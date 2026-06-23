import { redirect } from "next/navigation";

type LoginAliasPageProps = {
  searchParams?: Promise<{ callbackUrl?: string }>;
};

export default async function LoginAliasPage({ searchParams }: LoginAliasPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl;
  const params = new URLSearchParams();

  if (callbackUrl) {
    params.set("callbackUrl", callbackUrl);
  }

  redirect(params.toString() ? `/signin?${params.toString()}` : "/signin");
}