"use client";

import { useEffect, useRef, useState } from "react";
import { House } from "@/components/glyphs";

/** Survey-sheet placeholder shown when a property has no photo, or its photo fails to load. */
export function PhotoPlaceholder({ alt, className = "" }: { alt: string; className?: string }) {
  return (
    <div className={`survey-grid grid place-items-center text-faint ${className}`} role="img" aria-label={alt}>
      <span className="flex flex-col items-center gap-2">
        <House className="size-9 text-gold/70" strokeWidth={1.4} />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Photo coming soon</span>
      </span>
    </div>
  );
}

/** Plain <img> that falls back to the survey-sheet placeholder when there is no photo or it fails to load. */
export function PropertyImage({
  src,
  alt,
  className = "",
  priority = false,
  width,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  /** Requested width for remote images that support resizing (Unsplash). */
  width?: number;
}) {
  const img = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  if (src && width && src.startsWith("https://images.unsplash.com/")) {
    const u = new URL(src);
    u.searchParams.set("w", String(width));
    src = u.toString();
  }

  // An image that failed before hydration never fires onError, so check it once mounted.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (!src || failed) return <PhotoPlaceholder alt={alt} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={img}
      src={src}
      alt={alt}
      // Transparent text hides the browser's alt-text box in the moment before the placeholder takes over.
      className={`text-transparent ${className}`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
    />
  );
}
