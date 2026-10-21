"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoOrders } from "@/models/orders/demo";
import { EMAIL_KINDS, lineLabel, orderEmail, type EmailKind } from "@/models/orders/emails";

const NAMES: Record<EmailKind, string> = { paid: "Payée", shipped: "En transit", delivered: "Livrée", unavailable: "Article indisponible" };

/** Aperçu des 4 e-mails de commande, tels que le client les recevra. Démo : aucun n'est envoyé. */
export function OrderEmails() {
  // Dates calculées sur le téléphone (pas au rendu serveur) pour coller au jour du visiteur.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []); // eslint-disable-line react-hooks/set-state-in-effect -- date du visiteur, une fois
  if (now === null) return null;
  const [prep, transit, done] = demoOrders(now);
  const order = { paid: prep, shipped: transit, delivered: done, unavailable: transit };

  return (
    <div className="mails">
      {EMAIL_KINDS.map((k) => {
        const m = orderEmail(k, order[k]);
        return (
          <article className="mail" key={k} aria-label={`E-mail ${NAMES[k]}`}>
            <p className="eyebrow">{NAMES[k]}</p>
            <div className="mail-box">
              <p className="mail-subj"><b>{m.subject}</b> <span>{m.preheader}</span></p>
              <div className="mail-body">
                <p className="mail-brand">FRAUL</p>
                <h2>{m.title}</h2>
                {m.body.map((t) => <p key={t}>{t}</p>)}
                {m.lines.length > 0 && <ul>{m.lines.map((l) => <li key={l.name}>{lineLabel(l)}</li>)}</ul>}
                <Link className="pill solid" href={m.cta.href}>{m.cta.label}</Link>
                {k === "unavailable" && <Link className="link" href="/sur-demande">Fraul Finds</Link>}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
