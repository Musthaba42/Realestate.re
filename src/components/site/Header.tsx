import Link from "next/link";
import { CircleUserRound, Phone, Tag } from "@/components/glyphs";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { StickyHeader } from "./StickyHeader";
import { displayPhone, telLink } from "@/lib/format";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Find Property" },
  { href: "/loan", label: "Loan Assistance" },
  { href: "/about", label: "About" },
  { href: "/team", label: "Our Team" },
  { href: "/contact", label: "Contact" },
];

export type HeaderUser = { name: string; role: "admin" | "user" } | null;

export function Header({ businessName, phone, user }: { businessName: string; phone: string; user: HeaderUser }) {
  const accountHref = user ? (user.role === "admin" ? "/admin" : "/account") : "/login";
  const accountLabel = user ? (user.role === "admin" ? "Dashboard" : "My account") : "Log in";
  const accountShort = user ? user.name.split(" ")[0]! : "Log in";
  const menuItems = [NAV[0]!, NAV[1]!, { href: "/sell", label: "Sell Your Property" }, ...NAV.slice(2), { href: accountHref, label: accountLabel }];
  return (
    <StickyHeader>
      <div className="container-x flex h-[62px] items-center justify-between gap-3 transition-[height] duration-300 md:h-[74px] md:group-data-[scrolled]/header:h-[62px]">
        <Logo name={businessName} />
        <NavLinks items={NAV} />
        <div className="flex items-center gap-2">
          {/* Call: number on wide screens, round button on small ones */}
          <a href={telLink(phone)} className="group hidden items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-surface-2 lg:flex">
            <span className="grid size-9 place-items-center rounded-full border border-gold/40 text-gold-2 transition-colors group-hover:bg-gold group-hover:text-on-gold">
              <Phone className="size-4" />
            </span>
            <span className="leading-tight">
              <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-faint">Call us</span>
              <span className="block font-mono text-[13px] text-ink">{displayPhone(phone)}</span>
            </span>
          </a>
          <a href={telLink(phone)} className="icon-btn icon-btn-solid text-gold-2 lg:hidden" aria-label="Call us">
            <Phone className="size-[18px]" />
          </a>

          <Link
            href={accountHref}
            className="btn btn-ghost btn-sm hidden md:inline-flex xl:hidden 2xl:inline-flex"
            aria-label={accountLabel}
          >
            <CircleUserRound className="size-4" />
            {accountShort}
          </Link>
          <Link href={accountHref} className="icon-btn icon-btn-solid hidden xl:inline-grid 2xl:hidden" aria-label={accountLabel} title={accountLabel}>
            <CircleUserRound className="size-[18px]" />
          </Link>

          <Link href="/sell" className="btn btn-primary btn-sm hidden shadow-[0_6px_20px_rgba(217,173,75,0.22)] sm:inline-flex">
            <Tag className="size-4" />
            Sell Your Property
          </Link>
          <MobileMenu items={menuItems} businessName={businessName} />
        </div>
      </div>
    </StickyHeader>
  );
}
