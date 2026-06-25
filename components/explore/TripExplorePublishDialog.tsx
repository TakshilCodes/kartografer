"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  useTransition,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Globe2, X } from "lucide-react";

import {
  publishTripToExploreAction,
  unpublishTripFromExploreAction,
} from "@/actions/explore/explore.action";
import CustomSelect, { type CustomSelectOption } from "@/components/shared/CustomSelect";
import CoverImageUploader from "@/components/trips/publish/CoverImageUploader";
import TagInput from "@/components/trips/publish/TagInput";

type BudgetStyleValue = "" | "budget" | "mid-range" | "luxury";
type TravelStyleValue = "" | "solo" | "couple" | "family" | "friends" | "adventure" | "relaxing";

type TriggerElementProps = {
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  "aria-label"?: string;
  title?: string;
};

type TripExplorePublishDialogProps = {
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
  trigger?: ReactNode;
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
  trigger,
}: TripExplorePublishDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initialCoverImageUrl);
  const [budgetStyle, setBudgetStyle] = useState<BudgetStyleValue>((initialBudgetStyle || "") as BudgetStyleValue);
  const [travelStyle, setTravelStyle] = useState<TravelStyleValue>((initialTravelStyle || "") as TravelStyleValue);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await publishTripToExploreAction({
        tripId,
        publicTitle: String(formData.get("publicTitle") ?? ""),
        publicDescription: String(formData.get("publicDescription") ?? ""),
        destination: String(formData.get("destination") ?? ""),
        coverImageUrl,
        budgetStyle,
        travelStyle,
        tags,
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

  function openDialog() {
    setIsOpen(true);
  }

  function renderTrigger() {
    if (trigger && isValidElement(trigger)) {
      const triggerElement = trigger as ReactElement<TriggerElementProps>;
      const originalOnClick = triggerElement.props.onClick;

      return cloneElement(triggerElement, {
        onClick: (event: ReactMouseEvent<HTMLElement>) => {
          originalOnClick?.(event);

          if (event.defaultPrevented) return;

          openDialog();
        },
        "aria-label":
          triggerElement.props["aria-label"] ??
          (isPublic ? "Manage public trip" : "Publish trip to Explore"),
        title:
          triggerElement.props.title ??
          (isPublic ? "Manage public trip" : "Publish to Explore"),
      });
    }

    if (trigger) {
      return (
        <span
          role="button"
          tabIndex={0}
          onClick={openDialog}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openDialog();
            }
          }}
          className="inline-flex w-full"
        >
          {trigger}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-black text-foreground transition hover:bg-card-secondary"
      >
        {isPublic ? "Manage public trip" : "Publish to Explore"}
      </button>
    );
  }

  return (
    <>
        {renderTrigger()}

        {isOpen ? (
          <div>
          </div>
        ) : null}
      </>
      );

      {isOpen ? (
        <div
          role="button"
          tabIndex={-1}
          onMouseDown={() => setIsOpen(false)}
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 px-3 py-5 backdrop-blur-sm sm:px-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto scrollbar-hide rounded-4xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border bg-card-secondary/60 px-5 py-5 sm:px-6">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-primary shadow-sm">
                  <Globe2 className="h-3.5 w-3.5" />
                  Public template
                </div>
                <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">Publish to Explore</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-secondary-foreground">
                  Make this itinerary discoverable as a public template.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-card-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <CoverImageUploader value={coverImageUrl} onChange={setCoverImageUrl} />

              <Field label="Public title" name="publicTitle" defaultValue={initialPublicTitle || tripTitle} required />
              <TextArea
                label="Public description"
                name="publicDescription"
                defaultValue={initialPublicDescription || ""}
                placeholder="Tell travelers what makes this itinerary useful."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Destination" name="destination" defaultValue={initialDestination || ""} placeholder="Kashmir, Goa, Ladakh..." required />
                <CustomSelect
                  label="Budget style"
                  name="budgetStyle"
                  value={budgetStyle}
                  onChange={(value) => setBudgetStyle(value as BudgetStyleValue)}
                  placeholder="Choose budget style"
                  options={BUDGET_STYLE_OPTIONS}
                />
                <CustomSelect
                  label="Travel style"
                  name="travelStyle"
                  value={travelStyle}
                  onChange={(value) => setTravelStyle(value as TravelStyleValue)}
                  placeholder="Choose travel style"
                  options={TRAVEL_STYLE_OPTIONS}
                />
              </div>

              <TagInput value={tags} onChange={setTags} />

              {error ? <p className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{error}</p> : null}
              {success ? <p className="rounded-2xl border border-success/30 bg-success/10 px-3 py-2 text-sm font-bold text-success">{success}</p> : null}

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
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
        className="h-11 w-full rounded-2xl border border-border bg-input px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/20"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-foreground">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/20"
      />
    </label>
  );
}

const BUDGET_STYLE_OPTIONS: CustomSelectOption[] = [
  { label: "Not set", value: "", description: "Keep the public listing flexible." },
  { label: "Budget", value: "budget", description: "Affordable stays, food, and transport." },
  { label: "Mid-range", value: "mid-range", description: "Comfort-focused without luxury pricing." },
  { label: "Luxury", value: "luxury", description: "Premium stays and elevated experiences." },
];

const TRAVEL_STYLE_OPTIONS: CustomSelectOption[] = [
  { label: "Not set", value: "", description: "No specific traveler style." },
  { label: "Solo", value: "solo", description: "Built for one traveler." },
  { label: "Couple", value: "couple", description: "Easy pacing for two people." },
  { label: "Family", value: "family", description: "Comfortable for families." },
  { label: "Friends", value: "friends", description: "Social and flexible group plan." },
  { label: "Adventure", value: "adventure", description: "Active, outdoorsy, and experience-heavy." },
  { label: "Relaxing", value: "relaxing", description: "Calmer pacing with more downtime." },
];