import { cache } from './cache';
import { queryClient } from './query-client';

/**
 * Cache invalidation strategies for different data types
 * Use these when you know data has changed on the server
 */
export const cacheInvalidation = {
  /**
   * Invalidate all stock price caches
   */
  invalidateStockPrices: () => {
    queryClient.invalidateQueries('stock_price');
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(k => k.includes('stock_price_'))
        .forEach(k => localStorage.removeItem(k));
    }
  },

  /**
   * Invalidate specific stock price
   */
  invalidateStockPrice: (id: string) => {
    cache.remove(`stock_price_${id}`);
    queryClient.invalidateQuery(`stock_price_${id}`);
  },

  /**
   * Invalidate portfolio data
   */
  invalidatePortfolios: () => {
    queryClient.invalidateQueries('portfolio');
    cache.remove('portfolios');
  },

  /**
   * Invalidate user data (after login/logout/profile update)
   */
  invalidateUserData: () => {
    queryClient.invalidateQueries('user');
    cache.remove('user_profile');
    cache.remove('user_subscriptions');
  },

  /**
   * Invalidate cart data
   */
  invalidateCart: () => {
    queryClient.invalidateQueries('cart');
    cache.remove('cart');
  },

  /**
   * Invalidate recommendations
   */
  invalidateRecommendations: () => {
    queryClient.invalidateQueries('recommendations');
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(k => k.includes('recommendation'))
        .forEach(k => localStorage.removeItem(k));
    }
  },

  /**
   * Clear all caches (use sparingly)
   */
  clearAll: () => {
    cache.clear();
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(k => k.startsWith('rangaone_cache_'))
        .forEach(k => localStorage.removeItem(k));
    }
  },

  /**
   * Invalidate on user action (e.g., after purchase, subscription)
   */
  onUserAction: () => {
    cacheInvalidation.invalidateUserData();
    cacheInvalidation.invalidateCart();
    cacheInvalidation.invalidatePortfolios();
  },
};
