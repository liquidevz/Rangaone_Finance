// services/bundle.service.ts
import { get } from "@/lib/axios";

export interface Bundle {
  _id: string;
  name: string;
  description: string;
  portfolios: Portfolio[];
  discountPercentage: number;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  monthlyemandateprice?: number;
  quarterlyemandateprice?: number;
  yearlyemandateprice?: number;
  createdAt: string;
  updatedAt: string;
  category: string;
}

export interface Portfolio {
  _id: string;
  name: string;
  description?: Array<{
    key: string;
    value: string;
  }>;
  subscriptionFee: Array<{
    type: "monthly" | "quarterly" | "yearly";
    price: number;
  }>;
  minInvestment: number;
  durationMonths?: number;
  holdings?: Array<{
    symbol: string;
    weight: number;
    sector: string;
    status: string;
    price: number;
  }>;
}

export const bundleService = {
  // Get all bundles
  getAll: async (): Promise<Bundle[]> => {
    return await get<Bundle[]>("/api/bundles", {
      headers: {
        accept: "application/json",
      },
    });
  },

  // Get bundle by ID
  getById: async (id: string): Promise<Bundle> => {
    return await get<Bundle>(`/api/bundles/${id}`, {
      headers: {
        accept: "application/json",
      },
    });
  },

  // Check if an item is a bundle
  isBundle: (item: any): boolean => {
    return item && item.portfolio && item.portfolio.category && 
           (item.portfolio.category === "basic" || item.portfolio.category === "premium");
  },

  // Get bundle price for a specific subscription type
  getBundlePrice: (portfolio: any, subscriptionType: "monthly" | "quarterly" | "yearly"): number => {
    if (!portfolio) return 0;
    
    switch (subscriptionType) {
      case "yearly":
        return portfolio.quarterlyPrice || 0; // quarterlyPrice is used for yearly subscriptions
      case "quarterly":
        return portfolio.quarterlyPrice || 0;
      default:
        return portfolio.monthlyPrice || 0;
    }
  },

  // Get eMandate price for a specific subscription type
  getEmandatePrice: (bundle: any, emandateType: "monthly" | "quarterly" | "yearly"): number => {
    if (!bundle) return 0;
    
    switch (emandateType) {
      case "monthly":
        return bundle.monthlyemandateprice || 0;
      case "quarterly":
        return bundle.quarterlyemandateprice || 0;
      case "yearly":
        return bundle.yearlyemandateprice || 0;
      default:
        return 0;
    }
  },
};
