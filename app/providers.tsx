"use client"

import { AuthProvider } from "@/components/auth/auth-context"
import { CartProvider } from "@/components/cart/cart-context"
import { FilterProvider } from "@/components/recommendations/filter-state-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <FilterProvider>
          {children}
        </FilterProvider>
      </CartProvider>
    </AuthProvider>
  )
}
