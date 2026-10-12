import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PricingTester } from "@/components/PricingTester";
import { getNewArrivals } from "@/lib/catalog";
import { SITE_LIVE } from "@/lib/format";

// Page cachée de l'équipe : essayer chaque zone et chaque groupe sans compte. Disparaît au lancement.
export const metadata: Metadata = { title: "Test des prix", robots: { index: false, follow: false } };

export default async function PricingTestPage() {
  if (SITE_LIVE) notFound();
  const items = (await getNewArrivals()).slice(0, 4);
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <p className="eyebrow">Équipe · mode test</p>
      <h1 className="h2">Test des prix</h1>
      <p className="muted" style={{ maxWidth: 560 }}>
        Choisis une zone et un groupe : tout le site (fiches, panier, mall) affiche alors ces prix sur ce téléphone. Valeurs de test, à confirmer
        avec Serge (CLAUDE.md §9).
      </p>
      <PricingTester items={items.map((p) => ({ slug: p.slug, name: `${p.brandName} · ${p.name}`, cost: p.cost }))} />
    </section>
  );
}
