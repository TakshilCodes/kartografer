"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

const ConfirmPasswordChangeSchema = z
  .object({
    otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
    password: z.string().min(8, "Password must be at least 8 characters.").max(100, "Password is too long."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type PendingPasswordChange = {
  userId: string;
  email: string;
  otp: string;
  attempts: number;
  createdAt: string;
};

function otpKey(userId: string) {
  return "settings:password-change-otp:" + userId;
}

export async function confirmPasswordChangeAction(input: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { ok: false as const, error: "You must be logged in to change your password." };
    }

    const parsed = ConfirmPasswordChangeSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid password details." };
    }

    const key = otpKey(session.user.id);
    const pendingRaw = await redis.get(key);
    if (!pendingRaw) {
      return { ok: false as const, error: "The code expired. Request a new code." };
    }

    const pending = JSON.parse(pendingRaw) as PendingPasswordChange;
    if (pending.userId !== session.user.id) {
      await redis.del(key);
      return { ok: false as const, error: "This verification request is invalid." };
    }

    if (pending.attempts >= 5) {
      await redis.del(key);
      return { ok: false as const, error: "Too many incorrect attempts. Request a new code." };
    }

    if (pending.otp !== parsed.data.otp) {
      await redis.set(
        key,
        JSON.stringify({ ...pending, attempts: pending.attempts + 1 }),
        "EX",
        10 * 60
      );
      return { ok: false as const, error: "Invalid verification code." };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hashedPassword },
    });

    await redis.del(key);

    return { ok: true as const, error: null, message: "Password updated successfully." };
  } catch (error) {
    console.error("CONFIRM_PASSWORD_CHANGE_ERROR", error);
    return { ok: false as const, error: "Your password could not be updated. Please try again." };
  }
}