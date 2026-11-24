"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin } from "@/components/glyphs";

export type SpotlightSlide = {
  slug: string;
  src: string;
  title: string;
  price: string;
  place: string;
  type: string;
  code: string;
  specs: string[];
};

/** How long each half stays still before the sides swap. */
const HOLD_MS = 4200;

/**
 * Split-photo spotlight. Each photo is shown half as the original and half with a soft
 * background effect (blurred, darkened, brass-tinted) that carries the details. The sides
 * swap on their own — original left / effect right, then the other way round — and then the
 * next property comes in. Pauses on hover, on keyboard focus and when the tab is hidden;
 * stays still for visitors who prefer reduced motion.
 */
export function SplitSpotlight({ slides }: { slides: SpotlightSlide[] }) {
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [flipped, setFlipped] = useState(false);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  function goTo(i: number) {
    if (count === 0) return;
    const next = ((i % count) + count) % count;
    if (next === index) return;
    setPrev(index);
    setIndex(next);
    setFlipped(false);
  }

  useEffect(() => {
    if (paused || still || count === 0) return;
    const t = window.setTimeout(() => {
      if (document.visibilityState !== "visible") return;
      if (!flipped) setFlipped(true);
      else if (count > 1) goTo(index + 1);
      else setFlipped(false);
    }, HOLD_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, flipped, paused, still, count]);

  if (count === 0) return null;
  const current = slides[index]!;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-card border border-line/70 bg-surface sm:aspect-[4/3] md:aspect-[21/9]"
        role="region"
        aria-roledescription="carousel"
        aria-label="New listings in focus"
      >
        {slides.map((s, i) => {
          const on = i === index;
          // The slide that is leaving keeps its last position while it fades out.
          const flip = on ? flipped : i === prev;
          return (
            <div
              key={s.slug}
              className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${on ? "z-[1] opacity-100" : "z-0 opacity-0"}`}
              aria-hidden={!on}
            >
              {/* Background effect: the same photo, blurred, darkened and brass-tinted */}
              <div className="absolute inset-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="size-full scale-110 object-cover [filter:blur(18px)_saturate(0.55)_brightness(0.42)]"
                />
                <div className="survey-grid absolute inset-0 opacity-25 mix-blend-overlay" />
                <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,rgba(217,173,75,0.16),rgba(11,10,8,0.55))]" />
              </div>

              {/* Original half: a window that slides across while the photo inside stays put */}
              <div
                className={`absolute inset-x-0 top-0 h-1/2 overflow-hidden transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.25,1)] md:inset-x-auto md:bottom-0 md:left-0 md:h-full md:w-1/2 ${
                  flip ? "translate-y-full md:translate-x-full md:translate-y-0" : ""
                } ${on ? "" : "transition-none"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt={on ? s.title : ""}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className={`absolute left-0 top-0 h-[200%] w-full max-w-none object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.25,1)] md:h-full md:w-[200%] ${
                    flip ? "-translate-y-1/2 md:-translate-x-1/2 md:translate-y-0" : ""
                  } ${on ? "" : "transition-none"}`}
                />
                {/* brass seam on the edge that meets the effect half */}
                <span
                  className={`absolute bg-gold transition-opacity duration-500 ${
                    flip
                      ? "inset-x-0 top-0 h-[2px] md:inset-y-0 md:left-0 md:right-auto md:h-auto md:w-[2px]"
                      : "inset-x-0 bottom-0 h-[2px] md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[2px]"
                  }`}
                  aria-hidden="true"
                />
              </div>

              {/* Details, always on the effect half */}
              <div
                className={`absolute inset-x-0 top-1/2 flex h-1/2 flex-col justify-center p-5 transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.25,1)] sm:p-8 md:left-1/2 md:right-auto md:top-0 md:h-full md:w-1/2 md:p-12 lg:p-14 ${
                  flip ? "-translate-y-full md:-translate-x-full md:translate-y-0" : ""
                } ${on ? "" : "transition-none"}`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
                  {s.type} · {s.code}
                </p>
                <p className="mt-3 font-display text-[34px] font-semibold leading-none tracking-tight text-white md:text-[52px]">{s.price}</p>
                <p className="mt-2 inline-flex w-fit rounded-md border border-gold/50 bg-black/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-2">
                  Negotiable price
                </p>
                <h3 className="mt-4 line-clamp-2 max-w-md font-display text-xl leading-snug text-white md:text-[28px]">{s.title}</h3>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/75">
                  <MapPin className="size-4 shrink-0 text-gold-2" />
                  <span className="truncate">{s.place}</span>
                </p>
                {s.specs.length > 0 && (
                  <p className="mt-3 hidden flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-white/60 sm:flex">
                    {s.specs.map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </p>
                )}
                <Link
                  href={`/properties/${s.slug}`}
                  tabIndex={on ? 0 : -1}
                  className="btn btn-primary btn-sm mt-5 self-start md:mt-7"
                >
                  View property <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-1.5" role="group" aria-label="Choose a listing">
          {slides.map((s, i) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => goTo(i)}
              className="group relative h-6 flex-1 sm:max-w-20"
              aria-label={`Show ${s.title}`}
              aria-current={i === index}
            >
              <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-surface-3 group-hover:bg-faint/60">
                {i === index && (
                  <span
                    key={`${index}-${paused}-${still}`}
                    className="absolute inset-0 origin-left bg-gold"
                    style={{
                      animation: still || paused ? "none" : `fill-x ${HOLD_MS * 2 + 600}ms linear both`,
                      transform: still || paused ? "scaleX(1)" : undefined,
                    }}
                  />
                )}
                {i < index && <span className="absolute inset-0 bg-gold/45" />}
              </span>
            </button>
          ))}
        </div>
        <span className="hidden font-mono text-[11px] text-muted sm:inline" aria-live="polite">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")} · {current.place}
        </span>
        <div className="flex gap-2">
          <button type="button" className="icon-btn icon-btn-solid" onClick={() => goTo(index - 1)} aria-label="Previous listing" disabled={count < 2}>
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" className="icon-btn icon-btn-solid" onClick={() => goTo(index + 1)} aria-label="Next listing" disabled={count < 2}>
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
