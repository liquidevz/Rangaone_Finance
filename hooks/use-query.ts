import { useEffect, useState, useCallback, useRef } from 'react';
import { queryClient } from '@/lib/query-client';

interface UseQueryOptions<T> {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseQueryResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
}

export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const {
    enabled = true,
    staleTime = 30000,
    cacheTime = 300000,
    refetchInterval,
    refetchOnWindowFocus = false,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsFetching(true);
    try {
      const result = await queryClient.fetchQuery(key, fetcher, { staleTime, cacheTime });
      if (mountedRef.current) {
        setData(result);
        setError(null);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, [key, fetcher, enabled, staleTime, cacheTime, onSuccess, onError]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // Setup refetch interval
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
    }

    // Setup window focus refetch
    const handleFocus = () => {
      if (refetchOnWindowFocus && enabled) {
        fetchData();
      }
    };

    if (refetchOnWindowFocus) {
      window.addEventListener('focus', handleFocus);
    }

    // Subscribe to query updates
    const unsubscribe = queryClient.subscribe(key, fetchData);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (refetchOnWindowFocus) {
        window.removeEventListener('focus', handleFocus);
      }
      unsubscribe();
    };
  }, [key, fetchData, refetchInterval, refetchOnWindowFocus, enabled]);

  const refetch = useCallback(async () => {
    queryClient.invalidateQuery(key);
    await fetchData();
  }, [key, fetchData]);

  return { data, error, isLoading, isFetching, refetch };
}

// Hook for mutations
export function useMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: Error, variables: V) => void;
    invalidateQueries?: string[];
  } = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: V) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await mutationFn(variables);
        options.onSuccess?.(data, variables);
        
        // Invalidate related queries
        options.invalidateQueries?.forEach(key => {
          queryClient.invalidateQuery(key);
        });

        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        options.onError?.(error, variables);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, options]
  );

  return { mutate, isLoading, error };
}
