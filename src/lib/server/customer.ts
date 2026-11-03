import "server-only";
import { SUPABASE_URL } from "./env";

// Qui appelle ? On ne croit jamais le navigateur : le jeton est revérifié auprès de Supabase Auth.

export type VerifiedUser = { id: string; email: string };

export async function verifiedUser(token: unknown): Promise<VerifiedUser | null> {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (typeof token !== "string" || token.length > 4096 || !key) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) return null;
  const u = (await res.json()) as { id?: string; email?: string; email_confirmed_at?: string | null };
  // Les commandes sont retrouvées par e-mail : une adresse non confirmée ne donne accès à rien.
  if (!u.id || !u.email || !u.email_confirmed_at) return null;
  return { id: u.id, email: u.email.trim().toLowerCase() };
}
