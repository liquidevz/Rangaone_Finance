"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Immediate prefetch for critical auth pages
    const criticalRoutes = ["/login", "/signup", "/dashboard"];
    criticalRoutes.forEach(route => {
      router.prefetch(route);
      // Force preload by creating hidden link elements
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      link.as = 'document';
      document.head.appendChild(link);
    });

    // Delayed prefetch for secondary routes
    const timer = setTimeout(() => {
      const secondaryRoutes = [
        "/cart",
        "/model-portfolios",
        "/recommendations/all",
        "/settings",
        "/videos-for-you",
        "/investment-calculator",
        "/rangaone-wealth",
      ];
      secondaryRoutes.forEach(route => router.prefetch(route));
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
