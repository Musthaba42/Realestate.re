// Edge-safe session helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "gg_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export type Role = "admin" | "user";
export type SessionPayload = { uid: string; login: string; name: string; role: Role };

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const role = payload.role;
    if (
      typeof payload.uid !== "string" ||
      !/^[a-f0-9]{24}$/.test(payload.uid) ||
      typeof payload.login !== "string" ||
      (role !== "admin" && role !== "user")
    ) {
      return null;
    }
    return { uid: payload.uid, login: payload.login, name: String(payload.name ?? ""), role };
  } catch {
    return null;
  }
}
