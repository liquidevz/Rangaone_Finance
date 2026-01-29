import { stockPriceService } from "./stock-price.service";

interface StockSymbolData {
  symbol: string;
  name?: string;
  fetchedAt: number;
}

class StockSymbolCacheService {
  private cache = new Map<string, StockSymbolData>();
  private readonly CACHE_KEY = "ranga_stock_symbols_cache";
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private pendingRequests = new Map<string, Promise<string | null>>();
  private isInitialized = false;

  constructor() {
    this.loadFromSessionStorage();
  }

  /**
   * Load cached symbols from session storage
   */
  private loadFromSessionStorage(): void {
    try {
      if (typeof window === "undefined") return;
      
      const cached = sessionStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const parsedData = JSON.parse(cached);
        const now = Date.now();
        
        // Filter out expired entries
        Object.entries(parsedData).forEach(([stockId, data]: [string, any]) => {
          if (data.fetchedAt && now - data.fetchedAt < this.CACHE_DURATION) {
            this.cache.set(stockId, data);
          }
        });
        
      }
      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Failed to load stock symbol cache from session storage:", error);
      this.isInitialized = true;
    }
  }

  /**
   * Save cache to session storage
   */
  private saveToSessionStorage(): void {
    try {
      if (typeof window === "undefined") return;
      
      const cacheObject = Object.fromEntries(this.cache);
      sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error("❌ Failed to save stock symbol cache to session storage:", error);
    }
  }

  /**
   * Get symbol for a stock ID (from cache or fetch if needed)
   */
  async getSymbol(stockId: string): Promise<string | null> {
    if (!stockId?.trim()) return null;

    // Clean stock ID
    const cleanStockId = stockId.replace(/\.[A-Z]+$/, '').trim();
    
    // Check cache first
    const cached = this.cache.get(cleanStockId);
    if (cached) {
      return cached.symbol;
    }

    // Check if already fetching
    if (this.pendingRequests.has(cleanStockId)) {
      return this.pendingRequests.get(cleanStockId)!;
    }

    // Fetch from API
    const fetchPromise = this.fetchSymbolFromAPI(cleanStockId);
    this.pendingRequests.set(cleanStockId, fetchPromise);
    
    try {
      const symbol = await fetchPromise;
      return symbol;
    } finally {
      this.pendingRequests.delete(cleanStockId);
    }
  }

  /**
   * Get multiple symbols in parallel
   */
  async getMultipleSymbols(stockIds: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    if (!stockIds?.length) return results;


    // Clean stock IDs
    const cleanStockIds = stockIds
      .filter(id => id?.trim())
      .map(id => id.replace(/\.[A-Z]+$/, '').trim());

    // Separate cached and non-cached IDs
    const cachedSymbols = new Map<string, string>();
    const idsToFetch: string[] = [];

    cleanStockIds.forEach(stockId => {
      const cached = this.cache.get(stockId);
      if (cached) {
        cachedSymbols.set(stockId, cached.symbol);
        results.set(stockId, cached.symbol);
      } else {
        idsToFetch.push(stockId);
      }
    });


    // Fetch missing symbols in parallel
    if (idsToFetch.length > 0) {
      const fetchPromises = idsToFetch.map(async (stockId) => {
        // Check if already fetching
        if (this.pendingRequests.has(stockId)) {
          return { stockId, symbol: await this.pendingRequests.get(stockId)! };
        }

        const fetchPromise = this.fetchSymbolFromAPI(stockId);
        this.pendingRequests.set(stockId, fetchPromise);
        
        try {
          const symbol = await fetchPromise;
          return { stockId, symbol };
        } finally {
          this.pendingRequests.delete(stockId);
        }
      });

      const fetchResults = await Promise.all(fetchPromises);
      
      fetchResults.forEach(({ stockId, symbol }) => {
        if (symbol) {
          results.set(stockId, symbol);
        }
      });
    }

    
    return results;
  }

  /**
   * Fetch symbol from API and cache it
   */
  private async fetchSymbolFromAPI(stockId: string): Promise<string | null> {
    try {
      
      const response = await stockPriceService.getStockPriceById(stockId);
      
      if (response.success && response.data?.symbol) {
        const symbolData: StockSymbolData = {
          symbol: response.data.symbol,
          name: response.data.name,
          fetchedAt: Date.now()
        };
        
        this.cache.set(stockId, symbolData);
        this.saveToSessionStorage();
        
        return symbolData.symbol;
      } else {
        console.warn(`⚠️ Failed to fetch symbol for ${stockId}:`, response.error);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error fetching symbol for ${stockId}:`, error);
      return null;
    }
  }

  /**
   * Preload symbols for a list of stock IDs
   */
  async preloadSymbols(stockIds: string[]): Promise<void> {
    await this.getMultipleSymbols(stockIds);
  }

  /**
   * Check if symbol is cached
   */
  isSymbolCached(stockId: string): boolean {
    if (!stockId?.trim()) return false;
    const cleanStockId = stockId.replace(/\.[A-Z]+$/, '').trim();
    return this.cache.has(cleanStockId);
  }

  /**
   * Get cached symbol without fetching
   */
  getCachedSymbol(stockId: string): string | null {
    if (!stockId?.trim()) return null;
    const cleanStockId = stockId.replace(/\.[A-Z]+$/, '').trim();
    const cached = this.cache.get(cleanStockId);
    return cached?.symbol || null;
  }

  /**
   * Clear all cached symbols
   */
  clearCache(): void {
    this.cache.clear();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(this.CACHE_KEY);
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { count: number; symbols: string[] } {
    return {
      count: this.cache.size,
      symbols: Array.from(this.cache.keys())
    };
  }

  /**
   * Wait for initialization to complete
   */
  async waitForInitialization(): Promise<void> {
    if (this.isInitialized) return;
    
    // Wait for initialization with timeout
    return new Promise((resolve) => {
      const checkInitialized = () => {
        if (this.isInitialized) {
          resolve();
        } else {
          setTimeout(checkInitialized, 10);
        }
      };
      checkInitialized();
    });
  }
}

// Export singleton instance
export const stockSymbolCacheService = new StockSymbolCacheService();