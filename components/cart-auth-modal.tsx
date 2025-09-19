"use client";

import { useCart } from "@/components/cart/cart-context";
import { AuthPromptModal } from "@/components/auth-prompt-modal";
import { useRouter } from "next/navigation";

export const CartAuthModal = () => {
  const { showAuthPrompt, setShowAuthPrompt, cart, calculateTotal } = useCart();
  const router = useRouter();

  const cartItemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  const cartTotal = calculateTotal("monthly");

  const handleSuccessfulAuth = () => {
    // The auth context will handle the redirect to /cart
    setShowAuthPrompt(false);
  };

  const handleClose = () => {
    setShowAuthPrompt(false);
  };

  return (
    <AuthPromptModal
      isOpen={showAuthPrompt}
      onClose={handleClose}
      cartItemCount={cartItemCount}
      cartTotal={cartTotal}
      onSuccessfulAuth={handleSuccessfulAuth}
    />
  );
};