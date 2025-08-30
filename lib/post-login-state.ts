"use client";

interface PostLoginState {
  action: "purchase" | "cart" | "checkout";
  bundleId?: string;
  pricingType?: string;
  redirectPath?: string;
  timestamp: number;
}

const STATE_KEY = "postLoginState";
const STATE_EXPIRY = 30 * 60 * 1000; // 30 minutes

export const postLoginState = {
  save: (state: Omit<PostLoginState, "timestamp">) => {
    try {
      const stateWithTimestamp: PostLoginState = {
        ...state,
        timestamp: Date.now()
      };
      sessionStorage.setItem(STATE_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error("Failed to save post-login state:", error);
    }
  },

  get: (): PostLoginState | null => {
    try {
      const saved = sessionStorage.getItem(STATE_KEY);
      if (!saved) return null;

      const state: PostLoginState = JSON.parse(saved);
      
      // Check if state has expired
      if (Date.now() - state.timestamp > STATE_EXPIRY) {
        postLoginState.clear();
        return null;
      }

      return state;
    } catch (error) {
      console.error("Failed to get post-login state:", error);
      return null;
    }
  },

  clear: () => {
    try {
      sessionStorage.removeItem(STATE_KEY);
    } catch (error) {
      console.error("Failed to clear post-login state:", error);
    }
  },

  execute: (onPurchase?: (bundleId: string, pricingType: string) => void) => {
    const state = postLoginState.get();
    if (!state) return false;

    switch (state.action) {
      case "purchase":
        if (state.bundleId && state.pricingType && onPurchase) {
          onPurchase(state.bundleId, state.pricingType);
        }
        break;
      case "checkout":
        if (state.redirectPath) {
          window.location.href = state.redirectPath;
        }
        break;
    }

    postLoginState.clear();
    return true;
  }
};