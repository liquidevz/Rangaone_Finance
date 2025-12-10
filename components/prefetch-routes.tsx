"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch critical routes
    const routes = [
      "/login",
      "/signup",
      "/dashboard",
      "/cart",
      "/model-portfolios",
      "/recommendations/all",
      "/settings",
      "/videos-for-you",
      "/investment-calculator",
      "/rangaone-wealth",
    ];
    
    routes.forEach(route => router.prefetch(route));
  }, [router]);

  return null;
}
