import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getTripExportData } from "@/lib/trips/get-trip-export-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type PdfRouteContext = {
  params: Promise<{
    tripId: string;
  }>;
};

function createPdfFilename(title: string) {
  const safeTitle = title
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  return `${safeTitle || "trip"}-itinerary.pdf`;
}

function parseRequestCookies(cookieHeader: string, origin: string) {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex <= 0) return null;

      return {
        name: part.slice(0, separatorIndex),
        value: part.slice(separatorIndex + 1),
        url: origin,
      };
    })
    .filter(
      (cookie): cookie is { name: string; value: string; url: string } =>
        cookie !== null
    );
}

export async function GET(request: NextRequest, { params }: PdfRouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to export this trip." },
      { status: 401 }
    );
  }

  const { tripId } = await params;
  const trip = await getTripExportData(tripId, session.user.id);

  if (!trip) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  const { chromium } = await import("playwright");

  const browser = await chromium.launch({ headless: true }).catch((error) => {
    console.error("PDF_BROWSER_LAUNCH_ERROR", error);
    return null;
  });

  if (!browser) {
    return NextResponse.json(
      {
        error:
          "PDF generation is unavailable because the server browser is not installed.",
      },
      { status: 503 }
    );
  }

  try {
    const context = await browser.newContext();
    const cookieHeader = request.headers.get("cookie");

    if (cookieHeader) {
      await context.addCookies(
        parseRequestCookies(cookieHeader, request.nextUrl.origin)
      );
    }

    const page = await context.newPage();
    const exportUrl = new URL(
      `/dashboard/trips/${encodeURIComponent(tripId)}/export`,
      request.nextUrl.origin
    );
    exportUrl.searchParams.set("pdf", "1");

    const response = await page.goto(exportUrl.toString(), {
      waitUntil: "networkidle",
      timeout: 60_000,
    });

    if (!response?.ok() || page.url().includes("/signin")) {
      throw new Error("The authenticated export page could not be loaded.");
    }

    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${createPdfFilename(
          trip.title
        )}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("TRIP_PDF_GENERATION_ERROR", error);

    return NextResponse.json(
      {
        error: "Kartografer could not generate this PDF. Please try again.",
      },
      { status: 500 }
    );
  } finally {
    await browser.close();
  }
}
