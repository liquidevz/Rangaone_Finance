import { useEffect, useRef } from 'react';

interface UsePollingOptions {
  interval: number;
  enabled?: boolean;
  onlyWhenVisible?: boolean;
}

/**
 * Hook for polling data at regular intervals
 * Use this for critical data that needs to stay fresh without WebSockets
 */
export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions
) {
  const { interval, enabled = true, onlyWhenVisible = true } = options;
  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      if (onlyWhenVisible && document.hidden) return;
      await savedCallback.current();
    };

    intervalRef.current = setInterval(tick, interval);

    if (onlyWhenVisible) {
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          tick();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [interval, enabled, onlyWhenVisible]);
}
