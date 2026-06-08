import Sidebar from "@/components/dashboard/Sidebar";
import ConfirmDialog from "@/components/shared/ConfirmDialogProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-dashboard lg:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 pt-16 lg:ml-72 lg:pt-0">
        {children}
        <ConfirmDialog />
      </main>
    </div>
  );
}