import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { absoluteUrl, siteConfig } from "@/lib/site";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.defaultTitle,
    template: "%s | Kartografer",
  },
  description:
    "Plan smarter trips with Kartografer, an AI travel planner that creates detailed itineraries with places, stays, transport, meals, activities, and estimated costs.",
  keywords: siteConfig.keywords,
  authors: [{ name: "Kartografer" }],
  creator: "Kartografer",
  publisher: "Kartografer",
  applicationName: "Kartografer",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.defaultTitle,
    description:
      "Plan smarter trips with Kartografer, an AI travel planner that creates detailed itineraries with places, stays, transport, meals, activities, and estimated costs.",
    url: absoluteUrl("/"),
    images: [
      {
        url: absoluteUrl(siteConfig.ogImage),
        width: 1200,
        height: 630,
        alt: "Kartografer AI travel planner workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.defaultTitle,
    description:
      "Plan smarter trips with Kartografer, an AI travel planner that creates detailed itineraries with places, stays, transport, meals, activities, and estimated costs.",
    images: [absoluteUrl(siteConfig.ogImage)],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}