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
        value: decodeURIComponent(part.slice(separatorIndex + 1)),
        url: origin,
      };
    })
    .filter(
      (cookie): cookie is { name: string; value: string; url: string } =>
        cookie !== null,
    );
}

async function launchPdfBrowser() {
  const puppeteer = await import("puppeteer-core");

  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const executablePath = await chromium.executablePath();

    console.log("PDF_CHROMIUM_PATH", {
      executablePath,
      region: process.env.VERCEL_REGION,
    });

    return puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
      ],
      executablePath,
      headless: true,
      defaultViewport: {
        width: 1240,
        height: 1754,
      },
    });
  }

  return puppeteer.launch({
    executablePath:
      process.env.LOCAL_CHROME_PATH ||
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    defaultViewport: {
      width: 1240,
      height: 1754,
    },
  });
}

export async function GET(request: NextRequest, context: PdfRouteContext) {
  const steps: string[] = [];
  let tripId = "unknown";
  let browser: Awaited<
    ReturnType<typeof import("puppeteer-core").launch>
  > | null = null;

  function mark(step: string) {
    steps.push(step);
    console.log("PDF_EXPORT_STEP", {
      step,
      tripId,
      region: process.env.VERCEL_REGION,
      vercel: process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
    });
  }

  try {
    mark("request_started");

    const session = await getServerSession(authOptions);
    mark("session_loaded");

    if (!session?.user?.id) {
      mark("unauthorized");

      return NextResponse.json(
        { error: "You must be logged in to export this trip.", steps },
        { status: 401 },
      );
    }

    const params = await context.params;
    tripId = params.tripId;
    mark("params_loaded");

    const trip = await getTripExportData(tripId, session.user.id);
    mark("trip_loaded");

    if (!trip) {
      mark("trip_not_found");

      return NextResponse.json(
        { error: "Trip not found.", steps },
        { status: 404 },
      );
    }

    browser = await launchPdfBrowser();
    mark("browser_launched");

    const page = await browser.newPage();
    mark("page_created");

    const cookieHeader = request.headers.get("cookie");

    if (cookieHeader) {
      await page.setCookie(
        ...parseRequestCookies(cookieHeader, request.nextUrl.origin),
      );
      mark("cookies_set");
    } else {
      mark("no_cookies_found");
    }

    const exportUrl = new URL(
      `/dashboard/trips/${encodeURIComponent(tripId)}/export`,
      request.nextUrl.origin,
    );

    exportUrl.searchParams.set("pdf", "1");
    mark(`goto_started:${exportUrl.toString()}`);

    const response = await page.goto(exportUrl.toString(), {
      waitUntil: "networkidle0",
      timeout: 60_000,
    });

    mark(`goto_finished:${response?.status()}`);

    if (!response?.ok() || page.url().includes("/signin")) {
      throw new Error(
        `The authenticated export page could not be loaded. status=${response?.status()} url=${page.url()}`,
      );
    }

    await page.emulateMediaType("print");
    mark("media_print_set");

    await page.evaluate(() => document.fonts.ready.then(() => true));
    mark("fonts_ready");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    mark("pdf_created");

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${createPdfFilename(
          trip.title,
        )}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("PDF_EXPORT_ERROR", {
      tripId,
      steps,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      region: process.env.VERCEL_REGION,
    });

    return NextResponse.json(
      {
        error: "Kartografer could not generate this PDF. Please try again.",
        debug:
          process.env.NODE_ENV !== "production"
            ? {
                steps,
                message: error instanceof Error ? error.message : String(error),
              }
            : {
                steps,
              },
      },
      { status: 500 },
    );
  } finally {
    if (browser) {
      await browser.close().catch((closeError) => {
        console.error("PDF_BROWSER_CLOSE_ERROR", closeError);
      });
    }
  }
}
