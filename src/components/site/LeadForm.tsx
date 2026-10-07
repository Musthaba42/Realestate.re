"use client";

import { useState } from "react";
import { CircleCheck, LoaderCircle, Phone } from "@/components/glyphs";
import { CONSENT_TEXT, PREFERRED_TIMES } from "@/lib/constants";
import { WhatsAppIcon } from "@/components/icons";

type Props = {
  source: "interested" | "no_results" | "contact";
  propertyId?: string;
  searchFilters?: Record<string, string>;
  submitLabel?: string;
  showPreferredTime?: boolean;
  showMessage?: boolean;
  messagePlaceholder?: string;
  callHref: string;
  successTitle?: string;
};

export function LeadForm({
  source,
  propertyId,
  searchFilters,
  submitLabel = "Submit",
  showPreferredTime = true,
  showMessage = true,
  messagePlaceholder = "Anything you would like us to know (optional)",
  callHref,
  successTitle = "Thank you! We have received your details.",
}: Props) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [waUrl, setWaUrl] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const phone = String(fd.get("phone") ?? "");
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          propertyId,
          searchFilters,
          name: String(fd.get("name") ?? ""),
          phone,
          preferredTime: fd.get("preferredTime") ? String(fd.get("preferredTime")) : undefined,
          message: fd.get("message") ? String(fd.get("message")) : undefined,
          website: String(fd.get("website") ?? ""),
        }),
      });
      const data = (await res.json().catch(() => null)) as { ok: boolean; error?: string; whatsappUrl?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Something went wrong. Please try again or call us.");
        setState("idle");
        return;
      }
      setWaUrl(data.whatsappUrl ?? "");
      setState("done");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="text-center" role="status">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent/15 text-accent">
          <CircleCheck className="size-9" />
        </span>
        <h3 className="mt-4 text-xl font-bold">{successTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Our team will call you shortly. For a faster response, send your details to us on WhatsApp now.
        </p>
        <div className="mt-6 grid gap-2.5">
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg w-full">
              <WhatsAppIcon /> Send on WhatsApp
            </a>
          )}
          <a href={callHref} className="btn btn-ghost w-full">
            <Phone className="size-4" /> Call us now
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {/* Honeypot (hidden from people, bots fill it) */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="block">
        <span className="label">Your name *</span>
        <input name="name" className="input" required minLength={2} maxLength={80} autoComplete="name" placeholder="Full name" />
      </label>
      <label className="block">
        <span className="label">Mobile number *</span>
        <div className="flex">
          <span className="grid place-items-center rounded-l-2xl border border-r-0 border-line bg-surface-3 px-3.5 text-sm text-muted">
            +91
          </span>
          <input
            name="phone"
            className="input rounded-l-none"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            maxLength={14}
          />
        </div>
      </label>
      {showPreferredTime && (
        <label className="block">
          <span className="label">Best time to call</span>
          <select name="preferredTime" className="input" defaultValue="anytime">
            {PREFERRED_TIMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {showMessage && (
        <label className="block">
          <span className="label">Message</span>
          <textarea name="message" className="input" maxLength={1000} placeholder={messagePlaceholder} rows={3} />
        </label>
      )}
      {error && (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={state === "sending"}>
        {state === "sending" ? <LoaderCircle className="size-5 animate-spin" /> : null}
        {state === "sending" ? "Sending…" : submitLabel}
      </button>
      <p className="text-center text-xs leading-relaxed text-faint">{CONSENT_TEXT}</p>
    </form>
  );
}
