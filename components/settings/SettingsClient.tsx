"use client";

import {
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  IndianRupee,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState, useTransition } from "react";

import { confirmEmailChangeAction } from "@/actions/settings/confirm-email-change.action";
import { deleteAccountAction } from "@/actions/settings/delete-account.action";
import { confirmPasswordChangeAction } from "@/actions/settings/confirm-password-change.action";
import { requestEmailChangeOtpAction } from "@/actions/settings/request-email-change-otp.action";
import { requestPasswordChangeOtpAction } from "@/actions/settings/request-password-change-otp.action";
import {
  updateUserSettingsAction,
  type UpdateUserSettingsInput,
} from "@/actions/settings/update-user-settings.action";
import { useTheme, type ThemePreferenceValue } from "@/components/providers/ThemeProvider";
import SettingsSection from "@/components/settings/SettingsSection";
import CustomSelect from "@/components/shared/CustomSelect";
import { useConfirmStore } from "@/stores/use-confirm-store";

type SettingsClientProps = {
  user: {
    name: string;
    email: string | null;
    joinedAt: string;
  };
  initialSettings: UpdateUserSettingsInput & {
    defaultCurrency: string;
  };
};

type Notice = { type: "success" | "error"; text: string } | null;

const themeOptions: Array<{
  value: ThemePreferenceValue;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  { value: "LIGHT", label: "Light", description: "Warm paper and cream surfaces", icon: Sun },
  { value: "DARK", label: "Dark", description: "Warm night palette with soft contrast", icon: Moon },
  { value: "SYSTEM", label: "System", description: "Follow this device automatically", icon: Globe2 },
];

const currencyOptions = [
  {
    value: "INR",
    label: "INR - Indian Rupee",
    description: "More currencies are coming later.",
  },
];

const visibilityOptions = [
  {
    value: "PRIVATE",
    label: "Private",
    description: "Only you can access the trip.",
  },
  {
    value: "UNLISTED",
    label: "Unlisted",
    description: "Available through a private share link.",
  },
  {
    value: "PUBLIC",
    label: "Public",
    description: "Prepared for future public discovery.",
  },
];
function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function NoticeMessage({ notice }: { notice: Notice }) {
  if (!notice) return null;

  return (
    <p
      role="status"
      className={
        notice.type === "success"
          ? "flex items-center gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-bold text-success"
          : "rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm font-bold text-danger"
      }
    >
      {notice.type === "success" ? <Check className="h-4 w-4 shrink-0" /> : null}
      {notice.text}
    </p>
  );
}

function ToggleRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 border-b border-border py-4 last:border-b-0">
      <span>
        <span className="block text-sm font-black text-foreground">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition " +
          (checked ? "border-primary bg-primary" : "border-border bg-card-secondary")
        }
      >
        <span
          className={
            "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition " +
            (checked ? "left-5" : "left-0.5")
          }
        />
      </span>
    </label>
  );
}

