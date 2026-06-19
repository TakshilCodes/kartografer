import Sidebar from "@/components/dashboard/Sidebar";
import ConfirmDialog from "@/components/shared/ConfirmDialogProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-dashboard lg:flex" data-dashboard-shell>
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
