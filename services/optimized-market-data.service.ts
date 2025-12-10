import { apiClient } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';

export interface MarketIndexData {
  symbol: string;
  name: string;
  exchange: string;
  currentPrice: string;
  previousClose: string;
  priceChange: string;
  priceChangePercent: string;
  direction: "UP" | "DOWN" | "FLAT";
  marketStatus: string;
  isGainer: boolean;
  isLoser: boolean;
  volume: number;
  dayRange: string;
}

export interface MarketDataResponse {
  success: boolean;
  timestamp: string;
  marketHours: boolean;
  dataSource: string;
  summary: {
    totalStocks: number;
    gainers: number;
    losers: number;
    unchanged: number;
    avgChangePercent: string;
    overallSentiment: string;
    exchange: string;
    successRate: string;
  };
  data: MarketIndexData[];
}

class OptimizedMarketDataService {
  private readonly CACHE_KEY = 'market_indices';
  private readonly STALE_TIME = 30000; // 30s
  private readonly CACHE_TIME = 300000; // 5min

  async getMarketIndices(forceRefresh = false): Promise<MarketDataResponse | null> {
    if (forceRefresh) {
      queryClient.invalidateQuery(this.CACHE_KEY);
    }

    try {
      return await queryClient.fetchQuery(
        this.CACHE_KEY,
        () => this.fetchMarketData(),
        { staleTime: this.STALE_TIME, cacheTime: this.CACHE_TIME }
      );
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
      return null;
    }
  }

  private async fetchMarketData(): Promise<MarketDataResponse> {
    const response = await apiClient.get<MarketDataResponse>(
      '/api/stock-symbols/realtime/market',
      {
        params: {
          symbols: 'NIFTY,NIFTYMIDCAP150,NIFTYSMLCAP250',
          exchange: 'NSE'
        }
      }
    );

    if (!response.success) {
      throw new Error('Market data fetch unsuccessful');
    }

    return response;
  }

  prefetchMarketData(): void {
    queryClient.prefetchQuery(
      this.CACHE_KEY,
      () => this.fetchMarketData(),
      { staleTime: this.STALE_TIME, cacheTime: this.CACHE_TIME }
    );
  }

  clearCache(): void {
    queryClient.invalidateQuery(this.CACHE_KEY);
  }
}

export const optimizedMarketDataService = new OptimizedMarketDataService();
