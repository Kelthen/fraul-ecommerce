"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { teamCheckCodeAction, teamSendCodeAction, teamStateAction, type TeamState } from "@/app/compte/team-actions";
import { useAccount } from "../AccountProvider";

/** Case « Admin » de la page compte, pour l'équipe seulement : après le code reçu par e-mail. */
export function TeamAccess() {
  const { token } = useAccount();
  const [state, setState] = useState<TeamState>("none");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void token().then((t) => (t ? teamStateAction(t) : "none")).then((s) => { if (live) setState(s); }).catch(() => null);
    return () => { live = false; };
  }, [token]);

  if (state === "none") return null;
  if (state === "admin")
    return (
      <li>
        <Link className="acc-tile acc-team" href="/admin">
          <b>Admin</b>
          <span>Articles, boutiques, commandes</span>
        </Link>
      </li>
    );

  async function send() {
    setBusy(true);
    const ok = await teamSendCodeAction(await token()).catch(() => false);
    setSent(ok);
    setMsg(ok ? "Code envoyé par e-mail (valable 10 min)." : "Envoi impossible. Réessaie.");
    setBusy(false);
  }
  async function check(f: FormData) {
    setBusy(true);
    const ok = await teamCheckCodeAction(await token(), String(f.get("code") ?? "")).catch(() => false);
    if (ok) setState("admin");
    else setMsg("Code incorrect ou expiré.");
    setBusy(false);
  }
  return (
    <li className="acc-wide">
      <div className="acc-tile acc-team">
        <b>Accès équipe</b>
        {!sent ? (
          <button type="button" className="admin-chip" onClick={send} disabled={busy}>Recevoir mon code</button>
        ) : (
          <form action={check} className="acc-code">
            <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6 chiffres" aria-label="Code reçu par e-mail" required />
            <button className="admin-chip" disabled={busy}>Entrer</button>
          </form>
        )}
        {msg && <span>{msg}</span>}
      </div>
    </li>
  );
}
