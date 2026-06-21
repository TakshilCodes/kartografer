"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

const ConfirmEmailChangeSchema = z.object({
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

type PendingEmailChange = {
  userId: string;
  newEmail: string;
  otp: string;
  attempts: number;
  createdAt: string;
};

function otpKey(userId: string) {
  return "settings:email-change-otp:" + userId;
}

export async function confirmEmailChangeAction(input: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { ok: false as const, error: "You must be logged in to change your email." };
    }

    const parsed = ConfirmEmailChangeSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid verification code." };
    }

    const key = otpKey(session.user.id);
    const pendingRaw = await redis.get(key);
    if (!pendingRaw) {
      return { ok: false as const, error: "The code expired. Request a new code." };
    }

    const pending = JSON.parse(pendingRaw) as PendingEmailChange;
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

    const existingUser = await prisma.user.findUnique({
      where: { email: pending.newEmail },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      await redis.del(key);
      return { ok: false as const, error: "This email cannot be used. Try another email address." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        hashedPassword: true,
        accounts: {
          where: { provider: "google" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!user) {
      await redis.del(key);
      return { ok: false as const, error: "Account not found." };
    }

    if (user.accounts.length > 0 && !user.hashedPassword) {
      await redis.del(key);
      return {
        ok: false as const,
        error:
          "Create a password before changing the email connected to Google.",
      };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { email: pending.newEmail, emailVerified: new Date() },
      }),
      prisma.account.deleteMany({
        where: {
          userId: session.user.id,
          provider: "google",
        },
      }),
    ]);

    await redis.del(key);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/profile");

    return {
      ok: true as const,
      email: pending.newEmail,
      error: null,
      message: "Email updated successfully.",
    };
  } catch (error) {
    console.error("CONFIRM_EMAIL_CHANGE_ERROR", error);
    return { ok: false as const, error: "Your email could not be updated. Please try again." };
  }
}