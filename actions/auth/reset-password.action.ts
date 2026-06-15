"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

const ResetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

type PasswordResetSessionPayload = {
  email: string;
  createdAt: string;
};

function getPasswordResetSessionKey(token: string) {
  return `auth:password-reset-session:${token}`;
}

export async function resetPasswordAction(values: ResetPasswordInput) {
  try {
    const parsed = ResetPasswordSchema.safeParse(values);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.flatten().fieldErrors,
        message: null,
      };
    }

    const token = parsed.data.token.trim();
    const sessionKey = getPasswordResetSessionKey(token);
    const sessionRaw = await redis.get(sessionKey);

    if (!sessionRaw) {
      return {
        ok: false,
        error: "Password reset session expired. Please request a new code.",
        message: null,
      };
    }

    const session = JSON.parse(sessionRaw) as PasswordResetSessionPayload;
    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    await prisma.user.update({
      where: {
        email: session.email,
      },
      data: {
        hashedPassword,
        emailVerified: new Date(),
      },
    });

    await redis.del(sessionKey);

    return {
      ok: true,
      error: null,
      message: "Password reset successfully. You can now sign in.",
    };
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR", error);

    return {
      ok: false,
      error: "Something went wrong. Please try again.",
      message: null,
    };
  }
}
