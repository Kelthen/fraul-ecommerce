import { cookies } from "next/headers";
import { renderSVG } from "uqr";
import {
  changeEmail,
  requestEmailCode,
  requestTelegramCode,
  startRecovery,
  verifyEmailCode,
  verifyRecovery,
  verifyTelegramCode,
  verifyTotp,
} from "@/app/admin/login-actions";
import { enrollmentKey, readSecondStep, totpRequired, type PendingLogin } from "@/lib/server/admin-totp";
import { TOTP_DIGITS, otpauthUrl, readableKey } from "@/models/admin/totp";

// Connexion à l'admin en deux étapes : un code par e-mail (ou Telegram), puis l'application d'authentification.
export async function AdminLogin({ msg, step }: { msg: string | null; step: string | null }) {
  const pending = totpRequired() ? await readSecondStep() : null;
  const email = (await cookies()).get("tuc_admin_email")?.value;
  return (
    <div className="admin-login">
      {msg && <p className="admin-msg" role="status">{msg}</p>}
      {pending ? <SecondStep pending={pending} recovering={step === "secours"} /> : email ? <FirstCode email={email} telegram={step === "telegram"} /> : <EmailForm />}
    </div>
  );
}

function EmailForm() {
  return (
    <form action={requestEmailCode} className="admin-email">
      <label htmlFor="admin-email">Ton adresse e-mail</label>
      <input id="admin-email" name="email" type="email" autoComplete="email" required autoFocus />
      <button className="pill solid">Recevoir un code</button>
    </form>
  );
}

function CodeForm({ label, action, length }: { label: string; action: (f: FormData) => Promise<void>; length: number }) {
  return (
    <form action={action} className="admin-code">
      <label htmlFor="admin-code">{label}</label>
      <input id="admin-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={length + 2} required autoFocus />
      <button className="pill solid">Entrer</button>
    </form>
  );
}

const Restart = () => (
  <form action={changeEmail}>
    <button className="link">Changer d&apos;adresse</button>
  </form>
);

function FirstCode({ email, telegram }: { email: string; telegram: boolean }) {
  if (telegram)
    return (
      <>
        <CodeForm label="Code à 8 chiffres envoyé sur Telegram" action={verifyTelegramCode} length={8} />
        <Restart />
      </>
    );
  return (
    <>
      <CodeForm label={`Code à 6 chiffres envoyé à ${email}`} action={verifyEmailCode} length={6} />
      <form action={requestEmailCode}>
        <input type="hidden" name="email" value={email} />
        <button className="link">Renvoyer un code</button>
      </form>
      <Restart />
      <form action={requestTelegramCode}>
        <p className="muted">
          Pas d&apos;e-mail ? <button className="link">Code par Telegram</button>
        </p>
      </form>
    </>
  );
}

async function SecondStep({ pending, recovering }: { pending: PendingLogin; recovering: boolean }) {
  if (recovering) {
    const other = pending.factor === "email" ? "sur Telegram" : "par e-mail";
    return (
      <>
        <CodeForm label={`Code de secours reçu ${other}`} action={verifyRecovery} length={8} />
        <Restart />
      </>
    );
  }
  const key = await enrollmentKey(pending.email);
  if (!key)
    return (
      <>
        <CodeForm label="Code affiché dans ton application d'authentification" action={verifyTotp} length={TOTP_DIGITS} />
        <form action={startRecovery}>
          <button className="link">Téléphone perdu ?</button>
        </form>
        <Restart />
      </>
    );
  const url = otpauthUrl(pending.email, key);
  return (
    <>
      <p>
        Dernière étape, une seule fois : installe une application d&apos;authentification (Google Authenticator, Microsoft
        Authenticator…) et ajoute ton accès.
      </p>
      <div className="admin-qr" role="img" aria-label="QR code à scanner avec l'application" dangerouslySetInnerHTML={{ __html: renderSVG(url, { border: 2 }) }} />
      <p>
        <a className="link" href={url}>Ouvrir dans l&apos;application</a> (sur ce téléphone)
      </p>
      <p className="muted">
        Ou tape cette clé : <code className="admin-key">{readableKey(key)}</code>
      </p>
      <CodeForm label="Tape ensuite le code à 6 chiffres affiché dans l'application" action={verifyTotp} length={TOTP_DIGITS} />
      <Restart />
    </>
  );
}
