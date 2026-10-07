"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Search, SlidersHorizontal } from "@/components/glyphs";
import Link from "next/link";
import { PROPERTY_TYPES } from "@/lib/constants";

export function HeroSearch({ localities }: { localities: string[] }) {
  const router = useRouter();
  const [type, setType] = useState("");
  const [area, setArea] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    if (area.trim()) p.set("area", area.trim());
    const q = p.toString();
    router.push(`/properties${q ? `?${q}` : ""}`);
  }

  return (
    <form onSubmit={submit} className="card p-3 sm:p-4" role="search">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Area or locality</span>
          <MapPin className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
          <input
            className="input rounded-full pl-11"
            placeholder="Enter area / locality"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            list="hero-localities"
            autoComplete="off"
            enterKeyHint="search"
          />
          <datalist id="hero-localities">
            {localities.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </label>
        <Link href="/properties" className="icon-btn icon-btn-solid size-[46px]" aria-label="All filters">
          <SlidersHorizontal className="size-[18px]" />
        </Link>
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
      <button type="submit" className="btn btn-primary btn-lg mt-3 w-full">
        <Search className="size-[18px]" /> Search Properties
      </button>
    </form>
  );
}
