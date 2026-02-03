import axiosApi from "@/lib/axios";
import { Tip, TipDownloadLink } from "@/lib/types";

// Re-export types for backward compatibility
export type { Tip, TipDownloadLink };

export interface TipsFilterParams {
  startDate?: string;
  endDate?: string;
  category?: 'basic' | 'premium';
  status?: 'active' | 'closed' | 'expired';
  action?: 'buy' | 'sell' | 'hold';
  stockId?: string;
  portfolioId?: string;
}

export const tipsService = {
  // Check if user should see premium tips based on subscription
  shouldShowPremiumTips: async (): Promise<boolean> => {
    try {
      // Dynamic import to avoid circular dependencies if any
      const { subscriptionService } = await import('./subscription.service');
      return await subscriptionService.hasPremiumAccess();
    } catch (error) {
      console.error('Failed to check premium access:', error);
      return false;
    }
  },

  // Fetch general tips (without portfolio association)
  getAll: async (params?: TipsFilterParams): Promise<Tip[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.stockId) queryParams.append('stockId', params.stockId);
    
    const url = `/api/user/tips${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await axiosApi.get<Tip[]>(url, {
      headers: { accept: "application/json" },
    });
    return response.data || [];
  },

  // Fetch portfolio-specific tips
  getPortfolioTips: async (params?: TipsFilterParams): Promise<Tip[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.portfolioId) queryParams.append('portfolioId', params.portfolioId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.stockId) queryParams.append('stockId', params.stockId);
    
    const url = `/api/user/tips-with-portfolio${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await axiosApi.get<Tip[]>(url, {
      headers: { accept: "application/json" },
    });
    return response.data || [];
  },

  // Fetch tip by ID with enhanced error logging
  getById: async (id: string): Promise<Tip> => {
    try {
      if (!id) throw new Error("Tip ID is required");

      const response = await axiosApi.get<Tip>(`/api/user/tips/${id}`, {
        headers: { accept: "application/json" },
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ TipsService Error:', error.message);
      
      // Detailed error logging for debugging
      if (error?.response) {
        console.error('📊 API Error Response:', {
          status: error.response.status,
          url: error.config?.url,
          data: error.response.data
        });
      }
      
      throw error;
    }
  },

  // Fetch tips by portfolio ID (legacy method for backward compatibility)
  getByPortfolioId: async (portfolioId: string): Promise<Tip[]> => {
    return tipsService.getPortfolioTips({ portfolioId });
  }
};