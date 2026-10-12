import type { Metadata } from "next";
import { LegalPage, Todo } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Livraison et douane", alternates: { canonical: "/livraison" } };

export default function Page() {
  return (
    <LegalPage
      eyebrow="Aide"
      title="Livraison et douane"
      sections={[
        { title: "Délais", body: <p>Le délai estimé pour ton adresse est affiché avant le paiement. <Todo>délais par zone</Todo></p> },
        { title: "Suivi", body: <p>Dès l&apos;expédition, tu reçois un code de suivi pour voir ta commande avancer sur la page <a href="/suivi">Suivi</a>.</p> },
        { title: "Droits de douane et taxes", body: <p><Todo>inclus dans le prix (droits payés) ou payés à la livraison</Todo></p> },
      ]}
    />
  );
}
