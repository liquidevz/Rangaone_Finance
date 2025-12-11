# Caching Strategy Without WebSockets

## Overview
Since we don't have live WebSockets, we use a multi-layered caching strategy with aggressive invalidation and polling to ensure data freshness.

## Cache Durations

### Stock Prices
- **Cache Duration**: 10 seconds
- **Rationale**: Financial data changes frequently; 10s balances performance with freshness
- **Strategy**: Stale-while-revalidate (show cached data, fetch in background)

### Portfolio Data
- **Cache Duration**: 1 minute
- **Rationale**: Portfolio compositions don't change as frequently
- **Strategy**: Refetch on window focus and user actions

### User Data
- **Cache Duration**: 5 minutes
- **Rationale**: User profile/subscription data is relatively static
- **Strategy**: Invalidate on login/logout/profile updates

### General Queries
- **Cache Duration**: 1 minute (reduced from 5 minutes)
- **Rationale**: Balance between performance and freshness

## Key Strategies

### 1. Stale-While-Revalidate
```typescript
// Shows cached data immediately, fetches fresh data in background
const { data } = useQuery('stock_price', fetchStockPrice, {
  staleTime: 10000, // Consider stale after 10s
  cacheTime: 60000, // Keep in cache for 1min
});
```

### 2. Polling for Critical Data
```typescript
import { usePolling } from '@/hooks/use-polling';

// Poll stock prices every 15 seconds when page is visible
usePolling(
  () => refetchStockPrices(),
  { interval: 15000, onlyWhenVisible: true }
);
```

### 3. Refetch on Window Focus
```typescript
// Automatically refetch when user returns to tab
const { data } = useQuery('portfolio', fetchPortfolio, {
  refetchOnWindowFocus: true, // Now enabled by default
});
```

### 4. Manual Cache Invalidation
```typescript
import { cacheInvalidation } from '@/lib/cache-invalidation';

// After user purchases subscription
await purchaseSubscription();
cacheInvalidation.onUserAction(); // Clears user, cart, portfolio caches
```

## Usage Examples

### Stock Prices (High Frequency)
```typescript
import { useQuery } from '@/hooks/use-query';
import { usePolling } from '@/hooks/use-polling';
import { stockPriceService } from '@/services/stock-price.service';

function StockPrice({ stockId }: { stockId: string }) {
  const { data, refetch } = useQuery(
    `stock_price_${stockId}`,
    () => stockPriceService.getStockPriceById(stockId),
    {
      staleTime: 10000, // 10s
      refetchOnWindowFocus: true,
    }
  );

  // Poll every 15 seconds for fresh data
  usePolling(refetch, { 
    interval: 15000,
    onlyWhenVisible: true 
  });

  return <div>{data?.currentPrice}</div>;
}
```

### Portfolio Data (Medium Frequency)
```typescript
function Portfolio({ portfolioId }: { portfolioId: string }) {
  const { data, refetch } = useQuery(
    `portfolio_${portfolioId}`,
    () => portfolioService.getById(portfolioId),
    {
      staleTime: 60000, // 1min
      refetchOnWindowFocus: true,
    }
  );

  // Poll every 2 minutes
  usePolling(refetch, { 
    interval: 120000,
    onlyWhenVisible: true 
  });

  return <div>{data?.name}</div>;
}
```

### User Data (Low Frequency)
```typescript
function UserProfile() {
  const { data } = useQuery(
    'user_profile',
    () => userService.getProfile(),
    {
      staleTime: 300000, // 5min
      refetchOnWindowFocus: false, // Don't refetch on focus
    }
  );

  return <div>{data?.name}</div>;
}
```

## Cache Invalidation Triggers

### After User Actions
```typescript
// After purchase
await purchaseSubscription();
cacheInvalidation.onUserAction();

// After profile update
await updateProfile(data);
cacheInvalidation.invalidateUserData();

// After adding to cart
await addToCart(item);
cacheInvalidation.invalidateCart();
```

### On Authentication Changes
```typescript
// On login
await login(credentials);
cacheInvalidation.invalidateUserData();
cacheInvalidation.invalidatePortfolios();

// On logout
await logout();
cacheInvalidation.clearAll();
```

## Best Practices

### ✅ DO
- Use polling for critical financial data (stock prices, portfolio values)
- Invalidate caches after mutations (purchases, updates)
- Enable `refetchOnWindowFocus` for important data
- Use shorter cache times for frequently changing data
- Implement stale-while-revalidate for better UX

### ❌ DON'T
- Cache financial data for more than 30 seconds
- Forget to invalidate caches after user actions
- Poll when page is hidden (wastes resources)
- Use the same cache duration for all data types
- Rely solely on cache without any refresh mechanism

## Monitoring Cache Effectiveness

```typescript
// Check cache status
import { stockPriceService } from '@/services/stock-price.service';

const cacheStatus = stockPriceService.getCacheStatus();
console.log('Cache entries:', cacheStatus);
```

## Performance Considerations

1. **Batch Requests**: Use `optimizedStockPriceService` for multiple stocks
2. **Debounce Polling**: Don't poll more frequently than data changes
3. **Conditional Polling**: Only poll when data is visible on screen
4. **Memory Management**: Cache automatically evicts old entries

## Migration from Aggressive Caching

### Before (Problematic)
```typescript
// 30s cache, no refresh mechanism
staleTime: 30000,
cacheTime: 300000,
refetchOnWindowFocus: false,
```

### After (Recommended)
```typescript
// 10s cache, auto-refresh, polling
staleTime: 10000,
cacheTime: 60000,
refetchOnWindowFocus: true,
// + usePolling hook
```

## Testing Cache Behavior

```typescript
// Force refresh to bypass cache
await stockPriceService.forceRefresh(stockId);

// Clear specific cache
cacheInvalidation.invalidateStockPrice(stockId);

// Clear all caches
cacheInvalidation.clearAll();
```

## Summary

Without WebSockets, we ensure data freshness through:
1. **Shorter cache durations** (10s for financial data)
2. **Polling** for critical data
3. **Refetch on window focus** by default
4. **Manual invalidation** after user actions
5. **Stale-while-revalidate** for better UX

This approach balances performance with data freshness, ensuring users always see up-to-date information.
