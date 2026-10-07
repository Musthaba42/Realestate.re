import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/format";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${s.businessName} – Land, Houses, Apartments & Commercial`, template: `%s | ${s.businessName}` },
    description: s.heroSubtitle ?? s.aboutText ?? undefined,
    openGraph: { siteName: s.businessName, type: "website", locale: "en_IN" },
  };
}

export const viewport: Viewport = {
  themeColor: "#121110",
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
