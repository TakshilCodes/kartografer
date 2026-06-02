"use server";

import { z } from "zod";

import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

const VerifySignupOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits"),
});

type VerifySignupOtpInput = z.infer<typeof VerifySignupOtpSchema>;

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

export async function verifySignupOtpAction(values: VerifySignupOtpInput) {
  try {
    const parsed = VerifySignupOtpSchema.safeParse(values);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.flatten().fieldErrors,
        message: null,
      };
    }

    const email = parsed.data.email.toLowerCase().trim();
    const otp = parsed.data.otp.trim();

    const otpKey = getSignupOtpKey(email);
    const pendingRaw = await redis.get(otpKey);

    if (!pendingRaw) {
      return {
        ok: false,
        error: "OTP expired. Please request a new OTP.",
        message: null,
      };
    }

    const pending = JSON.parse(pendingRaw) as PendingSignupPayload;

    if (pending.attempts >= 5) {
      await redis.del(otpKey);

      return {
        ok: false,
        error: "Too many incorrect attempts. Please request a new OTP.",
        message: null,
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
        error: "An account already exists with this email.",
        message: null,
      };
    }

    await prisma.user.create({
      data: {
        name: pending.name,
        email: pending.email,
        hashedPassword: pending.hashedPassword,
        emailVerified: new Date(),
      },
    });

    await redis.del(otpKey);

    return {
      ok: true,
      error: null,
      message: "Account created successfully. You can now sign in.",
    };
  } catch (error) {
    console.error("VERIFY_SIGNUP_OTP_ERROR", error);

    return {
      ok: false,
      error: "Something went wrong. Please try again.",
      message: null,
    };
  }
}