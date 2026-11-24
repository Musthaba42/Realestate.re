import Link from "next/link";
import { ChevronRight, House } from "@/components/glyphs";

/**
 * "Home › Page" trail at the top of inner pages: a one-tap way back to the home page.
 * `items` are the steps after Home; the last one is the current page.
 */
export function HomeTrail({ items, className = "" }: { items: { href?: string; label: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`mb-5 md:mb-7 ${className}`}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-[13px] text-muted">
        <li>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-surface py-1.5 pl-2 pr-3 font-medium text-ink transition-colors hover:border-gold/60 hover:text-gold-2"
          >
            <House className="size-4 text-gold-2" />
            Home
          </Link>
        </li>
        {items.map((it, i) => (
          <li key={it.label + i} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="size-3.5 shrink-0 text-faint" aria-hidden="true" />
            {it.href && i < items.length - 1 ? (
              <Link href={it.href} className="truncate hover:text-ink">
                {it.label}
              </Link>
            ) : (
              <span className="max-w-[60vw] truncate text-ink/90" aria-current={i === items.length - 1 ? "page" : undefined}>
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
