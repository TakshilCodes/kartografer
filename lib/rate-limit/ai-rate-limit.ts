import redis from "@/lib/redis";

export const AI_CHAT_USER_DAILY_LIMIT = 20;
export const AI_CHAT_TRIP_DAILY_LIMIT = 10;
export const AI_CHAT_BURST_LIMIT = 3;

export const AI_TRIP_GENERATION_DAILY_LIMIT = 3;
export const AI_LONG_TRIP_GENERATION_DAILY_LIMIT = 1;

export const AI_GLOBAL_DAILY_REQUEST_LIMIT = 1500;

export const DAILY_WINDOW_SECONDS = 24 * 60 * 60;
export const BURST_WINDOW_SECONDS = 60;

export type AiRateLimitReason =
  | "AI_CHAT_USER_DAILY_LIMIT"
  | "AI_CHAT_TRIP_DAILY_LIMIT"
  | "AI_CHAT_BURST_LIMIT"
  | "AI_TRIP_GENERATION_DAILY_LIMIT"
  | "AI_LONG_TRIP_GENERATION_DAILY_LIMIT"
  | "AI_GLOBAL_DAILY_REQUEST_LIMIT"
  | "AI_RATE_LIMIT_UNAVAILABLE";

export type AiRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  reason?: AiRateLimitReason;
};

type LimitDefinition = {
  key: string;
  limit: number;
  windowSeconds: number;
  reason: AiRateLimitReason;
};

export type AiChatLimitUsageSnapshot = {
  userDailyUsed: number;
  userDailyLimit: number;
  burstUsed: number;
  burstLimit: number;
  tripDailyLimit: number;
  tripDailyUsedByTripId: Record<string, number>;
};

function aiChatUserDailyKey(userId: string) {
  return "rate-limit:ai:chat:user:" + userId + ":daily";
}

function aiChatTripDailyKey(tripId: string) {
  return "rate-limit:ai:chat:trip:" + tripId + ":daily";
}

function aiChatUserBurstKey(userId: string) {
  return "rate-limit:ai:chat:user:" + userId + ":burst";
}

function toUsageCount(value: unknown) {
  const count = Number(value ?? 0);

  return Number.isFinite(count) && count > 0 ? count : 0;
}

// The script checks every counter first. It increments all counters only when
// every limit allows the action, so blocked requests cannot consume other quotas.
const consumeLimitsScript = [
  "local allowed = 1",
  "",
  "for index, key in ipairs(KEYS) do",
  "  local current = tonumber(redis.call('GET', key) or '0')",
  "  local limit = tonumber(ARGV[(index - 1) * 2 + 2])",
  "  if current >= limit then",
  "    allowed = 0",
  "  end",
  "end",
  "",
  "if allowed == 1 then",
  "  for index, key in ipairs(KEYS) do",
  "    local window = tonumber(ARGV[(index - 1) * 2 + 1])",
  "    local count = redis.call('INCR', key)",
  "    local ttl = redis.call('TTL', key)",
  "    if count == 1 or ttl < 0 then",
  "      redis.call('EXPIRE', key, window)",
  "    end",
  "  end",
  "end",
  "",
  "local response = { allowed }",
  "for index, key in ipairs(KEYS) do",
  "  local window = tonumber(ARGV[(index - 1) * 2 + 1])",
  "  local current = tonumber(redis.call('GET', key) or '0')",
  "  local ttl = redis.call('TTL', key)",
  "  if ttl < 0 then",
  "    ttl = window",
  "  end",
  "  table.insert(response, current)",
  "  table.insert(response, ttl)",
  "end",
  "",
  "return response",
].join("\n");

async function consumeLimits(
  definitions: LimitDefinition[],
): Promise<AiRateLimitResult> {
  try {
    const keys = definitions.map((definition) => definition.key);
    const args = definitions.flatMap((definition) => [
      definition.windowSeconds,
      definition.limit,
    ]);

    const response = (await redis.eval(
      consumeLimitsScript,
      keys.length,
      ...keys,
      ...args,
    )) as Array<number | string>;

    const allowed = Number(response[0]) === 1;

    if (allowed) {
      return {
        allowed: true,
        retryAfterSeconds: 0,
      };
    }

    const blockedLimits = definitions
      .map((definition, index) => ({
        definition,
        current: Number(response[1 + index * 2]),
        ttl: Math.max(
          1,
          Number(response[2 + index * 2]) || definition.windowSeconds,
        ),
      }))
      .filter(({ definition, current }) => current >= definition.limit)
      .sort((left, right) => right.ttl - left.ttl);

    const blocked = blockedLimits[0];

    return {
      allowed: false,
      retryAfterSeconds: blocked?.ttl ?? DAILY_WINDOW_SECONDS,
      reason: blocked?.definition.reason ?? "AI_GLOBAL_DAILY_REQUEST_LIMIT",
    };
  } catch (error) {
    console.error("AI_RATE_LIMIT_REDIS_ERROR", error);

    // AI calls can consume limited provider quota, so Redis failure fails closed.
    return {
      allowed: false,
      retryAfterSeconds: 5 * 60,
      reason: "AI_RATE_LIMIT_UNAVAILABLE",
    };
  }
}

