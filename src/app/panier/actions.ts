"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getProduct } from "@/lib/catalog";
import { missingPaymentSettings } from "@/lib/server/env";
import { createCheckoutSession } from "@/lib/server/stripe";
import { checkoutParams, priceCart, type CartProblem, type PayableProduct } from "@/models/payment/checkout";
import { DEFAULT_ZONE, ZONES, type ZoneId } from "@/models/pricing/config";

// « Payer » : le panier (identifiants et quantités seulement) part vers Stripe Checkout.
// Une action serveur est une adresse publique : tout est revérifié ici, rien n'est cru du navigateur.

const PROBLEMS: Record<CartProblem, string> = {
  empty: "Ton panier est vide.",
  "too-many": "Trop d'articles différents dans le panier.",
  "unknown-product": "Un article n'est plus disponible : retire-le du panier.",
  "bad-size": "Choisis une taille pour chaque article.",
  "bad-color": "Une couleur n'est plus disponible : retire l'article et ajoute-le à nouveau.",
  "bad-qty": "Quantité impossible pour un article.",
};

async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function startCheckout(lines: unknown): Promise<{ url: string } | { error: string }> {
  if (missingPaymentSettings().length) return { error: "Le paiement n'est pas encore ouvert. Reviens très vite !" };
  const z = (await cookies()).get("tuc_zone")?.value;
  const zone: ZoneId = z && z in ZONES ? (z as ZoneId) : DEFAULT_ZONE;

  const found = new Map<string, PayableProduct & { image?: { front: string } }>();
  if (Array.isArray(lines)) {
    for (const l of lines.slice(0, 50)) {
      const slug = (l as { slug?: unknown })?.slug;
      if (typeof slug === "string" && !found.has(slug)) {
        const p = await getProduct(slug);
        if (p) found.set(slug, p);
      }
    }
  }
  const priced = priceCart(lines, zone, (slug) => found.get(slug));
  if (!priced.ok) return { error: PROBLEMS[priced.problem] };

  const base = await baseUrl();
  try {
    const session = await createCheckoutSession(
      checkoutParams({
        lines: priced.lines,
        currency: priced.currency,
        zone,
        baseUrl: base,
        photo: (slug) => {
          const front = found.get(slug)?.image?.front;
          return front ? `${base}${front}` : undefined;
        },
      }),
      randomUUID(),
    );
    if (!session.url) throw new Error("Stripe n'a pas renvoyé d'adresse de paiement");
    return { url: session.url };
  } catch (e) {
    console.error("[paiement]", e);
    return { error: "Le paiement ne répond pas. Réessaie dans un instant." };
  }
}
