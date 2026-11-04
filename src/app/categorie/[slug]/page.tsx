import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogBrowser, CatalogFallback } from "@/components/catalog/CatalogBrowser";
import { CATEGORIES, getCategoryBySlug, getProductsByCategory, getStockedCategories } from "@/lib/catalog";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categorie/[slug]">): Promise<Metadata> {
  const cat = await getCategoryBySlug((await params).slug);
  if (!cat) return {};
  return { title: cat.label, description: `${cat.label} streetwear et luxe, toutes marques, chez TakeUrClothes.`, alternates: { canonical: `/categorie/${cat.slug}` } };
}

export default async function CategoryPage({ params }: PageProps<"/categorie/[slug]">) {
  const cat = await getCategoryBySlug((await params).slug);
  if (!cat) notFound();
  const [products, categories] = await Promise.all([getProductsByCategory(cat.id), getStockedCategories()]);
  if (!products.length) notFound(); // une catégorie sans article n'existe pas sur le site
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <div className="head">
        <div>
          <p className="eyebrow">Toutes marques</p>
          <h1 style={{ fontSize: "clamp(42px, 8vw, 80px)", lineHeight: 0.95, marginTop: 8 }}>{cat.label}</h1>
        </div>
      </div>
      <nav aria-label="Catégories" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <Link className="chip" href="/tout">Tout voir</Link>
        {categories.map((c) => (
          <Link key={c.id} className="chip" href={`/categorie/${c.slug}`} aria-current={c.id === cat.id ? "page" : undefined}>
            {c.label}
          </Link>
        ))}
      </nav>
      <Suspense fallback={<CatalogFallback products={products} />}>
        <CatalogBrowser products={products} categories={categories.map(({ id, label }) => ({ id, label }))} />
      </Suspense>
    </section>
  );
}
