"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/glyphs";

/**
 * Horizontal swipe carousel: one slide per view on phones, `perView` on larger screens.
 * Slides snap into place; arrows and position dots for mouse and keyboard users.
 */
export function SwipeCarousel({ children, label, perView = 3 }: { children: React.ReactNode; label: string; perView?: 2 | 3 }) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(1);
  const count = slides.length;
  const last = Math.max(0, count - visible);

  // How many slides fit on screen (1 on phones).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      const first = el.firstElementChild as HTMLElement | null;
      if (first?.offsetWidth) setVisible(Math.max(1, Math.round(el.clientWidth / first.offsetWidth)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback((i: number) => {
    const el = track.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    if (el && slide) el.scrollTo({ left: slide.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }, []);

  function onScroll() {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first?.offsetWidth) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    setIndex(Math.min(count - 1, Math.round(el.scrollLeft / step)));
  }

  const width = perView === 3 ? "md:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]" : "md:w-[calc((100%-1rem)/2)]";

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        onScroll={onScroll}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 md:mx-0 md:scroll-px-0 md:px-0"
      >
        {slides.map((s, i) => (
          <div
            key={i}
            className={`w-[86%] shrink-0 snap-start snap-always ${width}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
          >
            {s}
          </div>
        ))}
      </div>

      {count > visible && (
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-gold" : "w-1.5 bg-surface-3"}`}
              />
            ))}
            <span className="ml-2 font-mono text-[11px] text-muted">
              {Math.min(index + 1, count)} / {count}
            </span>
          </div>
          <div className="hidden gap-2 md:flex">
            <button type="button" className="icon-btn icon-btn-solid" onClick={() => go(Math.max(0, index - 1))} disabled={index === 0} aria-label="Previous">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" className="icon-btn icon-btn-solid" onClick={() => go(Math.min(last, index + 1))} disabled={index >= last} aria-label="Next">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
