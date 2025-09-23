// components/auth/auth-context.tsx
"use client";

import { authService, UserProfile } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { setRedirectHandler } from "@/lib/axios";
import { cartRedirectState } from "@/lib/cart-redirect-state";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profileComplete: boolean;
  missingFields: string[];
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const router = useRouter();

  // Set up redirect handler for axios
  useEffect(() => {
    setRedirectHandler((path) => {
      router.replace(path);
    });
  }, [router]);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Initialize axios headers
        authService.initializeAuth();

        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          const accessToken = authService.getAccessToken();
          
          // Check if token is expired
          if (accessToken && authService.isTokenExpired(accessToken)) {
            // Try to refresh token
            const refreshed = await authService.refreshTokens();
            if (!refreshed) {
              // Refresh failed, clear tokens
              authService.clearTokens();
              setIsAuthenticated(false);
              setUser(null);
              setIsLoading(false);
              return;
            }
          }

          // Fetch user profile
          try {
            const userProfile = await authService.getCurrentUser();
            setUser(userProfile);
            setIsAuthenticated(true);
            setProfileComplete(userProfile.profileComplete || false);
            setMissingFields(userProfile.missingFields || []);
          } catch (error) {
            console.error("Failed to fetch user profile:", error);
            // If profile fetch fails, user might be invalid
            authService.clearTokens();
            setIsAuthenticated(false);
            setUser(null);
            setProfileComplete(false);
            setMissingFields([]);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Handle cart redirect after authentication state changes
  useEffect(() => {
    if (isAuthenticated && !isLoading && cartRedirectState.hasPendingCartRedirect()) {
      cartRedirectState.clearPendingCartRedirect();
      setTimeout(() => router.push("/cart"), 100);
    }
  }, [isAuthenticated, isLoading, router]);

  const login = async (identifier: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      
      // Clear all caches before login
      const { subscriptionService } = await import('@/services/subscription.service');
      subscriptionService.clearCache();
      
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Call login API
      const response = await authService.login({ identifier, password });
      
      // Store tokens
      authService.setTokens(response.accessToken, response.refreshToken, rememberMe);
      
      // Fetch user profile
      const userProfile = await authService.getCurrentUser();
      
      // Update state atomically to avoid race conditions
      setUser(userProfile);
      setIsAuthenticated(true);
      setProfileComplete(userProfile.profileComplete || false);
      setMissingFields(userProfile.missingFields || []);
    } catch (error: any) {
      console.error("Login failed:", error);
      
      // Clear any existing tokens on login failure
      authService.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout API and clear tokens
      await authService.logout();
      
      // Clear all caches and storage
      const { subscriptionService } = await import('@/services/subscription.service');
      subscriptionService.clearCache();
      
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
      setProfileComplete(false);
      setMissingFields([]);
      
      // Redirect to home page
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
      
      // Still clear state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      setProfileComplete(false);
      setMissingFields([]);
      router.replace("/");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userProfile = await authService.getCurrentUser();
        setUser(userProfile);
        setIsAuthenticated(true);
        setProfileComplete(userProfile.profileComplete || false);
        setMissingFields(userProfile.missingFields || []);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // If refresh fails, clear authentication
      authService.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      setProfileComplete(false);
      setMissingFields([]);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    profileComplete,
    missingFields,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};