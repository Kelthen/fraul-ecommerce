import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { openSheet } from "@/lib/server/relay";

// Fiche d'expédition (docs/PARCOURS-COMMANDE.md §7.3) : ouverte par l'expéditeur depuis WeChat, sans compte.
// Minimale : n° de commande, nom, adresse, pays, téléphone, colis attendus. Ni e-mail, ni prix, ni liste d'achats.
// Lien secret qui expire 7 jours après l'expédition ; chaque ouverture est enregistrée.
export const metadata: Metadata = { title: "发货单 Shipping sheet", robots: { index: false, follow: false } };
// Lien secret unique : rien à pré-rendre, la page attend la base (et le menu du site lit l'adresse).
export const instant = false;

export default function ShippingSheetPage({ params }: PageProps<"/f/[token]">) {
  return (
    <section className="sec wrap sheet" style={{ paddingTop: 32 }}>
      <Suspense fallback={<p className="muted">…</p>}>
        <Sheet params={params} />
      </Suspense>
    </section>
  );
}

const COUNTRY: Record<string, string> = { FR: "France", BE: "Belgium", US: "United States", CA: "Canada", GB: "United Kingdom" };

async function Sheet({ params }: { params: PageProps<"/f/[token]">["params"] }) {
  const { token } = await params;
  const s = await openSheet(token, (await headers()).get("user-agent")).catch((e) => {
    console.error("[fiche]", e);
    return "erreur" as const;
  });
  if (s === "erreur") return <p>暂时无法打开 · Temporarily unavailable, try again later.</p>;
  if (!s) return <p>链接无效 · Invalid link.</p>;
  if (s.expired) return <p>链接已过期 · This link has expired.</p>;
  const o = s.order;
  const a = o.shipping_address;
  const parcels = o.order_parcels;
  return (
    <div className="sheet-card">
      {o.is_demo && <p className="todo">测试 · TEST — 不要发货 / do not ship</p>}
      <p className="eyebrow">发货单 · Shipping sheet</p>
      <p className="sheet-number">{o.number}</p>
      <p className="muted">请把此编号写在包裹上 · Write this number on the parcel.</p>

      <h2>收件人 · Recipient</h2>
      <address>
        {a.first_name} {a.last_name}
        <br />
        {a.line1}
        {a.line2 && (
          <>
            <br />
            {a.line2}
          </>
        )}
        <br />
        {a.postal_code} {a.city}
        <br />
        <b>{COUNTRY[a.country] ?? a.country}</b>
        {a.phone && (
          <>
            <br />
            电话 Tel. {a.phone}
          </>
        )}
      </address>

      <h2>
        {parcels.length} 个包裹 · {parcels.length} parcel{parcels.length > 1 ? "s" : ""} expected
      </h2>
      <ul>
        {parcels.map((p) => (
          <li key={p.id}>
            {p.suppliers.name} — {p.received_at ? "已收到 received ✓" : "待收 waiting"}
          </li>
        ))}
      </ul>
      <p className="muted">全部收到后合并成一个包裹发出，然后把「订单号 → 快递单号」发给 Fraul。</p>
      <p className="muted">When everything is here, ship ONE parcel, then send “order number → tracking number” to Fraul.</p>
    </div>
  );
}
