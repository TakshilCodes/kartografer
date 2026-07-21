"use client";

import BrandLogo from "@/components/shared/BrandLogo";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { sendPasswordResetOtpAction } from "@/actions/auth/send-password-reset-otp.action";

function getActionErrorMessage(error: unknown) {
  if (!error) return "Something went wrong. Please try again.";

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    const fieldErrors = error as Record<string, string[] | undefined>;
    const firstError = Object.values(fieldErrors).flat().find(Boolean);

    if (firstError) return firstError;
  }

  return "Something went wrong. Please try again.";
}

export default function ForgotPasswordClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.toLowerCase().trim();

    startTransition(async () => {
      const result = await sendPasswordResetOtpAction({
        email: normalizedEmail,
      });

      if (!result.ok) {
        setError(getActionErrorMessage(result.error));
        return;
      }

      router.push(
        `/reset-password/verify-otp?email=${encodeURIComponent(normalizedEmail)}`,
      );
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 -top-70 h-140 w-230 -translate-x-1/2 rounded-full bg-card-secondary/50 blur-3xl" />
        <div className="absolute -right-55 top-24 h-110 w-110 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-65 -left-45 h-120 w-120 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[44px_44px] opacity-30" />
        <div className="absolute inset-0 bg-linear-to-b from-background/10 via-background/80 to-background" />
      </div>

      <Link
        href="/signin"
        className="group fixed left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/45 px-4 py-2 text-sm font-bold text-foreground shadow-[0_14px_40px_rgba(93,62,29,0.12)] backdrop-blur-2xl transition hover:bg-white/70 hover:shadow-[0_18px_50px_rgba(93,62,29,0.16)] sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
        Back
      </Link>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-110">
          <div className="mb-6 text-center">
            <BrandLogo
              className="mb-4 w-full justify-center"
              compactClassName="h-12 w-12"
              wordmarkClassName="h-auto w-44 sm:w-48"
              priority
            />
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-white/45 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-secondary-foreground shadow-sm backdrop-blur-xl">
              <ShieldCheck className="h-3.5 w-3.5" />
              Account recovery
            </div>

            <h1 className="text-3xl font-black tracking-tighter text-foreground sm:text-4xl">
              Reset your password
            </h1>

            <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
              Enter your email and we will send a 6-digit reset code if the
              account can use password sign in.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-4xl border border-white/60 bg-white/35 p-2 shadow-[0_30px_100px_rgba(93,62,29,0.18)] backdrop-blur-2xl">
            <div className="absolute inset-0 bg-linear-to-b from-white/60 via-white/30 to-white/10" />
            <div className="absolute left-1/2 -top-30 h-60 w-60 -translate-x-1/2 rounded-full bg-card-secondary/45 blur-3xl" />

            <div className="relative rounded-[1.55rem] border border-white/55 bg-card/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-black text-foreground">
                    Email
                  </label>

                  <div className="group flex items-center gap-3 rounded-2xl border border-border bg-input px-4 py-3 transition hover:bg-input-hover focus-within:border-ring focus-within:bg-input focus-within:ring-4 focus-within:ring-ring/15">
                    <Mail className="h-4 w-4 text-muted-foreground transition group-focus-within:text-primary" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isPending}
                  className="group mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-black text-primary-foreground shadow-[0_18px_44px_rgba(93,62,29,0.25)] transition hover:bg-primary-hover hover:shadow-[0_24px_60px_rgba(93,62,29,0.30)] disabled:pointer-events-none disabled:opacity-70"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Send reset code
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm font-semibold text-muted-foreground">
                Remembered it?{" "}
                <Link
                  href="/signin"
                  className="font-black text-primary transition hover:text-primary-hover hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
