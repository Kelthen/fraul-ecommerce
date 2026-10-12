import type { Metadata } from "next";
import { LegalPage, Todo } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" } };

export default function Page() {
  return (
    <LegalPage
      eyebrow="Données personnelles"
      title="Politique de confidentialité"
      sections={[
        { title: "Responsable du traitement", body: <p><Todo>entité et contact</Todo></p> },
        { title: "Données collectées", body: <p>Compte, commandes, adresses de livraison, préférences et consentements. Aucune donnée de carte bancaire n&apos;est conservée par Fraul.</p> },
        { title: "Finalités et bases légales", body: <p><Todo>exécution des commandes, obligations légales, intérêt légitime, consentement</Todo></p> },
        { title: "Destinataires", body: <p>Prestataire de paiement, transporteur, fournisseur pour la préparation des commandes. <Todo>liste exacte et pays de traitement</Todo></p> },
        { title: "Durées de conservation", body: <p><Todo>durées par type de donnée</Todo></p> },
        { title: "Tes droits", body: <p>Accès, rectification, suppression, opposition, portabilité, retrait du consentement. <Todo>adresse de contact pour exercer ces droits</Todo></p> },
      ]}
    />
  );
}
