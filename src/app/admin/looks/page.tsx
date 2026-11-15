import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listLooks } from "@/lib/server/admin-looks";
import { isAdmin } from "@/lib/server/admin-session";

// Looks de l'accueil : Jean Paul ajoute un look (photo d'une personne qui porte des articles du site) et choisit ses pièces.
export const metadata: Metadata = { title: "Looks", robots: { index: false, follow: false } };

export default function LooksAdminPage({ searchParams }: PageProps<"/admin/looks">) {
  return (
    <section className="sec wrap admin" style={{ paddingTop: 40 }}>
      <p className="eyebrow">TakeUrClothes · équipe</p>
      <h1 className="h2">Looks</h1>
      <Suspense fallback={<p className="muted">Chargement…</p>}>
        <List searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/admin/looks">["searchParams"] }) {
  if (!(await isAdmin()))
    return (
      <p className="muted">
        Accès réservé. <Link className="link" href="/admin">Connecte-toi</Link>, puis reviens ici.
      </p>
    );
  const sp = await searchParams;
  const msg = typeof sp.msg === "string" ? sp.msg.slice(0, 200) : null;
  const looks = await listLooks().catch((e) => (console.error("[admin looks]", e), null));
  if (!looks) return <p className="todo">La base ne répond pas. Réessaie dans un instant.</p>;
  return (
    <>
      {msg && <p className="admin-msg">{msg}</p>}
      <nav className="admin-bar">
        <Link className="admin-add" href="/admin/looks/fiche">+ Ajouter un look</Link>
        <Link className="link" href="/admin/articles">Articles</Link>
        <span className="muted">{looks.length ? `${looks.length} look(s)` : "Aucun look : l'accueil montre les looks de test."}</span>
      </nav>
      <ul className="admin-grid">
        {looks.map((l) => (
          <li key={l.id} className={l.onSite ? undefined : "is-hidden"}>
            <Link href={`/admin/looks/fiche?id=${encodeURIComponent(l.id)}`} aria-label={`Modifier ${l.title}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- miniature de l'admin */}
              <img src={l.cutout || l.photo} alt="" loading="lazy" style={{ objectFit: "contain" }} />
              <span className="admin-name">{l.title}</span>
              <span className="admin-price">
                {l.items.length} pièces · {l.cutout === null ? "détourage en cours…" : l.cutout === "" ? "détourage impossible" : l.onSite ? "en ligne" : "masqué"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
