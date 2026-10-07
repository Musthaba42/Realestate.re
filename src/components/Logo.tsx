import Link from "next/link";

/** Golden Groups emblem (public/logo.png) + business name. */
export function Logo({ name, href = "/", size = 44 }: { name: string; href?: string; size?: number }) {
  return (
    <Link href={href} className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5" aria-label={`${name} – home`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        className="size-[var(--logo-sm)] shrink-0 rounded-full shadow-[0_0_0_1px_rgba(217,173,75,0.35),0_4px_18px_rgba(217,173,75,0.18)] transition-transform duration-500 group-hover:rotate-[8deg] sm:size-[var(--logo)]"
        style={{ "--logo": `${size}px`, "--logo-sm": `${Math.round(size * 0.86)}px` } as React.CSSProperties}
      />
      <span className="min-w-0 leading-tight">
        <span className="block whitespace-nowrap font-display text-[16px] leading-tight text-foil sm:text-[18px]">{name}</span>
        <span className="block truncate font-mono text-[9.5px] uppercase tracking-[0.28em] text-muted">Real Estate</span>
      </span>
    </Link>
  );
}
