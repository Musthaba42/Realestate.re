"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle, LocateFixed, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import {
  BUDGET_PRESETS,
  FACINGS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  RESIDENTIAL_TYPES,
  SORT_OPTIONS,
} from "@/lib/constants";
import { Portal } from "@/components/Portal";

export type FilterState = {
  type: string;
  area: string;
  min: string;
  max: string;
  sqmin: string;
  sqmax: string;
  bhk: string;
  facing: string;
  status: string;
  sort: string;
  /** "lat,lng" of the visitor when sorting nearest first, otherwise empty. */
  near: string;
};

const EMPTY_MORE = { min: "", max: "", sqmin: "", sqmax: "", bhk: "", facing: "", status: "" };

function toQuery(f: FilterState): string {
  const p = new URLSearchParams();
  (Object.keys(f) as (keyof FilterState)[]).forEach((k) => {
    const v = f[k].trim();
    if (!v || (k === "sort" && v === "newest")) return;
    p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function SearchFilters({ initial, localities }: { initial: FilterState; localities: string[] }) {
  const router = useRouter();
  const [f, setF] = useState<FilterState>(initial);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  // Note: the parent passes a `key` derived from the URL, so state resets on navigation.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function go(next: FilterState) {
    setF(next);
    router.push(`/properties${toQuery(next)}`, { scroll: false });
  }

  // "Near me": sort nearest first using the browser location (not stored anywhere).
  function toggleNear() {
    setLocError("");
    if (f.near) {
      go({ ...f, near: "" });
      return;
    }
    if (!("geolocation" in navigator)) {
      setLocError("Your browser cannot share its location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        go({ ...f, near: `${pos.coords.latitude.toFixed(2)},${pos.coords.longitude.toFixed(2)}` });
      },
      (err) => {
        setLocating(false);
        setLocError(err.code === err.PERMISSION_DENIED ? "Location is blocked. Allow it in your browser settings." : "Could not find your location.");
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    );
  }

  const set = (patch: Partial<FilterState>) => setF((prev) => ({ ...prev, ...patch }));
  const showBhk = !f.type || RESIDENTIAL_TYPES.includes(f.type);
  const moreCount = (["min", "max", "sqmin", "sqmax", "bhk", "facing", "status"] as const).filter((k) => initial[k]).length;
  const minError = f.min && f.max && Number(f.min) > Number(f.max);

  return (
    <div className="space-y-3">
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          go(f);
        }}
      >
        <label className="relative flex-1">
          <span className="sr-only">Area or locality</span>
          <MapPin className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
          <input
            className="input rounded-full pl-11 pr-10"
            placeholder="Search area / locality"
            value={f.area}
            onChange={(e) => set({ area: e.target.value })}
            list="search-localities"
            autoComplete="off"
            enterKeyHint="search"
          />
          {f.area && (
            <button
              type="button"
              aria-label="Clear area"
              className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-3 hover:text-ink"
              onClick={() => go({ ...f, area: "" })}
            >
              <X className="size-4" />
            </button>
          )}
          <datalist id="search-localities">
            {localities.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </label>
        <button type="submit" className="btn btn-primary hidden sm:inline-flex">
          <Search className="size-4" /> Search
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="icon-btn icon-btn-solid relative size-[46px]"
          aria-label="More filters"
        >
          <SlidersHorizontal className="size-[18px]" />
          {moreCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-on-gold">
              {moreCount}
            </span>
          )}
        </button>
      </form>

      <div className="flex items-center justify-between gap-3">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="radiogroup" aria-label="Property type">
          {[{ value: "", label: "All" }, ...PROPERTY_TYPES].map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={f.type === t.value}
              className={`chip ${f.type === t.value ? "chip-active" : ""}`}
              onClick={() =>
                go({ ...f, type: t.value, bhk: t.value && !RESIDENTIAL_TYPES.includes(t.value) ? "" : f.bhk })
              }
            >
              {t.label}
            </button>
          ))}
          <button type="button" className={`chip ${f.near ? "chip-active" : ""}`} aria-pressed={Boolean(f.near)} onClick={toggleNear} disabled={locating}>
            {locating ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
            Near me
          </button>
        </div>
        <label className="hidden shrink-0 md:block">
          <span className="sr-only">Sort</span>
          <select
            className="input min-h-9 rounded-full py-1.5 text-sm"
            value={f.sort}
            onChange={(e) => go({ ...f, sort: e.target.value })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {locError && (
        <p className="text-sm text-warn" role="alert">
          {locError}
        </p>
      )}
      {f.near && <p className="text-sm text-muted">Sorted by distance from your location, nearest first.</p>}

      {open && (
        <Portal>
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="animate-fade absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="animate-sheet absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[32px] border border-line bg-surface md:inset-auto md:left-1/2 md:top-1/2 md:w-[560px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[32px]">
            <div className="flex items-center justify-between px-5 pb-2 pt-5">
              <h2 className="text-lg font-bold">Filters</h2>
              <button type="button" className="icon-btn icon-btn-solid" aria-label="Close filters" onClick={() => setOpen(false)}>
                <X className="size-[18px]" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-5 pt-2">
              <fieldset>
                <legend className="label">Property type</legend>
                <div className="flex flex-wrap gap-2">
                  {[{ value: "", label: "Any" }, ...PROPERTY_TYPES].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className={`chip ${f.type === t.value ? "chip-active" : ""}`}
                      onClick={() => set({ type: t.value, bhk: t.value && !RESIDENTIAL_TYPES.includes(t.value) ? "" : f.bhk })}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="label">Budget</legend>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <select className="input" value={f.min} onChange={(e) => set({ min: e.target.value })} aria-label="Minimum budget">
                    <option value="">No Min</option>
                    {BUDGET_PRESETS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-muted">to</span>
                  <select className="input" value={f.max} onChange={(e) => set({ max: e.target.value })} aria-label="Maximum budget">
                    <option value="">No Max</option>
                    {BUDGET_PRESETS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                {minError && <p className="mt-2 text-xs text-danger">Minimum budget is higher than maximum.</p>}
              </fieldset>

              <fieldset>
                <legend className="label">Area (sq.ft)</legend>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="Min"
                    value={f.sqmin}
                    onChange={(e) => set({ sqmin: e.target.value.replace(/\D/g, "") })}
                    aria-label="Minimum square feet"
                  />
                  <span className="text-sm text-muted">to</span>
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="Max"
                    value={f.sqmax}
                    onChange={(e) => set({ sqmax: e.target.value.replace(/\D/g, "") })}
                    aria-label="Maximum square feet"
                  />
                </div>
              </fieldset>

              {showBhk && (
                <fieldset>
                  <legend className="label">Bedrooms</legend>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "", label: "Any" },
                      { value: "1", label: "1 BHK" },
                      { value: "2", label: "2 BHK" },
                      { value: "3", label: "3 BHK" },
                      { value: "4", label: "4 BHK" },
                      { value: "5", label: "5+" },
                    ].map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={`chip ${f.bhk === o.value ? "chip-active" : ""}`}
                        onClick={() => set({ bhk: o.value })}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <fieldset>
                <legend className="label">Facing</legend>
                <div className="flex flex-wrap gap-2">
                  {[{ value: "", label: "Any" }, ...FACINGS].map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`chip ${f.facing === o.value ? "chip-active" : ""}`}
                      onClick={() => set({ facing: o.value })}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="label">Status</span>
                  <select className="input" value={f.status} onChange={(e) => set({ status: e.target.value })}>
                    <option value="">Any status</option>
                    {PROPERTY_STATUSES.filter((s) => s.value !== "not_available").map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label">Sort by</span>
                  <select className="input" value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="pb-safe flex gap-3 border-t border-line px-5 pt-4">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => set({ ...EMPTY_MORE, sort: "newest" })}>
                Reset
              </button>
              <button
                type="button"
                className="btn btn-primary flex-[2]"
                disabled={Boolean(minError)}
                onClick={() => {
                  setOpen(false);
                  go(f);
                }}
              >
                Show results
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
