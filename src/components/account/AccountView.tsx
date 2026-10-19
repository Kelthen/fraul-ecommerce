"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "../AccountProvider";
import { AuthForm } from "./AuthForm";

/** Page « Mon compte » : connecté → infos, commandes, préférences ; sinon → connexion. */
export function AccountView() {
  const { account, signOut, setMarketing } = useAccount();
  const router = useRouter();
  if (!account) return <AuthForm />;
  const since = new Date(account.since).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="auth account">
      <p className="eyebrow">Mon compte</p>
      <h1>Bonjour</h1>
      <p className="muted">{account.email} · membre depuis le {since}</p>
      <p className="todo">Démo : compte gardé sur ce téléphone seulement, rien n&apos;est envoyé.</p>

      <section className="acc-card" aria-labelledby="acc-orders">
        <h2 id="acc-orders">Mes commandes</h2>
        <p className="muted">Aucune commande pour l&apos;instant.</p>
        <Link className="link" href="/suivi">Suivre une commande avec un code</Link>
      </section>

      <section className="acc-card" aria-labelledby="acc-mails">
        <h2 id="acc-mails">E-mails</h2>
        <p className="muted">Commandes, livraisons et réponses de Fraul Finds : toujours par e-mail.</p>
        <label className="acc-check">
          <input type="checkbox" checked={account.marketing} onChange={(e) => setMarketing(e.target.checked)} />
          <span>Recevoir les nouveautés et les drops (modifiable à tout moment)</span>
        </label>
      </section>

      <div className="acc-acts">
        <button className="pill ghost" type="button" onClick={() => { signOut(); router.push("/"); }}>Se déconnecter</button>
      </div>
    </div>
  );
}
