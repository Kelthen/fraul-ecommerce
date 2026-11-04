import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BoutiqueForm } from "@/components/admin/BoutiqueForm";
import { isAdmin } from "@/lib/server/admin-session";
import { listBoutiques } from "@/lib/server/admin-boutiques";

// Fiche d'une boutique : nouvelle (sans ?slug) ou à modifier (?slug=…).
export const metadata: Metadata = { title: "Fiche boutique", robots: { index: false, follow: false } };

export default function BoutiqueSheetPage({ searchParams }: PageProps<"/admin/boutiques/fiche">) {
  return (
    <section className="sec wrap admin" style={{ paddingTop: 40 }}>
      <p className="eyebrow">
        <Link className="link" href="/admin/boutiques">← Boutiques</Link>
      </p>
      <Suspense fallback={<p className="muted">Chargement…</p>}>
        <Sheet searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Sheet({ searchParams }: { searchParams: PageProps<"/admin/boutiques/fiche">["searchParams"] }) {
  if (!(await isAdmin()))
    return (
      <p className="muted">
        Accès réservé. <Link className="link" href="/admin/commandes">Connecte-toi</Link>, puis reviens ici.
      </p>
    );
  const sp = await searchParams;
  const slug = typeof sp.slug === "string" ? sp.slug : null;
  const all = await listBoutiques().catch(() => null);
  if (!all) return <p className="todo">La base ne répond pas. Réessaie dans un instant.</p>;
  const boutique = slug ? all.find((b) => b.slug === slug) ?? null : null;
  if (slug && !boutique) return <p className="todo">Boutique introuvable.</p>;
  return (
    <>
      <h1 className="h2">{boutique ? boutique.name : "Nouvelle boutique"}</h1>
      <BoutiqueForm boutique={boutique} total={all.length} />
    </>
  );
}
