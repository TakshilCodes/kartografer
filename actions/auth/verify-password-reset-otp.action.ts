"use server";

import crypto from "node:crypto";

import { z } from "zod";

import redis from "@/lib/redis";

const VerifyPasswordResetOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits"),
});

type VerifyPasswordResetOtpInput = z.infer<
  typeof VerifyPasswordResetOtpSchema
>;

type PendingPasswordResetPayload = {
  email: string;
  otp: string;
  attempts: number;
  createdAt: string;
};

function getPasswordResetOtpKey(email: string) {
  return `auth:password-reset-otp:${email}`;
}

function getPasswordResetSessionKey(token: string) {
  return `auth:password-reset-session:${token}`;
}

export async function verifyPasswordResetOtpAction(
  values: VerifyPasswordResetOtpInput
) {
  try {
    const parsed = VerifyPasswordResetOtpSchema.safeParse(values);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.flatten().fieldErrors,
        resetToken: null,
      };
    }

    const email = parsed.data.email.toLowerCase().trim();
    const otp = parsed.data.otp.trim();
    const otpKey = getPasswordResetOtpKey(email);
    const pendingRaw = await redis.get(otpKey);

    if (!pendingRaw) {
      return {
        ok: false,
        error: "OTP expired. Please request a new code.",
        resetToken: null,
      };
    }

    const pending = JSON.parse(pendingRaw) as PendingPasswordResetPayload;

    if (pending.attempts >= 5) {
      await redis.del(otpKey);

      return {
        ok: false,
        error: "Too many incorrect attempts. Please request a new code.",
        resetToken: null,
      };
    }

    if (pending.otp !== otp) {
      await redis.set(
        otpKey,
        JSON.stringify({
          ...pending,
          attempts: pending.attempts + 1,
        }),
        "EX",
        10 * 60
      );

      return {
        ok: false,
        error: "Invalid OTP.",
        resetToken: null,
      };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    await redis.set(
      getPasswordResetSessionKey(resetToken),
      JSON.stringify({
        email,
        createdAt: new Date().toISOString(),
      }),
      "EX",
      10 * 60
    );

    await redis.del(otpKey);

    return {
      ok: true,
      error: null,
      resetToken,
    };
  } catch (error) {
    console.error("VERIFY_PASSWORD_RESET_OTP_ERROR", error);

    return {
      ok: false,
      error: "Something went wrong. Please try again.",
      resetToken: null,
    };
  }
}
