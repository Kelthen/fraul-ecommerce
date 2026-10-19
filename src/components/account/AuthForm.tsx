"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { CODE_LENGTH, cleanCode, failTry, isCode, isEmail, locked, noTries, normalizeEmail, passwordProblem, type Tries } from "@/models/account/auth";
import { useAccount } from "../AccountProvider";

type Mode = "connexion" | "inscription" | "oubli";
type Step = "form" | "code" | "nouveau";

/** Code de démonstration affiché à l'écran : aucun e-mail n'est envoyé tant que Supabase n'est pas branché. */
const DEMO_CODE = "246810";

const TITLES: Record<Mode, string> = { connexion: "Content de te revoir", inscription: "Crée ton compte", oubli: "Mot de passe oublié" };

/**
 * Connexion, création de compte et mot de passe oublié (démo).
 * Création et mot de passe oublié passent par un code à 6 chiffres envoyé par e-mail ; 5 erreurs = une minute d'attente.
 */
export function AuthForm() {
  const id = useId();
  const router = useRouter();
  const { signIn } = useAccount();
  const [mode, setMode] = useState<Mode>("connexion");
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [tries, setTries] = useState<Tries>(noTries);

  const go = (m: Mode) => { setMode(m); setStep("form"); setErr({}); };
  const done = () => { signIn(normalizeEmail(email)); router.push("/compte"); };
  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="af-field">
      <label htmlFor={`${id}-${name}`}>{label}</label>
      <input id={`${id}-${name}`} name={name} aria-invalid={err[name] ? true : undefined} aria-describedby={err[name] ? `${id}-${name}-e` : undefined} {...props} />
      {err[name] && <span className="af-err" id={`${id}-${name}-e`}>{err[name]}</span>}
    </div>
  );

  function submitForm(f: FormData) {
    const e = String(f.get("email") ?? ""), pw = String(f.get("password") ?? "");
    const errors: Record<string, string> = {};
    if (!isEmail(e)) errors.email = "Une adresse e-mail valide.";
    if (mode === "inscription") { const p = passwordProblem(pw, e); if (p) errors.password = p; }
    if (mode === "connexion" && !pw) errors.password = "Ton mot de passe.";
    setErr(errors);
    if (Object.keys(errors).length) return;
    setEmail(e);
    if (mode === "connexion") done(); // démo : pas de vérification réelle du mot de passe
    else setStep("code");
  }

  function submitCode(f: FormData) {
    if (locked(tries)) { setErr({ code: "Trop d'essais. Réessaie dans une minute." }); return; }
    const c = String(f.get("code") ?? "");
    if (!isCode(c) || cleanCode(c) !== DEMO_CODE) {
      const t = failTry(tries);
      setTries(t);
      setErr({ code: locked(t) ? "Trop d'essais. Réessaie dans une minute." : "Ce code ne correspond pas." });
      return;
    }
    setErr({});
    if (mode === "oubli") setStep("nouveau");
    else done();
  }

  function submitNew(f: FormData) {
    const p = passwordProblem(String(f.get("password") ?? ""), email);
    if (p) { setErr({ password: p }); return; }
    done();
  }

  return (
    <div className="auth">
      <p className="eyebrow">Mon compte</p>
      <h1>{TITLES[mode]}</h1>

      {step === "form" && (
        <>
          {mode !== "oubli" && (
            <div className="auth-tabs" role="group" aria-label="Choisir">
              <button type="button" aria-pressed={mode === "connexion"} onClick={() => go("connexion")}>Se connecter</button>
              <button type="button" aria-pressed={mode === "inscription"} onClick={() => go("inscription")}>Créer un compte</button>
            </div>
          )}
          <form className="auth-form" noValidate onSubmit={(e) => { e.preventDefault(); submitForm(new FormData(e.currentTarget)); }}>
            {field("email", "E-mail", { type: "email", autoComplete: "email", defaultValue: email, maxLength: 254 })}
            {mode !== "oubli" &&
              field("password", "Mot de passe", {
                type: "password",
                autoComplete: mode === "inscription" ? "new-password" : "current-password",
                maxLength: 128,
                placeholder: mode === "inscription" ? "10 caractères ou plus" : undefined,
              })}
            <button className="pill solid" type="submit">
              {mode === "connexion" ? "Se connecter" : mode === "inscription" ? "Recevoir mon code" : "Recevoir un code"}
            </button>
            {mode === "connexion" && <button className="auth-link" type="button" onClick={() => go("oubli")}>Mot de passe oublié ?</button>}
            {mode === "oubli" && <button className="auth-link" type="button" onClick={() => go("connexion")}>← Retour à la connexion</button>}
          </form>
        </>
      )}

      {step === "code" && (
        <form className="auth-form" noValidate onSubmit={(e) => { e.preventDefault(); submitCode(new FormData(e.currentTarget)); }}>
          <p>On t&apos;a envoyé un code à {CODE_LENGTH} chiffres à <b>{normalizeEmail(email)}</b>.</p>
          <p className="todo">Démo : aucun e-mail n&apos;est envoyé. Le code est {DEMO_CODE}.</p>
          {field("code", "Code reçu", { inputMode: "numeric", autoComplete: "one-time-code", maxLength: 9, placeholder: "••••••" })}
          <button className="pill solid" type="submit">Valider</button>
          <button className="auth-link" type="button" onClick={() => go(mode)}>← Changer d&apos;e-mail</button>
        </form>
      )}

      {step === "nouveau" && (
        <form className="auth-form" noValidate onSubmit={(e) => { e.preventDefault(); submitNew(new FormData(e.currentTarget)); }}>
          {field("password", "Nouveau mot de passe", { type: "password", autoComplete: "new-password", maxLength: 128, placeholder: "10 caractères ou plus" })}
          <button className="pill solid" type="submit">Enregistrer</button>
        </form>
      )}

      <p className="af-small">
        En créant un compte, tu acceptes les <Link href="/cgv">CGV</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>. Pas d&apos;e-mails
        promotionnels sans ton accord.
      </p>
    </div>
  );
}
