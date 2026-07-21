import redis from "@/lib/redis";

export const MANUAL_TRIP_CREATION_DAILY_LIMIT = 20;
export const DAILY_WINDOW_SECONDS = 24 * 60 * 60;

export type ManualTripCreationRateLimitReason =
  "MANUAL_TRIP_CREATION_DAILY_LIMIT" | "TRIP_RATE_LIMIT_UNAVAILABLE";

export type ManualTripCreationRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  reason?: ManualTripCreationRateLimitReason;
};

const consumeScript = [
  "local current = tonumber(redis.call('GET', KEYS[1]) or '0')",
  "local limit = tonumber(ARGV[1])",
  "local window = tonumber(ARGV[2])",
  "local ttl = redis.call('TTL', KEYS[1])",
  "if ttl < 0 then ttl = window end",
  "if current >= limit then return { 0, current, ttl } end",
  "local count = redis.call('INCR', KEYS[1])",
  "ttl = redis.call('TTL', KEYS[1])",
  "if count == 1 or ttl < 0 then",
  "  redis.call('EXPIRE', KEYS[1], window)",
  "  ttl = window",
  "end",
  "return { 1, count, ttl }",
].join("\n");

export async function consumeManualTripCreationLimit({
  userId,
}: {
  userId: string;
}): Promise<ManualTripCreationRateLimitResult> {
  try {
    const key = "rate-limit:trip:create:manual:user:" + userId + ":daily";

    const result = (await redis.eval(
      consumeScript,
      1,
      key,
      MANUAL_TRIP_CREATION_DAILY_LIMIT,
      DAILY_WINDOW_SECONDS,
    )) as Array<number | string>;

    const allowed = Number(result[0]) === 1;

    return {
      allowed,
      retryAfterSeconds: allowed
        ? 0
        : Math.max(1, Number(result[2]) || DAILY_WINDOW_SECONDS),
      reason: allowed ? undefined : "MANUAL_TRIP_CREATION_DAILY_LIMIT",
    };
  } catch (error) {
    console.error("MANUAL_TRIP_RATE_LIMIT_REDIS_ERROR", error);

    // Manual creation can write many database rows, so Redis failure fails closed.
    return {
      allowed: false,
      retryAfterSeconds: 5 * 60,
      reason: "TRIP_RATE_LIMIT_UNAVAILABLE",
    };
  }
}

export function getManualTripCreationRateLimitMessage(
  result: ManualTripCreationRateLimitResult,
) {
  if (result.reason === "MANUAL_TRIP_CREATION_DAILY_LIMIT") {
    return "You have reached today's manual trip creation limit. Please try again tomorrow.";
  }

  return "Trip creation limits are temporarily unavailable. Please try again in a few minutes.";
}
