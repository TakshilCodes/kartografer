"use server";

import { z } from "zod";

import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import {
  assertOtpEmailConfig,
  generateOtp,
  sendOtpEmail,
} from "@/lib/auth/otp-email";

const SendPasswordResetOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type SendPasswordResetOtpInput = z.infer<typeof SendPasswordResetOtpSchema>;

function getPasswordResetOtpKey(email: string) {
  return `auth:password-reset-otp:${email}`;
}

function getPasswordResetOtpRateLimitKey(email: string) {
  return `rate-limit:password-reset-otp:${email}`;
}

export async function sendPasswordResetOtpAction(
  values: SendPasswordResetOtpInput
) {
  try {
    const configError = assertOtpEmailConfig();

    if (configError) {
      return {
        ok: false,
        error: configError,
        message: null,
      };
    }

    const parsed = SendPasswordResetOtpSchema.safeParse(values);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.flatten().fieldErrors,
        message: null,
      };
    }

    const email = parsed.data.email.toLowerCase().trim();
    const rateLimitKey = getPasswordResetOtpRateLimitKey(email);
    const currentRequests = await redis.incr(rateLimitKey);

    if (currentRequests === 1) {
      await redis.expire(rateLimitKey, 10 * 60);
    }

    if (currentRequests > 3) {
      return {
        ok: false,
        error: "Too many reset requests. Please try again after 10 minutes.",
        message: null,
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        email: true,
        name: true,
        hashedPassword: true,
      },
    });

    const safeSuccess = {
      ok: true,
      error: null,
      message:
        "If an account exists with this email, we sent a password reset code.",
    };

    if (!user?.email || !user.hashedPassword) {
      return safeSuccess;
    }

    const otp = generateOtp();

    await redis.set(
      getPasswordResetOtpKey(email),
      JSON.stringify({
        email,
        otp,
        attempts: 0,
        createdAt: new Date().toISOString(),
      }),
      "EX",
      10 * 60
    );

    await sendOtpEmail({
      email,
      userName: user.name ?? "traveller",
      purpose: "reset your Kartografer password",
      otp,
    });

    return safeSuccess;
  } catch (error) {
    console.error("SEND_PASSWORD_RESET_OTP_ERROR", error);

    return {
      ok: false,
      error: "Something went wrong. Please try again.",
      message: null,
    };
  }
}
