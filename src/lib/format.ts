const inrFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹40,00,000 */
export function formatINR(value: number): string {
  return "₹" + inrFormatter.format(Math.round(value));
}

function trimDecimals(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, "");
}

/** ₹40 Lakhs · ₹1.25 Cr · ₹85,000 */
export function formatPriceShort(value: number): string {
  if (value >= 1_00_00_000) return `₹${trimDecimals(value / 1_00_00_000)} Cr`;
  if (value >= 1_00_000) {
    const lakhs = value / 1_00_000;
    return `₹${trimDecimals(lakhs)} ${lakhs === 1 ? "Lakh" : "Lakhs"}`;
  }
  return formatINR(value);
}

export function formatNumber(value: number): string {
  return inrFormatter.format(Math.round(value));
}

export function formatSqft(value: number): string {
  return `${formatNumber(value)} sq.ft`;
}

export function pricePerSqft(price: number, sqft: number): number | null {
  if (!sqft || sqft <= 0) return null;
  return Math.round(price / sqft);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Normalise an Indian mobile number. Accepts "98765 43210", "+91-9876543210",
 * "09876543210" etc. Returns "+919876543210" or null if invalid.
 */
export function normalizeIndianPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return "+91" + digits;
}

/** "+919876543210" → "+91 98765 43210" */
export function displayPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return phone;
}

/** Digits only, with country code, for wa.me / tel: links. */
export function phoneDigits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? "91" + d : d;
}

export function whatsappLink(phone: string, message?: string): string {
  const base = `https://wa.me/${phoneDigits(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink(phone: string): string {
  return `tel:+${phoneDigits(phone)}`;
}

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch {
    return null;
  }
  return null;
}

export function mapsSearchLink(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}
