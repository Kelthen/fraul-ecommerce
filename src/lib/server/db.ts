import "server-only";
import { SUPABASE_URL, serviceKey } from "./env";

// Accès à la base Supabase par son API REST (PostgREST), avec la clé service, côté serveur uniquement.
// Pas de dépendance en plus : de simples requêtes fetch. La clé service contourne la RLS :
// ce module n'est importé que par du code serveur qui a déjà vérifié qui appelle.

type Row = Record<string, unknown>;

async function call<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const key = serviceKey();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
  });
  if (!res.ok) throw new DbError(res.status, await res.text());
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export class DbError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Base de données (${status}) : ${body.slice(0, 300)}`);
  }
  /** Violation d'unicité (ex. code de suivi déjà utilisé). */
  get isUnique() {
    return this.body.includes('"23505"');
  }
}

const enc = encodeURIComponent;

export const db = {
  /** `select("orders", "select=id,number&number=eq.FRL-…")` */
  select: <T = Row>(table: string, query: string) => call<T[]>(`${table}?${query}`),

  async one<T = Row>(table: string, query: string): Promise<T | null> {
    const rows = await call<T[]>(`${table}?${query}&limit=1`);
    return rows[0] ?? null;
  },

  insert: <T = Row>(table: string, rows: Row | Row[], onConflict?: string) =>
    call<T[]>(`${table}${onConflict ? `?on_conflict=${enc(onConflict)}` : ""}`, {
      method: "POST",
      body: JSON.stringify(rows),
      prefer: `return=representation${onConflict ? ",resolution=merge-duplicates" : ""}`,
    }),

  update: <T = Row>(table: string, filter: string, patch: Row) =>
    call<T[]>(`${table}?${filter}`, { method: "PATCH", body: JSON.stringify(patch), prefer: "return=representation" }),

  remove: (table: string, filter: string) => call<null>(`${table}?${filter}`, { method: "DELETE" }),
};

export const eq = (v: string | number) => `eq.${enc(String(v))}`;
