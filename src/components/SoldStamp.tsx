/** Big "SOLD" stamp shown over a property's photo. */
export function SoldStamp({ size = "md" }: { size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] grid place-items-center bg-black/45" aria-hidden="true">
      <span
        className={`-rotate-12 rounded-xl border-[3px] border-gold bg-black/55 font-extrabold uppercase tracking-[0.25em] text-gold-2 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-[2px] ${
          big ? "px-8 py-3 text-4xl md:text-5xl" : "px-5 py-2 text-2xl"
        }`}
      >
        Sold
      </span>
    </div>
  );
}
