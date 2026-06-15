import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
      },
    },
  });

  if (error) {
    console.error("RESEND_OTP_EMAIL_ERROR", error);
    throw new Error("Could not send OTP email. Please try again.");
  }
}
