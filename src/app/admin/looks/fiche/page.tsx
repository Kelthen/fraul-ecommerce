import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LookForm } from "@/components/admin/LookForm";
import { listArticles } from "@/lib/server/admin-articles";
import { listBoutiques } from "@/lib/server/admin-boutiques";
import { getLook } from "@/lib/server/admin-looks";
import { isAdmin } from "@/lib/server/admin-session";
import { deleteLookAction } from "../actions";

// Fiche d'un look : nouveau (sans ?id) ou à modifier (?id=…).
export const metadata: Metadata = { title: "Fiche look", robots: { index: false, follow: false } };

export default function LookSheetPage({ searchParams }: PageProps<"/admin/looks/fiche">) {
  return (
    <section className="sec wrap admin" style={{ paddingTop: 40 }}>
      <p className="eyebrow">
        <Link className="link" href="/admin/looks">← Looks</Link>
      </p>
      <Suspense fallback={<p className="muted">Chargement…</p>}>
        <Sheet searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Sheet({ searchParams }: { searchParams: PageProps<"/admin/looks/fiche">["searchParams"] }) {
  if (!(await isAdmin()))
    return (
      <p className="muted">
        Accès réservé. <Link className="link" href="/admin">Connecte-toi</Link>, puis reviens ici.
      </p>
    );
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : null;
  const [look, articles, boutiques] = await Promise.all([id ? getLook(id).catch(() => null) : null, listArticles().catch(() => null), listBoutiques().catch(() => null)]);
  if (id && !look) return <p className="todo">Look introuvable.</p>;
  if (!articles || !boutiques) return <p className="todo">La base ne répond pas. Réessaie dans un instant.</p>;
  const brand = (slug: string) => boutiques.find((b) => b.slug === slug)?.name ?? slug;
  return (
    <>
      <h1 className="h2">{look ? look.title : "Nouveau look"}</h1>
      <LookForm
        look={look}
        articles={articles.filter((a) => a.onSite && a.photos.front).map((a) => ({ slug: a.slug, name: a.name, brand: brand(a.brand), photo: a.photos.front! }))}
      />
      {look && (
        <details className="admin-delete">
          <summary>Supprimer le look</summary>
          <form action={deleteLookAction}>
            <input type="hidden" name="id" value={look.id} />
            <button className="admin-danger">Oui, supprimer ce look</button>
          </form>
        </details>
      )}
    </>
  );
}
