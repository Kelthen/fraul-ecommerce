// Données structurées pour les moteurs de recherche. Pur (testé dans jsonld.test.ts).

export type Crumb = { name: string; path: string };

export const breadcrumbJsonLd = (baseUrl: string, crumbs: Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${baseUrl}${c.path}` })),
});

type ProductInput = { slug: string; name: string; brandName: string; categoryLabel: string; image: string; priceUsd: number };

/** Fiche produit : le prix affiché aux moteurs est le prix public en dollars américains. */
export const productJsonLd = (baseUrl: string, p: ProductInput) => {
  const url = `${baseUrl}/produit/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.name} ${p.brandName}`,
    brand: { "@type": "Brand", name: p.brandName },
    category: p.categoryLabel,
    image: p.image.startsWith("http") ? p.image : `${baseUrl}${p.image}`,
    url,
    offers: { "@type": "Offer", url, price: p.priceUsd, priceCurrency: "USD", availability: "https://schema.org/InStock" },
  };
};

/** JSON à poser dans une balise script : un nom d'article ne peut pas fermer la balise. */
export const jsonLdHtml = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
