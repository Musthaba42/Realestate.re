import type { Metadata } from "next";
import { db } from "@/lib/db";
import { TeamCard } from "@/components/site/TeamCard";
import { SwipeCarousel } from "@/components/site/SwipeCarousel";

export const metadata: Metadata = { title: "Our Team" };

export default async function TeamPage() {
  const all = await db.teamMember.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const founderId = all.find((m) => /founder/i.test(m.role))?.id;
  const team = founderId ? [...all.filter((m) => m.id === founderId), ...all.filter((m) => m.id !== founderId)] : all;
  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <p className="eyebrow">Our team</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">The people behind every deal</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        From your first call to registration, our team is with you at every step.
      </p>
      {team.length > 0 ? (
        <div className="mt-10">
          <SwipeCarousel label="Our team" perView={3}>
            {team.map((m) => (
              <TeamCard key={m.id} m={m} featured={m.id === founderId} />
            ))}
          </SwipeCarousel>
        </div>
      ) : (
        <p className="card mt-10 p-10 text-center text-muted">Team details coming soon.</p>
      )}
    </div>
  );
}
