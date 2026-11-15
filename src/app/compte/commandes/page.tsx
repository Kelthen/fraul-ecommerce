import type { Metadata } from "next";
import { AccountGate } from "@/components/account/AccountGate";
import { MyOrders } from "@/components/orders/MyOrders";

export const metadata: Metadata = { title: "Mes commandes", robots: { index: false } };

export default function MyOrdersPage() {
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <AccountGate title="Mes commandes">
        <MyOrders />
      </AccountGate>
    </section>
  );
}
