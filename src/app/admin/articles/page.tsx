import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { isAdmin } from "@/lib/server/admin-session";
import { listArticles } from "@/lib/server/admin-articles";
import { listBoutiques } from "@/lib/server/admin-boutiques";
import { MARGIN_ALERT_PCT, marginsByZone } from "@/models/admin/article";
import { toggleOnSiteAction } from "./actions";

// Articles du site (docs/ADMIN-ARTICLES.md, PR 2) : Jean Paul ajoute, modifie, masque ou remet un article.
export const metadata: Metadata = { title: "Articles", robots: { index: false, follow: false } };

export default function ArticlesAdminPage({ searchParams }: PageProps<"/admin/articles">) {
  return (
    <section className="sec wrap admin" style={{ paddingTop: 40 }}>
      <p className="eyebrow">TakeUrClothes · équipe</p>
      <h1 className="h2">Articles</h1>
      <Suspense fallback={<p className="muted">Chargement…</p>}>
        <List searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/admin/articles">["searchParams"] }) {
  if (!(await isAdmin()))
    return (
      <p className="muted">
        Accès réservé. <Link className="link" href="/admin">Connecte-toi</Link>, puis reviens ici.
      </p>
    );
  const sp = await searchParams;
  const msg = typeof sp.msg === "string" ? sp.msg : null;
  const [articles, boutiques] = await Promise.all([listArticles(), listBoutiques()]).catch((e) => {
    console.error("[admin articles]", e);
    return [null, null];
  });
  if (!articles || !boutiques) return <p className="todo">La base ne répond pas. Réessaie dans un instant.</p>;
  const brand = (slug: string) => boutiques.find((b) => b.slug === slug)?.name ?? slug;
  return (
    <>
      {msg && <p className="admin-msg">{msg}</p>}
      <nav className="admin-bar">
        <Link className="admin-add" href="/admin/articles/fiche">+ Ajouter</Link>
        <Link className="link" href="/admin/boutiques">Boutiques</Link>
        <Link className="link" href="/admin/commandes">Commandes</Link>
        <span className="muted">{articles.filter((a) => a.onSite).length} en ligne · {articles.filter((a) => !a.onSite).length} masqué(s)</span>
      </nav>
      {/* Les photos d'abord : toucher un article l'ouvre ; une seule petite action par carte (Rhamone, 4 nov.). */}
      <ul className="admin-grid">
        {articles.map((a) => {
          const us = a.priceUsd != null ? marginsByZone(a.priceUsd, a.costCny, a.weightG).find((m) => m.zone === "us") : null;
          return (
            <li key={a.slug} className={a.onSite ? undefined : "is-hidden"}>
              <Link href={`/admin/articles/fiche?slug=${encodeURIComponent(a.slug)}`} aria-label={`Modifier ${a.name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- miniature de l'admin, déjà réduite */}
                {a.photos.front ? <img src={a.photos.front} alt="" loading="lazy" /> : <span className="admin-nophoto" />}
                <span className="admin-brand">{brand(a.brand)}</span>
                <span className="admin-name">{a.name}</span>
                <span className="admin-price">
                  {us ? `${us.price} USD` : "Prix à saisir"}
                  {us && us.marginPct < MARGIN_ALERT_PCT ? " · ⚠️ marge" : ""}
                </span>
              </Link>
              <form action={toggleOnSiteAction}>
                <input type="hidden" name="slug" value={a.slug} />
                <input type="hidden" name="show" value={a.onSite ? "0" : "1"} />
                <button className="admin-chip" aria-label={a.onSite ? `Masquer ${a.name}` : `Remettre ${a.name}`}>{a.onSite ? "Masquer" : "Remettre"}</button>
              </form>
            </li>
          );
        })}
      </ul>
    </>
  );
}
