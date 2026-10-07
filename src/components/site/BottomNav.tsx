"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, CirclePlus, CircleUserRound } from "lucide-react";

/** Floating bottom bar for phones — modelled on the reference design. */
export function BottomNav({ accountHref }: { accountHref: string }) {
  const pathname = usePathname();
  // Property detail pages have their own sticky action bar.
  if (/^\/properties\/[^/]+/.test(pathname)) return null;

  const items = [
    { href: "/", label: "Home", icon: House, match: ["/"] },
    { href: "/properties", label: "Find", icon: Search, match: ["/properties"] },
    { href: "/sell", label: "Sell", icon: CirclePlus, match: ["/sell"] },
    { href: accountHref, label: accountHref === "/login" ? "Log in" : "Account", icon: CircleUserRound, match: ["/login", "/signup", "/account", "/admin"] },
  ];

  return (
    <nav
      aria-label="Quick navigation"
      className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 md:hidden"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[#1c1a17]/90 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match.some((m) => (m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(m + "/")));
          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex h-12 items-center justify-center gap-2 rounded-full transition-all ${
                active ? "bg-gold px-4 text-on-gold" : "w-12 bg-surface-2 text-ink"
              }`}
            >
              <Icon className="size-5" />
              {active && <span className="text-sm font-semibold">{label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
