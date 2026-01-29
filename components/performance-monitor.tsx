'use client';

import { useEffect } from 'react';
import { webVitalsMonitor } from '@/lib/web-vitals';
import { addDNSPrefetch, addPreconnect } from '@/lib/performance';

export function PerformanceMonitor() {
  useEffect(() => {
    // Prefetch critical domains
    addDNSPrefetch('https://api.rangaone.finance');
    addDNSPrefetch('https://www.youtube.com');
    addPreconnect('https://api.rangaone.finance');

    // Register service worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('Service Worker registration failed:', err));
    }

    // Monitor performance
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Monitor navigation timing
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // const navEntry = entry as PerformanceNavigationTiming;
            // console.log('Navigation Timing:', navEntry);
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });

        // Monitor resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resource = entry as PerformanceResourceTiming;
            if (resource.duration > 1000) {
              console.warn(`Slow resource: ${resource.name} (${resource.duration.toFixed(2)}ms)`);
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        // PerformanceObserver not fully supported
      }
    }

    // Cleanup on unmount
    return () => {
      // Cleanup if needed
    };
  }, []);

  return null;
}
