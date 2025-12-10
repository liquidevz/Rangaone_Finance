import { apiClient } from '@/lib/api-client';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';

export interface StockPriceData {
  symbol: string;
  currentPrice: number;
  previousPrice: number;
  todayClosingPrice: number;
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

class OptimizedStockPriceService {
  private readonly CACHE_TTL = 0.5; // 30 seconds in minutes
  private batchQueue: Map<string, Array<(data: StockPriceData | null) => void>> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 50; // 50ms batch window

  async getStockPriceById(id: string): Promise<StockPriceData | null> {
    const cacheKey = `stock_price_${id}`;
    const cached = cache.get<StockPriceData>(cacheKey);
    
    if (cached) {
      return cached;
    }

    return new Promise((resolve) => {
      if (!this.batchQueue.has(id)) {
        this.batchQueue.set(id, []);
      }
      
      this.batchQueue.get(id)!.push(resolve);

      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), this.BATCH_DELAY);
      }
    });
  }

  private async processBatch(): Promise<void> {
    const ids = Array.from(this.batchQueue.keys());
    const callbacks = new Map(this.batchQueue);
    
    this.batchQueue.clear();
    this.batchTimer = null;

    if (ids.length === 0) return;

    try {
      const results = await this.fetchMultiplePrices(ids);
      
      ids.forEach(id => {
        const data = results.get(id) || null;
        const cbs = callbacks.get(id) || [];
        
        if (data) {
          cache.set(`stock_price_${id}`, data, this.CACHE_TTL);
        }
        
        cbs.forEach(cb => cb(data));
      });
    } catch (error) {
      logger.error('Batch price fetch failed:', error);
      ids.forEach(id => {
        const cbs = callbacks.get(id) || [];
        cbs.forEach(cb => cb(null));
      });
    }
  }

  private async fetchMultiplePrices(ids: string[]): Promise<Map<string, StockPriceData>> {
    const results = new Map<string, StockPriceData>();

    // Fetch in parallel with concurrency limit
    const CONCURRENCY = 5;
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const batch = ids.slice(i, i + CONCURRENCY);
      const promises = batch.map(id => this.fetchSinglePrice(id));
      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.set(batch[index], result.value);
        }
      });
    }

    return results;
  }

  private async fetchSinglePrice(id: string): Promise<StockPriceData | null> {
    try {
      const response = await apiClient.get<any>(`/api/stock-symbols/${id}`);
      return this.parseStockData(response.data || response);
    } catch (error) {
      logger.error(`Failed to fetch price for ${id}:`, error);
      return null;
    }
  }

  private parseStockData(data: any): StockPriceData | null {
    if (!data?.symbol) return null;

    const currentPrice = this.parsePrice(data.currentPrice);
    const previousPrice = this.parsePrice(data.previousPrice);
    const todayClosingPrice = this.parsePrice(data.todayClosingPrice || data.previousPrice);

    if (currentPrice <= 0) return null;

    const change = currentPrice - todayClosingPrice;
    const changePercent = todayClosingPrice > 0 ? (change / todayClosingPrice) * 100 : 0;

    return {
      symbol: data.symbol,
      currentPrice,
      previousPrice,
      todayClosingPrice,
      change,
      changePercent,
      name: data.name,
      exchange: data.exchange,
      marketCap: data.marketCap,
      volume: this.parsePrice(data.volume),
      high: this.parsePrice(data.high),
      low: this.parsePrice(data.low),
      open: this.parsePrice(data.open),
    };
  }

  private parsePrice(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[₹,\s]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  clearCache(id?: string): void {
    if (id) {
      cache.remove(`stock_price_${id}`);
    } else {
      // Clear all stock price caches
      if (typeof window !== 'undefined') {
        Object.keys(localStorage)
          .filter(k => k.includes('stock_price_'))
          .forEach(k => cache.remove(k.replace('rangaone_cache_', '')));
      }
    }
  }
}

export const optimizedStockPriceService = new OptimizedStockPriceService();
