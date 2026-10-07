"use client";

import { startTransition, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CircleCheck, LoaderCircle, TriangleAlert } from "lucide-react";
import type { FormState } from "@/app/admin/actions";

/**
 * Run a server action from onSubmit (instead of <form action>) so React does
 * NOT reset the form fields when the action returns a validation error.
 */
export function useFormAction(fn: (prev: FormState, fd: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(fn, undefined);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return { state, onSubmit, pending };
}

export function PendingButton({
  pending,
  children,
  className = "btn btn-primary",
  pendingText = "Saving…",
}: {
  pending: boolean;
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {pending ? pendingText : children}
    </button>
  );
}

export function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingText = "Saving…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {pending ? pendingText : children}
    </button>
  );
}

/** Submit button that asks for confirmation first (for deletes). */
export function ConfirmSubmit({
  children,
  message,
  className = "btn btn-danger btn-sm",
  title,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      title={title}
      aria-label={title}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state?.error && !state?.ok) return null;
  return state.error ? (
    <p className="flex items-start gap-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {state.error}
    </p>
  ) : (
    <p className="flex items-start gap-2 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent" role="status">
      <CircleCheck className="mt-0.5 size-4 shrink-0" /> {state.ok}
    </p>
  );
}
