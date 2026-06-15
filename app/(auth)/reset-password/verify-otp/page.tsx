import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import ResetPasswordOtpClient from "./ResetPasswordOtpClient";

type ResetPasswordOtpPageProps = {
  searchParams?: Promise<{
    email?: string;
  }>;
};

export default async function ResetPasswordOtpPage({
  searchParams,
}: ResetPasswordOtpPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const email = params?.email;

  if (!email) {
    redirect("/forgot-password");
  }

  return <ResetPasswordOtpClient email={email} />;
}
