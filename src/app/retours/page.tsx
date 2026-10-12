import type { Metadata } from "next";
import { LegalPage, Todo } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Retours et remboursements", alternates: { canonical: "/retours" } };

export default function Page() {
  return (
    <LegalPage
      eyebrow="Aide"
      title="Retours et remboursements"
      sections={[
        { title: "Délai de rétractation", body: <p>Selon la loi applicable à ton adresse de livraison, tu peux disposer d&apos;un délai légal (par exemple 14 jours dans l&apos;Union européenne). <Todo>délai retenu, conditions</Todo></p> },
        { title: "Comment retourner un article", body: <p><Todo>étapes, adresse de retour, qui paie le retour</Todo></p> },
        { title: "Remboursement", body: <p><Todo>délai et moyen de remboursement</Todo></p> },
      ]}
    />
  );
}
