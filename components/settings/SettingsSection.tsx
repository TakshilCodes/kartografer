import type { LucideIcon } from "lucide-react";

export default function SettingsSection({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-start gap-3 rounded-t-lg border-b border-border bg-card-secondary/35 p-4 sm:p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-black uppercase text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="mt-0.5 text-lg font-black text-foreground">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-secondary-foreground">
            {description}
          </p>
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
