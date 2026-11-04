import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BRANDS, CATEGORIES, COLORS, WEIGHT_G } from "@/lib/catalog/demo";
import { COLOR_NAMES } from "@/lib/catalog/palette";
import { isAdmin } from "@/lib/server/admin-session";
import { getArticle } from "@/lib/server/admin-articles";
import { ArticleForm } from "@/components/admin/ArticleForm";

// Fiche d'un article : nouvelle (sans ?slug) ou à modifier (?slug=…).
export const metadata: Metadata = { title: "Fiche article", robots: { index: false, follow: false } };

export default function ArticleSheetPage({ searchParams }: PageProps<"/admin/articles/fiche">) {
  return (
    <section className="sec wrap admin" style={{ paddingTop: 40 }}>
      <p className="eyebrow">
        <Link className="link" href="/admin/articles">← Articles</Link>
      </p>
      <Suspense fallback={<p className="muted">Chargement…</p>}>
        <Sheet searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Sheet({ searchParams }: { searchParams: PageProps<"/admin/articles/fiche">["searchParams"] }) {
  if (!(await isAdmin()))
    return (
      <p className="muted">
        Accès réservé. <Link className="link" href="/admin/commandes">Connecte-toi</Link>, puis reviens ici.
      </p>
    );
  const sp = await searchParams;
  const slug = typeof sp.slug === "string" ? sp.slug : null;
  const article = slug ? await getArticle(slug).catch(() => null) : null;
  if (slug && !article) return <p className="todo">Article introuvable.</p>;
  return (
    <>
      <h1 className="h2">{article ? article.name : "Nouvel article"}</h1>
      <ArticleForm
        article={article}
        brands={BRANDS.map((b) => ({ slug: b.slug, name: b.name }))}
        categories={CATEGORIES.map((c) => ({ id: c.id, label: c.label, sizes: c.sizes, weight: WEIGHT_G[c.id] }))}
        colors={COLORS.map((hex) => ({ hex, name: COLOR_NAMES[hex] ?? hex }))}
      />
    </>
  );
}
