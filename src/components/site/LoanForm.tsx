"use client";

import { useMemo, useState } from "react";
import { CircleCheck, Info, LoaderCircle, Phone } from "@/components/glyphs";
import { CONSENT_TEXT, PREFERRED_TIMES } from "@/lib/constants";
import { formatINR, formatPriceShort } from "@/lib/format";
import { WhatsAppIcon } from "@/components/icons";

type Opt = { id: string; label: string; price: number };

const digits = (v: string) => v.replace(/[^\d]/g, "");

export function LoanForm({
  properties,
  initialPropertyId,
  maxPercent,
  callHref,
}: {
  properties: Opt[];
  initialPropertyId?: string;
  maxPercent: number;
  callHref: string;
}) {
  const [propertyId, setPropertyId] = useState<string>(initialPropertyId ?? "");
  const selected = properties.find((p) => String(p.id) === propertyId);
  const [manualPrice, setManualPrice] = useState("");
  const [available, setAvailable] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [waUrl, setWaUrl] = useState("");

  const price = selected ? selected.price : Number(digits(manualPrice)) || 0;
  const have = Number(digits(available)) || 0;

  const calc = useMemo(() => {
    if (!price || !available) return null;
    const needed = Math.max(0, price - have);
    const pct = (needed / price) * 100;
    const maxLoan = Math.round((price * maxPercent) / 100);
    const minDown = price - maxLoan;
    return { needed, pct, maxLoan, minDown, over: pct > maxPercent };
  }, [price, have, available, maxPercent]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const phone = String(fd.get("phone") ?? "");
    if (phone.replace(/\D/g, "").length < 10) return setError("Please enter a valid 10-digit mobile number.");
    if (!price) return setError("Please choose a property or enter the property price.");
    if (!available) return setError("Please enter the amount you have available.");
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "loan",
          propertyId: selected ? selected.id : undefined,
          propertyPrice: price,
          budgetAvailable: have,
          name: String(fd.get("name") ?? ""),
          phone,
          preferredTime: String(fd.get("preferredTime") ?? "anytime"),
          message: fd.get("message") ? String(fd.get("message")) : undefined,
          website: String(fd.get("website") ?? ""),
        }),
      });
      const data = (await res.json().catch(() => null)) as { ok: boolean; error?: string; whatsappUrl?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setWaUrl(data.whatsappUrl ?? "");
      setState("done");
    } catch {
      setError("Network error. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="text-center" role="status">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent/15 text-accent">
          <CircleCheck className="size-9" />
        </span>
        <h2 className="mt-4 text-xl font-bold">Request received!</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Our loan advisor will call you to check eligibility and explain the documents needed.
        </p>
        <div className="mt-6 grid gap-2.5">
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg">
              <WhatsAppIcon /> Send on WhatsApp
            </a>
          )}
          <a href={callHref} className="btn btn-ghost">
            <Phone className="size-4" /> Call us
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="block">
        <span className="label">Property</span>
        <select className="input" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
          <option value="">Not decided / other property</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} – {formatPriceShort(p.price)}
            </option>
          ))}
        </select>
      </label>

      {!selected && (
        <label className="block">
          <span className="label">Property price (₹) *</span>
          <input
            className="input"
            inputMode="numeric"
            placeholder="e.g. 4000000"
            value={manualPrice}
            onChange={(e) => setManualPrice(digits(e.target.value))}
          />
          {Number(manualPrice) > 0 && <span className="hint">{formatINR(Number(manualPrice))}</span>}
        </label>
      )}

      <label className="block">
        <span className="label">Amount you have now (₹) *</span>
        <input
          className="input"
          inputMode="numeric"
          placeholder="e.g. 500000"
          value={available}
          onChange={(e) => setAvailable(digits(e.target.value))}
        />
        {have > 0 && <span className="hint">{formatINR(have)}</span>}
      </label>

      {calc && (
        <div className="rounded-3xl bg-surface-2 p-4" aria-live="polite">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-muted">Property price</p>
              <p className="font-semibold">{formatINR(price)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Loan you need</p>
              <p className="font-semibold">
                {formatINR(calc.needed)} <span className="text-xs font-normal text-muted">({calc.pct.toFixed(1)}%)</span>
              </p>
            </div>
          </div>
          {calc.over ? (
            <p className="mt-3 flex gap-2 text-xs leading-relaxed text-warn">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Banks usually finance up to {maxPercent}%* ({formatINR(calc.maxLoan)}). You may need about{" "}
              {formatINR(calc.minDown)} as down payment. Our team will explain the options available to you.
            </p>
          ) : (
            <p className="mt-3 flex gap-2 text-xs leading-relaxed text-accent">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Your requirement is within the typical {maxPercent}%* financing range.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Your name *</span>
          <input name="name" className="input" required minLength={2} maxLength={80} autoComplete="name" />
        </label>
        <label className="block">
          <span className="label">Mobile number *</span>
          <input name="phone" className="input" required type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" />
        </label>
      </div>
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
      <label className="block">
        <span className="label">Message</span>
        <textarea name="message" className="input" rows={3} maxLength={1000} placeholder="Salaried / business, monthly income, etc. (optional)" />
      </label>

      {error && (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={state === "sending"}>
        {state === "sending" && <LoaderCircle className="size-5 animate-spin" />}
        {state === "sending" ? "Sending…" : "Request Loan Assistance"}
      </button>
      <p className="text-center text-xs leading-relaxed text-faint">{CONSENT_TEXT}</p>
    </form>
  );
}
