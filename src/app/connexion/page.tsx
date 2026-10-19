import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = { title: "Connexion", robots: { index: false }, alternates: { canonical: "/compte" } };

// Même écran que /compte : on y voit la connexion tant qu'on n'est pas connecté.
export default function LoginPage() {
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <AccountView />
    </section>
  );
}
