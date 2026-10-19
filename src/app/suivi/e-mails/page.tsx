import type { Metadata } from "next";
import { OrderEmails } from "@/components/orders/OrderEmails";

export const metadata: Metadata = { title: "E-mails de commande (démo)", robots: { index: false, follow: false } };

export default function OrderEmailsPage() {
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <p className="eyebrow">Démo</p>
      <h1 style={{ fontSize: "clamp(36px, 7vw, 60px)", lineHeight: 1, marginTop: 8 }}>Les e-mails de commande</h1>
      <p className="todo" style={{ marginTop: 12 }}>Aperçu pour l&apos;équipe : ces e-mails ne sont pas encore envoyés (envoi prévu avec Supabase).</p>
      <OrderEmails />
    </section>
  );
}