export function consumeAiChatLimit({
  userId,
  tripId,
}: {
  userId: string;
  tripId: string;
}) {
  // TODO: Add an admin/test-user bypass when roles are introduced.
  return consumeLimits([
    {
      key: aiChatUserDailyKey(userId),
      limit: AI_CHAT_USER_DAILY_LIMIT,
      windowSeconds: DAILY_WINDOW_SECONDS,
      reason: "AI_CHAT_USER_DAILY_LIMIT",
    },
    {
      key: aiChatTripDailyKey(tripId),
      limit: AI_CHAT_TRIP_DAILY_LIMIT,
      windowSeconds: DAILY_WINDOW_SECONDS,
      reason: "AI_CHAT_TRIP_DAILY_LIMIT",
    },
    {
      key: aiChatUserBurstKey(userId),
      limit: AI_CHAT_BURST_LIMIT,
      windowSeconds: BURST_WINDOW_SECONDS,
      reason: "AI_CHAT_BURST_LIMIT",
    },
    {
      key: "rate-limit:ai:global:daily",
      limit: AI_GLOBAL_DAILY_REQUEST_LIMIT,
      windowSeconds: DAILY_WINDOW_SECONDS,
      reason: "AI_GLOBAL_DAILY_REQUEST_LIMIT",
    },
  ]);
}

export async function getAiChatLimitUsageSnapshot({
  userId,
  tripIds = [],
}: {
  userId: string;
  tripIds?: string[];
}): Promise<AiChatLimitUsageSnapshot | null> {
  try {
    const uniqueTripIds = Array.from(new Set(tripIds));
    const keys = [
      aiChatUserDailyKey(userId),
      aiChatUserBurstKey(userId),
      ...uniqueTripIds.map((tripId) => aiChatTripDailyKey(tripId)),
    ];

    const values = await redis.mget(...keys);
    const tripDailyUsedByTripId: Record<string, number> = {};

    uniqueTripIds.forEach((tripId, index) => {
      tripDailyUsedByTripId[tripId] = toUsageCount(values[index + 2]);
    });

    return {
      userDailyUsed: toUsageCount(values[0]),
      userDailyLimit: AI_CHAT_USER_DAILY_LIMIT,
      burstUsed: toUsageCount(values[1]),
      burstLimit: AI_CHAT_BURST_LIMIT,
      tripDailyLimit: AI_CHAT_TRIP_DAILY_LIMIT,
      tripDailyUsedByTripId,
    };
  } catch (error) {
    console.error("AI_CHAT_USAGE_SNAPSHOT_REDIS_ERROR", error);

    return null;
  }
}

export function consumeAiTripGenerationLimit({
  userId,
  isLongTrip,
}: {
  userId: string;
  isLongTrip: boolean;
}) {
  const definitions: LimitDefinition[] = [
    {
      key: "rate-limit:ai:generation:user:" + userId + ":daily",
      limit: AI_TRIP_GENERATION_DAILY_LIMIT,
      windowSeconds: DAILY_WINDOW_SECONDS,
      reason: "AI_TRIP_GENERATION_DAILY_LIMIT",
    },
  ];

  if (isLongTrip) {
    definitions.push({
      key: "rate-limit:ai:generation:user:" + userId + ":long-daily",
      limit: AI_LONG_TRIP_GENERATION_DAILY_LIMIT,
      windowSeconds: DAILY_WINDOW_SECONDS,
      reason: "AI_LONG_TRIP_GENERATION_DAILY_LIMIT",
    });
  }

  definitions.push({
    key: "rate-limit:ai:global:daily",
    limit: AI_GLOBAL_DAILY_REQUEST_LIMIT,
    windowSeconds: DAILY_WINDOW_SECONDS,
    reason: "AI_GLOBAL_DAILY_REQUEST_LIMIT",
  });

  return consumeLimits(definitions);
}

export function getAiRateLimitErrorMessage(result: AiRateLimitResult) {
  switch (result.reason) {
    case "AI_CHAT_USER_DAILY_LIMIT":
      return "You have reached today's AI chat limit. Please try again tomorrow.";
    case "AI_CHAT_TRIP_DAILY_LIMIT":
      return "This trip has reached today's AI chat limit. Please continue tomorrow or use manual editing.";
    case "AI_CHAT_BURST_LIMIT":
      return "You are sending messages too quickly. Please wait a moment and try again.";
    case "AI_TRIP_GENERATION_DAILY_LIMIT":
      return "You have reached today's AI trip generation limit. Please try again tomorrow.";
    case "AI_LONG_TRIP_GENERATION_DAILY_LIMIT":
      return "You have reached today's long-trip generation limit. Try a shorter trip or try again tomorrow.";
    case "AI_GLOBAL_DAILY_REQUEST_LIMIT":
      return "Kartografer AI is busy for today. Please try again later.";
    case "AI_RATE_LIMIT_UNAVAILABLE":
      return "AI usage limits are temporarily unavailable. Please try again in a few minutes.";
    default:
      return "Kartografer AI is temporarily unavailable. Please try again later.";
  }
}
