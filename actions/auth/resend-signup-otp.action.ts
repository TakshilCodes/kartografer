"use server";

import { z } from "zod";

import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import {
  assertOtpEmailConfig,
  generateOtp,
  sendOtpEmail,
} from "@/lib/auth/otp-email";

const ResendSignupOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ResendSignupOtpInput = z.infer<typeof ResendSignupOtpSchema>;

type PendingSignupPayload = {
  name: string;
  email: string;
  hashedPassword: string;
  otp: string;
  attempts: number;
  createdAt: string;
};

function getSignupOtpKey(email: string) {
  return `auth:signup-otp:${email}`;
}

function getSignupOtpRateLimitKey(email: string) {
  return `rate-limit:signup-otp:${email}`;
}

export async function resendSignupOtpAction(values: ResendSignupOtpInput) {
  try {
    const configError = assertOtpEmailConfig();

    if (configError) {
      return {
        ok: false,
        error: configError,
        message: null,
      };
    }

    const parsed = ResendSignupOtpSchema.safeParse(values);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.flatten().fieldErrors,
        message: null,
      };
    }

    const email = parsed.data.email.toLowerCase().trim();
    const otpKey = getSignupOtpKey(email);
    const pendingRaw = await redis.get(otpKey);

    if (!pendingRaw) {
      return {
        ok: false,
        error: "OTP expired. Please create your account again.",
        message: null,
      };
    }

    const rateLimitKey = getSignupOtpRateLimitKey(email);
    const currentRequests = await redis.incr(rateLimitKey);

    if (currentRequests === 1) {
      await redis.expire(rateLimitKey, 10 * 60);
    }

    if (currentRequests > 3) {
      return {
        ok: false,
        error: "Too many OTP requests. Please try again after 10 minutes.",
        message: null,
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      await redis.del(otpKey);

      return {
        ok: false,
        error:
          "An account already exists with this email. Please sign in instead.",
        message: null,
      };
    }

    const pending = JSON.parse(pendingRaw) as PendingSignupPayload;
    const otp = generateOtp();

    await redis.set(
      otpKey,
      JSON.stringify({
        ...pending,
        otp,
        attempts: 0,
        createdAt: new Date().toISOString(),
      }),
      "EX",
      10 * 60,
    );

    await sendOtpEmail({
      email,
      userName: pending.name,
      purpose: "create your Kartografer account",
      otp,
    });

    return {
      ok: true,
      error: null,
      message: "OTP sent successfully. Please check your email.",
    };
  } catch (error) {
    console.error("RESEND_SIGNUP_OTP_ERROR", error);

    return {
      ok: false,
      error: "Something went wrong. Please try again.",
      message: null,
    };
  }
}
