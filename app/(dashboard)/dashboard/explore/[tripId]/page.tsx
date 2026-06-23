import { redirect } from "next/navigation";

type OldDashboardExploreTripPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function OldDashboardExploreTripPage({ params }: OldDashboardExploreTripPageProps) {
  const { tripId } = await params;

  redirect(`/explore/${tripId}`);
}