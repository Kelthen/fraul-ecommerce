import "server-only";
import { need } from "./env";

// Stripe par son API REST, côté serveur uniquement. Pas de dépendance en plus : de simples requêtes fetch,
// comme pour Telegram et Supabase. La clé (sk_ / rk_) ne quitte jamais le serveur.

const API = "https://api.stripe.com/v1";

export const stripeKey = () => need("STRIPE_SECRET_KEY");
/** Mode test (clé sk_test_ / rk_test_) : aucun vrai argent. */
export const stripeTestMode = () => /^(sk|rk)_test_/.test(stripeKey());

async function call<T>(path: string, init: { method?: "GET" | "POST"; form?: URLSearchParams; idempotencyKey?: string } = {}): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    method: init.method ?? "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      ...(init.form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
    },
    body: init.form?.toString(),
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe (${res.status}) : ${json.error?.message ?? "erreur"}`);
  return json;
}

type ShippingDetails = {
  name: string | null;
  address: { line1: string | null; line2: string | null; city: string | null; postal_code: string | null; country: string | null; state: string | null };
} | null;

export type CheckoutSession = {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  amount_total: number | null;
  currency: string | null;
  payment_intent: string | null;
  metadata: Record<string, string>;
  customer_details: { email: string | null; name: string | null; phone: string | null } | null;
  /** Selon la version de l'API, l'adresse est ici… */
  collected_information?: { shipping_details: ShippingDetails } | null;
  /** … ou là (anciennes versions). */
  shipping_details?: ShippingDetails;
};

export const createCheckoutSession = (form: URLSearchParams, idempotencyKey: string) =>
  call<CheckoutSession>("checkout/sessions", { method: "POST", form, idempotencyKey });

/** Identifiant de la session de paiement d'un paiement Stripe, s'il y en a une. */
export const sessionOfPaymentIntent = async (paymentIntent: string): Promise<string | null> =>
  (await call<{ data: { id: string }[] }>(`checkout/sessions?payment_intent=${encodeURIComponent(paymentIntent)}&limit=1`)).data[0]?.id ?? null;
export const getCheckoutSession = (id: string) => call<CheckoutSession>(`checkout/sessions/${encodeURIComponent(id)}`);

/** Adresse de livraison de la session, quelle que soit la version de l'API. */
export const shippingOf = (s: CheckoutSession): ShippingDetails => s.collected_information?.shipping_details ?? s.shipping_details ?? null;
