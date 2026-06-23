"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe2, X } from "lucide-react";

type BudgetStyleValue = "" | "budget" | "mid-range" | "luxury";
type TravelStyleValue = "" | "solo" | "couple" | "family" | "friends" | "adventure" | "relaxing";

import {
  publishTripToExploreAction,
  unpublishTripFromExploreAction,
} from "@/actions/explore/explore.action";

export type TripExplorePublishDialogProps = {
  tripId: string;
  tripTitle: string;
  initialIsPublic: boolean;
  initialPublicTitle: string | null;
  initialPublicDescription: string | null;
  initialDestination: string | null;
  initialCoverImageUrl: string | null;
  initialBudgetStyle: string | null;
  initialTravelStyle: string | null;
  initialTags: string[];
};

export default function TripExplorePublishDialog({
  tripId,
  tripTitle,
  initialIsPublic,
  initialPublicTitle,
  initialPublicDescription,
  initialDestination,
  initialCoverImageUrl,
  initialBudgetStyle,
  initialTravelStyle,
  initialTags,
}: TripExplorePublishDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await publishTripToExploreAction({
        tripId,
        publicTitle: String(formData.get("publicTitle") ?? ""),
        publicDescription: String(formData.get("publicDescription") ?? ""),
        destination: String(formData.get("destination") ?? ""),
        coverImageUrl: String(formData.get("coverImageUrl") ?? ""),
        budgetStyle: String(formData.get("budgetStyle") ?? "") as BudgetStyleValue,
        travelStyle: String(formData.get("travelStyle") ?? "") as TravelStyleValue,
        tags: String(formData.get("tags") ?? ""),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsPublic(true);
      setSuccess("Trip published to Explore.");
      router.refresh();
    });
  }

  function handleUnpublish() {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await unpublishTripFromExploreAction(tripId);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsPublic(false);
      setSuccess("Trip removed from Explore.");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-black text-foreground transition hover:bg-card-secondary"
      >
        <Globe2 className="h-4 w-4" />
        {isPublic ? "Published" : "Publish"}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-border bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border bg-card-secondary/50 px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-foreground">Publish to Explore</h2>
                <p className="mt-1 text-sm text-secondary-foreground">
                  Make this itinerary discoverable as a public template.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-card-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4 p-5">
              <Field label="Public title" name="publicTitle" defaultValue={initialPublicTitle || tripTitle} required />
              <TextArea label="Public description" name="publicDescription" defaultValue={initialPublicDescription || ""} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Destination" name="destination" defaultValue={initialDestination || ""} />
                <Field label="Cover image URL" name="coverImageUrl" defaultValue={initialCoverImageUrl || ""} />
                <Select label="Budget style" name="budgetStyle" defaultValue={initialBudgetStyle || ""} options={["", "budget", "mid-range", "luxury"]} />
                <Select label="Travel style" name="travelStyle" defaultValue={initialTravelStyle || ""} options={["", "solo", "couple", "family", "friends", "adventure", "relaxing"]} />
              </div>
              <Field label="Tags" name="tags" defaultValue={initialTags.join(", ")} placeholder="kashmir, family, budget" />

              {error ? <p className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{error}</p> : null}
              {success ? <p className="rounded-2xl border border-success/30 bg-success/10 px-3 py-2 text-sm font-bold text-success-foreground">{success}</p> : null}

              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? "Saving..." : isPublic ? "Update public listing" : "Publish trip"}
                </button>

                {isPublic ? (
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    disabled={isPending}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-danger/30 bg-card px-5 text-sm font-black text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Unpublish
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-foreground">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-2xl border border-border bg-input px-4 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
      />
    </label>
  );
}

function TextArea({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-foreground">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={3}
        className="w-full resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
      />
    </label>
  );
}

function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-11 w-full cursor-pointer rounded-2xl border border-border bg-input px-4 text-sm font-black text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
      >
        {options.map((option) => (
          <option key={option || "any"} value={option}>
            {option ? option.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "Not set"}
          </option>
        ))}
      </select>
    </label>
  );
}