// services/user-portfolio.service.ts
import axios from "axios";

export interface SubscriptionFee {
  type: "monthly" | "quarterly" | "yearly";
  price: number;
}

export interface PortfolioDescription {
  key: string;
  value: string;
}

export interface YouTubeLink {
  link: string;
  createdAt: string;
}

export interface DownloadLink {
  linkType: string;
  linkUrl: string;
  linkDiscription: string;
  createdAt: string;
}

export interface UserPortfolio {
  _id: string;
  name: string;
  description: PortfolioDescription[];
  subscriptionFee: SubscriptionFee[];
  minInvestment: number;
  durationMonths: number;
  createdAt: string;
  holdingsValue: number;
  id: string;
  // Optional fields that may be added by backend later
  CAGRSinceInception?: string;
  oneYearGains?: string;
  monthlyGains?: string;
  timeHorizon?: string;
  rebalancing?: string;
  index?: string;
  compareWith?: string;
}

// Create a separate axios instance for public API calls (without auth headers)
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

export const userPortfolioService = {
  // Fetch all portfolios (works for both authenticated and non-authenticated users)
  getAll: async (): Promise<UserPortfolio[]> => {
    try {
      const authToken = typeof window !== "undefined" 
        ? localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
        : null;

      // If authenticated, use auth token
      if (authToken) {
        const response = await axios.get<UserPortfolio[]>("/api/user/portfolios", {
          baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });
        return response.data;
      }
      
      // If not authenticated, use public API endpoint
      const response = await publicApi.get<UserPortfolio[]>("/api/user/portfolios");
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch portfolios:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
      }
      return [];
    }
  },

  // Fetch portfolio by ID (requires authentication)
  getById: async (id: string): Promise<UserPortfolio | null> => {
    try {
      const authToken = typeof window !== "undefined" 
        ? localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
        : null;

      if (!authToken) {
        return null;
      }

      const response = await axios.get<UserPortfolio>(`/api/user/portfolios/${id}`, {
        baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch portfolio:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
      }
      return null;
    }
  },

  // Helper function to get description by key
  getDescriptionByKey: (descriptions: PortfolioDescription[], key: string): string => {
    const desc = descriptions.find(d => d.key === key);
    return desc?.value || "";
  },

  // Helper function to get price by subscription type
  getPriceByType: (subscriptionFee: SubscriptionFee[], type: "monthly" | "quarterly" | "yearly"): number => {
    const fee = subscriptionFee.find(f => f.type === type);
    return fee?.price || 0;
  },

  // Helper to get YouTube links
  getYouTubeLinks: (youTubeLinks: YouTubeLink[]): string[] => {
    return youTubeLinks.map(link => link.link).filter(link => link && link.trim() !== "");
  },

  // Helper to get performance metrics with fallbacks
  getPerformanceMetrics: (portfolio: UserPortfolio) => {
    const formatPercentage = (value: string | undefined): string => {
      if (!value) return "N/A";
      // Remove % if it exists and add it back for consistency
      const cleanValue = value.replace('%', '');
      return cleanValue === "N/A" ? "N/A" : cleanValue;
    };

    return {
      cagr: formatPercentage(portfolio.CAGRSinceInception),
      oneYearGains: formatPercentage(portfolio.oneYearGains),
      monthlyGains: formatPercentage(portfolio.monthlyGains),
    };
  },

  // Helper to get portfolio details with fallbacks for simplified schema
  getPortfolioDetails: (portfolio: UserPortfolio) => {
    return {
      timeHorizon: portfolio.timeHorizon || `${portfolio.durationMonths} months`,
      rebalancing: portfolio.rebalancing || "Quarterly",
      benchmark: portfolio.index || portfolio.compareWith || "Market",
      durationMonths: portfolio.durationMonths,
      holdingsValue: portfolio.holdingsValue || 0,
    };
  }
};