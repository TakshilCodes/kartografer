import Navbar from "@/components/shared/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 -top-55 h-105 w-190 -translate-x-1/2 rounded-full bg-card-secondary/35 blur-3xl" />
        <div className="absolute -right-45 top-40 h-90 w-90 rounded-full bg-accent/15 blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[42px_42px] opacity-40" />
        <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/80 to-background" />
      </div>

      <Navbar />

      <main className="pt-32">{children}</main>
    </div>
  );
}