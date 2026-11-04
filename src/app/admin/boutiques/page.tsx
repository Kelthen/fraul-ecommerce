import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { isAdmin } from "@/lib/server/admin-session";
import { listBoutiques } from "@/lib/server/admin-boutiques";
import { moveBoutiqueAction, removeBoutiqueAction, toggleVisibleAction } from "./actions";

// Boutiques du mall : Jean Paul ajoute, modifie, déplace, masque ou retire une boutique.
export const metadata: Metadata = { title: "Boutiques", robots: { index: false, follow: false } };

export default function BoutiquesAdminPage({ searchParams }: PageProps<"/admin/boutiques">) {
  return (
    <section className="sec wrap admin" style={{ paddingTop: 40 }}>
      <p className="eyebrow">TakeUrClothes · équipe</p>
      <h1 className="h2">Boutiques</h1>
      <Suspense fallback={<p className="muted">Chargement…</p>}>
        <List searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/admin/boutiques">["searchParams"] }) {
  if (!(await isAdmin()))
    return (
      <p className="muted">
        Accès réservé. <Link className="link" href="/admin/commandes">Connecte-toi</Link> (code sur Telegram), puis reviens ici.
      </p>
    );
  const sp = await searchParams;
  const msg = typeof sp.msg === "string" ? sp.msg : null;
  const boutiques = await listBoutiques().catch((e) => {
    console.error("[admin boutiques]", e);
    return null;
  });
  if (!boutiques) return <p className="todo">La base ne répond pas. Réessaie dans un instant.</p>;
  return (
    <>
      {msg && <p className="admin-msg">{msg}</p>}
      <div className="admin-acts">
        <Link className="pill solid" href="/admin/boutiques/fiche">Ajouter une boutique</Link>
        <Link className="pill ghost" href="/admin/articles">Articles</Link>
        <Link className="pill ghost" href="/admin/commandes">Commandes</Link>
      </div>
      <p className="muted">
        Une boutique apparaît dans le mall dès qu&apos;elle a au moins un article visible. La première de la liste est la première du parcours.
      </p>
      <ul className="admin-articles admin-boutiques">
        {boutiques.map((b, i) => (
          <li key={b.slug} className={b.visible ? undefined : "is-hidden"}>
            <span className="admin-shop" style={{ background: b.color }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- logo envoyé dans l'admin, déjà réduit */}
              {b.logo && <img src={b.logo} alt="" loading="lazy" />}
            </span>
            <div>
              <p className="eyebrow">Place {b.place}</p>
              <p><b>{b.name}</b></p>
              <p className="muted">
                {b.articles} article{b.articles > 1 ? "s" : ""}
                {!b.visible ? " · masquée" : b.articles === 0 ? " · pas encore dans le mall" : ""}
              </p>
            </div>
            <div className="admin-acts">
              <form action={moveBoutiqueAction}>
                <input type="hidden" name="slug" value={b.slug} />
                <input type="hidden" name="place" value={b.place - 1} />
                <button className="pill ghost" disabled={i === 0} aria-label={`Avancer ${b.name}`}>↑</button>
              </form>
              <form action={moveBoutiqueAction}>
                <input type="hidden" name="slug" value={b.slug} />
                <input type="hidden" name="place" value={b.place + 1} />
                <button className="pill ghost" disabled={i === boutiques.length - 1} aria-label={`Reculer ${b.name}`}>↓</button>
              </form>
              <Link className="pill ghost" href={`/admin/boutiques/fiche?slug=${encodeURIComponent(b.slug)}`}>Modifier</Link>
              <form action={toggleVisibleAction}>
                <input type="hidden" name="slug" value={b.slug} />
                <input type="hidden" name="show" value={b.visible ? "0" : "1"} />
                <button className="pill ghost">{b.visible ? "Masquer" : "Remettre"}</button>
              </form>
              {b.articles === 0 && (
                <details className="admin-remove">
                  <summary className="pill ghost">Retirer</summary>
                  <form action={removeBoutiqueAction}>
                    <input type="hidden" name="slug" value={b.slug} />
                    <button className="pill solid">Confirmer le retrait de {b.name}</button>
                  </form>
                </details>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
