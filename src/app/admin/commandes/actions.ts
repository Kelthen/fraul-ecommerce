"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkLoginCode, isAdmin, logout, sendLoginCode } from "@/lib/server/admin-session";
import { webhookSecret } from "@/lib/server/env";
import { createTestOrder, deleteTestOrders, relayOrder } from "@/lib/server/relay";
import { tg } from "@/lib/server/telegram";

// Actions du tableau de bord des commandes. Chaque action revérifie la session : une action serveur
// est une adresse publique, on ne fait jamais confiance à la page qui l'a appelée.

const PAGE = "/admin/commandes";

async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const done = (msg: string): never => redirect(`${PAGE}?msg=${encodeURIComponent(msg)}`);

async function guard() {
  if (!(await isAdmin())) redirect(PAGE);
}

async function attempt(fn: () => Promise<string>): Promise<never> {
  let msg: string;
  try {
    msg = await fn();
  } catch (e) {
    console.error("[admin]", e);
    msg = `⚠️ ${e instanceof Error ? e.message : "Erreur"}`;
  }
  return done(msg);
}

export async function requestCode() {
  await attempt(async () => {
    await sendLoginCode();
    return "Code envoyé sur Telegram.";
  });
}

export async function verifyCode(form: FormData) {
  const ok = await checkLoginCode(String(form.get("code") ?? ""));
  done(ok ? "Connecté." : "Code incorrect ou expiré.");
}

export async function signOut() {
  await logout();
  redirect(PAGE);
}

export async function newTestOrder() {
  await guard();
  const base = await baseUrl();
  await attempt(async () => {
    await createTestOrder(base);
    return "Commande test créée et envoyée sur Telegram.";
  });
}

export async function resend(form: FormData) {
  await guard();
  const base = await baseUrl();
  await attempt(async () => {
    await relayOrder(String(form.get("order")), base);
    return "Message renvoyé sur Telegram.";
  });
}

export async function clearTestOrders() {
  await guard();
  await attempt(async () => `${await deleteTestOrders()} commande(s) test effacée(s).`);
}

/** Branche le bot sur ce site (adresse du webhook). Sur une preview protégée, ajoute le jeton de contournement Vercel. */
export async function connectBot() {
  await guard();
  const base = await baseUrl();
  await attempt(async () => {
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    const url = `${base}/api/telegram${bypass ? `?x-vercel-protection-bypass=${encodeURIComponent(bypass)}` : ""}`;
    await tg("setWebhook", { url, secret_token: webhookSecret(), allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
    // Menu « / » du bot (groupe et conversation privée).
    await tg("setMyCommands", {
      commands: [
        { command: "afaire", description: "Ce qui reste à envoyer ou à recevoir" },
        { command: "aide", description: "Comment utiliser le bot" },
      ],
    });
    return `Bot branché sur ${base}.`;
  });
}
