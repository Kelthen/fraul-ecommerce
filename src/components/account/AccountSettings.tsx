"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authLive, changePassword } from "@/lib/auth-client";
import { passwordProblem } from "@/models/account/auth";
import { useAccount } from "../AccountProvider";

/** Réglages du compte : e-mail, nouveautés et drops, mot de passe ; « Se déconnecter » reste discret tout en bas. */
export function AccountSettings() {
  const { account, setMarketing, signOut, token } = useAccount();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!account) return null;

  async function save() {
    const problem = passwordProblem(password, account!.email);
    if (problem) { setNote({ ok: false, text: problem }); return; }
    setBusy(true);
    setNote(null);
    try {
      if (authLive) {
        const t = await token();
        if (!t) throw new Error("session");
        await changePassword(t, password);
      }
      setPassword("");
      setNote({ ok: true, text: "Mot de passe changé." });
    } catch {
      setNote({ ok: false, text: "Le mot de passe n'a pas pu être changé. Réessaie." });
    }
    setBusy(false);
  }

  return (
    <>
      <section className="acc-card" aria-labelledby="acc-mail">
        <h2 id="acc-mail">E-mail</h2>
        <p>{account.email}</p>
        <p className="muted">Commandes, livraisons et réponses de Finds : toujours par e-mail.</p>
        <label className="acc-check">
          <input type="checkbox" checked={account.marketing} onChange={(e) => setMarketing(e.target.checked)} />
          <span>Recevoir les nouveautés et les drops</span>
        </label>
      </section>

      <form className="acc-card auth-form" onSubmit={(e) => { e.preventDefault(); void save(); }} aria-labelledby="acc-pw">
        <h2 id="acc-pw">Mot de passe</h2>
        <div className="af-field">
          <label htmlFor="acc-new-pw">Nouveau mot de passe</label>
          <input id="acc-new-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" maxLength={128} placeholder="10 caractères ou plus" required />
        </div>
        {note && <p className={note.ok ? "muted" : "af-err"} role="status">{note.text}</p>}
        <button className="pill ghost" disabled={busy}>Changer le mot de passe</button>
      </form>

      <button className="auth-link acc-signout" type="button" onClick={() => { signOut(); router.push("/"); }}>Se déconnecter</button>
    </>
  );
}
