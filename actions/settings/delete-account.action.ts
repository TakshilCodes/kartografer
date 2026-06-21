"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function deleteAccountAction() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false as const,
        error: "You must be logged in to delete your account.",
      };
    }

    const result = await prisma.user.deleteMany({
      where: {
        id: session.user.id,
      },
    });

    if (result.count === 0) {
      return {
        ok: false as const,
        error: "Account not found.",
      };
    }

    return {
      ok: true as const,
      error: null,
    };
  } catch (error) {
    console.error("DELETE_ACCOUNT_ERROR", error);

    return {
      ok: false as const,
      error: "Your account could not be deleted. Please try again.",
    };
  }
}