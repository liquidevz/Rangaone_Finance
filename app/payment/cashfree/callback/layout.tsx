import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Processing | RangaOne Finance",
  description: "Processing your payment...",
};

export default function CashfreeCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
