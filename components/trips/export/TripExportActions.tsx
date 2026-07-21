"use client";

import Link from "next/link";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useState } from "react";

type TripExportActionsProps = {
  tripId: string;
};

function getDownloadFilename(disposition: string | null) {
  const match = disposition?.match(/filename="([^"]+)"/i);
  return match?.[1] ?? "kartografer-trip-itinerary.pdf";
}

export default function TripExportActions({ tripId }: TripExportActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setError("");
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/trips/${tripId}/pdf`);

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(result?.error ?? "The PDF could not be generated.");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = getDownloadFilename(
        response.headers.get("content-disposition"),
      );
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "The PDF could not be generated.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="no-print sticky top-0 z-30 border-b border-border bg-card/95 px-3 py-3 backdrop-blur-xl sm:px-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={`/dashboard/trips/${tripId}`}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-black text-foreground transition hover:bg-card-secondary sm:px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to trip
          </Link>
          <div>
            <p className="text-sm font-black text-foreground">Export preview</p>
            <p className="text-xs text-secondary-foreground">
              Review the proposal before downloading.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isDownloading ? "Preparing PDF..." : "Download PDF"}
          </button>
          {error ? (
            <p className="max-w-sm text-xs font-bold text-danger">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
