import type { Metadata } from "next";
import { BrandDirectory } from "@/components/BrandDirectory";
import { getBrands } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Toutes les marques",
  description: "Toutes les marques Fraul de A à Z. Streetwear et luxe authentiques, une boutique par marque.",
  alternates: { canonical: "/marques" },
};

export default async function BrandsPage() {
  const brands = await getBrands();
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <div className="head">
        <div>
          <p className="eyebrow">Annuaire</p>
          <h1 style={{ fontSize: "clamp(42px, 8vw, 80px)", lineHeight: 0.95, marginTop: 8 }}>Toutes les marques</h1>
        </div>
        <p className="muted">{brands.length} marques, de A à Z.</p>
      </div>
      <BrandDirectory brands={brands.map((b) => ({ name: b.name, slug: b.slug, inWalk: b.inWalk }))} />
    </section>
  );
}
