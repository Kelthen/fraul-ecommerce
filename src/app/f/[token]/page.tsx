import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { openSheet, type OrderRow } from "@/lib/server/relay";
import { UNDO_MINUTES } from "@/models/relay/messages";
import { markReceived, undoReceived } from "./actions";

// Fiche d'expédition (docs/PARCOURS-COMMANDE.md §7.3) : ouverte par l'expéditeur depuis WeChat, sans compte.
// Minimale : n° de commande, nom, adresse, pays, téléphone, colis attendus (contenu, sans prix).
// L'expéditeur y coche chaque colis reçu (« 已收到 Reçu ») : l'équipe est prévenue sur Telegram.
// Lien secret qui expire 7 jours après l'expédition ; chaque ouverture est enregistrée.
export const metadata: Metadata = { title: "发货单 Shipping sheet", robots: { index: false, follow: false } };
// Lien secret unique : rien à pré-rendre, la page attend la base (et le menu du site lit l'adresse).
export const instant = false;

export default function ShippingSheetPage({ params, searchParams }: PageProps<"/f/[token]">) {
  return (
    <section className="sec wrap sheet" style={{ paddingTop: 32 }}>
      <Suspense fallback={<p className="muted">…</p>}>
        <Sheet params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

const COUNTRY: Record<string, string> = { FR: "France", BE: "Belgium", US: "United States", CA: "Canada", GB: "United Kingdom" };

const RESULTS: Record<string, string> = {
  ok: "✓ 已记录 Saved — Fraul is notified.",
  undone: "↩︎ 已撤销 Undone.",
  already: "这个包裹已经记录了 This parcel was already marked as received.",
  late: `超过 ${UNDO_MINUTES} 分钟，请联系 Fraul · More than ${UNDO_MINUTES} min: please contact Fraul.`,
  expired: "链接已过期 · This link has expired.",
  invalid: "链接无效 · Invalid link.",
  error: "暂时无法保存，请重试 · Could not save, try again.",
};

type Props = { params: PageProps<"/f/[token]">["params"]; searchParams: PageProps<"/f/[token]">["searchParams"] };

async function Sheet({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  const result = typeof sp.r === "string" ? RESULTS[sp.r] : undefined;
  const confirm = typeof sp.confirm === "string" ? sp.confirm : null;
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
  const waiting = parcels.filter((p) => !p.received_at).length;
  const shipped = o.shipments.some((x) => x.tracking_code);
  return (
    <div className="sheet-card">
      {o.is_demo && <p className="todo">测试 · TEST — 不要发货 / do not ship</p>}
      {result && <p className="admin-msg">{result}</p>}
      <p className="eyebrow">发货单 · Shipping sheet</p>
      <p className="sheet-number">{o.number}</p>
      <p className="muted">每个包裹上都写着这个编号 · Every parcel for this order carries this number.</p>

      <h2>
        {parcels.length} 个包裹 · {parcels.length} parcel{parcels.length > 1 ? "s" : ""}
      </h2>
      <ul className="sheet-parcels">
        {parcels.map((p, i) => (
          <li key={p.id} className={p.received_at ? "is-received" : undefined}>
            <p className="sheet-parcel-head">
              <b>
                {i + 1}. {p.suppliers.name}
              </b>
              <span>{p.received_at ? "✓ 已收到 received" : "待收 waiting"}</span>
            </p>
            <ParcelContent order={o} supplierId={p.supplier_id} />
            {!shipped && !p.received_at && (
              <form action={markReceived}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="parcel" value={p.id} />
                <button className="pill solid sheet-btn">📥 已收到 · Received</button>
              </form>
            )}
            {!shipped && s.undoable.includes(p.id) &&
              (confirm === p.id ? (
                <form action={undoReceived} className="sheet-confirm">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="parcel" value={p.id} />
                  <span>撤销？Undo &quot;received&quot;?</span>
                  <button className="pill solid">是 Yes</button>
                  <Link className="pill ghost" href={`/f/${token}`}>
                    否 No
                  </Link>
                </form>
              ) : (
                <Link className="sheet-undo" href={`/f/${token}?confirm=${p.id}`}>
                  ↩︎ 撤销 Undo ({UNDO_MINUTES} min)
                </Link>
              ))}
          </li>
        ))}
      </ul>

      {shipped ? (
        <p className="muted">已发货 · Shipped.</p>
      ) : waiting ? (
        <p className="muted">
          还差 {waiting} 个包裹 · Still waiting for {waiting} parcel{waiting > 1 ? "s" : ""}. 每收到一个就点「已收到」· Tap « Received » for each parcel when it arrives.
        </p>
      ) : (
        <p className="admin-msg">
          全部收到 ✓ 合并成一个包裹发出，然后把「订单号 → 快递单号」发给 Fraul。
          <br />
          All here ✓ Ship ONE parcel, then send “order number → tracking number” to Fraul.
        </p>
      )}

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
    </div>
  );
}

/** Contenu attendu dans ce colis (pour le reconnaître à l'ouverture) ; jamais de prix. */
function ParcelContent({ order, supplierId }: { order: OrderRow; supplierId: string }) {
  const items = order.order_items.filter((i) => i.supplier_id === supplierId);
  return (
    <ul className="sheet-items">
      {items.map((i, k) => (
        <li key={k}>
          {i.qty} 件 pc · {i.title} · {i.color_name} · 尺码 size {i.size}
          {i.supplier_offers?.supplier_ref ? ` · 编号 ref ${i.supplier_offers.supplier_ref}` : ""}
        </li>
      ))}
    </ul>
  );
}
