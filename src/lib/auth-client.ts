// Supabase Auth depuis le navigateur : chaque visiteur garde ainsi ses propres limites d'essais et son captcha.
// De simples requêtes fetch, sans dépendance en plus, comme pour Stripe et Telegram. La clé publique n'est pas un secret.
import { authErrorMessage, type AuthProblem } from "@/models/account/auth";

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://rqrdccsxyyufqlenmpct.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Sans clé publique (développement local), les écrans restent en démo. */
export const authLive = KEY.length > 0;
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export type Session = { access_token: string; refresh_token: string; expires_at: number; email: string; since: number };

export class AuthError extends Error {
  constructor(public problem: AuthProblem) {
    super(authErrorMessage(problem));
  }
}

type RawSession = { access_token: string; refresh_token: string; expires_in: number; user: { email?: string; created_at?: string } };

async function call<T>(path: string, body: unknown, init: { method?: string; token?: string } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${URL_BASE}/auth/v1/${path}`, {
      method: init.method ?? "POST",
      headers: { apikey: KEY, "Content-Type": "application/json", ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError("network");
  }
  const json = (await res.json().catch(() => ({}))) as { error_code?: string; code?: string | number; error?: string };
  if (!res.ok) throw new AuthError(problemOf(res.status, String(json.error_code ?? json.error ?? json.code ?? "")));
  return json as T;
}

function problemOf(status: number, code: string): AuthProblem {
  if (status === 429 || code.includes("rate_limit")) return "rate-limit";
  if (code === "invalid_credentials" || code === "invalid_grant") return "bad-credentials";
  if (code === "email_not_confirmed") return "not-confirmed";
  if (code === "otp_expired" || code === "otp_disabled") return "bad-code";
  if (code === "weak_password" || code === "same_password") return "weak-password";
  if (code.includes("captcha")) return "captcha";
  if (code === "email_address_not_authorized" || code === "over_email_send_rate_limit") return "email-unavailable";
  return "unknown";
}

const toSession = (s: RawSession): Session => ({
  access_token: s.access_token,
  refresh_token: s.refresh_token,
  expires_at: Date.now() + s.expires_in * 1000,
  email: s.user.email ?? "",
  since: s.user.created_at ? Date.parse(s.user.created_at) : Date.now(),
});

const security = (captcha?: string) => (captcha ? { gotrue_meta_security: { captcha_token: captcha } } : {});

export const signUp = (email: string, password: string, captcha?: string) => call("signup", { email, password, ...security(captcha) });
export const signInWithPassword = async (email: string, password: string, captcha?: string) =>
  toSession(await call<RawSession>("token?grant_type=password", { email, password, ...security(captcha) }));
export const sendRecoveryCode = (email: string, captcha?: string) => call("recover", { email, ...security(captcha) });
export const resendSignupCode = (email: string, captcha?: string) => call("resend", { type: "signup", email, ...security(captcha) });
export const verifyCode = async (type: "signup" | "recovery", email: string, token: string) => toSession(await call<RawSession>("verify", { type, email, token }));
export const changePassword = (accessToken: string, password: string) => call("user", { password }, { method: "PUT", token: accessToken });
export const refreshSession = async (refreshToken: string) => toSession(await call<RawSession>("token?grant_type=refresh_token", { refresh_token: refreshToken }));
export const signOutEverywhere = (accessToken: string) => call("logout", {}, { token: accessToken }).catch(() => {});
