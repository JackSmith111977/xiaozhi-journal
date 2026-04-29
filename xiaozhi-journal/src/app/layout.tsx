import type { Metadata } from "next";
import { Noto_Serif_SC, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { BfcacheHandler } from "@/components/bfcache-handler";
import { ThemeHydration } from "@/components/theme-hydration";

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

function getTimeTheme(): "warm-sun" | "starry-night" {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "warm-sun" : "starry-night";
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = getTimeTheme();
  const isDark = theme === "starry-night";

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
