import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser, CatalogFallback } from "@/components/catalog/CatalogBrowser";
import { getCategories, getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Tout voir",
  description: "Toutes les pièces streetwear et luxe de TakeUrClothes : filtre par type, marque, couleur et taille.",
  alternates: { canonical: "/tout" },
};

export default async function AllProductsPage() {
  const products = await getProducts();
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <div className="head">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 style={{ fontSize: "clamp(42px, 8vw, 80px)", lineHeight: 0.95, marginTop: 8 }}>Tout voir</h1>
        </div>
      </div>
      <Suspense fallback={<CatalogFallback products={products} />}>
        <CatalogBrowser products={products} categories={(await getCategories()).map(({ id, label }) => ({ id, label }))} />
      </Suspense>
    </section>
  );
}
