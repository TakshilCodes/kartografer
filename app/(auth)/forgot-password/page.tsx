import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import ForgotPasswordClient from "./ForgotPasswordClient";

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return <ForgotPasswordClient />;
}
