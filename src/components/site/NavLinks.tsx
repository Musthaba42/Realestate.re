"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center xl:flex" aria-label="Main">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
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
