import type { Metadata } from "next";
import { LegalPage, Todo } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Mentions légales", alternates: { canonical: "/mentions-legales" } };

export default function Page() {
  return (
    <LegalPage
      eyebrow="Informations"
      title="Mentions légales"
      sections={[
        { title: "Éditeur du site", body: <p><Todo>raison sociale, forme juridique, adresse du siège, numéro d&apos;immatriculation, contact</Todo></p> },
        { title: "Directeur de la publication", body: <p><Todo>nom</Todo></p> },
        { title: "Hébergement", body: <p><Todo>hébergeur du site et adresse</Todo></p> },
        { title: "Marques", body: <p>Les noms de marques cités appartiennent à leurs propriétaires respectifs. Fraul n&apos;utilise pas leurs logos.</p> },
      ]}
    />
  );
}
