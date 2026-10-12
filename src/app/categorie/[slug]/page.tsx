import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, getCategoryBySlug, getProductsByCategory } from "@/lib/catalog";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categorie/[slug]">): Promise<Metadata> {
  const cat = await getCategoryBySlug((await params).slug);
  if (!cat) return {};
  return { title: cat.label, description: `${cat.label} streetwear et luxe, toutes marques, chez Fraul.`, alternates: { canonical: `/categorie/${cat.slug}` } };
}

export default async function CategoryPage({ params }: PageProps<"/categorie/[slug]">) {
  const cat = await getCategoryBySlug((await params).slug);
  if (!cat) notFound();
  const products = await getProductsByCategory(cat.id);
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <div className="head">
        <div>
          <p className="eyebrow">Toutes marques</p>
          <h1 style={{ fontSize: "clamp(42px, 8vw, 80px)", lineHeight: 0.95, marginTop: 8 }}>{cat.label}</h1>
        </div>
        <p className="muted">{products.length} pièces</p>
      </div>
      <nav aria-label="Catégories" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        {CATEGORIES.map((c) => (
          <Link key={c.id} className="chip" href={`/categorie/${c.slug}`} aria-current={c.id === cat.id ? "page" : undefined}>
            {c.label}
          </Link>
        ))}
      </nav>
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
