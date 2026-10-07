"use client";

import { loginAction, signupAction } from "@/app/auth/actions";
import { FormMessage, PendingButton, useFormAction } from "@/components/admin/ui";

export function LoginForm({ next }: { next: string }) {
  const { state, onSubmit, pending } = useFormAction(loginAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="label">Mobile number or email</span>
        <input
          name="identifier"
          className="input"
          required
          autoComplete="username"
          inputMode="email"
          placeholder="98765 43210"
        />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input name="password" type="password" className="input" required autoComplete="current-password" />
      </label>
      <FormMessage state={state} />
      <PendingButton pending={pending} className="btn btn-primary btn-lg w-full" pendingText="Signing in…">
        Log in
      </PendingButton>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const { state, onSubmit, pending } = useFormAction(signupAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="label">Your name *</span>
        <input name="name" className="input" required minLength={2} maxLength={80} autoComplete="name" />
      </label>
      <label className="block">
        <span className="label">Mobile number *</span>
        <div className="flex">
          <span className="grid place-items-center rounded-l-2xl border border-r-0 border-line bg-surface-3 px-3.5 text-sm text-muted">+91</span>
          <input
            name="phone"
            className="input rounded-l-none"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            maxLength={14}
            placeholder="98765 43210"
          />
        </div>
        <span className="hint">Our team calls this number about your property.</span>
      </label>
      <label className="block">
        <span className="label">Email (optional)</span>
        <input name="email" type="email" className="input" autoComplete="email" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Password *</span>
          <input name="password" type="password" className="input" required minLength={8} autoComplete="new-password" />
          <span className="hint">At least 8 characters</span>
        </label>
        <label className="block">
          <span className="label">Confirm password *</span>
          <input name="confirm" type="password" className="input" required minLength={8} autoComplete="new-password" />
        </label>
      </div>
      <FormMessage state={state} />
      <PendingButton pending={pending} className="btn btn-primary btn-lg w-full" pendingText="Creating account…">
        Create account
      </PendingButton>
      <p className="text-center text-xs leading-relaxed text-faint">
        By creating an account, you agree to be contacted by our team by call or WhatsApp about your property.
      </p>
    </form>
  );
}
