"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Hand, Phone, Search, X } from "@/components/glyphs";
import { LeadForm } from "./LeadForm";
import { WhatsAppIcon } from "@/components/icons";
import { Portal } from "@/components/Portal";

type Props = {
  propertyId: string;
  title: string;
  priceLabel: string;
  isOpen: boolean;
  callHref: string;
  whatsappHref: string;
  similarHref: string;
  /** "bar" = sticky bottom bar (phones), "panel" = buttons in the desktop side card */
  variant: "bar" | "panel";
};

export function PropertyActions(p: Props) {
  const [open, setOpen] = useState(false);

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

  const primary = p.isOpen ? (
    <button type="button" className="btn btn-primary btn-lg flex-[1.6]" onClick={() => setOpen(true)}>
      <Hand className="size-[18px]" /> I am Interested
    </button>
  ) : (
    <Link href={p.similarHref} className="btn btn-primary btn-lg flex-[1.6]">
      <Search className="size-[18px]" /> Find Similar
    </Link>
  );

  return (
    <>
      {p.variant === "bar" ? (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#1c1a17]/92 px-4 pt-3 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-xl gap-2.5">
            <a href={p.callHref} className="btn btn-ghost btn-lg flex-1">
              <Phone className="size-[18px]" /> Call
            </a>
            {primary}
          </div>
        </div>
      ) : (
        <div className="grid gap-2.5">
          <div className="flex gap-2.5">{primary}</div>
          <div className="flex gap-2.5">
            <a href={p.callHref} className="btn btn-ghost flex-1">
              <Phone className="size-4" /> Call
            </a>
            <a href={p.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost flex-1">
              <WhatsAppIcon className="size-4" /> WhatsApp
            </a>
          </div>
        </div>
      )}

      {open && (
        <Portal>
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="interest-title">
          <div className="animate-fade absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="animate-sheet absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[32px] border border-line bg-surface px-5 pb-8 pt-5 md:inset-auto md:left-1/2 md:top-1/2 md:w-[460px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[32px]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-surface-3 md:hidden" />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="interest-title" className="text-xl font-bold">
                  I am Interested
                </h2>
                <p className="mt-1 truncate text-sm text-muted">
                  {p.title} · {p.priceLabel}
                </p>
              </div>
              <button type="button" className="icon-btn icon-btn-solid" aria-label="Close" onClick={() => setOpen(false)}>
                <X className="size-[18px]" />
              </button>
            </div>
            <LeadForm
              source="interested"
              propertyId={p.propertyId}
              submitLabel="Send my details"
              showMessage={false}
              callHref={p.callHref}
              successTitle="Thank you! Our team will call you."
            />
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}
