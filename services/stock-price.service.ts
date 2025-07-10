import axiosApi from "@/lib/axios";
import { authService } from "./auth.service";

export interface StockPriceData {
  symbol: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  name?: string;
  exchange?: string;
  marketCap?: string;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
}

export interface StockPriceResponse {
  success: boolean;
  data: StockPriceData | null;
  error?: string;
}

class StockPriceService {
  private cache = new Map<string, { data: StockPriceData; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds timeout
  private readonly MAX_RETRIES = 2;

  /**
   * Fetch live stock price for a single symbol
   */
  async getStockPrice(symbol: string): Promise<StockPriceResponse> {
    try {
      // Check cache first
      const cached = this.getCachedPrice(symbol);
      if (cached) {
        return { success: true, data: cached };
      }

      // Get auth token
      const token = authService.getAccessToken();
      if (!token) {
        console.warn(`No auth token available for fetching ${symbol} price`);
        return { success: false, data: null, error: "Authentication required" };
      }

      console.log(`🔍 Fetching live price for ${symbol}`);

      // Make API call with retry logic
      const stockData = await this.fetchWithRetry(symbol, token);
      
      if (stockData) {
        // Cache the result
        this.setCachedPrice(symbol, stockData);
        console.log(`✅ Successfully fetched price for ${symbol}: ₹${stockData.currentPrice}`);
        return { success: true, data: stockData };
      } else {
        console.warn(`⚠️ No data returned for ${symbol}`);
        return { success: false, data: null, error: "No data available" };
      }

    } catch (error: any) {
      console.error(`❌ Failed to fetch price for ${symbol}:`, error);
      return { 
        success: false, 
        data: null, 
        error: error.message || "Failed to fetch stock price" 
      };
    }
  }

  /**
   * Fetch live stock prices for multiple symbols
   */
  async getMultipleStockPrices(symbols: string[]): Promise<Map<string, StockPriceResponse>> {
    console.log(`🔍 Fetching prices for ${symbols.length} symbols`);
    
    const results = new Map<string, StockPriceResponse>();
    
    // Use Promise.allSettled to handle partial failures gracefully
    const promises = symbols.map(async (symbol) => {
      const result = await this.getStockPrice(symbol);
      return { symbol, result };
    });

    const settledResults = await Promise.allSettled(promises);
    
    settledResults.forEach((settledResult) => {
      if (settledResult.status === 'fulfilled') {
        const { symbol, result } = settledResult.value;
        results.set(symbol, result);
      } else {
        console.error('Failed to fetch price for symbol:', settledResult.reason);
      }
    });

    console.log(`✅ Completed fetching prices. Success: ${Array.from(results.values()).filter(r => r.success).length}/${symbols.length}`);
    
    return results;
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(symbol: string, token: string, retryCount = 0): Promise<StockPriceData | null> {
    try {
      const response = await axiosApi.get(`/api/stock-symbols/search?keyword=${symbol}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: this.REQUEST_TIMEOUT,
      });

      console.log(`📊 API response for ${symbol}:`, response.data);

      return this.parseStockResponse(response.data, symbol);

    } catch (error: any) {
      console.error(`❌ API call failed for ${symbol} (attempt ${retryCount + 1}):`, error.message);
      
      if (retryCount < this.MAX_RETRIES) {
        console.log(`🔄 Retrying ${symbol} (${retryCount + 1}/${this.MAX_RETRIES})`);
        // Exponential backoff: wait 1s, then 2s, then 4s
        await this.delay(Math.pow(2, retryCount) * 1000);
        return this.fetchWithRetry(symbol, token, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Parse API response and extract stock data
   */
  private parseStockResponse(responseData: any, symbol: string): StockPriceData | null {
    try {
      let stockData = null;

      // Handle different response structures
      if (responseData?.success && responseData?.data?.length > 0) {
        stockData = responseData.data[0];
      } else if (responseData?.data?.length > 0) {
        stockData = responseData.data[0];
      } else if (Array.isArray(responseData) && responseData.length > 0) {
        stockData = responseData[0];
      } else if (responseData?.symbol) {
        stockData = responseData;
      }

      if (!stockData) {
        console.warn(`⚠️ No stock data found in response for ${symbol}`);
        return null;
      }

      // Extract price information with fallbacks
      const currentPrice = this.parsePrice(
        stockData.currentPrice || 
        stockData.price || 
        stockData.ltp || 
        stockData.lastPrice ||
        stockData.close
      );

      const previousPrice = this.parsePrice(
        stockData.previousPrice || 
        stockData.prevPrice || 
        stockData.previousClose ||
        stockData.close ||
        currentPrice
      );

      if (isNaN(currentPrice) || currentPrice <= 0) {
        console.warn(`⚠️ Invalid current price for ${symbol}:`, currentPrice);
        return null;
      }

      // Calculate change and change percentage
      const change = currentPrice - previousPrice;
      const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

      const result: StockPriceData = {
        symbol: stockData.symbol || symbol,
        currentPrice,
        previousPrice,
        change,
        changePercent,
        name: stockData.name || stockData.companyName,
        exchange: stockData.exchange || stockData.exchangeSegment,
        marketCap: stockData.marketCap || stockData.marketCapitalization,
        volume: this.parsePrice(stockData.volume),
        high: this.parsePrice(stockData.high || stockData.dayHigh),
        low: this.parsePrice(stockData.low || stockData.dayLow),
        open: this.parsePrice(stockData.open || stockData.dayOpen),
      };

      console.log(`📈 Parsed stock data for ${symbol}:`, {
        currentPrice: result.currentPrice,
        change: result.change,
        changePercent: result.changePercent.toFixed(2) + '%'
      });

      return result;

    } catch (error) {
      console.error(`❌ Failed to parse response for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Safely parse price values
   */
  private parsePrice(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value;
    }
    
    if (typeof value === 'string') {
      // Remove currency symbols, commas, and other non-numeric characters
      const cleaned = value.replace(/[₹,\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
  }

  /**
   * Cache management
   */
  private getCachedPrice(symbol: string): StockPriceData | null {
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📋 Using cached price for ${symbol}`);
      return cached.data;
    }
    return null;
  }

  private setCachedPrice(symbol: string, data: StockPriceData): void {
    this.cache.set(symbol, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for specific symbol or all symbols
   */
  clearCache(symbol?: string): void {
    if (symbol) {
      this.cache.delete(symbol);
      console.log(`🗑️ Cleared cache for ${symbol}`);
    } else {
      this.cache.clear();
      console.log(`🗑️ Cleared all price cache`);
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { symbol: string; age: number }[] {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([symbol, { timestamp }]) => ({
      symbol,
      age: now - timestamp
    }));
  }
}

// Export singleton instance
export const stockPriceService = new StockPriceService(); 