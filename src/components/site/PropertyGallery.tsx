"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Expand, Images, Play, Share2, X } from "lucide-react";
import { PropertyImage } from "@/components/PropertyImage";
import { Portal } from "@/components/Portal";
import { SoldStamp } from "@/components/SoldStamp";

type Img = { url: string; category: string };

export function PropertyGallery({
  images,
  title,
  hasVideo,
  sold = false,
}: {
  images: Img[];
  title: string;
  hasVideo: boolean;
  sold?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [copied, setCopied] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const count = images.length;

  const scrollTo = useCallback((i: number, smooth = true) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }, []);

  function onScroll() {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index && i >= 0 && i < count) setIndex(i);
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled */
    }
  }

  if (count === 0) {
    return (
      <div className="relative">
        <PropertyImage alt={title} className="aspect-[4/3] w-full rounded-[28px]" />
        <Link href="/properties" className="icon-btn absolute left-3 top-3" aria-label="Back to properties">
          <ArrowLeft className="size-[18px]" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-[28px] bg-surface-2">
        <div
          ref={track}
          onScroll={onScroll}
          className="no-scrollbar flex aspect-[4/3.2] snap-x snap-mandatory overflow-x-auto md:aspect-[16/10]"
        >
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              className="relative h-full w-full shrink-0 snap-center"
              onClick={() => {
                setIndex(i);
                setLightbox(true);
              }}
              aria-label={`Open photo ${i + 1} of ${count}`}
            >
              <PropertyImage
                src={img.url}
                alt={`${title} – photo ${i + 1}`}
                priority={i === 0}
                width={1280}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>

        {sold && <SoldStamp size="lg" />}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[2] flex justify-between">
          <Link href="/properties" className="icon-btn pointer-events-auto" aria-label="Back to properties">
            <ArrowLeft className="size-[18px]" />
          </Link>
          <div className="pointer-events-auto flex gap-2">
            <button type="button" className="icon-btn" onClick={share} aria-label="Share this property">
              <Share2 className="size-[18px]" />
            </button>
            <button type="button" className="icon-btn" onClick={() => setLightbox(true)} aria-label="View fullscreen">
              <Expand className="size-[18px]" />
            </button>
          </div>
        </div>
        {copied && (
          <span className="badge absolute left-1/2 top-4 -translate-x-1/2" role="status">
            Link copied
          </span>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              className="icon-btn absolute left-3 top-1/2 z-[2] hidden -translate-y-1/2 md:inline-grid"
              onClick={() => scrollTo(Math.max(0, index - 1))}
              disabled={index === 0}
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              className="icon-btn absolute right-3 top-1/2 z-[2] hidden -translate-y-1/2 md:inline-grid"
              onClick={() => scrollTo(Math.min(count - 1, index + 1))}
              disabled={index === count - 1}
              aria-label="Next photo"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[2] flex items-end justify-between">
          {hasVideo ? (
            <a href="#videos" className="icon-btn pointer-events-auto" aria-label="Watch video">
              <Play className="size-4 fill-current" />
            </a>
          ) : (
            <span />
          )}
          <span className="badge gap-1.5">
            <Images className="size-3.5" /> {index + 1}/{count}
          </span>
        </div>
      </div>

      {count > 1 && (
        <div className="no-scrollbar mt-2.5 flex gap-2.5 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url + "thumb" + i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`h-[70px] w-[100px] shrink-0 overflow-hidden rounded-2xl border-2 transition md:h-[84px] md:w-[124px] ${
                i === index ? "border-white" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <PropertyImage src={img.url} alt="" width={300} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && <Portal><Lightbox images={images} start={index} title={title} onClose={(i) => { setLightbox(false); setIndex(i); scrollTo(i, false); }} /></Portal>}
    </div>
  );
}

function Lightbox({
  images,
  start,
  title,
  onClose,
}: {
  images: Img[];
  start: number;
  title: string;
  onClose: (index: number) => void;
}) {
  const [i, setI] = useState(start);
  const track = useRef<HTMLDivElement>(null);
  const count = images.length;

  const go = useCallback(
    (n: number) => {
      const next = Math.max(0, Math.min(count - 1, n));
      const el = track.current;
      if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    },
    [count],
  );

  useEffect(() => {
    const el = track.current;
    if (el) el.scrollTo({ left: start * el.clientWidth, behavior: "auto" });
  }, [start]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(i);
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go, onClose]);

  return (
    <div className="animate-fade fixed inset-0 z-[60] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div className="flex items-center justify-between p-3">
        <span className="badge">
          {i + 1} / {count}
        </span>
        <button type="button" className="icon-btn" onClick={() => onClose(i)} aria-label="Close photo viewer">
          <X className="size-5" />
        </button>
      </div>
      <div
        ref={track}
        onScroll={() => {
          const el = track.current;
          if (!el || !el.clientWidth) return;
          const n = Math.round(el.scrollLeft / el.clientWidth);
          if (n !== i && n >= 0 && n < count) setI(n);
        }}
        className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((img, n) => (
          <div key={img.url + "lb" + n} className="grid h-full w-full shrink-0 snap-center place-items-center p-2">
            <PropertyImage src={img.url} alt={`${title} – photo ${n + 1}`} width={2000} className="max-h-full max-w-full object-contain" />
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="pb-safe flex items-center justify-center gap-3 p-4">
          <button type="button" className="icon-btn" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous photo">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" className="icon-btn" onClick={() => go(i + 1)} disabled={i === count - 1} aria-label="Next photo">
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
