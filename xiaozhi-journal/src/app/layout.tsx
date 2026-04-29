import type { Metadata } from "next";
import { Noto_Serif_SC, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { BfcacheHandler } from "@/components/bfcache-handler";

const notoSerif = Noto_Serif_SC({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const notoSans = Noto_Sans_SC({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Xiaozhi Journal",
  description: "被理解的日记",
};

import { headers } from "next/headers";
import { getTimeTheme } from "@/lib/theme";
import { ThemeHydration } from "@/components/theme-hydration";

async function resolveDarkClass(): Promise<boolean> {
  const h = await headers();
  // Vercel injects user IP timezone from CloudFront/edge headers
  const tz = h.get("x-vercel-ip-timezone");

  if (tz) {
    const hour = Number(
      new Date().toLocaleString("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }),
    );
    return hour >= 6 && hour < 18 ? false : true;
  }

  // Fallback: server local time (non-Vercel deployments)
  return getTimeTheme() === "starry-night";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDark = await resolveDarkClass();

  return (
    <html
      lang="zh-CN"
      className={`${notoSerif.variable} ${notoSans.variable} h-full${isDark ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased">
        {children}
        <BfcacheHandler />
        <ThemeHydration />
      </body>
    </html>
  );
}
