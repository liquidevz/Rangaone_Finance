"use client";

interface PaymentFlowState {
  bundleId: string;
  pricingType: string;
  currentStep: "plan" | "consent" | "auth" | "digio" | "processing" | "success" | "error";
  timestamp: number;
  isAuthenticated: boolean;
}

const FLOW_STATE_KEY = "paymentFlowState";
const FLOW_STATE_EXPIRY = 60 * 60 * 1000; // 1 hour

export const paymentFlowState = {
  save: (state: Omit<PaymentFlowState, "timestamp">) => {
    try {
      const stateWithTimestamp: PaymentFlowState = {
        ...state,
        timestamp: Date.now()
      };
      sessionStorage.setItem(FLOW_STATE_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error("Failed to save payment flow state:", error);
    }
  },

  get: (): PaymentFlowState | null => {
    try {
      const saved = sessionStorage.getItem(FLOW_STATE_KEY);
      if (!saved) return null;

      const state: PaymentFlowState = JSON.parse(saved);
      
      // Check if state has expired
      if (Date.now() - state.timestamp > FLOW_STATE_EXPIRY) {
        paymentFlowState.clear();
        return null;
      }

      return state;
    } catch (error) {
      console.error("Failed to get payment flow state:", error);
      return null;
    }
  },

  update: (updates: Partial<Omit<PaymentFlowState, "timestamp">>) => {
    const current = paymentFlowState.get();
    if (current) {
      paymentFlowState.save({
        ...current,
        ...updates
      });
    }
  },

  clear: () => {
    try {
      sessionStorage.removeItem(FLOW_STATE_KEY);
    } catch (error) {
      console.error("Failed to clear payment flow state:", error);
    }
  },

  shouldContinueFlow: (bundleId: string, isAuthenticated: boolean): string | null => {
    const state = paymentFlowState.get();
    if (!state || state.bundleId !== bundleId) return null;

    // If user was not authenticated before but is now, skip consent and go to digio
    if (!state.isAuthenticated && isAuthenticated && state.currentStep === "auth") {
      return "digio";
    }

    // If user is authenticated and was in the middle of a flow, continue from where they left off
    if (isAuthenticated && ["consent", "digio"].includes(state.currentStep)) {
      return state.currentStep;
    }

    return null;
  }
};