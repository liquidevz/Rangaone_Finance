import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from './logger';

interface RequestCache {
  promise: Promise<any>;
  timestamp: number;
}

class ApiClient {
  private instance: AxiosInstance;
  private pendingRequests = new Map<string, RequestCache>();
  private readonly DEDUP_WINDOW = 100; // 100ms deduplication window

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['Cache-Control'] = 'no-cache';
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.handleTokenRefresh();
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  }

  private async handleTokenRefresh() {
    // Token refresh logic
    if (typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${this.instance.defaults.baseURL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          const useLocalStorage = !!localStorage.getItem('refreshToken');
          if (useLocalStorage) {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
          } else {
            sessionStorage.setItem('accessToken', accessToken);
            sessionStorage.setItem('refreshToken', newRefreshToken);
          }
        } catch {
          this.clearAuth();
        }
      }
    }
  }

  private clearAuth() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    }
  }

  private getCacheKey(method: string, url: string, params?: any): string {
    return `${method}:${url}:${JSON.stringify(params || {})}`;
  }

  // Request deduplication - prevents duplicate API calls
  private async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const cached = this.pendingRequests.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.DEDUP_WINDOW) {
      logger.debug(`🔄 Deduplicating request: ${key}`);
      return cached.promise;
    }

    const promise = requestFn().finally(() => {
      setTimeout(() => this.pendingRequests.delete(key), this.DEDUP_WINDOW);
    });

    this.pendingRequests.set(key, { promise, timestamp: now });
    return promise;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const key = this.getCacheKey('GET', url, config?.params);
    return this.deduplicateRequest(key, async () => {
      const response = await this.instance.get<T>(url, config);
      return response.data;
    });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.rangaone.finance'
);
