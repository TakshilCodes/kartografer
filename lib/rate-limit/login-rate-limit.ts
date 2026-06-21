import { createHmac } from "node:crypto";

import redis from "@/lib/redis";

const LOGIN_WINDOW_SECONDS = 10 * 60;
const EMAIL_ATTEMPT_LIMIT = 5;
const IP_ATTEMPT_LIMIT = 20;

const consumeScript = [
  'local count = redis.call("INCR", KEYS[1])',
  'local ttl = redis.call("TTL", KEYS[1])',
  "",
  "if count == 1 or ttl < 0 then",
  '  redis.call("EXPIRE", KEYS[1], ARGV[1])',
  "  ttl = tonumber(ARGV[1])",
  "end",
  "",
  "return { count, ttl }",
].join("\n");

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function hashIdentifier(value: string) {
  const secret = process.env.NEXTAUTH_SECRET ?? "kartografer-rate-limit";
  return createHmac("sha256", secret).update(value).digest("hex");
}

function getHeaderValue(
  headers: Record<string, unknown> | undefined,
  name: string
) {
  const value = headers?.[name] ?? headers?.[name.toLowerCase()];

  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : null;
}

function getClientIp(headers: Record<string, unknown> | undefined) {
  const forwardedFor = getHeaderValue(headers, "x-forwarded-for");
  const realIp = getHeaderValue(headers, "x-real-ip");
  const cloudflareIp = getHeaderValue(headers, "cf-connecting-ip");

  return (
    forwardedFor?.split(",")[0]?.trim() ||
    cloudflareIp?.trim() ||
    realIp?.trim() ||
    null
  );
}

async function consumeLimit(
  key: string,
  limit: number
): Promise<RateLimitResult> {
  const result = (await redis.eval(
    consumeScript,
    1,
    key,
    LOGIN_WINDOW_SECONDS
  )) as [number | string, number | string];

  const count = Number(result[0]);
  const ttl = Math.max(1, Number(result[1]) || LOGIN_WINDOW_SECONDS);

  return {
    allowed: count <= limit,
    retryAfterSeconds: ttl,
  };
}

function getEmailKey(email: string) {
  return "rate-limit:login:email:" + hashIdentifier(email);
}

function getIpKey(ip: string) {
  return "rate-limit:login:ip:" + hashIdentifier(ip);
}

export async function consumeLoginAttempt({
  email,
  headers,
}: {
  email: string;
  headers?: Record<string, unknown>;
}): Promise<RateLimitResult> {
  try {
    const normalizedEmail = email.toLowerCase().trim() || "invalid-email";
    const ip = getClientIp(headers);

    const limits = [
      consumeLimit(getEmailKey(normalizedEmail), EMAIL_ATTEMPT_LIMIT),
    ];

    if (ip) {
      limits.push(consumeLimit(getIpKey(ip), IP_ATTEMPT_LIMIT));
    }

    const results = await Promise.all(limits);
    const blockedResults = results.filter((result) => !result.allowed);

    return {
      allowed: blockedResults.length === 0,
      retryAfterSeconds:
        blockedResults.length > 0
          ? Math.max(
              ...blockedResults.map((result) => result.retryAfterSeconds)
            )
          : 0,
    };
  } catch (error) {
    console.error("LOGIN_RATE_LIMIT_REDIS_ERROR", error);

    // Keep authentication available if Redis has a temporary outage.
    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }
}

export async function clearLoginEmailLimit(email: string) {
  try {
    await redis.del(getEmailKey(email.toLowerCase().trim()));
  } catch (error) {
    console.error("CLEAR_LOGIN_RATE_LIMIT_ERROR", error);
  }
}