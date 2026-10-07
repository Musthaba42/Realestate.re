import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, Trash } from "@/components/glyphs";
import { db } from "@/lib/db";
import { displayPhone, initials } from "@/lib/format";
import { ConfirmSubmit } from "@/components/admin/ui";
import { deleteTeamMemberAction } from "../../actions";

export const metadata: Metadata = { title: "Team" };

export default async function AdminTeamPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const team = await db.teamMember.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Team</h1>
          <p className="mt-1 text-sm text-muted">Shown on the “Our Team” page and the home page (first 3).</p>
        </div>
        <Link href="/admin/team/new" className="btn btn-primary">
          <Plus className="size-4" /> Add member
        </Link>
      </div>
      {sp.saved && <p className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">Team member saved.</p>}

      {team.length === 0 ? (
        <p className="card p-8 text-center text-muted">No team members yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m) => (
            <div key={m.id} className="card flex items-center gap-4 p-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
                {m.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center font-bold text-muted">{initials(m.name)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.name}</p>
                <p className="truncate text-sm text-muted">{m.role}</p>
                {m.phone && <p className="truncate text-xs text-faint">{displayPhone(m.phone)}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Link href={`/admin/team/${m.id}`} className="icon-btn icon-btn-solid size-9" aria-label={`Edit ${m.name}`} title="Edit">
                  <Pencil className="size-4" />
                </Link>
                <form action={deleteTeamMemberAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <ConfirmSubmit message={`Remove ${m.name} from the team?`} className="icon-btn icon-btn-solid size-9 text-danger" title="Delete">
                    <Trash className="size-4" />
                  </ConfirmSubmit>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
