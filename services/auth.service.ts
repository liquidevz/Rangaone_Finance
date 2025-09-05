// services/auth.service.ts
import axiosApi, { get, post } from "@/lib/axios";

interface SignupPayload {
  username: string;
  email: string;
  password: string;
  phone: string;
  mainUserId?: string;
}

interface LoginPayload {
  identifier: string; // Can be email, phone, or username
  password: string;
}

interface RefreshTokenPayload {
  refreshToken: string;
}

interface SignupResponse {
  message: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  provider: string;
  providerId?: string;
  mainUserId?: string;
  changedPasswordAt?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  phone?: string;
}

export const authService = {
  // Initialize authentication - sets up axios headers
  initializeAuth: (): void => {
    if (typeof window !== "undefined") {
      const token = authService.getAccessToken();
      if (token) {
        axiosApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
    }
  },

  // Authentication methods
  signup: async (payload: SignupPayload): Promise<SignupResponse> => {
    return await post<SignupResponse>("/auth/signup", payload, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  },

  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    try {
      const response = await post<LoginResponse>("/auth/login", payload, {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      return response;
    } catch (error: any) {
      // Handle specific error cases
      if (error?.response?.status === 401) {
        throw new Error("Invalid email/phone/username or password");
      } else if (error?.response?.status === 403) {
        throw new Error("Your account is banned or blocked");
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Call backend logout to invalidate tokens
      await post("/auth/logout", {}, {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getAccessToken()}`,
        },
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Don't throw error, just log it
    }
    
    // Always clear local tokens regardless of API call result
    authService.clearTokens();
  },

  // User profile method
  getCurrentUser: async (): Promise<UserProfile> => {
    return await get<UserProfile>("/api/user/profile", {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${authService.getAccessToken()}`,
      },
    });
  },

  // Token refresh method
  refreshTokens: async (): Promise<RefreshTokenResponse | null> => {
    const refreshToken = authService.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await post<RefreshTokenResponse>(
        "/auth/refresh",
        { refreshToken },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      // Store the new tokens using the same rememberMe preference
      const rememberMe = !!localStorage.getItem("refreshToken");
      authService.setTokens(
        response.accessToken,
        response.refreshToken,
        rememberMe
      );

      return response;
    } catch (error) {
      console.error("Failed to refresh tokens:", error);
      authService.clearTokens();
      return null;
    }
  },

  // Token management methods
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") {
      if (process.env.ACCESS_TOKEN) {
        return process.env.ACCESS_TOKEN;
      }
      return null;
    }

    try {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      if (!token) {
        return null;
      }

      return token;
    } catch (error) {
      console.error("Error retrieving access token:", error);
      return null;
    }
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") {
      if (process.env.REFRESH_TOKEN) {
        return process.env.REFRESH_TOKEN;
      }
      return null;
    }

    return (
      localStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refreshToken")
    );
  },

  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") {
      return !!process.env.ACCESS_TOKEN;
    }
    return !!(
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken")
    );
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },

  setTokens: (
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean = false
  ): void => {
    if (typeof window !== "undefined") {
      if (rememberMe) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
      } else {
        sessionStorage.setItem("accessToken", accessToken);
        sessionStorage.setItem("refreshToken", refreshToken);
      }

      // Update axios default headers
      axiosApi.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken}`;
    }
  },

  clearTokens: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");

      // Clear axios default headers
      delete axiosApi.defaults.headers.common["Authorization"];
    }
  },

  // Route management
  isPublicRoute: (path: string): boolean => {
    const publicRoutes = ["/", "/login", "/signup", "/contact-us"];
    return publicRoutes.includes(path) || path.startsWith("/auth/");
  },

  shouldRedirectToLogin: (path: string): boolean => {
    return !authService.isPublicRoute(path) && !authService.isAuthenticated();
  },

  shouldRedirectToDashboard: (path: string): boolean => {
    const authRoutes = ["/login", "/signup"];
    return authRoutes.includes(path) && authService.isAuthenticated();
  },

  // Get admin token for privileged operations
  getAdminToken: async (): Promise<string | null> => {
    try {
      const response = await post<LoginResponse>("/admin/login", {
        username: "anupm019@gmail.com",
        password: "anup"
      }, {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      return response.accessToken;
    } catch (error) {
      console.error("Failed to get admin token:", error);
      return null;
    }
  },
};