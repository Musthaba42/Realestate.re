"use client";

import Link from "next/link";
import { useEffect } from "react";
import { House, RotateCw } from "@/components/glyphs";

/** Friendly "something went wrong" screen used by the error boundaries. */
export function ErrorView({
  error,
  reset,
  homeHref = "/",
  homeLabel = "Home",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-x grid min-h-[70dvh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <p className="text-6xl font-bold text-surface-3">Oops</p>
        <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 leading-relaxed text-muted">
          This page could not be loaded right now. Please try again in a moment. If it keeps happening, call or WhatsApp us.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-faint">Error code: {error.digest}</p>}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RotateCw className="size-4" /> Try again
          </button>
          <Link href={homeHref} className="btn btn-ghost">
            <House className="size-4" /> {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Centered spinner shown while a page loads. */
export function LoadingView({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-[60dvh] place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-muted">
        <span className="size-9 animate-spin rounded-full border-2 border-line border-t-gold" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
