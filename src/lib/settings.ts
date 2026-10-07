import "server-only";
import { cache } from "react";
import type { SiteSettings } from "@prisma/client";
import { db } from "./db";

export type Settings = Omit<SiteSettings, "updatedAt">;

export const DEFAULT_SETTINGS: Settings = {
  id: "site",
  businessName: "Golden Groups",
  tagline: "Real Estate · Land · Houses · Apartments · Commercial",
  phone: "+916379601928",
  whatsappNumber: "+916379601928",
  email: "goldengroupsre@gmail.com",
  address: "Chennai, Tamil Nadu",
  mapsUrl: null,
  workingHours: "Mon – Sat, 9:30 AM – 7:00 PM",
  instagramUrl: "https://www.instagram.com/goldengroups_re",
  facebookUrl: "https://www.facebook.com/share/19QegTTkxn/",
  youtubeUrl: "https://www.youtube.com/@goldengroups-i8b",
  heroTitle: "Find the right property in the right area",
  heroSubtitle:
    "Land, houses, apartments and commercial properties. Pick an area, explore, and tap “I am Interested”. Our team will call you.",
  aboutText:
    "Golden Groups helps families and investors buy the right property with complete clarity: verified documents, honest pricing and support with bank loans from start to registration.",
  reraNumber: null,
  loanMaxPercent: 90,
};

export const getSettings = cache(async (): Promise<Settings> => {
  const row = await db.siteSettings.findUnique({ where: { id: "site" } });
  if (!row) return DEFAULT_SETTINGS;
  const { updatedAt: _updatedAt, ...rest } = row;
  return rest;
});
