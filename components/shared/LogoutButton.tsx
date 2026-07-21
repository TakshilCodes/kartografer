"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";

type LogoutButtonProps = {
  className?: string;
  label?: string;
  redirectTo?: string;
};

export default function LogoutButton({
  className = "",
  label = "Logout",
  redirectTo = "/",
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    await signOut({
      callbackUrl: redirectTo,
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-2.5 text-sm font-bold text-danger-foreground shadow-sm transition hover:bg-danger-hover disabled:pointer-events-none disabled:opacity-70 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}

      {isLoading ? "Logging out..." : label}
    </button>
  );
}
