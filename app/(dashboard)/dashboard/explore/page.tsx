import { redirect } from "next/navigation";

type OldDashboardExplorePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OldDashboardExplorePage({ searchParams }: OldDashboardExplorePageProps) {
  const params = new URLSearchParams();
  const resolvedSearchParams = (await searchParams) ?? {};

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }

    if (value) params.set(key, value);
  });

  redirect(params.toString() ? `/explore?${params.toString()}` : "/explore");
}