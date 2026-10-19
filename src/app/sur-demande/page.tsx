import type { Metadata } from "next";
import { ConciergeForm } from "@/components/concierge/ConciergeForm";

export const metadata: Metadata = {
  title: "Fraul Finds : une pièce sur demande",
  description: "Une pièce introuvable sur le site ? Décris-la : on la cherche pour toi chez nos fournisseurs et on te répond par e-mail.",
  alternates: { canonical: "/sur-demande" },
};

// Page statique : la marque éventuelle (?marque=…) est lue par le formulaire, dans le navigateur.
export default function ConciergePage() {
  return (
    <section className="sec wrap concierge-page">
      <div className="concierge-intro">
        <p className="eyebrow">Fraul Finds</p>
        <h1>Sur demande</h1>
        <p className="muted">
          Une pièce introuvable dans les boutiques ? Décris-la : on te la trouve chez nos fournisseurs, et on te répond par e-mail.
        </p>
        <ol className="concierge-steps">
          <li><b>Tu décris</b> l&apos;article (une photo ou un lien aide beaucoup).</li>
          <li><b>On cherche</b> chez nos fournisseurs.</li>
          <li><b>On te répond</b> par e-mail avec ton prix, droits et taxes inclus.</li>
        </ol>
      </div>
      <ConciergeForm brandFromUrl />
    </section>
  );
}
