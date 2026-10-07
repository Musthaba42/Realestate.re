import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { SESSION_COOKIE, verifySession, type Role } from "./session";

export type CurrentUser = { id: string; name: string; login: string; phone: string | null; email: string | null; role: Role };

/**
 * The logged-in person, or null. The role always comes from the database (not from
 * the cookie), so a changed or removed account takes effect immediately.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const u = await db.user.findUnique({ where: { id: session.uid } });
  if (!u) return null;
  return { id: u.id, name: u.name, login: u.login, phone: u.phone, email: u.email, role: u.role === "admin" ? "admin" : "user" };
});

/** Admin only. Returns the admin or null (use in API routes). */
export async function getAdmin(): Promise<CurrentUser | null> {
  const u = await getCurrentUser();
  return u?.role === "admin" ? u : null;
}

/** Use at the top of every admin page and admin server action. */
export async function requireAdmin(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/admin");
  if (u.role !== "admin") redirect("/account");
  return u;
}

/** Any logged-in account (customer or admin). */
export async function requireUser(next = "/account"): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}
