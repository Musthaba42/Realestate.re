import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@/components/glyphs";
import { TeamForm } from "@/components/admin/TeamForm";

export const metadata: Metadata = { title: "Add team member" };

export default function NewTeamMemberPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/team" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Team
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Add team member</h1>
      </div>
      <TeamForm />
    </div>
  );
}
