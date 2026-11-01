"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { receiveFromSheet, undoReceiveFromSheet } from "@/lib/server/relay";

// Gestes de l'expéditeur sur sa fiche (lien secret, sans compte). Chaque action revérifie le lien
// et que le colis appartient bien à cette commande : on ne fait jamais confiance au formulaire.

async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const field = (form: FormData, name: string) => String(form.get(name) ?? "");
const back = (token: string, done: string): never => redirect(`/f/${encodeURIComponent(token)}?r=${done}`);

/** « 已收到 Reçu » sur un colis. */
export async function markReceived(form: FormData) {
  const token = field(form, "token");
  const result = await receiveFromSheet(token, field(form, "parcel"), await baseUrl()).catch((e) => {
    console.error("[fiche]", e);
    return "error" as const;
  });
  back(token, result);
}

/** « 撤销 Annuler » après confirmation, dans les 15 min. */
export async function undoReceived(form: FormData) {
  const token = field(form, "token");
  const result = await undoReceiveFromSheet(token, field(form, "parcel"), await baseUrl()).catch((e) => {
    console.error("[fiche]", e);
    return "error" as const;
  });
  back(token, result === "ok" ? "undone" : result);
}
