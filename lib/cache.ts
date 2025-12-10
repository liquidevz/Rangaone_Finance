interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
  size?: number;
}

class CacheManager {
  private prefix = 'rangaone_cache_';
  private memoryCache = new Map<string, CacheItem<any>>();
  private readonly MAX_MEMORY_ITEMS = 100;
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (ttlMinutes * 60 * 1000),
      size: this.estimateSize(data)
    };

    // Memory cache (fast access)
    this.setMemoryCache(key, item);

    // Persistent cache (survives page reload)
    if (typeof window !== 'undefined') {
      try {
        const serialized = JSON.stringify(item);
        if (serialized.length < 100000) { // Don't cache items > 100KB
          localStorage.setItem(this.prefix + key, serialized);
        }
      } catch (e) {
        this.handleStorageError(e);
      }
    }
  }

  get<T>(key: string): T | null {
    // Try memory cache first (fastest)
    const memCached = this.memoryCache.get(key);
    if (memCached && Date.now() < memCached.expiry) {
      return memCached.data;
    }

    // Fallback to localStorage
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const cached: CacheItem<T> = JSON.parse(item);
      
      if (Date.now() > cached.expiry) {
        this.remove(key);
        return null;
      }

      // Restore to memory cache
      this.memoryCache.set(key, cached);
      
      return cached.data;
    } catch (e) {
      return null;
    }
  }

  private setMemoryCache<T>(key: string, item: CacheItem<T>): void {
    // LRU eviction if cache is full
    if (this.memoryCache.size >= this.MAX_MEMORY_ITEMS) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, item);
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private handleStorageError(e: any): void {
    if (e.name === 'QuotaExceededError') {
      this.evictOldest();
    }
  }

  private evictOldest(): void {
    if (typeof window === 'undefined') return;
    
    const items: Array<{ key: string; timestamp: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key)!);
          items.push({ key, timestamp: item.timestamp });
        } catch {}
      }
    }

    items.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(items.length * 0.2); // Remove oldest 20%
    
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(items[i].key);
    }
  }

  remove(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.prefix + key);
    }
  }

  clear(): void {
    this.memoryCache.clear();
    if (typeof window === 'undefined') return;
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  // State management for UI components
  setState(key: string, state: any): void {
    this.set(`state_${key}`, state, 60); // 1 hour TTL for UI state
  }

  getState<T>(key: string): T | null {
    return this.get<T>(`state_${key}`);
  }

  // Batch operations for efficiency
  setMany<T>(items: Array<{ key: string; data: T; ttl?: number }>): void {
    items.forEach(({ key, data, ttl }) => this.set(key, data, ttl));
  }

  getMany<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>();
    keys.forEach(key => results.set(key, this.get<T>(key)));
    return results;
  }
}

export const cache = new CacheManager();