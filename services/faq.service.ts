import { get } from "@/lib/axios";

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  category: string;
  relatedFAQs: string[];
  lastUpdatedBy: {
    _id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FAQParams {
  category?: string;
  tag?: string;
  search?: string;
}

class FAQService {
  async getFAQs(params?: FAQParams): Promise<FAQ[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.category) {
        queryParams.append('category', params.category);
      }
      if (params?.tag) {
        queryParams.append('tag', params.tag);
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }

      const url = `/api/faqs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await get<FAQ[]>(url);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  }

  async getFAQsByCategory(category: string): Promise<FAQ[]> {
    return this.getFAQs({ category });
  }
}

export const faqService = new FAQService();