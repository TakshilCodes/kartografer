import { randomBytes } from "node:crypto";

import prisma from "@/lib/prisma";

function createShareSlug() {
  return randomBytes(12).toString("hex");
}

export async function createUniquePublicShareSlug() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = createShareSlug();
    const existingTrip = await prisma.trip.findUnique({
      where: { publicShareSlug: slug },
      select: { id: true },
    });

    if (!existingTrip) return slug;
  }

  throw new Error("Unable to generate a unique public share link.");
}