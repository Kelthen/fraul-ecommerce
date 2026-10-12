import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Cookies", alternates: { canonical: "/cookies" } };

export default function Page() {
  return (
    <LegalPage
      eyebrow="Traceurs"
      title="Cookies"
      sections={[
        { title: "Ce que le site utilise aujourd'hui", body: <p>Aucun cookie publicitaire ni de mesure d&apos;audience. Le panier est gardé dans le stockage de ton navigateur, sur ton appareil uniquement.</p> },
        { title: "Si cela change", body: <p>Avant d&apos;ajouter un traceur non essentiel, un bandeau te demandera ton accord, que tu pourras retirer à tout moment.</p> },
      ]}
    />
  );
}
