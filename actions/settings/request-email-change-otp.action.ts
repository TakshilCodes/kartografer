"use server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { assertOtpEmailConfig, generateOtp, sendOtpEmail } from "@/lib/auth/otp-email";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

const RequestEmailChangeSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

function otpKey(userId: string) {
  return "settings:email-change-otp:" + userId;
}

function rateLimitKey(userId: string) {
  return "rate-limit:settings:email-change-otp:" + userId;
}

export async function requestEmailChangeOtpAction(input: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { ok: false as const, error: "You must be logged in to change your email." };
    }

    const configError = assertOtpEmailConfig();
    if (configError) return { ok: false as const, error: configError };

    const parsed = RequestEmailChangeSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid email address." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        hashedPassword: true,
        accounts: {
          where: { provider: "google" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!user) return { ok: false as const, error: "Account not found." };

    if (user.accounts.length > 0 && !user.hashedPassword) {
      return {
        ok: false as const,
        error:
          "Create a password before changing the email connected to Google.",
      };
    }

    const newEmail = parsed.data.newEmail;
    if (user.email?.toLowerCase() === newEmail) {
      return { ok: false as const, error: "This is already your account email." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });

    if (existingUser) {
      return { ok: false as const, error: "This email cannot be used. Try another email address." };
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
      JSON.stringify({ userId: user.id, newEmail, otp, attempts: 0, createdAt: new Date().toISOString() }),
      "EX",
      10 * 60
    );

    try {
      await sendOtpEmail({
        email: newEmail,
        userName: user.name ?? "traveller",
        purpose: "confirm your new Kartografer email",
        otp,
      });
    } catch (error) {
      await redis.del(key);
      throw error;
    }

    return { ok: true as const, error: null, message: "We sent a verification code to your new email." };
  } catch (error) {
    console.error("REQUEST_EMAIL_CHANGE_OTP_ERROR", error);
    return { ok: false as const, error: "The verification code could not be sent. Please try again." };
  }
}