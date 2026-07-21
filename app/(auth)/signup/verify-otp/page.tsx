import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import VerifyOtpClient from "./VerifyOtpClient";

type VerifyOtpPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function VerifyOtpPage({
  searchParams,
}: VerifyOtpPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const email = params.email;

  if (!email) {
    redirect("/signup");
  }

  return <VerifyOtpClient email={email} />;
}
