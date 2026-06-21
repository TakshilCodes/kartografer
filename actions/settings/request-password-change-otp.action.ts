"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { assertOtpEmailConfig, generateOtp, sendOtpEmail } from "@/lib/auth/otp-email";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

function otpKey(userId: string) {
  return "settings:password-change-otp:" + userId;
}

function rateLimitKey(userId: string) {
  return "rate-limit:settings:password-change-otp:" + userId;
}

export async function requestPasswordChangeOtpAction() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { ok: false as const, error: "You must be logged in to change your password." };
    }

    const configError = assertOtpEmailConfig();
    if (configError) return { ok: false as const, error: configError };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    });

    if (!user) return { ok: false as const, error: "Account not found." };
    if (!user.email) {
      return { ok: false as const, error: "Add an email to your account before changing your password." };
    }

    const requests = await redis.incr(rateLimitKey(user.id));
    if (requests === 1) await redis.expire(rateLimitKey(user.id), 10 * 60);
    if (requests > 3) {
      return { ok: false as const, error: "Too many OTP requests. Please try again after 10 minutes." };
    }

    const otp = generateOtp();
    const key = otpKey(user.id);

    await redis.set(
      key,
      JSON.stringify({ userId: user.id, email: user.email, otp, attempts: 0, createdAt: new Date().toISOString() }),
      "EX",
      10 * 60
    );

    try {
      await sendOtpEmail({
        email: user.email,
        userName: user.name ?? "traveller",
        purpose: "change your Kartografer password",
        otp,
      });
    } catch (error) {
      await redis.del(key);
      throw error;
    }

    return { ok: true as const, error: null, message: "We sent a verification code to your account email." };
  } catch (error) {
    console.error("REQUEST_PASSWORD_CHANGE_OTP_ERROR", error);
    return { ok: false as const, error: "The verification code could not be sent. Please try again." };
  }
}