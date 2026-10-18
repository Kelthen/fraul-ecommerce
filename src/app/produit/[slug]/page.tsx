import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { getBrand, getCategory, getProduct, getProducts } from "@/lib/catalog";
import { signWord } from "@/lib/catalog/brands";
import { SITE_URL } from "@/lib/format";
import { related } from "@/models/catalog/related";

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produit/[slug]">): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const cat = getCategory(p.category);
  return {
    title: `${p.name} ${p.brandName}`,
    description: `${p.name} ${p.brandName} (${cat.label.toLowerCase()}). Tailles ${p.sizes.join(", ")}. Pièce authentique, suivi de commande à chaque étape.`,
    alternates: { canonical: `/produit/${p.slug}` },
  };
}

export default async function ProductPage({ params }: PageProps<"/produit/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const [brand, all] = await Promise.all([getBrand(product.brandSlug), getProducts()]);
  const cat = getCategory(product.category);
  // Mêmes propositions que la fiche en grand du Walk (src/models/catalog/related.ts).
  const tag = (p: (typeof all)[number]) => ({ slug: p.slug, brand: p.brandName, cat: p.category, photo: !!p.image, p });
  const sections = related(all.map(tag), tag(product));
  const titles = {
    same: `Autres ${cat.label.toLowerCase()} ${product.brandName}`,
    outfit: "Complète la tenue",
    others: `${cat.label} des autres boutiques`,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.name} ${product.brandName}`,
    brand: { "@type": "Brand", name: product.brandName },
    category: cat.label,
    url: `${SITE_URL}/produit/${product.slug}`,
  };

  return (
    <div className="light">
      <div className="wrap">
        <nav aria-label="Fil d'Ariane" style={{ paddingTop: 20, fontSize: 12 }} className="muted">
          <Link href="/marques">Marques</Link> / <Link href={`/marques/${product.brandSlug}`}>{product.brandName}</Link> / {cat.label}
        </nav>
        <ProductDetail
          product={product}
          categoryLabel={cat.label}
          brandWord={brand ? signWord(brand.style) : product.brandName}
        />
        {sections.map((s, i) => (
          <section key={s.key} style={{ paddingBottom: i === sections.length - 1 ? 72 : 40 }} aria-labelledby={`more-${s.key}`}>
            <h2 id={`more-${s.key}`} style={{ fontSize: "clamp(26px, 5vw, 40px)", marginBottom: 18 }}>
              {titles[s.key]}
            </h2>
            <div className="grid rel">
              {s.items.map(({ p }) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
