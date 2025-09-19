// lib/cart-redirect-state.ts
"use client";

const CART_REDIRECT_KEY = "pendingCartRedirect";

export const cartRedirectState = {
  // Set redirect to cart after login
  setPendingCartRedirect: () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(CART_REDIRECT_KEY, "true");
    }
  },

  // Check if should redirect to cart
  hasPendingCartRedirect: (): boolean => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(CART_REDIRECT_KEY) === "true";
    }
    return false;
  },

  // Clear redirect state
  clearPendingCartRedirect: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CART_REDIRECT_KEY);
    }
  }
};