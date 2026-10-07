"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Expand, Images, Play, Share2, Video, X } from "@/components/glyphs";
import { PropertyImage } from "@/components/PropertyImage";
import { Portal } from "@/components/Portal";
import { SoldStamp } from "@/components/SoldStamp";
import { youtubeId } from "@/lib/format";

export type GalleryItem = { kind: "image" | "video" | "youtube"; url: string };

/**
 * One swipeable slider for a property's videos and photos.
 * Videos come first (the property opens on its walkthrough), then the photos.
 */
export function PropertyGallery({ items: raw, title, sold = false }: { items: GalleryItem[]; title: string; sold?: boolean }) {
  const items = [...raw.filter((m) => m.kind !== "image"), ...raw.filter((m) => m.kind === "image")];
  const images = items.filter((m) => m.kind === "image");
  const videoCount = items.length - images.length;

  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const count = items.length;

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

  // Stop a playing video when it is swiped away.
  useEffect(() => {
    track.current?.querySelectorAll<HTMLVideoElement>("video[data-slide]").forEach((v) => {
      if (Number(v.dataset.slide) !== index && !v.paused) v.pause();
    });
  }, [index]);

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

  const current = items[index]!;
  const isVideo = current.kind !== "image";
  const position = isVideo ? `Video ${index + 1}/${videoCount}` : `Photo ${index - videoCount + 1}/${images.length}`;

  return (
    <div>
      <div className="relative overflow-hidden rounded-[28px] bg-black">
        <div ref={track} onScroll={onScroll} className="no-scrollbar flex aspect-[4/3.2] snap-x snap-mandatory overflow-x-auto md:aspect-[16/10]">
          {items.map((m, i) => (
            <div key={m.url + i} className="relative h-full w-full shrink-0 snap-center snap-always">
              {m.kind === "image" ? (
                <button
                  type="button"
                  className="size-full"
                  onClick={() => setLightbox(i - videoCount)}
                  aria-label={`Open photo ${i - videoCount + 1} of ${images.length}`}
                >
                  <PropertyImage
                    src={m.url}
                    alt={`${title} – photo ${i - videoCount + 1}`}
                    priority={i === 0}
                    width={1280}
                    className="size-full object-cover"
                  />
                </button>
              ) : m.kind === "video" ? (
                <video
                  data-slide={i}
                  className="size-full object-contain"
                  src={`${m.url}#t=0.1`}
                  controls
                  playsInline
                  preload={i === 0 ? "auto" : "metadata"}
                  aria-label={`${title} – video ${i + 1}`}
                />
              ) : (
                <YouTubeSlide url={m.url} title={title} />
              )}
            </div>
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
            {images.length > 0 && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => setLightbox(isVideo ? 0 : index - videoCount)}
                aria-label="View photos fullscreen"
              >
                <Expand className="size-[18px]" />
              </button>
            )}
          </div>
        </div>
        {copied && (
          <span className="badge absolute left-1/2 top-4 z-[3] -translate-x-1/2" role="status">
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
              aria-label="Previous"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              className="icon-btn absolute right-3 top-1/2 z-[2] hidden -translate-y-1/2 md:inline-grid"
              onClick={() => scrollTo(Math.min(count - 1, index + 1))}
              disabled={index === count - 1}
              aria-label="Next"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* Labels sit at the top while a video shows, so they never cover its controls. */}
        <div className={`pointer-events-none absolute inset-x-3 z-[2] flex items-center justify-between gap-2 ${isVideo ? "top-[3.75rem]" : "bottom-3"}`}>
          {isVideo && index === videoCount - 1 && images.length > 0 ? (
            <button type="button" onClick={() => scrollTo(videoCount)} className="badge pointer-events-auto gap-1.5 hover:bg-black/80">
              Swipe for {images.length} photo{images.length === 1 ? "" : "s"} <ChevronRight className="size-3.5" />
            </button>
          ) : (
            <span />
          )}
          <span className="badge gap-1.5 font-mono tracking-wide">
            {isVideo ? <Video className="size-3.5" /> : <Images className="size-3.5" />} {position}
          </span>
        </div>
      </div>

      {count > 1 && (
        <div className="no-scrollbar mt-2.5 flex gap-2.5 overflow-x-auto" aria-label="Videos and photos">
          {items.map((m, i) => (
            <button
              key={m.url + "thumb" + i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={m.kind === "image" ? `Show photo ${i - videoCount + 1}` : `Show video ${i + 1}`}
              aria-current={i === index}
              className={`relative h-[70px] w-[100px] shrink-0 overflow-hidden rounded-2xl border-2 bg-black transition md:h-[84px] md:w-[124px] ${
                i === index ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {m.kind === "image" ? (
                <PropertyImage src={m.url} alt="" width={300} className="size-full object-cover" />
              ) : m.kind === "youtube" && youtubeId(m.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`https://i.ytimg.com/vi/${youtubeId(m.url)}/mqdefault.jpg`} alt="" className="size-full object-cover" />
              ) : (
                <video src={`${m.url}#t=0.1`} className="size-full object-cover" preload="metadata" muted playsInline tabIndex={-1} />
              )}
              {m.kind !== "image" && (
                <span className="absolute inset-0 grid place-items-center bg-black/35">
                  <span className="grid size-8 place-items-center rounded-full bg-gold text-on-gold">
                    <Play className="size-3.5 fill-current" />
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {lightbox !== null && images.length > 0 && (
        <Portal>
          <Lightbox
            images={images}
            start={lightbox}
            title={title}
            onClose={(i) => {
              setLightbox(null);
              setIndex(i + videoCount);
              scrollTo(i + videoCount, false);
            }}
          />
        </Portal>
      )}
    </div>
  );
}

/** YouTube thumbnail until tapped, so the embedded player does not swallow swipes. */
function YouTubeSlide({ url, title }: { url: string; title: string }) {
  const [play, setPlay] = useState(false);
  const id = youtubeId(url);
  if (!id) return null;
  if (play) {
    return (
      <iframe
        className="size-full"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
        title={`${title} video`}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }
  return (
    <button type="button" className="relative size-full" onClick={() => setPlay(true)} aria-label="Play video">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="size-full object-cover" />
      <span className="absolute inset-0 grid place-items-center bg-black/30">
        <span className="grid size-16 place-items-center rounded-full bg-gold text-on-gold shadow-2xl">
          <Play className="size-6 fill-current" />
        </span>
      </span>
    </button>
  );
}

function Lightbox({
  images,
  start,
  title,
  onClose,
}: {
  images: GalleryItem[];
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
        <span className="badge font-mono">
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
