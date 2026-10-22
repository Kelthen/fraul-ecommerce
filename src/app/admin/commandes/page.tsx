import type { Metadata } from "next";
import { Suspense } from "react";
import { hasPendingCode, isAdmin } from "@/lib/server/admin-session";
import { adminChatId, allowedUsers, botTokenLooksValid, missingSettings } from "@/lib/server/env";
import { isGroupChat } from "@/models/relay/access";
import { loadPaidOrders, type OrderRow } from "@/lib/server/relay";
import { PILES, pileOf, type PileId } from "@/models/relay/piles";
import { clearTestOrders, connectBot, newTestOrder, requestCode, resend, signOut, verifyCode } from "./actions";

// Tableau de bord des commandes de Fraul (docs/PARCOURS-COMMANDE.md §3) : 3 piles + expédiées.
// Version de démo : connexion par code Telegram, commande test, branchement du bot.
export const metadata: Metadata = { title: "Commandes", robots: { index: false, follow: false } };

export default function OrdersAdminPage({ searchParams }: PageProps<"/admin/commandes">) {
  return (
    <section className="sec wrap admin" style={{ paddingTop: 40 }}>
      <p className="eyebrow">Fraul · équipe</p>
      <h1 className="h2">Commandes</h1>
      <Suspense fallback={<p className="muted">Chargement…</p>}>
        <Gate searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Gate({ searchParams }: { searchParams: PageProps<"/admin/commandes">["searchParams"] }) {
  const sp = await searchParams;
  const msg = typeof sp.msg === "string" ? sp.msg : null;
  const missing = missingSettings();
  if (missing.length)
    return (
      <p className="todo">
        Réglages manquants dans Vercel : {missing.join(", ")}. Ajoute-les (Settings → Environment Variables), puis redéploie.
      </p>
    );
  if (!botTokenLooksValid())
    return (
      <p className="todo">
        Le code d&apos;accès du bot (TELEGRAM_BOT_TOKEN) n&apos;a pas la bonne forme : il doit ressembler à « 1234567890:AAE… », sans texte autour.
        Corrige-le dans Vercel, puis redéploie.
      </p>
    );
  if (isGroupChat(adminChatId()) && !allowedUsers().length)
    return (
      <p className="todo">
        Le bot écrit dans un groupe, mais personne n&apos;est autorisé à agir : ajoute dans Vercel TELEGRAM_ALLOWED_USERS (les numéros Telegram
        de l&apos;équipe, séparés par des virgules), puis redéploie.
      </p>
    );
  if (!(await isAdmin())) return <Login msg={msg} waiting={await hasPendingCode()} />;
  return <Dashboard msg={msg} />;
}

function Login({ msg, waiting }: { msg: string | null; waiting: boolean }) {
  return (
    <div className="admin-login">
      {msg && <p className="admin-msg">{msg}</p>}
      <p className="muted">Accès réservé. Le code de connexion arrive sur le Telegram de Fraul.</p>
      <form action={requestCode}>
        <button className={`pill ${waiting ? "ghost" : "solid"}`}>{waiting ? "Renvoyer un code" : "Recevoir un code sur Telegram"}</button>
      </form>
      {waiting && (
        <form action={verifyCode} className="admin-code">
          <label htmlFor="code">Code à 8 chiffres</label>
          <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={12} required />
          <button className="pill solid">Entrer</button>
        </form>
      )}
    </div>
  );
}

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto" }).format(new Date(iso));

function toPile(o: OrderRow, now: number) {
  const shipped = o.shipments.find((s) => s.tracking_code && s.shipped_at);
  return pileOf(
    {
      paidAt: Date.parse(o.created_at),
      shippedAt: shipped ? Date.parse(shipped.shipped_at!) : null,
      parcels: o.order_parcels.map((p) => ({
        supplier: p.suppliers.name,
        forwardedAt: p.forwarded_at ? Date.parse(p.forwarded_at) : null,
        receivedAt: p.received_at ? Date.parse(p.received_at) : null,
      })),
    },
    now,
  );
}

/** Lecture des commandes et heure du tri, hors du rendu (le rendu reste pur). */
async function loadDashboard() {
  return { orders: await loadPaidOrders(), now: Date.now() };
}

async function Dashboard({ msg }: { msg: string | null }) {
  const { orders, now } = await loadDashboard();
  const sorted = new Map<PileId, { o: OrderRow; reasons: string[] }[]>(PILES.map((p) => [p.id, []]));
  for (const o of orders) {
    const r = toPile(o, now);
    sorted.get(r.pile)!.push({ o, reasons: r.reasons });
  }
  return (
    <>
      {msg && <p className="admin-msg">{msg}</p>}
      <div className="admin-acts">
        <form action={newTestOrder}>
          <button className="pill solid">Créer une commande test</button>
        </form>
        <form action={connectBot}>
          <button className="pill ghost">Brancher le bot sur ce site</button>
        </form>
        <form action={clearTestOrders}>
          <button className="pill ghost">Effacer les commandes test</button>
        </form>
        <form action={signOut}>
          <button className="pill ghost">Se déconnecter</button>
        </form>
      </div>
      {PILES.map((pile) => {
        const list = sorted.get(pile.id)!;
        return (
          <section key={pile.id} className={`admin-pile pile-${pile.id}`}>
            <h2>
              {pile.label} <span className="muted">({list.length})</span>
            </h2>
            {!list.length && <p className="muted">Rien ici.</p>}
            {list.map(({ o, reasons }) => {
              const code = o.shipments.find((s) => s.tracking_code)?.tracking_code;
              return (
                <article key={o.id} className="admin-order">
                  <header>
                    <b>{o.number}</b>
                    {o.is_demo && <span className="chip">test</span>}
                    <span className="muted">
                      {fmt(o.created_at)} · {o.shipping_address.first_name} · {o.shipping_address.city} ·{" "}
                      {Math.round(o.total / 100)} {o.currency}
                    </span>
                  </header>
                  {reasons.map((r) => (
                    <p key={r} className="todo">
                      {r}
                    </p>
                  ))}
                  <ul>
                    {o.order_parcels.map((p) => (
                      <li key={p.id}>
                        {p.suppliers.name} : {p.received_at ? "reçu chez l'expéditeur" : p.forwarded_at ? "envoyé au fournisseur, colis attendu" : "à envoyer au fournisseur"}
                      </li>
                    ))}
                  </ul>
                  <p className="muted">
                    {code ? (
                      <>
                        Suivi : <code>{code}</code>
                      </>
                    ) : (
                      "En attente du code de suivi"
                    )}
                  </p>
                  <div className="admin-acts">
                    <form action={resend}>
                      <input type="hidden" name="order" value={o.id} />
                      <button className="pill ghost">Renvoyer sur Telegram</button>
                    </form>
                    {o.shipping_sheets && (
                      <a className="pill ghost" href={`/f/${o.shipping_sheets.token}`} target="_blank" rel="noreferrer">
                        Fiche d&apos;expédition
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
