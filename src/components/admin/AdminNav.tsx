"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building, Inbox, LayoutDashboard, Settings, Tag, UsersRound } from "@/components/glyphs";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/properties", label: "Properties", icon: Building },
  { href: "/admin/leads", label: "Leads", icon: Inbox, badge: "leads" as const },
  { href: "/admin/sellers", label: "Seller Requests", icon: Tag, badge: "sellers" as const },
  { href: "/admin/team", label: "Team", icon: UsersRound },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ counts, variant }: { counts: { leads: number; sellers: number }; variant: "side" | "top" }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin"
      className={variant === "side" ? "grid gap-1" : "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-3"}
    >
      {ITEMS.map(({ href, label, icon: Icon, exact, badge }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
        const n = badge ? counts[badge] : 0;
        return variant === "side" ? (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-gold text-on-gold" : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon className="size-[18px]" />
            <span className="flex-1">{label}</span>
            {n > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-on-gold text-gold" : "bg-gold text-on-gold"}`}
              >
                {n}
              </span>
            )}
          </Link>
        ) : (
          <Link key={href} href={href} className={`chip shrink-0 ${active ? "chip-active" : ""}`}>
            <Icon className="size-4" />
            {label}
            {n > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-[#0b2e17]">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
