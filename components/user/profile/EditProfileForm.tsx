"use client";

import { Check, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { updateProfileAction } from "@/actions/user/update-profile.action";

type EditProfileFormProps = {
  initialName: string;
};

export default function EditProfileForm({ initialName }: EditProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!message && !error) return;

    const timer = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [message, error]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    startTransition(async () => {
      const result = await updateProfileAction({ name });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setName(name.trim().replace(/\s+/g, " "));
      setMessage("Profile updated successfully.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="border-b border-border pb-4">
        <p className="text-xs font-black uppercase text-muted-foreground">
          Account details
        </p>
        <h2 className="mt-1 text-xl font-black text-foreground">
          Edit your profile
        </h2>
        <p className="mt-1 text-sm leading-6 text-secondary-foreground">
          This name appears across your private Kartografer workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="profile-name" className="text-sm font-black text-foreground">
              Display name
            </label>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {name.length}/60
            </span>
          </div>
          <input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            maxLength={60}
            autoComplete="name"
            disabled={isPending}
            className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition hover:bg-input-hover focus:border-ring focus:ring-4 focus:ring-ring/20 disabled:opacity-70"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? "Saving..." : "Save changes"}
        </button>

        <div aria-live="polite">
          {message ? (
            <p className="flex items-center gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-bold text-success">
              <Check className="h-4 w-4 shrink-0" />
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}