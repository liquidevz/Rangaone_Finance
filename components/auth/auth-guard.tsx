// components/auth/auth-guard.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-context";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Skip auth check during loading
    if (isLoading) return;

    // Define public routes that don't require authentication
    const publicRoutes = ["/", "/login", "/signup", "/contact-us", "/about-us", "/premium-subscription", "/basic-subscription", "/cart"];
    const currentPath = pathname || "/";
    const isPublicRoute = publicRoutes.includes(currentPath) || currentPath.startsWith("/auth/") || currentPath.startsWith("/policies/");

    // Define auth routes that should redirect to dashboard if authenticated
    const authRoutes = ["/login", "/signup"];
    const isAuthRoute = authRoutes.includes(currentPath);

    if (isAuthenticated && isAuthRoute) {
      // If user is authenticated and trying to access auth pages, redirect to dashboard
      router.replace("/dashboard");
      return;
    }

    if (!isAuthenticated && !isPublicRoute) {
      // If user is not authenticated and trying to access protected route
      // Redirect to login with the current path as redirectTo parameter
      const redirectUrl = encodeURIComponent(currentPath);
      router.replace(`/login?redirectTo=${redirectUrl}`);
      return;
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-[#001633] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Define public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/contact-us", "/about-us", "/premium-subscription", "/basic-subscription", "/cart"];
  const currentPath = pathname || "/";
  const isPublicRoute = publicRoutes.includes(currentPath) || currentPath.startsWith("/auth/") || currentPath.startsWith("/policies/");

  // If it's a public route or user is authenticated, render children
  if (isPublicRoute || isAuthenticated) {
    return <>{children}</>;
  }

  // If user is not authenticated and trying to access protected route,
  // the useEffect above will handle the redirect, so show loading
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="w-20 h-20 border-8 border-[#001633] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}