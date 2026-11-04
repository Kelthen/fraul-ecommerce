import Link from "next/link";
import { cookies } from "next/headers";
import { changeEmail, requestEmailCode, verifyEmailCode } from "@/app/admin/login-actions";

// Connexion à l'admin : l'adresse, puis le code reçu par e-mail. Le code Telegram reste en secours.
export async function AdminLogin({ msg }: { msg: string | null }) {
  const email = (await cookies()).get("tuc_admin_email")?.value;
  return (
    <div className="admin-login">
      {msg && <p className="admin-msg" role="status">{msg}</p>}
      {email ? (
        <>
          <form action={verifyEmailCode} className="admin-code">
            <label htmlFor="admin-code">Code à 6 chiffres envoyé à {email}</label>
            <input id="admin-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} required autoFocus />
            <button className="pill solid">Entrer</button>
          </form>
          <form action={requestEmailCode}>
            <input type="hidden" name="email" value={email} />
            <button className="link">Renvoyer un code</button>
          </form>
          <form action={changeEmail}>
            <button className="link">Changer d&apos;adresse</button>
          </form>
        </>
      ) : (
        <form action={requestEmailCode} className="admin-email">
          <label htmlFor="admin-email">Ton adresse e-mail</label>
          <input id="admin-email" name="email" type="email" autoComplete="email" required autoFocus />
          <button className="pill solid">Recevoir un code</button>
        </form>
      )}
      <p className="muted">
        Pas d&apos;e-mail ? <Link className="link" href="/admin/commandes">Code par Telegram</Link>
      </p>
    </div>
  );
}
