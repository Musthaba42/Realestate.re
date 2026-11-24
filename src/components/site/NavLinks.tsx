"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tag } from "@/components/glyphs";

type Item = { href: string; label: string; highlight?: boolean };

export function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
        // "Sell Your Property" is a main tab, drawn as a gold pill so owners find it at once.
        if (item.highlight) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`mx-1.5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
                active
                  ? "bg-gold text-on-gold"
                  : "border border-gold/55 text-gold-2 hover:bg-gold hover:text-on-gold"
              }`}
            >
              <Tag className="size-4" />
              {item.label}
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group relative px-3 py-2.5 text-[14px] font-medium transition-colors ${
              active ? "text-gold-2" : "text-muted hover:text-ink"
            }`}
          >
            {item.label}
            {/* gold dimension line  |——|  under the current page; a faint one on hover */}
            <span
              aria-hidden="true"
              className={`absolute inset-x-3 bottom-0.5 h-[7px] border-x bg-[linear-gradient(currentColor,currentColor)] bg-[length:100%_1px] bg-center bg-no-repeat transition-opacity duration-200 ${
                active ? "border-gold text-gold opacity-100" : "border-faint text-faint opacity-0 group-hover:opacity-60"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
