"use client";

import BrandLogo from "@/components/shared/BrandLogo";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import {
    ArrowLeft,
    ArrowRight,
    Eye,
    EyeOff,
    Loader2,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sparkles,
    User,
} from "lucide-react";

import { sendSignupOtpAction } from "@/actions/auth/send-signup-otp.action";

export default function SignupClient() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [isSignupPending, startSignupTransition] = useTransition();
    const [isGooglePending, startGoogleTransition] = useTransition();

    const isLoading = isSignupPending || isGooglePending;

    function handleSignup(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const normalizedEmail = email.toLowerCase().trim();

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        startSignupTransition(async () => {
            const result = await sendSignupOtpAction({
                name: name.trim(),
                email: normalizedEmail,
                password,
            });

            if (!result.ok) {
                setError(getActionErrorMessage(result.error));
                return;
            }

            router.push(`/signup/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);
        });
    }

    function handleGoogleSignup() {
        setError(null);

        startGoogleTransition(async () => {
            await signIn("google", {
                callbackUrl: "/dashboard",
            });
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
                href="/"
                className="group fixed left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/45 px-4 py-2 text-sm font-bold text-foreground shadow-[0_14px_40px_rgba(93,62,29,0.12)] backdrop-blur-2xl transition hover:bg-white/70 hover:shadow-[0_18px_50px_rgba(93,62,29,0.16)] sm:left-6 sm:top-6"
            >
                <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
                Back
            </Link>

            <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-15">
                <div className="w-full max-w-115">
                    {/* Top brand */}
                    <div className="mb-6 text-center">
                        <BrandLogo
                            className="mb-4 w-full justify-center"
                            compactClassName="h-12 w-12"
                            wordmarkClassName="h-auto w-44 sm:w-48"
                            priority
                        />

                        <h1 className="text-3xl font-black tracking-tighter text-foreground sm:text-4xl">
                            Create your account
                        </h1>

                        <p className="mt-2 text-sm font-semibold text-muted-foreground">
                            Join Kartografer and build your first AI travel workspace.
                        </p>
                    </div>

                    {/* Signup card */}
                    <div className="relative overflow-hidden rounded-4xl border border-white/60 bg-white/35 p-2 shadow-[0_30px_100px_rgba(93,62,29,0.18)] backdrop-blur-2xl">
                        <div className="absolute inset-0 bg-linear-to-b from-white/60 via-white/30 to-white/10" />
                        <div className="absolute left-1/2 -top-30 h-60 w-60 -translate-x-1/2 rounded-full bg-card-secondary/45 blur-3xl" />
                        <div className="absolute -bottom-30 -right-30 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

                        <div className="relative rounded-[1.55rem] border border-white/55 bg-card/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:p-7">
                            <button
                                type="button"
                                onClick={handleGoogleSignup}
                                disabled={isLoading}
                                className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-extrabold text-foreground shadow-sm transition hover:border-secondary-hover hover:bg-card-hover hover:shadow-[0_12px_30px_rgba(93,62,29,0.10)] disabled:pointer-events-none disabled:opacity-70"
                            >
                                {isGooglePending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <GoogleIcon />
                                )}
                                Continue with Google
                            </button>

                            <div className="my-6 flex items-center gap-3">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                                    or
                                </span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            <form onSubmit={handleSignup} className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-black text-foreground">
                                        Name
                                    </label>

                                    <div className="group flex items-center gap-3 rounded-2xl border border-border bg-input px-4 py-3 transition hover:bg-input-hover focus-within:border-ring focus-within:bg-input focus-within:ring-4 focus-within:ring-ring/15">
                                        <User className="h-4 w-4 text-muted-foreground transition group-focus-within:text-primary" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(event) => setName(event.target.value)}
                                            placeholder="Your name"
                                            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                                            required
                                        />
                                    </div>
                                </div>

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

                                <div>
                                    <label className="mb-2 block text-sm font-black text-foreground">
                                        Password
                                    </label>

                                    <div className="group flex items-center gap-3 rounded-2xl border border-border bg-input px-4 py-3 transition hover:bg-input-hover focus-within:border-ring focus-within:bg-input focus-within:ring-4 focus-within:ring-ring/15">
                                        <LockKeyhole className="h-4 w-4 text-muted-foreground transition group-focus-within:text-primary" />

                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder="Create a password"
                                            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                                            required
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
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
                                            onChange={(event) => setConfirmPassword(event.target.value)}
                                            placeholder="Repeat password"
                                            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-black text-primary-foreground shadow-[0_18px_44px_rgba(93,62,29,0.25)] transition hover:bg-primary-hover hover:shadow-[0_24px_60px_rgba(93,62,29,0.30)] disabled:pointer-events-none disabled:opacity-70"
                                >
                                    {isSignupPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        <>
                                            Create account
                                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-sm font-semibold text-muted-foreground">
                                Already have an account?{" "}
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

        if (firstError) {
            return firstError;
        }
    }

    return "Something went wrong. Please try again.";
}

function GoogleIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
            />
        </svg>
    );
}