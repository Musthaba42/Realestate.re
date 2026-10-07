"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "@/components/glyphs";
import { Portal } from "@/components/Portal";

export function MobileMenu({
  items,
  businessName,
}: {
  items: { href: string; label: string }[];
  businessName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="icon-btn icon-btn-solid xl:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-[18px]" />
      </button>
      {open && (
        <Portal>
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="animate-fade absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="animate-sheet absolute inset-x-3 top-3 rounded-[28px] md:left-auto md:w-96 border border-line bg-surface p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="font-display text-lg text-gold-2">{businessName}</span>
              <button type="button" className="icon-btn icon-btn-solid" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="size-[18px]" />
              </button>
            </div>
            <nav className="grid gap-1" aria-label="Mobile">
              {items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] font-medium ${
                      active ? "bg-gold text-on-gold" : "hover:bg-surface-2"
                    }`}
                  >
                    {item.label}
                    <ArrowUpRight className="size-4 opacity-60" />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}
