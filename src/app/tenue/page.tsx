import type { Metadata } from "next";
import { OutfitBuilder } from "@/components/OutfitBuilder";
import { getOutfitPieces } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Crée ta tenue",
  description: "Assemble un haut, un bas et une paire sur le mannequin, puis ajoute la tenue entière au panier.",
  alternates: { canonical: "/tenue" },
};

export default async function OutfitPage() {
  const pieces = await getOutfitPieces();
  return (
    <section className="sec pearl" style={{ minHeight: "80svh" }}>
      <div className="wrap">
        <p className="eyebrow">Drop 001 · Assemble</p>
        <h1 style={{ fontSize: "clamp(42px, 8vw, 80px)", lineHeight: 0.95, margin: "8px 0 28px", fontWeight: 700 }}>Crée ta tenue</h1>
        <OutfitBuilder pieces={pieces} />
      </div>
    </section>
  );
}
