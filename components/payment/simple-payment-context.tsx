"use client";

import React, { createContext, useContext, useState } from "react";
import { Bundle } from "@/services/bundle.service";

type SubscriptionType = "monthly" | "monthlyEmandate" | "quarterly" | "yearly";

interface PaymentState {
  selectedBundle: Bundle | null;
  selectedPlan: SubscriptionType | null;
  isModalOpen: boolean;
  modalStep: "plan" | "auth" | "processing" | "success" | "error";
}

interface PaymentContextType {
  state: PaymentState;
  selectBundle: (bundle: Bundle, plan: SubscriptionType) => void;
  openModal: () => void;
  closeModal: () => void;
  setStep: (step: "plan" | "auth" | "processing" | "success" | "error") => void;
}

const PaymentContext = createContext<PaymentContextType | null>(null);

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return context;
}

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PaymentState>({
    selectedBundle: null,
    selectedPlan: null,
    isModalOpen: false,
    modalStep: "plan",
  });

  const selectBundle = (bundle: Bundle, plan: SubscriptionType) => {
    setState(prev => ({ ...prev, selectedBundle: bundle, selectedPlan: plan }));
  };

  const openModal = () => {
    setState(prev => ({ ...prev, isModalOpen: true, modalStep: "plan" }));
  };

  const closeModal = () => {
    setState(prev => ({ ...prev, isModalOpen: false }));
  };

  const setStep = (step: "plan" | "auth" | "processing" | "success" | "error") => {
    setState(prev => ({ ...prev, modalStep: step }));
  };

  return (
    <PaymentContext.Provider value={{ state, selectBundle, openModal, closeModal, setStep }}>
      {children}
    </PaymentContext.Provider>
  );
}