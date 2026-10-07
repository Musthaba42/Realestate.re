import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/glyphs";
import { db } from "@/lib/db";
import { TeamForm } from "@/components/admin/TeamForm";

export const metadata: Metadata = { title: "Edit team member" };

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  const member = await db.teamMember.findUnique({ where: { id } });
  if (!member) notFound();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/team" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Team
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Edit {member.name}</h1>
      </div>
      <TeamForm member={member} />
    </div>
  );
}
