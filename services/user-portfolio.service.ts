// services/user-portfolio.service.ts
import axios from "axios";
import axiosApi from "@/lib/axios";

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
  monthlyContribution?: Number,
  rebalancing?: string;
  index?: string;
  compareWith?: string;
}

export interface UserPortfolioHolding {
  stockSymbol: string;
  stockName?: string;
  quantity: number;
  averagePrice: number;
  investmentValue?: number;
  currentPrice?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  sector?: string;
  exchange?: string;
}

export interface SavePortfolioRequest {
  portfolioId?: string;
  portfolioName?: string;
  holdings: UserPortfolioHolding[];
  showToAdmin?: boolean;
}

export interface SavedPortfolioResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface VideoItem {
  link: string;
  createdAt: string;
  _id?: string;
}

export interface VideoBundle {
  id: string;
  name: string;
  type: string;
  category: string;
  videos: VideoItem[];
}

export interface VideosForYouResponse {
  bundles: VideoBundle[];
  portfolios: VideoBundle[];
}

// Create a separate axios instance for public API calls (without auth headers)
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.rangaone.finance",
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
          baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.rangaone.finance",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });
        return response.data;
      }

      // If not authenticated, use public API endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.rangaone.finance";

      const response = await axiosApi.get<UserPortfolio[]>("/api/user/portfolios");
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch portfolios:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      console.error("API URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
      }
      throw error; // Re-throw to handle in component
    }
  },

  // Get user's subscribed portfolios only
  getSubscribedPortfolios: async (): Promise<UserPortfolio[]> => {
    try {
      const authToken = typeof window !== "undefined"
        ? localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
        : null;

      if (!authToken) {
        return [];
      }

      const response = await axios.get<UserPortfolio[]>("/api/user/portfolios", {
        baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Filter portfolios that the user has subscribed to
      // Portfolios without "message" field are subscribed portfolios
      const subscribedPortfolios = response.data.filter((portfolio: any) => {
        // If portfolio has full details (no "message" field), it means user has access
        const isSubscribed = !portfolio.message || portfolio.message !== "Subscribe to view complete details";
        return isSubscribed;
      });

      return subscribedPortfolios;
    } catch (error: any) {
      console.error("Failed to fetch subscribed portfolios:", error);
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
  getDescriptionByKey: (descriptions: PortfolioDescription[] | undefined, key: string): string => {
    if (!descriptions || !Array.isArray(descriptions)) {
      return "";
    }
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
  },

  /**
   * Save or update the user's portfolio holdings
   */
  savePortfolio: async (data: SavePortfolioRequest): Promise<SavedPortfolioResponse> => {
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
        : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axiosApi.post<SavedPortfolioResponse>(
        "/api/user-portfolio",
        data,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      console.error("Failed to save portfolio:", error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        error: error.message || "Failed to save portfolio",
      };
    }
  },

  /**
   * Get the saved portfolio for a user
   */
  getSavedPortfolio: async (portfolioNameOrId: string, isId: boolean = false): Promise<any> => {
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
        : null;

      const headers: Record<string, string> = {
        accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const param = isId ? `portfolioId=${portfolioNameOrId}` : `portfolioName=${encodeURIComponent(portfolioNameOrId)}`;
      const response = await axiosApi.get(
        `/api/user-portfolio?${param}`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      // It's normal to get a 404 if the user hasn't saved this portfolio yet
      if (error.response?.status === 404) {
        return null;
      }
      console.error("Failed to fetch saved portfolio:", error);
      throw error;
    }
  },

  /**
   * Delete a saved portfolio
   */
  deletePortfolio: async (portfolioId: string): Promise<any> => {
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
        : null;

      const headers: Record<string, string> = {
        accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axiosApi.delete(
        `/api/user-portfolio/${portfolioId}`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      console.error("Failed to delete portfolio:", error);
      throw error;
    }
  },

  /**
   * Get Videos For You
   */
  getVideosForYou: async (): Promise<VideosForYouResponse> => {
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
        : null;

      const headers: Record<string, string> = {
        accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Use the direct URL if needed, or rely on the baseURL if it's set correctly
      // The user provided full URL: https://api.rangaone.finance/api/user/videos-for-you
      // We'll use the relative path assuming axiosApi/axios is configured with base URL
      // If not, we fall back to absolute URL

      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.rangaone.finance";

      const response = await axios.get<VideosForYouResponse>(
        `${baseURL}/api/user/videos-for-you`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch videos for you:", error);
      // Return empty structure on error to avoid crashing UI
      return { bundles: [], portfolios: [] };
    }
  }
};