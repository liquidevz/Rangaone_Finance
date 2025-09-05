"use client";

interface ProfileCompletionState {
  hasCompletedFirstPayment: boolean;
  shouldShowProfileModal: boolean;
  timestamp: number;
}

const PROFILE_STATE_KEY = "profileCompletionState";
const PROFILE_STATE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const profileCompletionState = {
  markFirstPaymentComplete: () => {
    try {
      const state: ProfileCompletionState = {
        hasCompletedFirstPayment: true,
        shouldShowProfileModal: true,
        timestamp: Date.now()
      };
      localStorage.setItem(PROFILE_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to mark first payment complete:", error);
    }
  },

  shouldShowModal: (isAuthenticated: boolean, profileComplete: boolean): boolean => {
    if (!isAuthenticated || profileComplete) return false;
    
    try {
      const saved = localStorage.getItem(PROFILE_STATE_KEY);
      if (!saved) return false;

      const state: ProfileCompletionState = JSON.parse(saved);
      
      // Check if state has expired
      if (Date.now() - state.timestamp > PROFILE_STATE_EXPIRY) {
        profileCompletionState.clear();
        return false;
      }

      return state.hasCompletedFirstPayment && state.shouldShowProfileModal;
    } catch (error) {
      console.error("Failed to check profile completion state:", error);
      return false;
    }
  },

  markModalShown: () => {
    try {
      const saved = localStorage.getItem(PROFILE_STATE_KEY);
      if (saved) {
        const state: ProfileCompletionState = JSON.parse(saved);
        state.shouldShowProfileModal = false;
        localStorage.setItem(PROFILE_STATE_KEY, JSON.stringify(state));
      }
    } catch (error) {
      console.error("Failed to mark modal as shown:", error);
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(PROFILE_STATE_KEY);
    } catch (error) {
      console.error("Failed to clear profile completion state:", error);
    }
  }
};