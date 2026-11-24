import "server-only";
import { cache } from "react";
import type { SiteSettings } from "@prisma/client";
import { db } from "./db";
import { cachedSiteData } from "./cache";

export type Settings = Omit<SiteSettings, "updatedAt">;

export const DEFAULT_SETTINGS: Settings = {
  id: "site",
  businessName: "Golden Groups",
  tagline: "Real Estate · Land · Houses · Apartments · Commercial",
  phone: "+916380550531",
  whatsappNumber: "+916380550531",
  contactPerson: "Mageshwaravigna Raaj",
  email: "goldengroupsre@gmail.com",
  address: "Chennai, Tamil Nadu",
  mapsUrl: null,
  workingHours: "Mon – Sat, 9:30 AM – 7:00 PM",
  instagramUrl: "https://www.instagram.com/goldengroups_re",
  facebookUrl: "https://www.facebook.com/share/19QegTTkxn/",
  youtubeUrl: null,
  heroTitle: "Find the right property in the right area",
  heroSubtitle:
    "Land, houses, apartments and commercial properties. Pick an area, explore, and tap “I am Interested”. Our team will call you.",
  aboutText:
    "Golden Groups helps families and investors buy the right property with complete clarity: clear documents, honest negotiable pricing and full support from the first site visit to registration.",
  reraNumber: null,
  loanMaxPercent: 90,
};

const loadSettings = cachedSiteData(async (): Promise<Settings> => {
  const row = await db.siteSettings.findUnique({ where: { id: "site" } });
  if (!row) return DEFAULT_SETTINGS;
  const { updatedAt: _updatedAt, ...rest } = row;
  // Rows saved before the contact-person field existed fall back to the default name.
  return { ...rest, contactPerson: rest.contactPerson ?? DEFAULT_SETTINGS.contactPerson };
}, "settings");

export const getSettings = cache((): Promise<Settings> => loadSettings());
