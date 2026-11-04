import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { IconWalk } from "@/components/Icons";
import { CATEGORIES, getBrand, getBrands, getProductsByBrand } from "@/lib/catalog";
import { signCss, signWord } from "@/lib/catalog/brands";
import { SITE_URL } from "@/lib/format";
import { breadcrumbJsonLd, jsonLdHtml } from "@/models/seo/jsonld";
import { CatalogBrowser, CatalogFallback } from "@/components/catalog/CatalogBrowser";

export async function generateStaticParams() {
  return (await getBrands()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/marques/[slug]">): Promise<Metadata> {
  const brand = await getBrand((await params).slug);
  if (!brand) return {};
  const stocked = new Set((await getProductsByBrand(brand.slug)).map((p) => p.category));
  const kinds = CATEGORIES.filter((c) => stocked.has(c.id)).map((c) => c.label.toLowerCase()).join(", ");
  return {
    title: `${brand.name} — boutique`,
    description: `La boutique ${brand.name} chez TakeUrClothes : ${kinds}. Pièces authentiques, suivi de commande à chaque étape.`,
    alternates: { canonical: `/marques/${brand.slug}` },
  };
}

export default async function BrandPage({ params }: PageProps<"/marques/[slug]">) {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) notFound();
  const products = await getProductsByBrand(slug);
  const st = brand.style;
  // Les noms longs rétrécissent pour tenir sur la largeur d'un téléphone (une seule ligne).
  const fit = 92 / (signWord(st).length * (0.7 + st.sp));
  const crumbs = breadcrumbJsonLd(SITE_URL, [
    { name: "Marques", path: "/marques" },
    { name: brand.name, path: `/marques/${brand.slug}` },
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(crumbs) }} />
      <section className="storefront" style={{ background: st.bg, color: st.fg }}>
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow" style={{ color: st.fg, opacity: 0.75 }}>Boutique</p>
          <h1 className="sign" style={{ ...signCss(st), color: st.fg, margin: "12px 0 24px", fontSize: `clamp(28px, min(10vw, ${fit.toFixed(1)}vw), 120px)`, textShadow: `0 0 2px ${st.bg}, 0 2px 18px ${st.bg}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- logo déjà réduit à l'envoi */}
            {st.logo ? <img className="brand-logo big" src={st.logo} alt={brand.name} /> : signWord(st)}
          </h1>
          <Link className="pill solid" href={`/walk/${brand.slug}`}>
            <IconWalk /> Entrer dans la boutique
          </Link>
        </div>
        <div className="door" aria-hidden="true" />
      </section>
      <div className="wrap" style={{ paddingBottom: 24, paddingTop: 16 }}>
        <Suspense fallback={<CatalogFallback products={products} />}>
          <CatalogBrowser products={products} categories={CATEGORIES.map(({ id, label }) => ({ id, label }))} grouped />
        </Suspense>
      </div>
    </>
  );
}
