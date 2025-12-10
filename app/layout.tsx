// app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-context";
import { CartProvider } from "@/components/cart/cart-context";
import { FilterProvider } from "@/components/recommendations/filter-state-context";
import { PrefetchRoutes } from "@/components/prefetch-routes";

import AuthGuard from "@/components/auth/auth-guard";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "Finance - SEBI Registered Research Analyst",
  description: "Your Growth, Our Priority",
  images: [{ url: "../public/imgs/9.png" }],
  icons: {
    icon: '/favicon.ico',
    maskIcon: '/favicon.ico',
  },
  other: {
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const preloadResources = [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'dns-prefetch', href: 'https://www.youtube.com' },
];

// GLOBAL: runs once before any child component
console.log = () => {};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {preloadResources.map((resource, i) => (
          <link key={i} {...resource} />
        ))}
      </head>
      <body className="font-sans">
        <AuthProvider>
            <CartProvider>
              <FilterProvider>
                <PrefetchRoutes />
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