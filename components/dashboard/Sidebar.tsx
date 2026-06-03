import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import SidebarClient from "./SidebarClient";

export default async function Sidebar() {
    const session = await getServerSession(authOptions);

      const recentTrips = session?.user?.id
        ? await prisma.trip.findMany({
            where: {
              userId: session.user.id,
            },
            select: {
              id: true,
              title: true,
            },
            orderBy: {
              updatedAt: "desc",
            },
            take: 10,
          })
        : [];

    return <SidebarClient recentTrips={recentTrips} />;
}