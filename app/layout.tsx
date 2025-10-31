// app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-context";
import { CartProvider } from "@/components/cart/cart-context";
import { FilterProvider } from "@/components/recommendations/filter-state-context";

import AuthGuard from "@/components/auth/auth-guard";
import { Toaster } from "@/components/ui/toaster";



const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Finance - SEBI Registered Research Analyst",
  description: "Your Growth, Our Priority",
  images: [{ url: "../public/imgs/9.png" }],
  icons: {
    icon: '/favicon.ico',
    maskIcon: '/favicon.ico',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  other: {
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
            <CartProvider>
              <FilterProvider>
                <AuthGuard>
                  <div className="min-h-screen bg-gray-50 overflow-x-hidden">
                    <main>
                      {children}
                    </main>
                  </div>

                  <Toaster />
                </AuthGuard>
              </FilterProvider>
            </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}