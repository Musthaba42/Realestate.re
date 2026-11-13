import "server-only";

/**
 * Optional instant alerts to the team when a lead / seller request arrives.
 * Configure TELEGRAM_* and/or RESEND_* in .env. Failures never block the user.
 */
export async function notifyTeam(subject: string, lines: string[]): Promise<void> {
  const text = [subject, "", ...lines].join("\n");
  await Promise.allSettled([sendTelegram(text), sendEmail(subject, text)]);
}

async function withTimeout(url: string, init: RequestInit): Promise<void> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) console.error(`[notify] ${url.split("/")[2]} responded ${res.status}`);
  } catch (err) {
    console.error("[notify] failed:", err instanceof Error ? err.message : err);
  } finally {
    clearTimeout(t);
  }
}

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await withTimeout(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
}

async function sendEmail(subject: string, text: string): Promise<void> {
  const to = process.env.NOTIFY_EMAIL_TO;
  if (!to) return;
  await sendEmailTo(to.split(",").map((s) => s.trim()), subject, text);
}

/** Which instant-alert channels are configured (shown on the admin dashboard). */
export function alertChannels(): { telegram: boolean; email: boolean } {
  return {
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    email: Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL_FROM && process.env.NOTIFY_EMAIL_TO),
  };
}

/** True when emails can be sent (Resend key + sender address). */
export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL_FROM);
}

/** Send a plain-text email through Resend. Returns false if not configured or it failed. */
export async function sendEmailTo(to: string | string[], subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_EMAIL_FROM;
  if (!key || !from) return false;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, text }),
      signal: ctrl.signal,
    });
    if (!res.ok) console.error(`[notify] api.resend.com responded ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error("[notify] email failed:", err instanceof Error ? err.message : err);
    return false;
  } finally {
    clearTimeout(t);
  }
}
