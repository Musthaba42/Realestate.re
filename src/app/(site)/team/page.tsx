import type { Metadata } from "next";
import { db } from "@/lib/db";
import { TeamCard } from "@/components/site/TeamCard";

export const metadata: Metadata = { title: "Our Team" };

export default async function TeamPage() {
  const team = await db.teamMember.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <p className="eyebrow">Our team</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">The people behind every deal</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        From your first call to registration, our team is with you at every step.
      </p>
      {team.length > 0 ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m) => (
            <TeamCard key={m.id} m={m} />
          ))}
        </div>
      ) : (
        <p className="card mt-10 p-10 text-center text-muted">Team details coming soon.</p>
      )}
    </div>
  );
}
