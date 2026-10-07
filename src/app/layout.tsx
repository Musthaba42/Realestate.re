import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono, Marcellus } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/format";
import "./globals.css";

// Marcellus: flared, inscriptional capitals — like an engraved brass name plate. Used for headings only.
const display = Marcellus({ subsets: ["latin"], weight: "400", variable: "--font-marcellus", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
// Plex Mono: survey-sheet figures — property codes, distances, areas.
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

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
  themeColor: "#0e0d0b",
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
