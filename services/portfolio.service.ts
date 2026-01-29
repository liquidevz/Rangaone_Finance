import axiosApi from "@/lib/axios";
import { Portfolio } from "@/lib/types";
import { authService } from "./auth.service";
import { Tip } from "./tip.service";

// Portfolio query parameters for filtering
export interface PortfolioQueryParams {
  startDate?: string; // ISO date string (e.g., "2024-01-01")
  endDate?: string;   // ISO date string (e.g., "2024-12-31")
  category?: "basic" | "premium";
}

export const portfolioService = {
  /**
   * Fetch all portfolios using /api/user/portfolios endpoint
   * Works for both authenticated (full details) and unauthenticated users (basic details)
   * 
   * @param params - Optional filtering parameters
   * @returns Array of portfolios with access control applied
   */
  getAll: async (params?: PortfolioQueryParams): Promise<Portfolio[]> => {
    try {
      const token = authService.getAccessToken();
      
      // Build query string from parameters
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.category) queryParams.append('category', params.category);
      
      const queryString = queryParams.toString();
      const url = `/api/user/portfolios${queryString ? `?${queryString}` : ''}`;

      const headers: Record<string, string> = {
        accept: "application/json",
      };
      
      // Add auth header if token is available
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axiosApi.get<Portfolio[]>(url, { headers });
      
      
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch portfolios:", error);
      
      if (error.response?.status === 401) {
      } else if (error.response?.status === 400) {
      } else if (error.response?.status === 500) {
      }
      
      return [];
    }
  },

  /**
   * Fetch single portfolio details by ID using /api/user/portfolios/{id} endpoint
   * Returns full details if user has access, basic info with message otherwise
   * 
   * @param portfolioId - The portfolio ID to fetch
   * @returns Portfolio data or null if not found
   */
  getById: async (portfolioId: string): Promise<Portfolio | null> => {
    try {
      const token = authService.getAccessToken();
      
      const headers: Record<string, string> = {
        accept: "application/json",
      };
      
      // Add auth header if token is available
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axiosApi.get<Portfolio>(`/api/user/portfolios/${portfolioId}`, { 
        headers 
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch portfolio ${portfolioId}:`, error);
      
      if (error.response?.status === 404) {
      } else if (error.response?.status === 401) {
      } else if (error.response?.status === 500) {
      }
      
      return null;
    }
  },

  /**
   * Check if user has access to a portfolio
   * @param portfolio - Portfolio object to check
   * @returns true if user has access (no message field), false otherwise
   */
  hasAccess: (portfolio: Portfolio): boolean => {
    return !portfolio.message;
  },

  /**
   * Get only portfolios that user has access to (subscribed portfolios)
   * @param params - Optional filtering parameters
   * @returns Array of accessible portfolios
   */
  getAccessiblePortfolios: async (params?: PortfolioQueryParams): Promise<Portfolio[]> => {
    const portfolios = await portfolioService.getAll(params);
    return portfolios.filter(portfolio => portfolioService.hasAccess(portfolio));
  },

  /**
   * Get only portfolios that require subscription (portfolios with message field)
   * @param params - Optional filtering parameters
   * @returns Array of restricted portfolios
   */
  getRestrictedPortfolios: async (params?: PortfolioQueryParams): Promise<Portfolio[]> => {
    const portfolios = await portfolioService.getAll(params);
    return portfolios.filter(portfolio => !portfolioService.hasAccess(portfolio));
  },

  /**
   * Get portfolios by category (basic or premium)
   * @param category - Portfolio category to filter by
   * @param params - Additional filtering parameters
   * @returns Array of portfolios in the specified category
   */
  getByCategory: async (category: "basic" | "premium", params?: Omit<PortfolioQueryParams, 'category'>): Promise<Portfolio[]> => {
    return portfolioService.getAll({ ...params, category });
  },

  /**
   * Fetch portfolio price history (keeping for backward compatibility)
   * @param portfolioId - Portfolio ID
   * @param period - Time period (default: 'all')
   * @returns Price history data
   */
  getPriceHistory: async (portfolioId: string, period: string = 'all'): Promise<any> => {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      
      const response = await axiosApi.get(`/api/portfolios/${portfolioId}/price-history?period=${period}`, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch price history:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Fetch tips for a specific portfolio (keeping for backward compatibility)
   * @param portfolioId - Portfolio ID
   * @returns Array of tips for the portfolio
   */
  getPortfolioTips: async (portfolioId: string): Promise<Tip[]> => {
    const response = await axiosApi.get<Tip[]>(
      `/api/tips/portfolios/${portfolioId}/tips`,
      {
        headers: {
          accept: "application/json",
        },
      }
    );
    return response.data;
  },

  /**
   * Debug function to test portfolio API endpoints
   */
  debugPortfolioData: async (): Promise<void> => {
    
    try {
      const token = authService.getAccessToken();
      
      // Test the /api/user/portfolios endpoint
      const portfolios = await portfolioService.getAll();
      
      if (portfolios.length > 0) {
        const accessibleCount = portfolios.filter(p => portfolioService.hasAccess(p)).length;
        const restrictedCount = portfolios.filter(p => !portfolioService.hasAccess(p)).length;
      }
      
      // Test portfolio detail endpoint if we have portfolios
      if (portfolios.length > 0) {
        const firstPortfolio = portfolios[0];
        const detailPortfolio = await portfolioService.getById(firstPortfolio._id);
      }
      
    } catch (error: any) {
      console.error("❌ Debug failed:", error);
    }

  },

  // Legacy methods for backward compatibility
  /**
   * @deprecated Use getAll() instead - this method will be removed in future versions
   */
  getPublic: async (): Promise<Portfolio[]> => {
    console.warn("⚠️ portfolioService.getPublic() is deprecated. Use getAll() instead.");
    return portfolioService.getAll();
  },

  /**
   * @deprecated Use getAll() instead - this method will be removed in future versions  
   */
  getAllPublic: async (): Promise<Portfolio[]> => {
    console.warn("⚠️ portfolioService.getAllPublic() is deprecated. Use getAll() instead.");
    return portfolioService.getAll();
  },
};