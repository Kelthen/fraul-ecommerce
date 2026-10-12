import type { Metadata } from "next";
import { TrackView } from "@/components/TrackView";

export const metadata: Metadata = {
  title: "Suivi de commande",
  description: "Entre ton code de suivi et vois ta commande avancer, étape par étape.",
  alternates: { canonical: "/suivi" },
};

export default function TrackPage() {
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <TrackView />
    </section>
  );
}
