"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  changeMyPasswordAction,
  forgotPasswordAction,
  loginAction,
  resetPasswordAction,
  signupAction,
} from "@/app/auth/actions";
import type { FormState } from "@/app/admin/actions";
import { FormMessage, PendingButton, useFormAction } from "@/components/admin/ui";
import { Turnstile, resetTurnstile } from "@/components/site/Turnstile";

/** Turnstile tokens work once: get a fresh one after the server rejects the form. */
function useResetTurnstileOnError(state: FormState) {
  useEffect(() => {
    if (state?.error) resetTurnstile();
  }, [state]);
}

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
        />
      </label>
      <label className="block">
        <span className="flex items-baseline justify-between gap-3">
          <span className="label">Password</span>
          <Link href="/forgot-password" className="text-xs font-semibold text-gold-2 hover:underline">
            Forgot password?
          </Link>
        </span>
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
  useResetTurnstileOnError(state);
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
          />
        </div>
        <span className="hint">Our team calls this number about your property.</span>
      </label>
      <label className="block">
        <span className="label">Email *</span>
        <input name="email" type="email" className="input" required maxLength={120} autoComplete="email" />
        <span className="hint">Used to reset your password if you forget it.</span>
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
      <Turnstile />
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

export function ForgotPasswordForm() {
  const { state, onSubmit, pending } = useFormAction(forgotPasswordAction);
  useResetTurnstileOnError(state);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="label">Mobile number or email</span>
        <input name="identifier" className="input" required autoComplete="username" inputMode="email" maxLength={120} />
        <span className="hint">We send a reset link to the email address on your account.</span>
      </label>
      <Turnstile />
      <FormMessage state={state} />
      <PendingButton pending={pending} className="btn btn-primary btn-lg w-full" pendingText="Sending…">
        Send reset link
      </PendingButton>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { state, onSubmit, pending } = useFormAction(resetPasswordAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="label">New password *</span>
        <input name="password" type="password" className="input" required minLength={8} autoComplete="new-password" />
        <span className="hint">At least 8 characters</span>
      </label>
      <label className="block">
        <span className="label">Confirm new password *</span>
        <input name="confirm" type="password" className="input" required minLength={8} autoComplete="new-password" />
      </label>
      <FormMessage state={state} />
      <PendingButton pending={pending} className="btn btn-primary btn-lg w-full" pendingText="Saving…">
        Save new password
      </PendingButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const { state, onSubmit, pending } = useFormAction(changeMyPasswordAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4" key={state?.ok ? "done" : "form"}>
      <label className="block">
        <span className="label">Current password</span>
        <input name="current" type="password" className="input" required autoComplete="current-password" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">New password</span>
          <input name="next" type="password" className="input" required minLength={8} autoComplete="new-password" />
        </label>
        <label className="block">
          <span className="label">Confirm new password</span>
          <input name="confirm" type="password" className="input" required minLength={8} autoComplete="new-password" />
        </label>
      </div>
      <FormMessage state={state} />
      <PendingButton pending={pending} className="btn btn-ghost" pendingText="Saving…">
        Change password
      </PendingButton>
    </form>
  );
}
