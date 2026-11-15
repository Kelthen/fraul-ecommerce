"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useId, useState } from "react";
import { AuthError, TURNSTILE_SITE_KEY, authLive, changePassword, resendSignupCode, sendRecoveryCode, signInWithPassword, signUp, verifyCode, type Session } from "@/lib/auth-client";
import { CODE_LENGTH, authErrorMessage, cleanCode, failTry, isCode, isEmail, locked, noTries, normalizeEmail, passwordProblem, type Tries } from "@/models/account/auth";
import { useAccount } from "../AccountProvider";
import { Captcha } from "./Captcha";

type Mode = "connexion" | "inscription" | "oubli";
type Step = "form" | "code" | "nouveau";

/** Code de démonstration, affiché seulement sans Supabase (développement local). */
const DEMO_CODE = "246810";

const TITLES: Record<Mode, string> = { connexion: "Content de te revoir", inscription: "Crée ton compte", oubli: "Mot de passe oublié" };

/**
 * Connexion, création de compte et mot de passe oublié.
 * Création et mot de passe oublié passent par un code à 6 chiffres envoyé par e-mail ; 5 erreurs = une minute d'attente.
 */
export function AuthForm() {
  const id = useId();
  const router = useRouter();
  const { signIn, adopt } = useAccount();
  const [mode, setMode] = useState<Mode>("connexion");
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [tries, setTries] = useState<Tries>(noTries);
  const [busy, setBusy] = useState(false);
  const [news, setNews] = useState(false); // nouveautés et drops : jamais cochée d'avance (consentement libre, RGPD)
  const [captcha, setCaptcha] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const onCaptcha = useCallback((t: string) => setCaptcha(t), []);

  const go = (m: Mode) => { setMode(m); setStep("form"); setErr({}); setCaptchaKey((k) => k + 1); };
  const done = () => { signIn(normalizeEmail(email)); router.push("/compte"); };
  const finish = async (s: Session, acceptedTerms: boolean, wantsNews = false) => { await adopt(s, acceptedTerms, wantsNews); router.push("/compte"); };

  /** Appel à Supabase : une seule requête à la fois, erreur affichée sur le formulaire. Un jeton de captcha ne sert qu'une fois. */
  async function run(field: string, work: () => Promise<void>) {
    setBusy(true);
    setErr({});
    try {
      await work();
    } catch (e) {
      setErr({ [field]: e instanceof AuthError ? e.message : authErrorMessage("unknown") });
    }
    setBusy(false);
    setCaptcha("");
    setCaptchaKey((k) => k + 1);
  }
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
    if (!authLive) {
      if (mode === "connexion") done();
      else setStep("code");
      return;
    }
    if (TURNSTILE_SITE_KEY && !captcha) { setErr({ form: "Vérification en cours, réessaie dans une seconde." }); return; }
    const mail = normalizeEmail(e);
    void run("form", async () => {
      if (mode === "connexion") {
        try {
          await finish(await signInWithPassword(mail, pw, captcha), false);
        } catch (x) {
          if (!(x instanceof AuthError) || x.problem !== "not-confirmed") throw x;
          await resendSignupCode(mail, captcha); // compte créé mais jamais confirmé : on repart du code
          setMode("inscription");
          setStep("code");
        }
        return;
      }
      if (mode === "inscription") await signUp(mail, pw, captcha);
      else await sendRecoveryCode(mail, captcha);
      setStep("code");
    });
  }

  function submitCode(f: FormData) {
    if (locked(tries)) { setErr({ code: "Trop d'essais. Réessaie dans une minute." }); return; }
    const c = String(f.get("code") ?? "");
    const wrong = () => {
      const t = failTry(tries);
      setTries(t);
      setErr({ code: locked(t) ? "Trop d'essais. Réessaie dans une minute." : "Ce code ne correspond pas." });
    };
    if (!isCode(c) || (!authLive && cleanCode(c) !== DEMO_CODE)) { wrong(); return; }
    setErr({});
    if (!authLive) {
      if (mode === "oubli") setStep("nouveau");
      else done();
      return;
    }
    void run("code", async () => {
      try {
        const s = await verifyCode(mode === "oubli" ? "recovery" : "signup", normalizeEmail(email), cleanCode(c));
        if (mode === "oubli") { setSession(s); setStep("nouveau"); }
        else await finish(s, true, news);
      } catch (x) {
        if (x instanceof AuthError && x.problem === "bad-code") { wrong(); return; }
        throw x;
      }
    });
  }

  function submitNew(f: FormData) {
    const p = passwordProblem(String(f.get("password") ?? ""), email);
    if (p) { setErr({ password: p }); return; }
    if (!authLive || !session) { done(); return; }
    void run("password", async () => {
      await changePassword(session.access_token, String(f.get("password")));
      await finish(session, false);
    });
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
            {mode === "inscription" && (
              <label className="acc-check">
                <input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} />
                <span>Recevoir les nouveautés et les drops</span>
              </label>
            )}
            <Captcha key={captchaKey} onToken={onCaptcha} />
            {err.form && <span className="af-err" role="alert">{err.form}</span>}
            <button className="pill solid" type="submit" disabled={busy}>
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
          {!authLive && <p className="todo">Démo : aucun e-mail n&apos;est envoyé. Le code est {DEMO_CODE}.</p>}
          {field("code", "Code reçu", { inputMode: "numeric", autoComplete: "one-time-code", maxLength: 9, placeholder: "••••••" })}
          <button className="pill solid" type="submit" disabled={busy}>Valider</button>
          <button className="auth-link" type="button" onClick={() => go(mode)}>← Changer d&apos;e-mail</button>
        </form>
      )}

      {step === "nouveau" && (
        <form className="auth-form" noValidate onSubmit={(e) => { e.preventDefault(); submitNew(new FormData(e.currentTarget)); }}>
          {field("password", "Nouveau mot de passe", { type: "password", autoComplete: "new-password", maxLength: 128, placeholder: "10 caractères ou plus" })}
          <button className="pill solid" type="submit" disabled={busy}>Enregistrer</button>
        </form>
      )}

      <p className="af-small">
        En créant un compte, tu acceptes les <Link href="/cgv">CGV</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>. Pas d&apos;e-mails
        promotionnels sans ton accord.
      </p>
    </div>
  );
}
