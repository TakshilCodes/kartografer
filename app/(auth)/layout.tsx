import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Access",
  description:
    "Sign in, create an account, verify OTP codes, or reset your Kartografer password to continue planning trips.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}