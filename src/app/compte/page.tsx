import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

export default function AccountPage() {
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <AccountView />
    </section>
  );
}
