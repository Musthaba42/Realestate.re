"use client";

import { useEffect, useRef, useState } from "react";
import { Hand, MapPin, Phone, Search, X } from "@/components/glyphs";

const KEY = "gg_welcome_seen_v1";

const STEPS = [
  { icon: Search, title: "Choose type & area", text: "Select land, house, apartment or commercial and the area you want." },
  { icon: MapPin, title: "Explore properties", text: "Videos, photos, price, approvals, road, loan and nearby landmarks, all in one page." },
  { icon: Hand, title: "Tap “I am Interested”", text: "Share just your name and phone number. That's it." },
  { icon: Phone, title: "We call you", text: "Our team arranges the site visit, loan support and documentation." },
];

/** "How it works" — shown as a pop-up the first time someone opens the website. */
export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      // Storage blocked (private mode): don't nag on every page.
    }
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    button.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="animate-fade absolute inset-0 bg-black/70" onClick={close} />
      <div className="animate-sheet absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[32px] border border-line bg-surface px-5 pb-8 pt-5 md:inset-auto md:left-1/2 md:top-1/2 md:w-[560px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[32px] md:p-8">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-surface-3 md:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Welcome to Golden Groups</p>
            <h2 id="welcome-title" className="mt-2 text-2xl font-bold tracking-tight">
              How it works
            </h2>
            <p className="mt-1 text-sm text-muted">No forms to start. Just pick an area and explore.</p>
          </div>
          <button type="button" className="icon-btn icon-btn-solid" aria-label="Close" onClick={close}>
            <X className="size-[18px]" />
          </button>
        </div>

        <ol className="mt-6 grid gap-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex items-start gap-4 rounded-3xl bg-surface-2 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold text-on-gold">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold">
                  <span className="text-gold-2">{i + 1}.</span> {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <button ref={button} type="button" className="btn btn-primary btn-lg mt-6 w-full" onClick={close}>
          Start exploring
        </button>
      </div>
    </div>
  );
}
