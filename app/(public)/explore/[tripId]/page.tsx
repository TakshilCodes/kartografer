import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import PublicTripDetail from "@/components/explore/PublicTripDetail";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type ExploreTripDetailPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function ExploreTripDetailPage({ params }: ExploreTripDetailPageProps) {
  const { tripId } = await params;
  const session = await getServerSession(authOptions);

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      isPublic: true,
    },
    select: {
      id: true,
      title: true,
      summary: true,
      publicTitle: true,
      publicDescription: true,
      destination: true,
      durationDays: true,
      budgetStyle: true,
      travelStyle: true,
      tags: true,
      copiedCount: true,
      publishedAt: true,
      daysCount: true,
      peopleCount: true,
      budgetAmount: true,
      fromPlace: { select: { name: true, formattedName: true } },
      toPlace: { select: { name: true, formattedName: true } },
      costBreakdown: {
        select: {
          totalEstimatedCost: true,
          transportCost: true,
          stayCost: true,
          foodCost: true,
          activityCost: true,
          budgetStatus: true,
        },
      },
      days: {
        orderBy: { dayNumber: "asc" },
        select: {
          id: true,
          dayNumber: true,
          title: true,
          description: true,
          notes: true,
          estimatedCost: true,
          transportOptions: {
            where: { isSelected: true },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              title: true,
              mode: true,
              fromText: true,
              toText: true,
              description: true,
              totalCost: true,
              pricePerPerson: true,
            },
          },
          stayOptions: {
            where: { isSelected: true },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              name: true,
              city: true,
              area: true,
              budgetLevel: true,
              totalCost: true,
              pricePerNight: true,
              nights: true,
            },
          },
          mealSuggestions: {
            where: { isSelected: true },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              mealType: true,
              title: true,
              locationName: true,
              estimatedCost: true,
            },
          },
          activities: {
            where: { isSelected: true },
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              title: true,
              description: true,
              locationName: true,
              category: true,
              startTime: true,
              endTime: true,
              estimatedCost: true,
            },
          },
        },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  return <PublicTripDetail trip={trip} isLoggedIn={Boolean(session?.user?.id)} />;
}