const COLORS: Record<string, string> = {
  // leads
  new: "bg-gold text-on-gold",
  contacted: "bg-info/15 text-info",
  site_visit: "bg-warn/15 text-warn",
  negotiation: "bg-warn/15 text-warn",
  closed: "bg-accent/15 text-accent",
  lost: "bg-surface-3 text-muted",
  // seller requests
  pending: "bg-gold text-on-gold",
  needs_info: "bg-warn/15 text-warn",
  approved: "bg-accent/15 text-accent",
  rejected: "bg-danger/15 text-danger",
  // misc
  live: "bg-accent/15 text-accent",
  hidden: "bg-surface-3 text-muted",
};

export function Pill({ value, label }: { value: string; label: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${COLORS[value] ?? "bg-surface-3 text-muted"}`}>
      {label}
    </span>
  );
}
