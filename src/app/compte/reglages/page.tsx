import type { Metadata } from "next";
import { AccountGate } from "@/components/account/AccountGate";
import { AccountSettings } from "@/components/account/AccountSettings";

export const metadata: Metadata = { title: "Réglages du compte", robots: { index: false } };

export default function AccountSettingsPage() {
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <AccountGate title="Réglages">
        <AccountSettings />
      </AccountGate>
    </section>
  );
}
