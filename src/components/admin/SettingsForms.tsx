"use client";

import { useRef } from "react";
import type { SiteSettings } from "@prisma/client";
import { changePasswordAction, saveSettingsAction } from "@/app/admin/actions";
import { FormMessage, PendingButton, useFormAction } from "./ui";

function F({
  label,
  name,
  value,
  required,
  type = "text",
  wide,
  hint,
  placeholder,
}: {
  label: string;
  name: string;
  value?: string | number | null;
  required?: boolean;
  type?: string;
  wide?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="label">
        {label}
        {required && " *"}
      </span>
      <input name={name} type={type} className="input" defaultValue={value ?? ""} required={required} placeholder={placeholder} />
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export function SettingsForm({ s }: { s: Omit<SiteSettings, "updatedAt"> }) {
  const { state, onSubmit, pending } = useFormAction(saveSettingsAction);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="card p-5 md:p-6">
        <h2 className="font-bold">Business & contact</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <F label="Business name" name="businessName" value={s.businessName} required />
          <F label="Tagline" name="tagline" value={s.tagline} />
          <F label="Phone (Call button)" name="phone" type="tel" value={s.phone} required />
          <F
            label="WhatsApp number (leads are sent here)"
            name="whatsappNumber"
            type="tel"
            value={s.whatsappNumber}
            required
            hint="“I am Interested” details are sent to this WhatsApp number"
          />
          <F label="Email" name="email" type="email" value={s.email} />
          <F label="Working hours" name="workingHours" value={s.workingHours} />
          <F label="Office address" name="address" value={s.address} wide />
          <F label="Office Google Maps link" name="mapsUrl" type="url" value={s.mapsUrl} wide />
          <F label="RERA registration no." name="reraNumber" value={s.reraNumber} hint="Shown in the footer when filled" />
          <F label="Default loan financing (%)" name="loanMaxPercent" type="number" value={s.loanMaxPercent} required />
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="font-bold">Social media</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <F label="Instagram link" name="instagramUrl" type="url" value={s.instagramUrl} placeholder="https://instagram.com/yourpage" />
          <F label="Facebook link" name="facebookUrl" type="url" value={s.facebookUrl} placeholder="https://facebook.com/yourpage" />
          <F label="YouTube link" name="youtubeUrl" type="url" value={s.youtubeUrl} placeholder="https://youtube.com/@yourchannel" />
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="font-bold">Website text</h2>
        <div className="mt-5 grid gap-4">
          <F label="Home page headline" name="heroTitle" value={s.heroTitle} required />
          <label className="block">
            <span className="label">Home page sub-text</span>
            <textarea name="heroSubtitle" className="input" rows={3} defaultValue={s.heroSubtitle ?? ""} maxLength={300} />
          </label>
          <label className="block">
            <span className="label">About us</span>
            <textarea name="aboutText" className="input" rows={6} defaultValue={s.aboutText ?? ""} maxLength={3000} />
          </label>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-line/60 bg-bg/90 px-4 py-4 backdrop-blur-xl md:mx-0 md:rounded-3xl md:border">
        <div className="space-y-3">
          <FormMessage state={state} />
          <PendingButton pending={pending} className="btn btn-primary btn-lg w-full md:w-auto">
            Save settings
          </PendingButton>
        </div>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const ref = useRef<HTMLFormElement>(null);
  const { state, onSubmit, pending } = useFormAction(async (prev, fd) => {
    const res = await changePasswordAction(prev, fd);
    if (res?.ok) ref.current?.reset();
    return res;
  });
  return (
    <form ref={ref} onSubmit={onSubmit} className="card space-y-4 p-5 md:p-6">
      <h2 className="font-bold">Change my password</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <F label="Current password" name="current" type="password" required />
        <F label="New password" name="next" type="password" required hint="At least 8 characters" />
        <F label="Confirm new password" name="confirm" type="password" required />
      </div>
      <FormMessage state={state} />
      <PendingButton pending={pending} className="btn btn-soft">
        Change password
      </PendingButton>
    </form>
  );
}
