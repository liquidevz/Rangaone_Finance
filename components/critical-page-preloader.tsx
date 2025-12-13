"use client";

import { useEffect } from "react";

export function CriticalPagePreloader() {
  useEffect(() => {
    // Preload critical page components immediately
    const preloadPages = async () => {
      try {
        // Dynamically import critical pages to trigger webpack to load chunks
        const imports = [
          import("@/app/login/page"),
          import("@/app/signup/page"),
          import("@/app/dashboard/page"),
        ];
        
        // Don't await - fire and forget for background loading
        Promise.all(imports).catch(() => {
          // Silently fail - preloading is optional
        });
      } catch (error) {
        // Silently fail - preloading is optional
      }
    };

    // Start preloading after a short delay to not block initial render
    const timer = setTimeout(preloadPages, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return null;
}
