"use client"

import { AuthProvider } from "@/components/auth/auth-context"
import { CartProvider } from "@/components/cart/cart-context"
import { FilterProvider } from "@/components/recommendations/filter-state-context"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <FilterProvider>
          {children}
          <Toaster />
        </FilterProvider>
      </CartProvider>
    </AuthProvider>
  )
}
