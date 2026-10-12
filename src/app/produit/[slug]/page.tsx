import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { getBrand, getCategory, getProduct, getProducts, getProductsByBrand } from "@/lib/catalog";
import { signWord } from "@/lib/catalog/brands";
import { SITE_URL } from "@/lib/format";

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
  const [brand, sameBrand] = await Promise.all([getBrand(product.brandSlug), getProductsByBrand(product.brandSlug)]);
  const cat = getCategory(product.category);
  const more = sameBrand.filter((p) => p.slug !== product.slug && p.category === product.category).slice(0, 4);

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
        {more.length > 0 && (
          <section style={{ paddingBottom: 72 }} aria-labelledby="more-title">
            <h2 id="more-title" style={{ fontSize: "clamp(30px, 5vw, 44px)", marginBottom: 18 }}>
              Dans le même rayon
            </h2>
            <div className="grid">
              {more.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
