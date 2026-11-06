"use server";

import { db, eq } from "@/lib/server/db";
import { adminChatId } from "@/lib/server/env";
import { allow, clientIp } from "@/lib/server/limits";
import { sendMessage } from "@/lib/server/telegram";
import { validateRequest, type ConciergeResult } from "@/models/concierge/request";
import { findsAlert } from "@/models/concierge/alert";
import { TOO_MANY } from "@/models/security/limits";

// Finds : une adresse publique, donc tout est revérifié ici. Le texte du visiteur reste une donnée (voir request.ts).

const MAX_PER_EMAIL_PER_DAY = 5;
const MAX_PER_HOUR = 60;
const HOUR = 3_600_000;

export type FindsResult = ConciergeResult | { ok: "demo"; value: Extract<ConciergeResult, { ok: true }>["value"] };

async function captchaOk(token: unknown): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true; // captcha pas encore posé
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token }),
  }).catch(() => null);
  return res?.ok ? ((await res.json()) as { success?: boolean }).success === true : false;
}

const since = (ms: number) => encodeURIComponent(new Date(Date.now() - ms).toISOString());

export async function submitFinds(input: unknown, captcha: unknown): Promise<FindsResult> {
  const i = (input ?? {}) as Record<string, unknown>;
  const text = (k: string) => (typeof i[k] === "string" ? (i[k] as string).slice(0, 2000) : "");
  const r = validateRequest({ item: text("item"), brand: text("brand"), size: text("size"), link: text("link"), email: text("email"), note: text("note"), website: text("website") });
  if (!r.ok) return r;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // En local, sans base : démo. En ligne : la demande ne doit pas disparaître en silence.
    if (process.env.VERCEL_ENV) return { ok: false, errors: { form: "Finds est indisponible pour l'instant. Réessaie un peu plus tard." } };
    return { ok: "demo", value: r.value };
  }
  if (!(await captchaOk(captcha))) return { ok: false, errors: { form: "La vérification a échoué. Réessaie." } };
  if (!(await allow("finds", await clientIp()))) return { ok: false, errors: { form: TOO_MANY } };

  try {
    const mine = await db.select("concierge_requests", `select=id&email=${eq(r.value.email)}&created_at=gt.${since(24 * HOUR)}&limit=${MAX_PER_EMAIL_PER_DAY}`);
    const all = await db.select("concierge_requests", `select=id&created_at=gt.${since(HOUR)}&limit=${MAX_PER_HOUR}`);
    if (mine.length >= MAX_PER_EMAIL_PER_DAY || all.length >= MAX_PER_HOUR) return { ok: false, errors: { form: "Beaucoup de demandes pour l'instant. Réessaie plus tard." } };
    const v = r.value;
    await db.insert("concierge_requests", { email: v.email, item: v.item, brand: v.brand || null, size: v.size || null, link: v.link || null, note: v.note || null });
  } catch (e) {
    console.error("[finds]", e);
    return { ok: false, errors: { form: "La demande n'est pas partie. Réessaie dans un instant." } };
  }
  // La demande est enregistrée : si Telegram ne répond pas, elle reste dans la base.
  await sendMessage(adminChatId(), findsAlert(r.value)).catch((e) => console.warn("[finds] message Telegram", e));
  return r;
}
