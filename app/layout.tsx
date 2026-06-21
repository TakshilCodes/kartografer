import type { Metadata } from "next";

import { ThemeProvider } from "@/components/providers/ThemeProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kartografer",
    template: "%s | Kartografer",
  },
  description:
    "Create personalized AI-powered travel itineraries, organize every day, estimate trip costs, and share your journey with Kartografer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}