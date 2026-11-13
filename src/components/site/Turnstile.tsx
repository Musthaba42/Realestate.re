"use client";

import { useEffect, useRef } from "react";

// Cloudflare Turnstile widget. Renders nothing unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
// It adds a hidden "cf-turnstile-response" field to the surrounding <form>.

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const widgets = new Set<string>();
let scriptLoad: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptLoad ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptLoad = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptLoad;
}

/** Get a fresh token after a failed submit (tokens can only be used once). */
export function resetTurnstile() {
  for (const id of widgets) window.turnstile?.reset(id);
}

export function Turnstile() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let id: string | null = null;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        id = window.turnstile.render(ref.current, { sitekey: SITE_KEY, theme: "dark", size: "flexible" });
        widgets.add(id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (id) {
        widgets.delete(id);
        window.turnstile?.remove(id);
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}
