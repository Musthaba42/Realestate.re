"use client";

import { startTransition, useActionState, useState } from "react";
import type { TeamMember } from "@prisma/client";
import { saveTeamMemberAction } from "@/app/admin/actions";
import { compressImage } from "@/lib/client-image";
import { initials } from "@/lib/format";
import { FormMessage, PendingButton } from "./ui";

export function TeamForm({ member }: { member?: TeamMember | null }) {
  const [state, dispatch, pending] = useActionState(saveTeamMemberAction, undefined);
  const [preview, setPreview] = useState<string | null>(member?.photoUrl ?? null);
  const [preparing, setPreparing] = useState(false);
  const m = member;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const photo = fd.get("photo");
    if (photo && typeof photo !== "string" && photo.size > 0) {
      setPreparing(true);
      fd.set("photo", await compressImage(photo, 1000, 0.85));
      setPreparing(false);
    }
    startTransition(() => dispatch(fd));
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-5 md:p-6">
      {m && <input type="hidden" name="id" value={m.id} />}
      <div className="flex items-center gap-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-3xl bg-surface-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-xl font-bold text-muted">{m ? initials(m.name) : "?"}</span>
          )}
        </div>
        <div className="space-y-2">
          <label className="btn btn-soft btn-sm cursor-pointer">
            Choose photo
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPreview(URL.createObjectURL(f));
              }}
            />
          </label>
          {m?.photoUrl && (
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" name="removePhoto" className="checkbox" /> Remove current photo
            </label>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Name *</span>
          <input name="name" className="input" defaultValue={m?.name ?? ""} required />
        </label>
        <label className="block">
          <span className="label">Position / role *</span>
          <input name="role" className="input" defaultValue={m?.role ?? ""} required placeholder="e.g. Sales Manager" />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">Short bio</span>
          <textarea name="bio" className="input" rows={3} defaultValue={m?.bio ?? ""} maxLength={1000} />
        </label>
        <label className="block">
          <span className="label">Phone</span>
          <input name="phone" type="tel" className="input" defaultValue={m?.phone ?? ""} placeholder="98765 43210" />
        </label>
        <label className="block">
          <span className="label">WhatsApp</span>
          <input name="whatsapp" type="tel" className="input" defaultValue={m?.whatsapp ?? ""} placeholder="98765 43210" />
        </label>
        <label className="block">
          <span className="label">Email</span>
          <input name="email" type="email" className="input" defaultValue={m?.email ?? ""} />
        </label>
        <label className="block">
          <span className="label">Display order</span>
          <input name="sortOrder" type="number" className="input" defaultValue={m?.sortOrder ?? 0} />
          <span className="hint">Lower numbers are shown first</span>
        </label>
        <label className="flex items-start gap-3 rounded-2xl bg-surface-2 px-4 py-3 sm:col-span-2">
          <input type="checkbox" name="showContact" className="checkbox mt-0.5" defaultChecked={m ? m.showContact : true} />
          <span>
            <span className="block text-sm font-semibold">Show Call / WhatsApp buttons on the website</span>
            <span className="block text-xs text-muted">Untick to keep this person&apos;s number private</span>
          </span>
        </label>
      </div>
      <FormMessage state={state} />
      <PendingButton pending={pending || preparing} className="btn btn-primary">
        {m ? "Save changes" : "Add team member"}
      </PendingButton>
    </form>
  );
}
