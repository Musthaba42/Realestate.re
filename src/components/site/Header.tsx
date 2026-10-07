import Link from "next/link";
import { CircleUserRound, Phone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { displayPhone, telLink } from "@/lib/format";

export const NAV = [
  { href: "/properties", label: "Find Property" },
  { href: "/sell", label: "Sell Property" },
  { href: "/loan", label: "Loan Assistance" },
  { href: "/about", label: "About" },
  { href: "/team", label: "Our Team" },
  { href: "/contact", label: "Contact" },
];

export type HeaderUser = { name: string; role: "admin" | "user" } | null;

export function Header({ businessName, phone, user }: { businessName: string; phone: string; user: HeaderUser }) {
  const accountHref = user ? (user.role === "admin" ? "/admin" : "/account") : "/login";
  const accountLabel = user ? (user.role === "admin" ? "Dashboard" : "My account") : "Log in";
  const menuItems = [...NAV, { href: accountHref, label: accountLabel }];
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Logo name={businessName} />
        <NavLinks items={NAV} />
        <div className="flex items-center gap-2">
          <a href={telLink(phone)} className="btn btn-ghost btn-sm hidden 2xl:inline-flex">
            <Phone className="size-4" />
            {displayPhone(phone)}
          </a>
          <Link href={accountHref} className="btn btn-ghost btn-sm hidden md:inline-flex">
            <CircleUserRound className="size-4" />
            {user ? user.name.split(" ")[0] : "Log in"}
          </Link>
          <Link href="/properties" className="btn btn-primary btn-sm hidden md:inline-flex">
            Find Property
          </Link>
          <a href={telLink(phone)} className="icon-btn icon-btn-solid md:hidden" aria-label="Call us">
            <Phone className="size-[18px]" />
          </a>
          <MobileMenu items={menuItems} businessName={businessName} />
        </div>
      </div>
    </header>
  );
}
