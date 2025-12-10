import { cache } from './cache';

interface QueryOptions {
  staleTime?: number;
  cacheTime?: number;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
}

interface QueryState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
  timestamp: number;
}

class QueryClient {
  private queries = new Map<string, QueryState<any>>();
  private subscribers = new Map<string, Set<() => void>>();
  private fetchPromises = new Map<string, Promise<any>>();

  async fetchQuery<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    const {
      staleTime = 30000, // 30s default
      cacheTime = 300000, // 5min default
    } = options;

    // Check cache first
    const cached = cache.get<T>(key);
    if (cached) {
      return cached;
    }

    // Check if already fetching
    const existingPromise = this.fetchPromises.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    // Fetch data
    const promise = fetcher()
      .then((data) => {
        cache.set(key, data, cacheTime / 60000);
        this.fetchPromises.delete(key);
        this.notifySubscribers(key);
        return data;
      })
      .catch((error) => {
        this.fetchPromises.delete(key);
        throw error;
      });

    this.fetchPromises.set(key, promise);
    return promise;
  }

  invalidateQuery(key: string): void {
    cache.remove(key);
    this.notifySubscribers(key);
  }

  invalidateQueries(pattern: string): void {
    // Invalidate all queries matching pattern
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(k => k.includes(pattern))
        .forEach(k => cache.remove(k.replace('rangaone_cache_', '')));
    }
  }

  private notifySubscribers(key: string): void {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach(callback => callback());
    }
  }

  subscribe(key: string, callback: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  prefetchQuery<T>(key: string, fetcher: () => Promise<T>, options?: QueryOptions): void {
    // Non-blocking prefetch
    this.fetchQuery(key, fetcher, options).catch(() => {});
  }

  // Batch fetch multiple queries
  async fetchQueries<T>(
    queries: Array<{ key: string; fetcher: () => Promise<T>; options?: QueryOptions }>
  ): Promise<T[]> {
    return Promise.all(
      queries.map(({ key, fetcher, options }) => this.fetchQuery(key, fetcher, options))
    );
  }
}

export const queryClient = new QueryClient();
