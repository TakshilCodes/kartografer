import { CalendarDays, Compass, Mail, Map } from "lucide-react";

type ProfileOverviewCardProps = {
  name: string;
  email: string;
  image: string | null;
  joinedAt: string;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function ProfileOverviewCard({
  name,
  email,
  image,
  joinedAt,
}: ProfileOverviewCardProps) {
  const joinedDate = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(joinedAt));

  return (
    <section className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="relative min-h-40 overflow-hidden border-b border-primary/20 bg-primary p-5 sm:p-6">
        <Map className="absolute -right-5 -top-6 h-44 w-44 rotate-6 text-primary-foreground opacity-[0.07]" strokeWidth={1} />
        <div className="absolute inset-x-0 bottom-0 border-t border-primary-foreground/10" />

        <div className="relative flex items-start justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground px-3 py-1.5 text-xs font-black text-primary shadow-sm">
            <Compass className="h-3.5 w-3.5" />
            Kartografer Explorer
          </span>
        </div>
      </div>

      <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-card-secondary text-2xl font-black text-primary shadow-md"
            style={
              image
                ? {
                    backgroundImage: `url(${image})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }
                : undefined
            }
            role={image ? "img" : undefined}
            aria-label={image ? `${name}'s avatar` : undefined}
          >
            {!image ? getInitials(name) || "K" : null}
          </div>

          <div className="min-w-0 pb-1 sm:pt-4">
            <h1 className="break-words text-2xl font-black text-foreground sm:text-3xl">
              {name}
            </h1>
            <div className="mt-2 flex flex-col gap-1.5 text-sm font-semibold text-secondary-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
              <span className="flex min-w-0 items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{email}</span>
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                Joined {joinedDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}