"use server";

import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";
import { normalizeIndianPhone } from "@/lib/format";
import type { FormState } from "@/app/admin/actions";

function text(fd: FormData, key: string, max = 200): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Only allow redirects to pages on this site (never to another website). */
function safeNext(raw: string): string | null {
  return raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") ? raw : null;
}

async function startSession(user: { id: string; login: string; name: string; role: string }) {
  const token = await signSession({ uid: user.id, login: user.login, name: user.name, role: user.role === "admin" ? "admin" : "user" });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

function destination(role: string, next: string | null): string {
  if (role === "admin") return next?.startsWith("/admin") ? next : "/admin";
  return next && !next.startsWith("/admin") && next !== "/login" && next !== "/signup" ? next : "/account";
}

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!rateLimit(`login:${clientIp(await headers())}`, 10, 15 * 60 * 1000)) {
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
  if (!rateLimit(`signup:${clientIp(await headers())}`, 6, 60 * 60 * 1000)) {
    return { error: "Too many sign-ups from this connection. Please try again later." };
  }
  const name = text(fd, "name", 80);
  const phone = normalizeIndianPhone(text(fd, "phone", 20));
  const emailRaw = text(fd, "email", 120).toLowerCase();
  const password = typeof fd.get("password") === "string" ? String(fd.get("password")) : "";
  const confirm = typeof fd.get("confirm") === "string" ? String(fd.get("confirm")) : "";

  if (name.length < 2) return { error: "Please enter your name." };
  if (!phone) return { error: "Please enter a valid 10-digit mobile number." };
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) return { error: "Please enter a valid email, or leave it empty." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };

  if (await db.user.findFirst({ where: { OR: [{ login: phone }, { phone }] } })) {
    return { error: "An account with this mobile number already exists. Please log in." };
  }
  if (emailRaw && (await db.user.findFirst({ where: { OR: [{ login: emailRaw }, { email: emailRaw }] } }))) {
    return { error: "An account with this email already exists. Please log in." };
  }

  // Sign-ups are always the "user" role. Only the seeded account is an admin.
  const user = await db.user.create({
    data: { login: phone, name, phone, email: emailRaw || null, passwordHash: await bcrypt.hash(password, 12), role: "user" },
  });
  await startSession(user);
  redirect(destination("user", safeNext(text(fd, "next", 300))));
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}
