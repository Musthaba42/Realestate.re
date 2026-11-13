import "server-only";

// Cloudflare Turnstile (spam protection for public forms).
// Turned on only when TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY are set.

export const TURNSTILE_FIELD = "cf-turnstile-response";

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

/** True when the visitor passed the check (or when Turnstile is not configured). */
export async function verifyTurnstile(token: unknown, ip?: string): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (typeof token !== "string" || !token || token.length > 2048) return false;

  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: ctrl.signal,
    });
    const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
    return Boolean(data?.success);
  } catch (err) {
    // Cloudflare unreachable: let the visitor through (rate limits still apply) rather than lose a lead.
    console.error("[turnstile] verification failed:", err instanceof Error ? err.message : err);
    return true;
  } finally {
    clearTimeout(timer);
  }
}

export const TURNSTILE_ERROR = "Please complete the security check and try again.";
