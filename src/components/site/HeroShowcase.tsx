"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "@/components/glyphs";

export type HeroSlide = {
  slug: string;
  src: string | null;
  title: string;
  price: string;
  place: string;
  code: string;
  type: string;
};

const INTERVAL_MS = 7000;

/**
 * Full-bleed hero that turns through the featured properties' cover photos.
 * The brass plate names the property on screen and links to it. Rotation pauses while the
 * visitor is using the search, when the tab is hidden, and never starts with reduced motion.
 */
export function HeroShowcase({ slides, children }: { slides: HeroSlide[]; children: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const [failed, setFailed] = useState<Record<number, true>>({});
  const count = slides.length;
  const current = slides[index];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (count < 2 || paused || still) return;
    const t = window.setTimeout(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [index, count, paused, still]);

  return (
    <section
      className="relative isolate overflow-hidden"
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      aria-label="Featured properties and search"
    >
      {/* Backdrop: survey grid, then the photos, then the shading that keeps text readable. */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="survey-grid absolute inset-0" />
        <div className="absolute -right-40 -top-40 size-[640px] rounded-full bg-gold/10 blur-3xl" />
        {slides.map((s, i) =>
          s.src && !failed[i] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.slug}
              src={s.src}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              decoding="async"
              onError={() => setFailed((f) => ({ ...f, [i]: true }))}
              ref={(el) => {
                // A photo that failed before hydration never fires onError.
                if (el && el.complete && el.naturalWidth === 0 && !failed[i]) setFailed((f) => ({ ...f, [i]: true }));
              }}
              className={`absolute inset-0 size-full object-cover transition-opacity duration-[1400ms] ease-out ${
                i === index ? "animate-settle opacity-100" : "opacity-0"
              }`}
            />
          ) : null,
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,10,8,0.15)_0%,rgba(11,10,8,0.8)_38%,rgba(11,10,8,0.96)_70%)] lg:bg-[linear-gradient(90deg,rgba(11,10,8,0.94)_0%,rgba(11,10,8,0.72)_42%,rgba(11,10,8,0.2)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-bg via-bg/70 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg/70 to-transparent" />
      </div>

      <div className="container-x grid items-end gap-8 pb-8 pt-[20svh] md:min-h-[min(calc(100svh-62px),820px)] md:pb-14 lg:min-h-[min(calc(100svh-74px),860px)] lg:grid-cols-[minmax(0,1fr)_340px] lg:pt-24">
        <div className="max-w-2xl">{children}</div>

        {current && (
          <div className="hidden lg:block">
            <Link
              href={`/properties/${current.slug}`}
              className="group block rounded-card border border-gold/30 bg-bg/70 p-5 backdrop-blur-xl transition-colors hover:border-gold/60"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                <span>
                  {current.type} · {current.code}
                </span>
                <span className="text-faint">
                  {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-4 font-display text-[40px] font-semibold leading-none tracking-tight">{current.price}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-gold-2">Negotiable price</p>
              <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">{current.title}</p>
              <p className="mt-1 truncate text-xs text-muted">{current.place}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gold-2">
                View this property <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        )}
      </div>

      {count > 1 && (
        <div className="container-x -mt-4 flex gap-1.5 pb-8 md:pb-10" role="group" aria-label="Choose a featured property">
          {slides.map((s, i) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setIndex(i)}
              className="group relative h-6 flex-1 lg:max-w-24"
              aria-label={`Show ${s.title}`}
              aria-current={i === index}
            >
              <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/20 group-hover:bg-white/35">
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    className="absolute inset-0 origin-left bg-gold"
                    style={{
                      animation: still || paused ? "none" : `fill-x ${INTERVAL_MS}ms linear both`,
                      transform: still || paused ? "scaleX(1)" : undefined,
                    }}
                  />
                )}
                {i < index && <span className="absolute inset-0 bg-gold/45" />}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
