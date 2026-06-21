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
      <header className="flex items-start gap-4 rounded-t-lg border-b border-border bg-card-secondary/35 p-5 sm:p-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-black uppercase text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-black text-foreground">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary-foreground">
            {description}
          </p>
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}