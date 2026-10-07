const ANGLE: Record<string, number> = {
  north: 0,
  "north-east": 45,
  east: 90,
  "south-east": 135,
  south: 180,
  "south-west": 225,
  west: 270,
  "north-west": 315,
};

/** Small compass rose with the needle turned to the direction the property faces. */
export function FacingCompass({ facing, label, className = "size-24" }: { facing: string; label: string; className?: string }) {
  const deg = ANGLE[facing];
  if (deg === undefined) return null;
  const ticks = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`${label} facing`}>
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-line)" strokeWidth="1" />
      {ticks.map((t) => (
        <line
          key={t}
          x1="50"
          y1={t % 90 === 0 ? 7 : 9}
          x2="50"
          y2="13"
          stroke={t % 90 === 0 ? "var(--color-gold)" : "var(--color-faint)"}
          strokeWidth={t % 45 === 0 ? 1.4 : 0.8}
          transform={`rotate(${t} 50 50)`}
        />
      ))}
      {(
        [
          ["N", 50, 24],
          ["E", 77, 53.5],
          ["S", 50, 83],
          ["W", 23, 53.5],
        ] as const
      ).map(([l, x, y]) => (
        <text key={l} x={x} y={y} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-muted)">
          {l}
        </text>
      ))}
      <g transform={`rotate(${deg} 50 50)`}>
        <path d="M50 18 56 50H44z" fill="var(--color-gold)" />
        <path d="M50 82 56 50H44z" fill="var(--color-surface-3)" />
      </g>
      <circle cx="50" cy="50" r="3.2" fill="var(--color-bg)" stroke="var(--color-gold)" strokeWidth="1.4" />
    </svg>
  );
}
