import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import TripExportActions from "@/components/trips/export/TripExportActions";
import TripExportDocument from "@/components/trips/export/TripExportDocument";
import TripExportPreviewCanvas from "@/components/trips/export/TripExportPreviewCanvas";
import { authOptions } from "@/lib/auth";
import { getTripExportData } from "@/lib/trips/get-trip-export-data";

type TripExportPageProps = {
  params: Promise<{
    tripId: string;
  }>;
  searchParams: Promise<{
    pdf?: string;
  }>;
};

export default async function TripExportPage({
  params,
  searchParams,
}: TripExportPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const [{ tripId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const trip = await getTripExportData(tripId, session.user.id);

  if (!trip) {
    notFound();
  }

  const isPdfMode = resolvedSearchParams.pdf === "1";

  return (
    <div
      data-dashboard-fullscreen
      data-pdf-export-page={isPdfMode ? "true" : undefined}
      className={`trip-export-page min-h-screen bg-[#e9e3da] ${isPdfMode ? "trip-export-pdf-mode bg-white" : "fixed inset-0 z-100 overflow-y-auto"}`}
    >
      {!isPdfMode ? <TripExportActions tripId={trip.id} /> : null}

      <main
        className={
          isPdfMode
            ? "min-h-screen overflow-visible bg-white"
            : "px-2 py-4 sm:px-6 sm:py-10"
        }
      >
        {isPdfMode ? (
          <TripExportDocument trip={trip} />
        ) : (
          <TripExportPreviewCanvas>
            <TripExportDocument trip={trip} />
          </TripExportPreviewCanvas>
        )}
      </main>
    </div>
  );
}
