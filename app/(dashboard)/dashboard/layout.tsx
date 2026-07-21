import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { ThemePreferenceSync } from "@/components/providers/ThemeProvider";
import Sidebar from "@/components/dashboard/Sidebar";
import ConfirmDialog from "@/components/shared/ConfirmDialogProvider";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Workspace",
  description:
    "Manage your Kartografer trips, edit itineraries, use AI planning tools, track budgets, share public links, and export polished travel PDFs.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const settings = session?.user?.id
    ? await prisma.userSettings.findUnique({
        where: { userId: session.user.id },
        select: { themePreference: true },
      })
    : null;

  return (
    <div className="min-h-screen bg-dashboard lg:flex" data-dashboard-shell>
      <ThemePreferenceSync preference={settings?.themePreference ?? "SYSTEM"} />

      <div data-dashboard-sidebar>
        <Sidebar />
      </div>

      <main
        className="min-h-screen w-full min-w-0 flex-1 pt-20 transition-[padding-left] duration-300 lg:pl-(--dashboard-sidebar-width,18rem) lg:pt-0"
        data-dashboard-main
      >
        {children}
        <ConfirmDialog />
      </main>
    </div>
  );
}
