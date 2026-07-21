"use client";

import BrandLogo from "@/components/shared/BrandLogo";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { resetPasswordAction } from "@/actions/auth/reset-password.action";

type NewPasswordClientProps = {
  token: string;
};

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

export default function NewPasswordClient({ token }: NewPasswordClientProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await resetPasswordAction({
        token,
        password,
      });

      if (!result.ok) {
        setError(getActionErrorMessage(result.error));
        return;
      }

      setSuccessMsg("Password reset successfully. Redirecting to sign in...");

      setTimeout(() => {
        router.push("/signin");
      }, 900);
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
              Secure reset
            </div>

            <h1 className="text-3xl font-black tracking-tighter text-foreground sm:text-4xl">
              Create new password
            </h1>

            <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
              Choose a strong password for your Kartografer account.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-4xl border border-white/60 bg-white/35 p-2 shadow-[0_30px_100px_rgba(93,62,29,0.18)] backdrop-blur-2xl">
            <div className="absolute inset-0 bg-linear-to-b from-white/60 via-white/30 to-white/10" />

            <div className="relative rounded-[1.55rem] border border-white/55 bg-card/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-black text-foreground">
                    New password
                  </label>

                  <div className="group flex items-center gap-3 rounded-2xl border border-border bg-input px-4 py-3 transition hover:bg-input-hover focus-within:border-ring focus-within:bg-input focus-within:ring-4 focus-within:ring-ring/15">
                    <LockKeyhole className="h-4 w-4 text-muted-foreground transition group-focus-within:text-primary" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="cursor-pointer text-muted-foreground transition hover:text-primary"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-foreground">
                    Confirm password
                  </label>

                  <div className="group flex items-center gap-3 rounded-2xl border border-border bg-input px-4 py-3 transition hover:bg-input-hover focus-within:border-ring focus-within:bg-input focus-within:ring-4 focus-within:ring-ring/15">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground transition group-focus-within:text-primary" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Repeat new password"
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

                {successMsg ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-bold text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    {successMsg}
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
                      Saving password...
                    </>
                  ) : (
                    <>
                      Reset password
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
