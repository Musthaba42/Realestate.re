"use client";

import { useEffect, useState } from "react";

/** Sticky header frame: a brass hairline on top, and a tighter, darker bar once the page scrolls. */
export function StickyHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="group/header sticky top-0 z-40 border-b border-line/50 bg-bg/80 backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300 data-[scrolled]:border-gold/15 data-[scrolled]:bg-[#0b0a08]/92 data-[scrolled]:shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
    >
      <div
        className="h-[2px] bg-[linear-gradient(90deg,transparent,var(--color-gold-3)_15%,var(--color-gold-2)_50%,var(--color-gold-3)_85%,transparent)] opacity-80"
        aria-hidden="true"
      />
      {children}
    </header>
  );
}
