"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(60, "Display name cannot be more than 60 characters.")
    .transform((value) => value.replace(/\s+/g, " ")),
});

type UpdateProfileResult =
  | { ok: true; error: null }
  | { ok: false; error: string };

export async function updateProfileAction(
  input: unknown
): Promise<UpdateProfileResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { ok: false, error: "You must be logged in to update your profile." };
    }

    const parsed = updateProfileSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid profile information.",
      };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/profile");

    return { ok: true, error: null };
  } catch (error) {
    console.error("UPDATE_PROFILE_ERROR", error);
    return {
      ok: false,
      error: "Kartografer could not update your profile. Please try again.",
    };
  }
}