"use client"

import { AuthProvider } from "@/components/auth/auth-context"
import { CartProvider } from "@/components/cart/cart-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  )
}
