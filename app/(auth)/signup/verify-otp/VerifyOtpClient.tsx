"use client";

import BrandLogo from "@/components/shared/BrandLogo";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MailCheck,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import { resendSignupOtpAction } from "@/actions/auth/resend-signup-otp.action";
import { verifySignupOtpAction } from "@/actions/auth/verify-signup-otp.action";

type VerifyOtpClientProps = {
  email: string;
};

function getActionErrorMessage(error: unknown) {
  if (!error) return "Something went wrong. Please try again.";

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    const fieldErrors = error as Record<string, string[] | undefined>;

    const firstError = Object.values(fieldErrors)
      .flat()
      .find(Boolean);

    if (firstError) return firstError;
  }

  return "Something went wrong. Please try again.";
}

export default function VerifyOtpClient({ email }: VerifyOtpClientProps) {
  const router = useRouter();

  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isVerifyPending, startVerifyTransition] = useTransition();
  const [isResendPending, startResendTransition] = useTransition();

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otp = useMemo(() => otpValues.join(""), [otpValues]);
  const isLoading = isVerifyPending || isResendPending;

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);

    const nextOtp = [...otpValues];
    nextOtp[index] = digit;
    setOtpValues(nextOtp);
    setError(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pastedValue = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedValue) return;

    const nextOtp = Array.from({ length: 6 }, (_, index) => pastedValue[index] ?? "");
    setOtpValues(nextOtp);

    const focusIndex = Math.min(pastedValue.length, 6) - 1;
    inputRefs.current[focusIndex]?.focus();
  }

  function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    startVerifyTransition(async () => {
      const result = await verifySignupOtpAction({
        email,
        otp,
      });

      if (!result.ok) {
        setError(getActionErrorMessage(result.error));
        return;
      }

      setSuccessMsg("Account verified successfully. Redirecting to sign in...");

      setTimeout(() => {
        router.push("/signin");
      }, 900);
    });
  }

  function handleResendOtp() {
    setError(null);
    setSuccessMsg(null);

    startResendTransition(async () => {
      const result = await resendSignupOtpAction({
        email,
      });

      if (!result.ok) {
        setError(getActionErrorMessage(result.error));
        return;
      }

      setOtpValues(["", "", "", "", "", ""]);
      setSuccessMsg("A new verification code was sent.");
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 -top-70 h-140 w-230 -translate-x-1/2 rounded-full bg-card-secondary/50 blur-3xl" />
        <div className="absolute -right-55 top-24 h-110 w-110 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-65 -left-45 h-120 w-120 rounded-full bg-primary/10 blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[44px_44px] opacity-30" />
        <div className="absolute inset-0 bg-linear-to-b from-background/10 via-background/80 to-background" />
      </div>

      {/* Back button */}
      <Link
        href="/signup"
        className="group fixed left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/45 px-4 py-2 text-sm font-bold text-foreground shadow-[0_14px_40px_rgba(93,62,29,0.12)] backdrop-blur-2xl transition hover:bg-white/70 hover:shadow-[0_18px_50px_rgba(93,62,29,0.16)] sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
        Back
      </Link>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-115">
          {/* Top title */}
          <div className="mb-6 text-center">
                        <BrandLogo
                            className="mb-4 w-full justify-center"
                            compactClassName="h-12 w-12"
                            wordmarkClassName="h-auto w-44 sm:w-48"
                            priority
                        />
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-white/45 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-secondary-foreground shadow-sm backdrop-blur-xl">
              <ShieldCheck className="h-3.5 w-3.5" />
              Email verification
            </div>

            <h1 className="text-3xl font-black tracking-tighter text-foreground sm:text-4xl">
              Check your inbox
            </h1>

            <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
              We sent a 6-digit verification code to{" "}
              <span className="font-black text-primary">{email}</span>.
            </p>
          </div>

          {/* Card */}
          <div className="relative overflow-hidden rounded-4xl border border-white/60 bg-white/35 p-2 shadow-[0_30px_100px_rgba(93,62,29,0.18)] backdrop-blur-2xl">
            <div className="absolute inset-0 bg-linear-to-b from-white/60 via-white/30 to-white/10" />
            <div className="absolute left-1/2 -top-30 h-60 w-60 -translate-x-1/2 rounded-full bg-card-secondary/45 blur-3xl" />
            <div className="absolute -bottom-30 -right-30 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative rounded-[1.55rem] border border-white/55 bg-card/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:p-7">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                <MailCheck className="h-7 w-7 text-primary" />
              </div>

              <form onSubmit={handleVerify}>
                <label className="mb-3 block text-center text-sm font-black text-foreground">
                  Enter verification code
                </label>

                <div className="flex justify-center gap-2 sm:gap-3">
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={value}
                      onChange={(event) =>
                        handleOtpChange(index, event.target.value)
                      }
                      onKeyDown={(event) => handleKeyDown(index, event)}
                      onPaste={handlePaste}
                      disabled={isLoading}
                      className="h-12 w-11 rounded-2xl border border-border bg-input text-center text-lg font-black text-foreground outline-none transition hover:bg-input-hover focus:border-ring focus:bg-input focus:ring-4 focus:ring-ring/15 disabled:opacity-60 sm:h-14 sm:w-12"
                    />
                  ))}
                </div>

                {error && (
                  <div className="mt-5 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div className="mt-5 flex items-center gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-bold text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-black text-primary-foreground shadow-[0_18px_44px_rgba(93,62,29,0.25)] transition hover:bg-primary-hover hover:shadow-[0_24px_60px_rgba(93,62,29,0.30)] disabled:pointer-events-none disabled:opacity-70"
                >
                  {isVerifyPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify account
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-3 text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm font-black text-primary transition hover:text-primary-hover hover:underline disabled:pointer-events-none disabled:opacity-60"
                >
                  {isResendPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Resend code
                </button>

                <p className="text-xs font-semibold leading-5 text-muted-foreground">
                  Wrong email?{" "}
                  <Link
                    href="/signup"
                    className="font-black text-secondary-foreground transition hover:text-primary-hover hover:underline"
                  >
                    Create account again
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
