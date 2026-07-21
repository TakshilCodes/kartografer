import type { MetadataRoute } from "next";

import { absoluteUrl, siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/explore", "/explore/"],
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/api",
          "/api/",
          "/share",
          "/share/",
          "/login",
          "/signin",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify-otp",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
