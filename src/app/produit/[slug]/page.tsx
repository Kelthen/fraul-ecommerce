import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TEST_PREFIX } from "@/models/pricing/price";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { getCategory, getProduct, getProducts } from "@/lib/catalog";
import { SITE_URL } from "@/lib/format";
import { related } from "@/models/catalog/related";
import { breadcrumbJsonLd, jsonLdHtml, productJsonLd } from "@/models/seo/jsonld";

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produit/[slug]">): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const cat = await getCategory(p.category);
  return {
    title: `${p.name} ${p.brandName}`,
    description: `${p.name} ${p.brandName} (${cat.label.toLowerCase()}). Tailles ${p.sizes.join(", ")}. Pièce authentique, suivi de commande à chaque étape.`,
    alternates: { canonical: `/produit/${p.slug}` },
    // Article d'essai du paiement : pas dans les moteurs de recherche.
    ...(p.slug.startsWith(TEST_PREFIX) ? { robots: { index: false, follow: false } } : {}),
    openGraph: { type: "website", siteName: "TakeUrClothes", locale: "fr_FR", title: `${p.name} ${p.brandName}`, url: `/produit/${p.slug}`, images: [{ url: p.image.front }] },
  };
}

export default async function ProductPage({ params }: PageProps<"/produit/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const all = await getProducts();
  const cat = await getCategory(product.category);
  // Mêmes propositions que la fiche en grand du Walk (src/models/catalog/related.ts).
  const tag = (p: (typeof all)[number]) => ({ slug: p.slug, brand: p.brandName, cat: p.category, photo: !!p.image, p });
  const sections = related(all.map(tag), tag(product));
  const titles = {
    same: `Autres ${cat.label.toLowerCase()} ${product.brandName}`,
    outfit: "Complète la tenue",
    others: `${cat.label} des autres boutiques`,
  };

  const jsonLd = productJsonLd(SITE_URL, {
    slug: product.slug,
    name: product.name,
    brandName: product.brandName,
    categoryLabel: cat.label,
    image: product.image.front,
    priceUsd: product.prices.us,
  });
  const crumbs = breadcrumbJsonLd(SITE_URL, [
    { name: "Marques", path: "/marques" },
    { name: product.brandName, path: `/marques/${product.brandSlug}` },
    { name: product.name, path: `/produit/${product.slug}` },
  ]);

  return (
    <div className="light">
      <div className="wrap">
        <nav aria-label="Fil d'Ariane" style={{ paddingTop: 20, fontSize: 12 }} className="muted">
          <Link href="/marques">Marques</Link> / <Link href={`/marques/${product.brandSlug}`}>{product.brandName}</Link> / {cat.label}
        </nav>
        <ProductDetail
          product={product}
          categoryLabel={cat.label}
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml([jsonLd, crumbs]) }} />
    </div>
  );
}
