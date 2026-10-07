import { PROPERTY_STATUSES, labelOf } from "@/lib/constants";

const DOT: Record<string, string> = {
  available: "var(--color-accent)",
  new: "var(--color-accent)",
  ready_to_move: "var(--color-accent)",
  under_construction: "var(--color-warn)",
  coming_soon: "var(--color-info)",
  reserved: "var(--color-warn)",
  sold: "var(--color-danger)",
  not_available: "var(--color-faint)",
};

export function StatusBadge({
  status,
  percent,
  className = "",
}: {
  status: string;
  percent?: number | null;
  className?: string;
}) {
  const color = DOT[status] ?? "var(--color-accent)";
  const showPercent = status === "under_construction" && percent != null && percent > 0 && percent < 100;
  // Under-construction properties are on sale too: say both.
  if (status === "under_construction") {
    return (
      <span className={`badge ${className}`}>
        <span className="badge-dot" />
        For Sale
        <span className="h-3 w-px bg-white/25" aria-hidden="true" />
        <span className="text-warn">
          Under construction{showPercent && <span className="opacity-80"> · {percent}%</span>}
        </span>
      </span>
    );
  }
  const label = status === "available" ? "For Sale" : labelOf(PROPERTY_STATUSES, status);
  return (
    <span className={`badge ${className}`}>
      <span
        className="badge-dot"
        style={{ background: color, boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 25%, transparent)` }}
      />
      {label}
    </span>
  );
}
