import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { ClearCart } from "@/components/ClearCart";
import { fulfillCheckout, type Fulfilled } from "@/lib/server/orders";

// Retour de Stripe après le paiement. La page vérifie le paiement auprès de Stripe (jamais l'adresse seule),
// enregistre la commande et prévient TakeUrClothes sur Telegram. Le webhook Stripe fait la même chose en secours.
export const metadata: Metadata = { title: "Merci", robots: { index: false, follow: false } };
// Une session de paiement par visite : rien à pré-rendre.
export const instant = false;

export default function ThanksPage({ searchParams }: PageProps<"/commande/merci">) {
  return (
    <section className="sec wrap" style={{ paddingTop: 48, minHeight: "60svh" }}>
      <Suspense fallback={<p className="muted">On confirme ton paiement…</p>}>
        <Thanks searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function base(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function Thanks({ searchParams }: { searchParams: PageProps<"/commande/merci">["searchParams"] }) {
  const sp = await searchParams;
  const id = typeof sp.session_id === "string" ? sp.session_id : "";
  const r: Fulfilled | "erreur" = await fulfillCheckout(id, await base()).catch((e) => {
    console.error("[merci]", e);
    return "erreur" as const;
  });

  if (r === "erreur" || r.status === "pending") {
    return (
      <>
        <p className="eyebrow">Paiement reçu</p>
        <h1 style={{ fontSize: "clamp(36px, 7vw, 64px)", lineHeight: 0.95, margin: "8px 0 18px" }}>On enregistre ta commande.</h1>
        <p className="muted">Ça prend quelques secondes. Recharge la page, ou garde l&apos;e-mail de Stripe : ta commande est bien payée.</p>
      </>
    );
  }
  if (r.status !== "ok") {
    return (
      <>
        <p className="eyebrow">Paiement</p>
        <h1 style={{ fontSize: "clamp(36px, 7vw, 64px)", lineHeight: 0.95, margin: "8px 0 18px" }}>Paiement non finalisé.</h1>
        <p className="muted">Rien n&apos;a été débité. Ton panier t&apos;attend.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
          <Link className="pill solid" href="/panier">Retour au panier</Link>
        </div>
      </>
    );
  }
  return (
    <>
      <ClearCart />
      <p className="eyebrow">Merci</p>
      <h1 style={{ fontSize: "clamp(36px, 7vw, 64px)", lineHeight: 0.95, margin: "8px 0 18px" }}>Commande confirmée.</h1>
      <p>
        Ton numéro : <b style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.number}</b>
      </p>
      <p className="muted">
        Tes pièces passent en préparation. Garde ton numéro pour suivre ton colis.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
        <Link className="pill solid" href={`/suivi?code=${r.number}`}>Suivre ma commande</Link>
        <Link className="pill ghost" href="/walk">Retour au mall</Link>
      </div>
    </>
  );
}
