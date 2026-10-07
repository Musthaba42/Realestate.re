"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, LocateFixed } from "@/components/glyphs";
import { PropertyCard } from "@/components/PropertyCard";
import type { PropertyCardData } from "@/lib/properties";

type State =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "loaded"; items: PropertyCardData[]; lat: number; lng: number }
  | { kind: "error"; message: string };

/**
 * "Properties near you" — uses the visitor's location (only after they tap the button,
 * or automatically if they already allowed it). The position is never stored.
 */
export function NearbySection() {
  const [state, setState] = useState<State>({ kind: "idle" });

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ kind: "error", message: "Your browser cannot share its location. Search by area instead." });
      return;
    }
    setState({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`/api/nearby?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`);
          const data = (await res.json()) as { ok: boolean; items?: PropertyCardData[]; error?: string };
          if (!res.ok || !data.ok) throw new Error(data.error);
          setState({ kind: "loaded", items: data.items ?? [], lat, lng });
        } catch (e) {
          setState({ kind: "error", message: e instanceof Error && e.message ? e.message : "Could not load nearby properties. Please try again." });
        }
      },
      (err) =>
        setState({
          kind: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location is blocked for this site. Allow location in your browser settings, or search by area."
              : "We could not find your location. Please try again or search by area.",
        }),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // If the visitor already allowed location earlier, show nearby properties straight away.
  useEffect(() => {
    let cancelled = false;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((p) => {
        if (!cancelled && p.state === "granted") locate();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [locate]);

  return (
    <section className="container-x py-8 md:py-12" aria-labelledby="near-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Based on your location</p>
          <h2 id="near-title" className="section-title mt-2">
            Properties near you
          </h2>
        </div>
        {state.kind === "loaded" && state.items.length > 0 && (
          <Link href={`/properties?near=${state.lat.toFixed(2)},${state.lng.toFixed(2)}`} className="btn btn-ghost btn-sm shrink-0">
            See all, nearest first <ArrowRight className="size-4" />
          </Link>
        )}
      </div>

      {(state.kind === "idle" || state.kind === "error" || state.kind === "locating") && (
        <div className="card flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2">
              <LocateFixed className="size-6 text-gold-2" />
            </span>
            <div>
              <p className="font-semibold">See the properties closest to where you are</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                We use your location only to measure distance, and we do not store it.
              </p>
              {state.kind === "error" && (
                <p className="mt-3 text-sm text-warn" role="alert">
                  {state.message}
                </p>
              )}
            </div>
          </div>
          <button type="button" className="btn btn-primary shrink-0" onClick={locate} disabled={state.kind === "locating"}>
            {state.kind === "locating" ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
            {state.kind === "locating" ? "Finding you…" : "Show properties near me"}
          </button>
        </div>
      )}

      {state.kind === "loaded" &&
        (state.items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.items.slice(0, 3).map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-muted">No properties with a known location yet. Please search by area.</div>
        ))}
    </section>
  );
}