export default function SettingsClient({
  user,
  initialSettings,
}: SettingsClientProps) {
  const router = useRouter();
  const confirm = useConfirmStore((state) => state.confirm);
  const theme = useTheme();
  const [settings, setSettings] = useState(initialSettings);
  const [settingsNotice, setSettingsNotice] = useState<Notice>(null);
  const [emailNotice, setEmailNotice] = useState<Notice>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [deleteNotice, setDeleteNotice] = useState<Notice>(null);
  const currentEmail = user.email;
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStep, setEmailStep] = useState<"REQUEST" | "VERIFY">("REQUEST");
  const [passwordStep, setPasswordStep] = useState<"REQUEST" | "VERIFY">("REQUEST");
  const [passwordOtp, setPasswordOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isEmailPending, startEmailTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  useEffect(() => {
    const notices = [settingsNotice, emailNotice, passwordNotice, deleteNotice];
    if (!notices.some(Boolean)) return;
    const timer = window.setTimeout(() => {
      setSettingsNotice(null);
      setEmailNotice(null);
      setPasswordNotice(null);
      setDeleteNotice(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [settingsNotice, emailNotice, passwordNotice, deleteNotice]);

  function updateSetting<K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function selectTheme(value: ThemePreferenceValue) {
    updateSetting("themePreference", value);
    theme.setThemePreference(value);
  }

  function savePreferences() {
    setSettingsNotice(null);
    startSaving(async () => {
      const result = await updateUserSettingsAction({
        themePreference: settings.themePreference,
        defaultTripVisibility: settings.defaultTripVisibility,
        enablePublicSharingByDefault: settings.enablePublicSharingByDefault,
        exportIncludeEstimatedBudget: settings.exportIncludeEstimatedBudget,
        exportIncludePlannedBudget: settings.exportIncludePlannedBudget,
        exportIncludeTravelerNotes: settings.exportIncludeTravelerNotes,
        exportIncludeKartograferBranding: settings.exportIncludeKartograferBranding,
      });

      if (!result.ok) {
        setSettingsNotice({ type: "error", text: result.error });
        return;
      }

      setSettingsNotice({ type: "success", text: "Preferences saved." });
      router.refresh();
    });
  }

  function requestEmailOtp(event: React.FormEvent) {
    event.preventDefault();
    setEmailNotice(null);
    startEmailTransition(async () => {
      const result = await requestEmailChangeOtpAction({ newEmail });
      if (!result.ok) {
        setEmailNotice({ type: "error", text: result.error });
        return;
      }
      setEmailStep("VERIFY");
      setEmailNotice({ type: "success", text: result.message });
    });
  }

  function confirmEmail(event: React.FormEvent) {
    event.preventDefault();
    setEmailNotice(null);
    startEmailTransition(async () => {
      const result = await confirmEmailChangeAction({ otp: emailOtp });
      if (!result.ok) {
        setEmailNotice({ type: "error", text: result.error });
        return;
      }
      await signOut({
        callbackUrl: "/signin?emailChanged=1",
      });
    });
  }

  function requestPasswordOtp() {
    setPasswordNotice(null);
    startPasswordTransition(async () => {
      const result = await requestPasswordChangeOtpAction();
      if (!result.ok) {
        setPasswordNotice({ type: "error", text: result.error });
        return;
      }
      setPasswordStep("VERIFY");
      setPasswordNotice({ type: "success", text: result.message });
    });
  }

  function confirmPasswordChange(event: React.FormEvent) {
    event.preventDefault();
    setPasswordNotice(null);
    startPasswordTransition(async () => {
      const result = await confirmPasswordChangeAction({
        otp: passwordOtp,
        password,
        confirmPassword,
      });
      if (!result.ok) {
        setPasswordNotice({ type: "error", text: result.error });
        return;
      }
      setPasswordOtp("");
      setPassword("");
      setConfirmPassword("");
      setPasswordStep("REQUEST");
      setPasswordNotice({ type: "success", text: result.message });
    });
  }

  async function handleDeleteAccount() {
    setDeleteNotice(null);

    const confirmed = await confirm({
      title: "Delete your Kartografer account?",
      description:
        "This permanently deletes your profile, trips, itinerary items, chat history, public links, and settings. This action cannot be undone.",
      confirmText: "Delete account",
      cancelText: "Keep account",
      variant: "danger",
    });

    if (!confirmed) return;

    startDeleteTransition(async () => {
      const result = await deleteAccountAction();

      if (!result.ok) {
        setDeleteNotice({ type: "error", text: result.error });
        return;
      }

      await signOut({
        callbackUrl: "/signin?accountDeleted=1",
      });
    });
  }
  return (
    <div className="space-y-6">
      <SettingsSection
        icon={UserRound}
        eyebrow="Account"
        title="Your Kartografer account"
        description="Profile identity is shown here. Change your display name from the Profile page."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-card-secondary/55 p-4">
            <p className="text-[11px] font-black uppercase text-muted-foreground">Explorer</p>
            <p className="mt-2 text-sm font-black text-foreground">{user.name}</p>
          </div>
          <div className="rounded-lg bg-card-secondary/55 p-4">
            <p className="text-[11px] font-black uppercase text-muted-foreground">Email</p>
            <p className="mt-2 break-all text-sm font-black text-foreground">
              {currentEmail ?? "Email unavailable"}
            </p>
          </div>
          <div className="rounded-lg bg-card-secondary/55 p-4">
            <p className="text-[11px] font-black uppercase text-muted-foreground">Member since</p>
            <p className="mt-2 text-sm font-black text-foreground">
              {formatJoinedDate(user.joinedAt)}
            </p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={ShieldCheck}
        eyebrow="Security"
        title="Email and password"
        description="Both changes require a short-lived code delivered by Resend."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <form onSubmit={emailStep === "REQUEST" ? requestEmailOtp : confirmEmail}>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary" />
              <h3 className="text-base font-black text-foreground">Change email</h3>
            </div>
            {emailStep === "REQUEST" ? (
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-black text-foreground" htmlFor="new-email">
                  New email address
                </label>
                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.currentTarget.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
                <button
                  disabled={isEmailPending || !newEmail.trim()}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isEmailPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  Send code
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xs leading-5 text-muted-foreground">
                  Enter the code sent to <strong>{newEmail}</strong>.
                </p>
                <input
                  value={emailOtp}
                  onChange={(event) => setEmailOtp(event.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-bold tracking-[0.3em] text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={isEmailPending || emailOtp.length !== 6}
                    className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isEmailPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Verify email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep("REQUEST");
                      setEmailOtp("");
                    }}
                    className="h-11 cursor-pointer rounded-full border border-border px-5 text-sm font-black text-foreground hover:bg-card-secondary"
                  >
                    Use another email
                  </button>
                </div>
              </div>
            )}
            <div className="mt-4"><NoticeMessage notice={emailNotice} /></div>
          </form>

          <form onSubmit={confirmPasswordChange} className="border-t border-border pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-primary" />
              <h3 className="text-base font-black text-foreground">Change password</h3>
            </div>
            {passwordStep === "REQUEST" ? (
              <div className="mt-4">
                <p className="text-xs leading-5 text-muted-foreground">
                  A code will be sent to {currentEmail ?? "your account email"}.
                </p>
                <button
                  type="button"
                  onClick={requestPasswordOtp}
                  disabled={isPasswordPending || !currentEmail}
                  className="mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPasswordPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                  Send security code
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <input
                  value={passwordOtp}
                  onChange={(event) => setPasswordOtp(event.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-bold tracking-[0.3em] text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    autoComplete="new-password"
                    placeholder="New password"
                    className="w-full rounded-2xl border border-border bg-input px-4 py-3 pr-12 text-sm font-semibold text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((value) => !value)}
                    aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-card-secondary"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
                <button
                  disabled={isPasswordPending}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPasswordPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Update password
                </button>
              </div>
            )}
            <div className="mt-4"><NoticeMessage notice={passwordNotice} /></div>
          </form>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Sun}
        eyebrow="Appearance"
        title="Choose your atmosphere"
        description="Use Kartografer's warm daylight palette, night palette, or follow your device."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const selected = settings.themePreference === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectTheme(option.value)}
                className={
                  "cursor-pointer rounded-lg border p-4 text-left transition " +
                  (selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-card-secondary")
                }
              >
                <Icon className="h-5 w-5" />
                <span className="mt-5 block text-sm font-black">{option.label}</span>
                <span className={"mt-1 block text-xs leading-5 " + (selected ? "text-primary-foreground/75" : "text-muted-foreground")}>
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsSection
          icon={Globe2}
          eyebrow="App preferences"
          title="Trip defaults"
          description="Defaults affect future trips only. Existing trips stay unchanged."
        >
          <div>
            <CustomSelect
              icon={<IndianRupee className="h-4 w-4" />}
              label="Default currency"
              value={settings.defaultCurrency}
              options={currencyOptions}
              onChange={() => undefined}
              disabled
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Currency changes are coming later.
            </p>
          </div>
          <div className="mt-5">
            <CustomSelect
              icon={<Eye className="h-4 w-4" />}
              label="Default trip visibility"
              value={settings.defaultTripVisibility}
              options={visibilityOptions}
              onChange={(value) =>
                updateSetting(
                  "defaultTripVisibility",
                  value as UpdateUserSettingsInput["defaultTripVisibility"]
                )
              }
            />
          </div>
          <ToggleRow
            checked={settings.enablePublicSharingByDefault}
            onChange={(value) => updateSetting("enablePublicSharingByDefault", value)}
            title="Enable public sharing by default"
            description="New trips receive a secure read-only link. Existing trips are not changed."
          />
        </SettingsSection>

        <SettingsSection
          icon={FileText}
          eyebrow="Export and PDF"
          title="Proposal contents"
          description="Choose what your owner-only PDF exports include."
        >
          <ToggleRow
            checked={settings.exportIncludeEstimatedBudget}
            onChange={(value) => updateSetting("exportIncludeEstimatedBudget", value)}
            title="Estimated cost and breakdown"
            description="Show the selected itinerary cost summary."
          />
          <ToggleRow
            checked={settings.exportIncludePlannedBudget}
            onChange={(value) => updateSetting("exportIncludePlannedBudget", value)}
            title="Planned budget"
            description="Show the budget entered while creating the trip."
          />
          <ToggleRow
            checked={settings.exportIncludeTravelerNotes}
            onChange={(value) => updateSetting("exportIncludeTravelerNotes", value)}
            title="Traveler notes"
            description="Include trip-level special notes and day notes."
          />
          <ToggleRow
            checked={settings.exportIncludeKartograferBranding}
            onChange={(value) => updateSetting("exportIncludeKartograferBranding", value)}
            title="Kartografer branding"
            description="Show Kartografer identity and generated-with footer."
          />
        </SettingsSection>
      </div>

      <section className="overflow-hidden rounded-lg border border-danger/35 bg-card shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <Trash2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase text-danger">
                Danger zone
              </p>
              <h2 className="mt-1 text-xl font-black text-foreground">
                Delete account
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary-foreground">
                Permanently remove your account and every trip, itinerary item,
                public link, chat message, and saved preference attached to it.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeletePending}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-danger px-5 text-sm font-black text-danger-foreground transition hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeletePending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isDeletePending ? "Deleting..." : "Delete account"}
          </button>
        </div>
        {deleteNotice ? (
          <div className="border-t border-danger/20 p-5 sm:px-6">
            <NoticeMessage notice={deleteNotice} />
          </div>
        ) : null}
      </section>
      <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-lg border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-foreground">Save preference changes</p>
          <p className="text-xs text-muted-foreground">Security changes are saved separately after OTP verification.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <NoticeMessage notice={settingsNotice} />
          <button
            type="button"
            onClick={savePreferences}
            disabled={isSaving}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}