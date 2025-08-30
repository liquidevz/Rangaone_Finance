"use client";

import { useAuth } from "@/components/auth/auth-context";
import { useCart } from "@/components/cart/cart-context";
import { usePaymentState } from "@/components/payment/payment-state-context";
import { Bundle } from "@/services/bundle.service";
import { useCallback } from "react";

type SubscriptionType = "monthly" | "monthlyEmandate" | "quarterly" | "yearly";

export const useAppState = () => {
  const auth = useAuth();
  const cart = useCart();
  const payment = usePaymentState();

  // Comprehensive purchase flow
  const initiatePurchase = useCallback((bundle: Bundle, planType: SubscriptionType) => {
    // Store the selection
    payment.selectBundleAndPlan(bundle, planType);
    
    // Open modal to show plan details first
    payment.openModal();
  }, [payment]);

  // Check if user can proceed with payment
  const canProceedToPayment = useCallback(() => {
    return auth.isAuthenticated && !auth.isLoading && !!auth.user;
  }, [auth.isAuthenticated, auth.isLoading, auth.user]);

  // Get current selection summary
  const getSelectionSummary = useCallback(() => {
    const { selectedBundle, selectedPlan } = payment.state;
    if (!selectedBundle || !selectedPlan) return null;

    return {
      bundle: selectedBundle,
      plan: selectedPlan,
      price: payment.getPrice(),
      isEmandate: payment.state.isEmandateFlow,
    };
  }, [payment.state, payment.getPrice]);

  // Handle authentication for payment
  const authenticateForPayment = useCallback(async (username: string, password: string) => {
    try {
      await auth.login(username, password, false);
      // After successful login, the payment modal will automatically continue
      return true;
    } catch (error) {
      console.error("Authentication failed:", error);
      throw error;
    }
  }, [auth]);

  // Add to cart with proper state management
  const addToCartWithState = useCallback(async (bundle: Bundle, planType: SubscriptionType) => {
    try {
      const cartPlanType = planType === "monthlyEmandate" ? "monthly" : planType;
      await cart.addBundleToCart(bundle._id, cartPlanType as "monthly" | "quarterly" | "yearly", bundle.category);
      return true;
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error;
    }
  }, [cart]);

  // Clear all state (useful for logout or reset)
  const clearAllState = useCallback(() => {
    payment.resetState();
    // Cart will be cleared by auth context on logout
  }, [payment]);

  // Get comprehensive app state
  const getAppState = useCallback(() => {
    return {
      auth: {
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        user: auth.user,
        profileComplete: auth.profileComplete,
        missingFields: auth.missingFields,
      },
      cart: {
        cart: cart.cart,
        itemCount: cart.cartItemCount,
        loading: cart.loading,
        syncing: cart.syncing,
        error: cart.error,
      },
      payment: {
        selectedBundle: payment.state.selectedBundle,
        selectedPlan: payment.state.selectedPlan,
        isModalOpen: payment.state.isModalOpen,
        modalStep: payment.state.modalStep,
        isEmandateFlow: payment.state.isEmandateFlow,
        error: payment.state.error,
      },
    };
  }, [auth, cart, payment.state]);

  return {
    // State
    auth,
    cart,
    payment,
    
    // Actions
    initiatePurchase,
    canProceedToPayment,
    getSelectionSummary,
    authenticateForPayment,
    addToCartWithState,
    clearAllState,
    getAppState,
    
    // Computed values
    isReady: !auth.isLoading && !cart.loading,
    hasActiveSelection: !!payment.state.selectedBundle && !!payment.state.selectedPlan,
  };
};