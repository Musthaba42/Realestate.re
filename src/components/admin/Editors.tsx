"use client";

import { updateLeadAction, updateSellerNotesAction } from "@/app/admin/actions";
import { LEAD_STATUSES, SELLER_STATUSES } from "@/lib/constants";
import { FormMessage, PendingButton, useFormAction } from "./ui";

export function LeadEditor({ id, status, notes }: { id: string; status: string; notes: string | null }) {
  const { state, onSubmit, pending } = useFormAction(updateLeadAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="label">Status</span>
        <select name="status" defaultValue={status} className="input">
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Team notes</span>
        <textarea name="notes" defaultValue={notes ?? ""} className="input" rows={6} placeholder="Call summary, site visit date, budget discussed…" />
      </label>
      <FormMessage state={state} />
      <PendingButton pending={pending} className="btn btn-primary w-full">
        Save
      </PendingButton>
    </form>
  );
}

export function SellerEditor({
  id,
  status,
  notes,
  ownerMessage,
}: {
  id: string;
  status: string;
  notes: string | null;
  ownerMessage: string | null;
}) {
  const { state, onSubmit, pending } = useFormAction(updateSellerNotesAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="label">Review status</span>
        <select name="status" defaultValue={status} className="input">
          {SELLER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Message to the owner</span>
        <input
          name="ownerMessage"
          defaultValue={ownerMessage ?? ""}
          className="input"
          maxLength={500}
          placeholder="e.g. Please send a clearer photo of the documents."
        />
        <span className="hint">Shown on the owner&apos;s account page (not for approved properties).</span>
      </label>
      <label className="block">
        <span className="label">Team notes (private)</span>
        <textarea
          name="adminNotes"
          defaultValue={notes ?? ""}
          className="input"
          rows={5}
          placeholder="Verification notes, documents checked…"
        />
      </label>
      <FormMessage state={state} />
      <PendingButton pending={pending} className="btn btn-soft w-full">
        Save
      </PendingButton>
    </form>
  );
}
