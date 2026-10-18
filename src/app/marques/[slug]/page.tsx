import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconWalk } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, getBrand, getBrands, getProductsByBrand } from "@/lib/catalog";
import { signCss, signWord } from "@/lib/catalog/brands";

export async function generateStaticParams() {
  return (await getBrands()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/marques/[slug]">): Promise<Metadata> {
  const brand = await getBrand((await params).slug);
  if (!brand) return {};
  return {
    title: `${brand.name} — boutique`,
    description: `La boutique ${brand.name} chez Fraul : t-shirts, hoodies, pantalons, sneakers et accessoires. Pièces authentiques, suivi de commande à chaque étape.`,
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
  return (
    <>
      <section className="storefront" style={{ background: st.bg, color: st.fg }}>
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow" style={{ color: st.fg, opacity: 0.75 }}>Boutique</p>
          <h1 className="sign" style={{ ...signCss(st), color: st.fg, margin: "12px 0 24px", fontSize: `clamp(28px, min(10vw, ${fit.toFixed(1)}vw), 120px)`, textShadow: `0 0 2px ${st.bg}, 0 2px 18px ${st.bg}` }}>
            {signWord(st)}
          </h1>
          <Link className="pill solid" href={`/walk/${brand.slug}`}>
            <IconWalk /> Entrer dans la boutique
          </Link>
        </div>
        <div className="door" aria-hidden="true" />
      </section>
      <div className="wrap" style={{ paddingBottom: 24 }}>
        {CATEGORIES.map((c) => {
          const items = products.filter((p) => p.category === c.id);
          if (!items.length) return null;
          return (
            <section key={c.id} className="cat-block" aria-labelledby={`cat-${c.id}`}>
              <h2 id={`cat-${c.id}`}>{c.label}</h2>
              <div className="grid">
                {items.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
