"use server";

import { sendPasswordResetOtpAction } from "@/actions/auth/send-password-reset-otp.action";

export async function resendPasswordResetOtpAction(values: { email: string }) {
  return sendPasswordResetOtpAction(values);
}
