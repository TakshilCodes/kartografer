export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  throw new Error("NEXT_PUBLIC_APP_URL is required outside development.");
}

export function getPublicTripShareUrl(slug: string) {
  return `${getAppUrl()}/share/trips/${encodeURIComponent(slug)}`;
}
