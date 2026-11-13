"use server";

import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, destination, safeNext, signSession } from "@/lib/session";
import { normalizeIndianPhone, siteUrl } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { emailEnabled, sendEmailTo } from "@/lib/notify";
import { RESET_TTL_MINUTES, consumeResetToken, createResetToken } from "@/lib/password-reset";
import { TURNSTILE_ERROR, TURNSTILE_FIELD, verifyTurnstile } from "@/lib/turnstile";
import type { FormState } from "@/app/admin/actions";

function text(fd: FormData, key: string, max = 200): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

async function startSession(user: { id: string; login: string; name: string; role: string }) {
  const token = await signSession({ uid: user.id, login: user.login, name: user.name, role: user.role === "admin" ? "admin" : "user" });
  (await cookies()).set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
}

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await rateLimit(`login:${clientIp(await headers())}`, 10, 15 * 60 * 1000))) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }
  const idRaw = text(fd, "identifier");
  const password = typeof fd.get("password") === "string" ? String(fd.get("password")) : "";
  if (!idRaw || !password) return { error: "Enter your mobile number (or email) and password." };

  const isEmail = idRaw.includes("@");
  const login = isEmail ? idRaw.toLowerCase() : normalizeIndianPhone(idRaw);
  if (!login) return { error: "Enter a valid 10-digit mobile number or an email address." };

  const user = await db.user.findFirst({ where: { OR: [{ login }, ...(isEmail ? [{ email: login }] : [])] } });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) return { error: "Incorrect mobile number / email or password." };

  await startSession(user);
  redirect(destination(user.role, safeNext(text(fd, "next", 300))));
}

export async function signupAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const ip = clientIp(await headers());
  if (!(await rateLimit(`signup:${ip}`, 6, 60 * 60 * 1000))) {
    return { error: "Too many sign-ups from this connection. Please try again later." };
  }
  if (!(await verifyTurnstile(fd.get(TURNSTILE_FIELD), ip))) return { error: TURNSTILE_ERROR };
  const name = text(fd, "name", 80);
  const phone = normalizeIndianPhone(text(fd, "phone", 20));
  const emailRaw = text(fd, "email", 120).toLowerCase();
  const password = typeof fd.get("password") === "string" ? String(fd.get("password")) : "";
  const confirm = typeof fd.get("confirm") === "string" ? String(fd.get("confirm")) : "";

  if (name.length < 2) return { error: "Please enter your name." };
  if (!phone) return { error: "Please enter a valid 10-digit mobile number." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };

  if (await db.user.findFirst({ where: { OR: [{ login: phone }, { phone }] } })) {
    return { error: "An account with this mobile number already exists. Please log in." };
  }
  if (await db.user.findFirst({ where: { OR: [{ login: emailRaw }, { email: emailRaw }] } })) {
    return { error: "An account with this email already exists. Please log in." };
  }

  // Sign-ups are always the "user" role. Only the seeded account is an admin.
  const user = await db.user.create({
    data: { login: phone, name, phone, email: emailRaw, passwordHash: await bcrypt.hash(password, 12), role: "user" },
  });
  await startSession(user);
  redirect(destination("user", safeNext(text(fd, "next", 300))));
}

/** Accounts made with Google have no mobile number yet; selling needs one. */
export async function addPhoneAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await getCurrentUser();
  if (!me) return { error: "Please log in again." };
  if (me.role === "admin") return { error: "The admin account does not sell properties." };
  const phone = normalizeIndianPhone(text(fd, "phone", 20));
  if (!phone) return { error: "Please enter a valid 10-digit mobile number." };
  const taken = await db.user.findFirst({ where: { id: { not: me.id }, OR: [{ login: phone }, { phone }] } });
  if (taken) return { error: "This mobile number is already used by another account. Log in with that account instead." };
  await db.user.update({ where: { id: me.id }, data: { phone } });
  revalidatePath("/", "layout");
  return { ok: "Mobile number saved." };
}

// ---------- forgotten / changed passwords ----------

/** Emails a one-time reset link. Always answers the same way, so it never reveals who has an account. */
export async function forgotPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const ip = clientIp(await headers());
  if (!(await rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000))) {
    return { error: "Too many requests. Please wait an hour and try again, or call us." };
  }
  if (!(await verifyTurnstile(fd.get(TURNSTILE_FIELD), ip))) return { error: TURNSTILE_ERROR };
  if (!emailEnabled()) {
    return { error: "Password reset by email is not available right now. Please call or WhatsApp us and we will help you." };
  }

  const idRaw = text(fd, "identifier", 120);
  const isEmail = idRaw.includes("@");
  const login = isEmail ? idRaw.toLowerCase() : normalizeIndianPhone(idRaw);
  if (!login) return { error: "Enter the mobile number or email you signed up with." };

  const sent = {
    ok: "If an account matches, we have sent a reset link to its email address. The link works for 30 minutes. Check your spam folder too.",
  };
  // Per-account limit too, so nobody can flood someone's inbox.
  if (!(await rateLimit(`forgot-account:${login}`, 3, 60 * 60 * 1000))) return sent;

  const user = await db.user.findFirst({
    where: { OR: [{ login }, ...(isEmail ? [{ email: login }] : [{ phone: login }])] },
  });
  if (!user?.email) return sent;

  const token = await createResetToken(user.id);
  const s = await getSettings();
  const link = `${siteUrl()}/reset-password?token=${token}`;
  await sendEmailTo(
    user.email,
    `Reset your ${s.businessName} password`,
    [
      `Hello ${user.name},`,
      "",
      `Someone (hopefully you) asked to reset the password of your ${s.businessName} account.`,
      `Open this link within ${RESET_TTL_MINUTES} minutes to choose a new password:`,
      "",
      link,
      "",
      "If you did not ask for this, you can ignore this email. Your password stays the same.",
    ].join("\n"),
  );
  return sent;
}

export async function resetPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await rateLimit(`reset:${clientIp(await headers())}`, 10, 15 * 60 * 1000))) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }
  const token = text(fd, "token", 200);
  const password = typeof fd.get("password") === "string" ? String(fd.get("password")) : "";
  const confirm = typeof fd.get("confirm") === "string" ? String(fd.get("confirm")) : "";
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const userId = await consumeResetToken(token);
  if (!userId) return { error: "This reset link has expired or was already used. Please ask for a new one." };
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login?reset=1");
}

/** A logged-in customer changes their own password. */
export async function changeMyPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await getCurrentUser();
  if (!me) return { error: "Please log in again." };
  if (!(await rateLimit(`change-password:${me.id}`, 10, 15 * 60 * 1000))) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "New passwords do not match." };
  const user = await db.user.findUnique({ where: { id: me.id } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { error: "Current password is incorrect." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: "Password changed." };
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}
