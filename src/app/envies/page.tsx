import type { Metadata } from "next";
import { EnviesView } from "@/components/EnviesView";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Mes envies",
  description: "Les pièces que tu gardes de côté.",
  robots: { index: false },
};

export default async function EnviesPage() {
  // Pièces encore en vente : une envie hors de cette liste s'affiche « Plus disponible » au lieu de disparaître (§7.2).
  const available = (await getProducts()).map((p) => p.slug);
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <EnviesView available={available} />
    </section>
  );
}
