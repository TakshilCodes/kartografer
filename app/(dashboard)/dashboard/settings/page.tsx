import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import SettingsClient from "@/components/settings/SettingsClient";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      createdAt: true,
      settings: {
        select: {
          defaultCurrency: true,
          themePreference: true,
          defaultTripVisibility: true,
          enablePublicSharingByDefault: true,
          exportIncludeEstimatedBudget: true,
          exportIncludePlannedBudget: true,
          exportIncludeTravelerNotes: true,
          exportIncludeKartograferBranding: true,
        },
      },
    },
  });

  if (!user) notFound();

  const settings = user.settings ?? {
    defaultCurrency: "INR",
    themePreference: "SYSTEM" as const,
    defaultTripVisibility: "PRIVATE" as const,
    enablePublicSharingByDefault: false,
    exportIncludeEstimatedBudget: true,
    exportIncludePlannedBudget: true,
    exportIncludeTravelerNotes: true,
    exportIncludeKartograferBranding: true,
  };

  return (
    <div className="min-h-screen bg-dashboard px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-6 border-b border-border pb-5">
          <p className="text-xs font-black uppercase text-muted-foreground">Workspace controls</p>
          <h1 className="mt-1 text-3xl font-black text-foreground">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary-foreground">
            Secure your account and choose how Kartografer looks, shares, and exports future journeys.
          </p>
        </header>

        <SettingsClient
          user={{
            name: user.name?.trim() || "Kartografer Explorer",
            email: user.email,
            joinedAt: user.createdAt.toISOString(),
          }}
          initialSettings={settings}
        />
      </div>
    </div>
  );
}