import type { Metadata } from "next";
import { EnviesView } from "@/components/EnviesView";

export const metadata: Metadata = {
  title: "Mes envies",
  description: "Les pièces que tu gardes de côté.",
  robots: { index: false },
};

export default function EnviesPage() {
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <EnviesView />
    </section>
  );
}
