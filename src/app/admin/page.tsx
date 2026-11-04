import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { isAdmin } from "@/lib/server/admin-session";
import { db } from "@/lib/server/db";
import { PERIODS, salesByCurrency, topItems, type SaleOrder } from "@/models/admin/stats";

// Accueil de l'admin (docs/ADMIN-ARTICLES.md, PR 3) : ventes de Jean Paul et accès aux autres pages.
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminHomePage() {
  return (
    <section className="sec wrap admin" style={{ paddingTop: 40 }}>
      <p className="eyebrow">TakeUrClothes · équipe</p>
      <h1 className="h2">Tableau de bord</h1>
      <Suspense fallback={<p className="muted">Chargement…</p>}>
        <Dashboard />
      </Suspense>
    </section>
  );
}

type Row = { total: number; currency: string; status: string; is_demo: boolean; created_at: string; price_snapshot: { margin?: number | null }; order_items: { title: string; qty: number }[] };

const money = (cents: number, currency: string) => `${Math.round(cents / 100).toLocaleString("fr-FR")} ${currency}`;

/** Lecture des ventes des 31 derniers jours et heure du calcul, hors du rendu (le rendu reste pur). */
async function loadSales() {
  const now = Date.now();
  const since = new Date(now - 31 * 86_400_000).toISOString();
  const [rows, finds] = await Promise.all([
    db
      .select<Row>("orders", `select=total,currency,status,is_demo,created_at,price_snapshot,order_items(title,qty)&created_at=gt.${encodeURIComponent(since)}&limit=2000`)
      .catch((e) => (console.error("[admin] ventes", e), null)),
    db.select<{ id: string }>("concierge_requests", "select=id&status=eq.new&limit=100").catch(() => []),
  ]);
  const orders: SaleOrder[] | null =
    rows?.map((r) => ({
      total: r.total,
      currency: r.currency,
      status: r.status,
      isDemo: r.is_demo,
      createdAt: r.created_at,
      margin: r.price_snapshot?.margin ?? null,
      items: r.order_items,
    })) ?? null;
  return { orders, finds, now };
}

async function Dashboard() {
  if (!(await isAdmin()))
    return (
      <p className="muted">
        Accès réservé. <Link className="link" href="/admin/commandes">Connecte-toi</Link> (code sur Telegram), puis reviens ici.
      </p>
    );
  const { orders, finds, now } = await loadSales();

  return (
    <>
      <div className="admin-acts">
        <Link className="pill solid" href="/admin/articles">Articles et prix</Link>
        <Link className="pill ghost" href="/admin/boutiques">Boutiques</Link>
        <Link className="pill ghost" href="/admin/commandes">Commandes</Link>
      </div>
      {finds.length > 0 && <p className="admin-msg">{finds.length} demande(s) Finds à traiter.</p>}
      {!orders ? (
        <p className="todo">La base ne répond pas. Réessaie dans un instant.</p>
      ) : (
        <>
          {PERIODS.map((p) => {
            const t = salesByCurrency(orders, p.days, now);
            return (
              <div key={p.label} className="admin-pile">
                <h2>{p.label}</h2>
                {t.length ? (
                  <div style={{ overflowX: "auto" }}><table className="admin-margins">
                    <thead><tr><th>Devise</th><th>Commandes</th><th>Ventes</th><th>Panier moyen</th><th>Marge estimée</th></tr></thead>
                    <tbody>
                      {t.map((c) => (
                        <tr key={c.currency}>
                          <td>{c.currency}</td>
                          <td>{c.orders}</td>
                          <td>{money(c.total, c.currency)}</td>
                          <td>{money(c.average, c.currency)}</td>
                          <td>{money(c.margin, c.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                ) : (
                  <p className="muted">Aucune vente.</p>
                )}
              </div>
            );
          })}
          <div className="admin-pile">
            <h2>Les plus vendus (30 jours)</h2>
            {topItems(orders, 30, 5, now).length ? (
              <ol>{topItems(orders, 30, 5, now).map((i) => <li key={i.title}>{i.title} · {i.qty} pièce(s)</li>)}</ol>
            ) : (
              <p className="muted">Pas encore de vente.</p>
            )}
          </div>
          <p className="muted">Les commandes de test ne sont jamais comptées. Marge estimée au moment de la commande.</p>
        </>
      )}
    </>
  );
}
