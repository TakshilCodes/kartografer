import { randomInt } from "node:crypto";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export function getKartograferEmailLogoUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000";

  return new URL("/logo%26text_forlight.png", configuredUrl).toString();
}

export function generateOtp() {
  return randomInt(100000, 1000000).toString();
}

export function assertOtpEmailConfig() {
  if (!process.env.RESEND_API_KEY) {
    return "Resend API key is missing.";
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    return "Resend from email is missing.";
  }

  if (!process.env.RESEND_OTP_TEMPLATE_ID) {
    return "Resend OTP template ID is missing.";
  }

  return null;
}

export async function sendOtpEmail({
  email,
  userName,
  purpose,
  otp,
}: {
  email: string;
  userName: string;
  purpose: string;
  otp: string;
}) {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: [email],
    subject: "Your Kartografer verification code",
    template: {
      id: process.env.RESEND_OTP_TEMPLATE_ID!,
      variables: {
        userName,
        purpose,
        expiresInMinutes: "10",
        otp,
        logoUrl: getKartograferEmailLogoUrl(),
      },
    },
  });

  if (error) {
    console.error("RESEND_OTP_EMAIL_ERROR", error);
    throw new Error("Could not send OTP email. Please try again.");
  }
}
