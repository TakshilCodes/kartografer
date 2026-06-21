import { getServerSession } from "next-auth";

import { ThemePreferenceSync } from "@/components/providers/ThemeProvider";
import Sidebar from "@/components/dashboard/Sidebar";
import ConfirmDialog from "@/components/shared/ConfirmDialogProvider";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
        className="min-w-0 flex-1 pt-16 lg:ml-72 lg:pt-0"
        data-dashboard-main
      >
        {children}
        <ConfirmDialog />
      </main>
    </div>
  );
}