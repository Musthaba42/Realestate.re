import Link from "next/link";

/** Golden Groups emblem (public/logo.png) + business name. */
export function Logo({ name, href = "/", size = 44 }: { name: string; href?: string; size?: number }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2.5" aria-label={`${name} – home`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full shadow-[0_0_0_1px_rgba(217,173,75,0.35),0_4px_18px_rgba(217,173,75,0.18)]"
        style={{ width: size, height: size }}
      />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[16px] font-bold tracking-tight text-gold-2">{name}</span>
        <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Real Estate</span>
      </span>
    </Link>
  );
}
