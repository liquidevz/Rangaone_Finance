// app/cart/page.tsx
"use client";

import DashboardLayout from "@/components/dashboard-layout";
import CartPage from "@/components/cart";

export default function Cart() {
  return (
    <DashboardLayout>
      <CartPage />
    </DashboardLayout>
  );
}