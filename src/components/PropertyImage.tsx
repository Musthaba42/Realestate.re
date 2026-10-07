import { House } from "@/components/glyphs";

/** Plain <img> with a neutral placeholder when a property has no photo yet. */
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
  if (src && width && src.startsWith("https://images.unsplash.com/")) {
    const u = new URL(src);
    u.searchParams.set("w", String(width));
    src = u.toString();
  }
  if (!src) {
    return (
      <div className={`grid place-items-center bg-surface-2 text-faint ${className}`} role="img" aria-label={alt}>
        <House className="size-10" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
