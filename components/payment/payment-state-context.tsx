"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { Bundle } from "@/services/bundle.service";

type SubscriptionType = "monthly" | "monthlyEmandate" | "quarterly" | "yearly";

interface PaymentState {
  selectedBundle: Bundle | null;
  selectedPlan: SubscriptionType | null;
  isEmandateFlow: boolean;
  modalStep: "plan" | "auth" | "digio" | "processing" | "success" | "error";
  isModalOpen: boolean;
  processingMessage: string;
  error: string | null;
  telegramLinks: Array<{ invite_link: string }> | null;
}

type PaymentAction =
  | { type: "SELECT_BUNDLE"; payload: { bundle: Bundle; plan: SubscriptionType } }
  | { type: "OPEN_MODAL" }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_STEP"; payload: "plan" | "auth" | "digio" | "processing" | "success" | "error" }
  | { type: "SET_PROCESSING_MESSAGE"; payload: string }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_TELEGRAM_LINKS"; payload: Array<{ invite_link: string }> | null }
  | { type: "RESET_STATE" };

const initialState: PaymentState = {
  selectedBundle: null,
  selectedPlan: null,
  isEmandateFlow: false,
  modalStep: "plan",
  isModalOpen: false,
  processingMessage: "",
  error: null,
  telegramLinks: null,
};

function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case "SELECT_BUNDLE":
      return {
        ...state,
        selectedBundle: action.payload.bundle,
        selectedPlan: action.payload.plan,
        isEmandateFlow: action.payload.plan === "monthlyEmandate" || action.payload.plan === "yearly",
      };
    case "OPEN_MODAL":
      return {
        ...state,
        isModalOpen: true,
        modalStep: "plan",
        error: null,
      };
    case "CLOSE_MODAL":
      return {
        ...state,
        isModalOpen: false,
        modalStep: "plan",
        error: null,
        processingMessage: "",
        telegramLinks: null,
      };
    case "SET_STEP":
      return {
        ...state,
        modalStep: action.payload,
      };
    case "SET_PROCESSING_MESSAGE":
      return {
        ...state,
        processingMessage: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    case "SET_TELEGRAM_LINKS":
      return {
        ...state,
        telegramLinks: action.payload,
      };
    case "RESET_STATE":
      return initialState;
    default:
      return state;
  }
}

interface PaymentStateContextType {
  state: PaymentState;
  selectBundleAndPlan: (bundle: Bundle, plan: SubscriptionType) => void;
  openModal: () => void;
  closeModal: () => void;
  setStep: (step: "plan" | "auth" | "digio" | "processing" | "success" | "error") => void;
  setProcessingMessage: (message: string) => void;
  setError: (error: string | null) => void;
  setTelegramLinks: (links: Array<{ invite_link: string }> | null) => void;
  resetState: () => void;
  getPrice: () => number;
}

const PaymentStateContext = createContext<PaymentStateContextType | undefined>(undefined);

export const usePaymentState = () => {
  const context = useContext(PaymentStateContext);
  if (!context) {
    throw new Error("usePaymentState must be used within a PaymentStateProvider");
  }
  return context;
};

interface PaymentStateProviderProps {
  children: React.ReactNode;
}

export function PaymentStateProvider({ children }: PaymentStateProviderProps) {
  const [state, dispatch] = useReducer(paymentReducer, initialState);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem("paymentState");
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.selectedBundle && parsed.selectedPlan) {
          dispatch({
            type: "SELECT_BUNDLE",
            payload: {
              bundle: parsed.selectedBundle,
              plan: parsed.selectedPlan,
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to restore payment state:", error);
    }
  }, []);

  // Save state to sessionStorage when it changes
  useEffect(() => {
    if (state.selectedBundle && state.selectedPlan) {
      try {
        sessionStorage.setItem("paymentState", JSON.stringify({
          selectedBundle: state.selectedBundle,
          selectedPlan: state.selectedPlan,
        }));
      } catch (error) {
        console.error("Failed to save payment state:", error);
      }
    }
  }, [state.selectedBundle, state.selectedPlan]);

  const selectBundleAndPlan = (bundle: Bundle, plan: SubscriptionType) => {
    dispatch({ type: "SELECT_BUNDLE", payload: { bundle, plan } });
  };

  const openModal = () => {
    dispatch({ type: "OPEN_MODAL" });
  };

  const closeModal = () => {
    dispatch({ type: "CLOSE_MODAL" });
  };

  const setStep = (step: "plan" | "auth" | "digio" | "processing" | "success" | "error") => {
    dispatch({ type: "SET_STEP", payload: step });
  };

  const setProcessingMessage = (message: string) => {
    dispatch({ type: "SET_PROCESSING_MESSAGE", payload: message });
  };

  const setError = (error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  };

  const setTelegramLinks = (links: Array<{ invite_link: string }> | null) => {
    dispatch({ type: "SET_TELEGRAM_LINKS", payload: links });
  };

  const resetState = () => {
    try {
      sessionStorage.removeItem("paymentState");
    } catch (error) {
      console.error("Failed to clear payment state:", error);
    }
    dispatch({ type: "RESET_STATE" });
  };

  const getPrice = (): number => {
    if (!state.selectedBundle || !state.selectedPlan) return 0;
    
    const bundle = state.selectedBundle;
    
    switch (state.selectedPlan) {
      case "monthlyEmandate":
        return (bundle as any).monthlyemandateprice || bundle.monthlyPrice || 0;
      case "yearly":
        return state.isEmandateFlow 
          ? ((bundle as any).yearlyemandateprice || bundle.yearlyPrice || 0)
          : (bundle.yearlyPrice || 0);
      case "quarterly":
        return state.isEmandateFlow
          ? ((bundle as any).quarterlyemandateprice || bundle.quarterlyPrice || 0)
          : (bundle.quarterlyPrice || 0);
      case "monthly":
      default:
        return bundle.monthlyPrice || 0;
    }
  };

  const value: PaymentStateContextType = {
    state,
    selectBundleAndPlan,
    openModal,
    closeModal,
    setStep,
    setProcessingMessage,
    setError,
    setTelegramLinks,
    resetState,
    getPrice,
  };

  return (
    <PaymentStateContext.Provider value={value}>
      {children}
    </PaymentStateContext.Provider>
  );
}