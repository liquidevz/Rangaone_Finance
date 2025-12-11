'use client';

import { useQuery } from '@/hooks/use-query';
import { usePolling } from '@/hooks/use-polling';
import { stockPriceService } from '@/services/stock-price.service';
import { portfolioService } from '@/services/portfolio.service';
import { cacheInvalidation } from '@/lib/cache-invalidation';

/**
 * Example: Stock Price with Polling (High Frequency Data)
 * - 10s cache
 * - 15s polling
 * - Refetch on window focus
 */
export function StockPriceExample({ stockId }: { stockId: string }) {
  const { data, isLoading, refetch } = useQuery(
    `stock_price_${stockId}`,
    async () => {
      const result = await stockPriceService.getStockPriceById(stockId);
      return result.data;
    },
    {
      staleTime: 10000, // 10s
      refetchOnWindowFocus: true,
    }
  );

  // Poll every 15 seconds for fresh prices
  usePolling(refetch, {
    interval: 15000,
    onlyWhenVisible: true,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h3>{data?.symbol}</h3>
      <p>Price: ₹{data?.currentPrice}</p>
      <p>Change: {data?.changePercent.toFixed(2)}%</p>
      <button onClick={() => {
        cacheInvalidation.invalidateStockPrice(stockId);
        refetch();
      }}>
        Force Refresh
      </button>
    </div>
  );
}

/**
 * Example: Portfolio Data (Medium Frequency Data)
 * - 1min cache
 * - 2min polling
 * - Refetch on window focus
 */
export function PortfolioExample({ portfolioId }: { portfolioId: string }) {
  const { data, isLoading, refetch } = useQuery(
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
    onlyWhenVisible: true,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h3>{data?.name}</h3>
      <p>Holdings: {data?.holdings?.length}</p>
      <button onClick={() => {
        cacheInvalidation.invalidatePortfolios();
        refetch();
      }}>
        Refresh Portfolio
      </button>
    </div>
  );
}

/**
 * Example: Multiple Stock Prices (Batch Fetching)
 */
export function MultipleStocksExample({ stockIds }: { stockIds: string[] }) {
  const { data, isLoading, refetch } = useQuery(
    `stocks_${stockIds.join('_')}`,
    async () => {
      const results = await stockPriceService.getMultipleStockPricesById(stockIds);
      return Array.from(results.values()).map(r => r.data).filter(Boolean);
    },
    {
      staleTime: 10000,
      refetchOnWindowFocus: true,
    }
  );

  usePolling(refetch, {
    interval: 15000,
    onlyWhenVisible: true,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.map((stock) => (
        <div key={stock?.symbol}>
          {stock?.symbol}: ₹{stock?.currentPrice}
        </div>
      ))}
    </div>
  );
}

/**
 * Example: User Action with Cache Invalidation
 */
export function PurchaseExample() {
  const handlePurchase = async () => {
    try {
      // Make purchase API call
      // await purchaseSubscription();
      
      // Invalidate all related caches
      cacheInvalidation.onUserAction();
      
      alert('Purchase successful! Caches cleared.');
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  return (
    <button onClick={handlePurchase}>
      Purchase Subscription
    </button>
  );
}
