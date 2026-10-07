"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MapPin, Search, SlidersHorizontal, X } from "@/components/glyphs";
import { BHK_OPTIONS, BUDGET_PRESETS, FACINGS, PROPERTY_TYPES, RESIDENTIAL_TYPES } from "@/lib/constants";

const NO_FILTERS = { max: "", sqmin: "", bhk: "", facing: "" };

export function HeroSearch({ localities }: { localities: string[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const [type, setType] = useState("");
  const [area, setArea] = useState("");
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(NO_FILTERS);
  const set = (patch: Partial<typeof NO_FILTERS>) => setF((prev) => ({ ...prev, ...patch }));
  const activeCount = Object.values(f).filter(Boolean).length;
  const showBhk = !type || RESIDENTIAL_TYPES.includes(type);

  function search(where: string) {
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    p.set("area", where);
    if (f.max) p.set("max", f.max);
    if (f.sqmin) p.set("sqmin", f.sqmin);
    if (f.bhk && showBhk) p.set("bhk", f.bhk);
    if (f.facing) p.set("facing", f.facing);
    router.push(`/properties?${p}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const where = area.trim();
    // The area is the main search input: ask for it instead of listing everything.
    if (!where) {
      setError(true);
      input.current?.focus();
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setError(false), 3500);
      return;
    }
    search(where);
  }

  return (
    <form onSubmit={submit} className="card p-3 sm:p-4" role="search" noValidate>
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Area or locality</span>
          <MapPin className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
          <input
            ref={input}
            className={`input rounded-full pl-11 ${error ? "border-gold" : ""}`}
            placeholder="Enter area / locality"
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              if (e.target.value.trim()) setError(false);
            }}
            list="hero-localities"
            autoComplete="off"
            enterKeyHint="search"
            aria-invalid={error}
            aria-describedby={error ? "hero-area-error" : undefined}
          />
          <datalist id="hero-localities">
            {localities.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          {error && (
            <span
              id="hero-area-error"
              role="alert"
              className="animate-fade absolute left-4 top-full z-10 mt-2.5 rounded-xl bg-gold px-3 py-2 text-sm font-semibold text-on-gold shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            >
              <span className="absolute -top-1.5 left-5 size-3 rotate-45 bg-gold" aria-hidden="true" />
              <span className="relative">Enter a location</span>
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`icon-btn relative size-[46px] ${open || activeCount ? "bg-gold text-on-gold" : "icon-btn-solid"}`}
          aria-label={open ? "Hide filters" : "Show filters"}
          aria-expanded={open}
          aria-controls="hero-filters"
        >
          <SlidersHorizontal className="size-[18px]" />
          {activeCount > 0 && !open && (
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ink font-mono text-[10px] text-bg">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1" role="radiogroup" aria-label="Property type">
        {[{ value: "", label: "All" }, ...PROPERTY_TYPES].map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={type === t.value}
            onClick={() => setType(t.value)}
            className={`chip ${type === t.value ? "chip-active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {open && (
        <div id="hero-filters" className="animate-fade mt-3 grid gap-3 rounded-2xl bg-surface-2 p-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Budget up to</span>
            <select className="input bg-surface" value={f.max} onChange={(e) => set({ max: e.target.value })}>
              <option value="">Any budget</option>
              {BUDGET_PRESETS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Minimum size (sq.ft)</span>
            <input
              className="input bg-surface"
              inputMode="numeric"
              placeholder="e.g. 1200"
              value={f.sqmin}
              onChange={(e) => set({ sqmin: e.target.value.replace(/\D/g, "").slice(0, 7) })}
            />
          </label>
          {showBhk && (
            <label className="block">
              <span className="label">BHK</span>
              <select className="input bg-surface" value={f.bhk} onChange={(e) => set({ bhk: e.target.value })}>
                <option value="">Any</option>
                {BHK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="label">Facing</span>
            <select className="input bg-surface" value={f.facing} onChange={(e) => set({ facing: e.target.value })}>
              <option value="">Any direction</option>
              {FACINGS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {activeCount > 0 && (
            <button type="button" className="btn btn-ghost btn-sm justify-self-start sm:col-span-2" onClick={() => setF(NO_FILTERS)}>
              <X className="size-4" /> Clear filters
            </button>
          )}
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-lg mt-3 w-full">
        <Search className="size-[18px]" /> Search Properties
      </button>
    </form>
  );
}
