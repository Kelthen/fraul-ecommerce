import type { Metadata } from "next";
import { LegalPage, Todo } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Conditions générales de vente", alternates: { canonical: "/cgv" } };

export default function Page() {
  return (
    <LegalPage
      eyebrow="Conditions"
      title="Conditions générales de vente"
      sections={[
        { title: "Objet", body: <p><Todo>champ d&apos;application des conditions</Todo></p> },
        { title: "Commande", body: <p><Todo>étapes de la commande, confirmation, archivage</Todo></p> },
        {
          title: "Prix",
          body: (
            <p>
              Les prix peuvent être personnalisés selon le client. Lorsqu&apos;un prix est personnalisé sur la base d&apos;une décision automatisée, le
              client en est informé avant l&apos;achat. <Todo>règles de prix, taxes incluses ou non, devise</Todo>
            </p>
          ),
        },
        { title: "Paiement", body: <p>Le paiement est traité par un prestataire sécurisé ; Fraul ne conserve aucune donnée de carte. <Todo>prestataire, moment du débit</Todo></p> },
        { title: "Livraison et douane", body: <p>Voir la page <a href="/livraison">Livraison et douane</a>. <Todo>qui paie les droits de douane</Todo></p> },
        { title: "Droit de rétractation", body: <p>Voir la page <a href="/retours">Retours et remboursements</a>.</p> },
        { title: "Garanties et litiges", body: <p><Todo>garanties légales, médiation, droit applicable</Todo></p> },
      ]}
    />
  );
}
