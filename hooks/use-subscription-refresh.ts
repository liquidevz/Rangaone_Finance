"use client";

import { useEffect, useRef } from "react";
import { subscriptionService } from "@/services/subscription.service";

/**
 * Hook to automatically refresh subscription data when:
 * 1. Tab becomes visible (prevents stale data after subscription changes)
 * 2. Component mounts
 * 
 * This prevents the issue where canceling a subscription doesn't reflect
 * immediately due to client-side caching
 */
export function useSubscriptionRefresh() {
  const lastRefreshRef = useRef<number>(0);
  const REFRESH_THROTTLE = 3000; // Don't refresh more than once every 3 seconds

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        
        // Throttle refreshes to prevent too many API calls
        if (now - lastRefreshRef.current > REFRESH_THROTTLE) {
          lastRefreshRef.current = now;
          subscriptionService.clearCache();
          subscriptionService.getSubscriptionAccess(true).catch(err => {
            console.error('Failed to refresh subscription on visibility change:', err);
          });
        }
      }
    };

    // Add listener for tab visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

/**
 * Hook to force clear subscription cache on mount
 * Use this when you need to ensure fresh data (e.g., after payment or cancellation)
 */
export function useClearSubscriptionCache() {
  useEffect(() => {
    subscriptionService.clearCache();
  }, []);
}
