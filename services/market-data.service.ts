import axiosApi from "@/lib/axios";
import { logger } from "@/lib/logger";

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

class MarketDataService {
  private cache: MarketDataResponse | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async getMarketIndices(forceRefresh: boolean = false): Promise<MarketDataResponse | null> {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh && this.cache && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
        logger.debug("Using cached market data");
        return this.cache;
      }

      const response = await axiosApi.get('/api/stock-symbols/realtime/market', {
        params: {
          symbols: 'NIFTY,NIFTYMIDCAP150,NIFTYSMLCAP250',
          exchange: 'NSE'
        },
        timeout: 10000
      });

      if (response.data?.success) {
        this.cache = response.data;
        this.cacheTimestamp = Date.now();
        return response.data;
      } else {
        logger.warn("API returned unsuccessful response");
        return null;
      }
    } catch (error: any) {
      logger.error("Failed to fetch market indices:", error);
      return null;
    }
  }

  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export const marketDataService = new MarketDataService();