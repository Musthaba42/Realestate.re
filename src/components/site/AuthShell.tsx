import { featuredProperties } from "@/lib/properties";
import { formatPriceShort } from "@/lib/format";
import { PropertyImage } from "@/components/PropertyImage";
import { CircleCheck, MapPin } from "@/components/glyphs";

const STEPS = [
  "Submit your property with photos and videos",
  "Our team verifies the details and documents",
  "Track the approval status under My account",
  "Once approved, it goes live for genuine buyers",
];

/** Two-column frame for log-in / sign-up: a real listing on the left, the form on the right. */
export async function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const [show] = await featuredProperties(1).catch(() => []);
  const cover = show?.media[0]?.url;

  return (
    <div className="container-x pb-12 pt-6 md:pt-10">
      <div className="grid overflow-hidden rounded-[32px] border border-line/60 bg-surface lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden min-h-[620px] lg:block" aria-label="Featured property">
          {cover ? (
            <PropertyImage src={cover} alt={show!.title} width={1200} priority className="absolute inset-0 size-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/brand-banner.jpg" alt="" className="absolute inset-0 size-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-9">
            {show && (
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white/85 backdrop-blur">
                <MapPin className="size-3.5" /> {show.locality} · <span className="font-mono">{formatPriceShort(show.price)}</span>
              </p>
            )}
            <p className="font-display text-3xl leading-tight text-white">Selling with Golden Groups</p>
            <ul className="mt-5 grid gap-2.5">
              {STEPS.map((u) => (
                <li key={u} className="flex items-center gap-3 text-[15px] text-white/85">
                  <CircleCheck className="size-[18px] shrink-0 text-gold-2" /> {u}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex flex-col justify-center px-5 py-8 sm:px-10 md:py-12 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-3 text-[34px] leading-tight md:text-[40px]">{title}</h1>
            <p className="mb-7 mt-3 leading-relaxed text-muted">{intro}</p>
            {children}
            <div className="mt-6 text-center text-sm text-muted">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
