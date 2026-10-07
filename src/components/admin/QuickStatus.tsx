"use client";

import { quickLeadStatusAction, quickPropertyStatusAction } from "@/app/admin/actions";
import { LEAD_STATUSES, PROPERTY_STATUSES } from "@/lib/constants";

export function QuickPropertyStatus({ id, status }: { id: string; status: string }) {
  return (
    <form action={quickPropertyStatusAction}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        aria-label="Property status"
        className={`input min-h-9 w-[170px] rounded-full py-1 text-xs ${status === "sold" ? "border-danger/60 text-danger" : ""}`}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {PROPERTY_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </form>
  );
}

export function QuickLeadStatus({ id, status }: { id: string; status: string }) {
  return (
    <form action={quickLeadStatusAction}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        aria-label="Lead status"
        className="input min-h-9 w-[150px] rounded-full py-1 text-xs"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </form>
  );
}
