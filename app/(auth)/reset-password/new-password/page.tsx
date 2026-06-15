import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import NewPasswordClient from "./NewPasswordClient";

type NewPasswordPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function NewPasswordPage({
  searchParams,
}: NewPasswordPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const token = params?.token;

  if (!token) {
    redirect("/forgot-password");
  }

  return <NewPasswordClient token={token} />;
}
