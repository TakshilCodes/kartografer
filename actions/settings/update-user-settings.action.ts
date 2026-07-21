"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { ThemePreference, TripVisibility } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const UserSettingsSchema = z.object({
  themePreference: z.nativeEnum(ThemePreference),
  defaultTripVisibility: z.nativeEnum(TripVisibility),
  enablePublicSharingByDefault: z.boolean(),
  exportIncludeEstimatedBudget: z.boolean(),
  exportIncludePlannedBudget: z.boolean(),
  exportIncludeTravelerNotes: z.boolean(),
  exportIncludeKartograferBranding: z.boolean(),
});

const UpdateUserSettingsSchema = UserSettingsSchema.partial().refine(
  (settings) => Object.keys(settings).length > 0,
  "At least one setting is required.",
);

export type UpdateUserSettingsInput = z.infer<typeof UserSettingsSchema>;
export type UpdateUserSettingsPatch = z.infer<typeof UpdateUserSettingsSchema>;

export async function updateUserSettingsAction(input: unknown) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false as const,
        error: "You must be logged in to update settings.",
      };
    }

    const parsed = UpdateUserSettingsSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid settings.",
      };
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...parsed.data },
      update: parsed.data,
      select: {
        themePreference: true,
        defaultTripVisibility: true,
        enablePublicSharingByDefault: true,
        exportIncludeEstimatedBudget: true,
        exportIncludePlannedBudget: true,
        exportIncludeTravelerNotes: true,
        exportIncludeKartograferBranding: true,
      },
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/settings");

    return { ok: true as const, settings, error: null };
  } catch (error) {
    console.error("UPDATE_USER_SETTINGS_ERROR", error);
    return {
      ok: false as const,
      error: "Settings could not be saved. Please try again.",
    };
  }
}
