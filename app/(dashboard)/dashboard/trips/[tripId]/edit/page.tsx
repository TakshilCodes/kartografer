import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import EditTripClient from "./EditTripClient";

type EditTripPageProps = {
  params: Promise<{
    tripId: string;
  }>;
};

export default async function EditTripPage({ params }: EditTripPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { tripId } = await params;

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    include: {
      fromPlace: true,
      toPlace: true,
      days: {
        orderBy: {
          dayNumber: "asc",
        },
        select: {
          id: true,
          dayNumber: true,
        },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  return (
    <EditTripClient
      trip={{
        id: trip.id,
        title: trip.title,
        summary: trip.summary,
        daysCount: trip.daysCount,
        peopleCount: trip.peopleCount,
        budgetAmount: trip.budgetAmount?.toString() ?? null,
        currency: trip.currency,
        tripType: trip.tripType,
        travelPace: trip.travelPace,
        foodPreference: trip.foodPreference,
        transportPreference: trip.transportPreference,
        fromPlace: trip.fromPlace
          ? {
              name: trip.fromPlace.name,
              formattedName: trip.fromPlace.formattedName,
            }
          : null,
        toPlace: trip.toPlace
          ? {
              name: trip.toPlace.name,
              formattedName: trip.toPlace.formattedName,
            }
          : null,
        days: trip.days,
      }}
    />
  );
}