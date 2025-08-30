// app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-context";
import { CartProvider } from "@/components/cart/cart-context";

import AuthGuard from "@/components/auth/auth-guard";
import ProfileCompletionGuard from "@/components/auth/profile-completion-guard";
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
              <AuthGuard>
                <ProfileCompletionGuard>
                  <div className="min-h-screen bg-gray-50 overflow-x-hidden">
                    <main>
                      {children}
                    </main>

                  </div>
                  <Toaster />
                </ProfileCompletionGuard>
              </AuthGuard>
            </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}