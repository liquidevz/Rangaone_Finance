import { authService } from "./auth.service";
import { get, post } from "@/lib/axios";
import { bundleService } from "./bundle.service";
import { externalSubscribeService } from "./external-subscribe.service";

// Interface definitions
interface UserSubscription {
  _id: string;
  user: string | { _id: string; username: string; email: string; [key: string]: any };
  productType: 'Portfolio' | 'Bundle';
  productId: string | { _id: string; name: string; category?: string; [key: string]: any };
  portfolio?: string | { _id: string; name: string; [key: string]: any };
  bundle?: { _id: string; name: string; category?: string };
  planType?: "monthly" | "quarterly" | "yearly";
  subscriptionType?: "regular" | "yearlyEmandate";
  eMandateId?: string;
  bundleId?: string;
  lastPaidAt?: string | null;
  isActive: boolean;
  expiryDate?: string;
  commitmentEndDate?: string;
  monthlyAmount?: number;
  createdAt: string;
  updatedAt: string;
}

interface UserSubscriptionsResponse {
  success: boolean;
  bundleSubscriptions: UserSubscription[];
  individualSubscriptions: UserSubscription[];
  totalSubscriptions: number;
  accessData: SubscriptionAccess;
}

export interface SubscriptionAccess {
  hasBasic: boolean;
  hasPremium: boolean;
  portfolioAccess: string[];
  subscriptionType: 'none' | 'basic' | 'premium' | 'individual';
}

interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  planType: string;
}

interface CreateEmandateResponse {
  success: boolean;
  commitmentEndDate: string;
  setupUrl: string;
  subscriptionId: string;
  amount: number;
  yearlyAmount: number;
  customerId: string;
  currency: string;
  nextSteps: string;
  status: string;
}

interface VerifyEmandateResponse {
  success: boolean;
  message: string;
  subscriptionStatus?: string;
  activatedSubscriptions?: number;
  nextSteps?: string;
}

// Service implementation
export const subscriptionService = {
  _subscriptionCache: null as UserSubscription[] | null,
  _accessCache: null as SubscriptionAccess | null,
  _cacheExpiry: 0,
  _currentEmandateId: null as string | null,

  clearCache() {
    this._subscriptionCache = null;
    this._accessCache = null;
    this._cacheExpiry = 0;
  },

  setCurrentEmandateId(emandateId: string) {
    this._currentEmandateId = emandateId;
    localStorage.setItem('currentEmandateId', emandateId);
  },

  getCurrentEmandateId(): string | null {
    return this._currentEmandateId || localStorage.getItem('currentEmandateId');
  },

  clearCurrentEmandateId() {
    this._currentEmandateId = null;
    localStorage.removeItem('currentEmandateId');
  },

  async forceRefresh(): Promise<SubscriptionAccess> {
    this.clearCache();
    return this.getSubscriptionAccess();
  },

  async createOrder(productType: string, productId: string, planType: string = "monthly"): Promise<CreateOrderResponse> {
    const token = authService.getAccessToken();
    if (!token) throw new Error("Authentication required");
    
    try {
      return await post<CreateOrderResponse>("/api/subscriptions/order", {
        productType, productId, planType
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error("Order creation failed", error);
      throw error;
    }
  },

  async createEmandate(productType: string, productId: string, emandateType: 'monthly' | 'quarterly' | 'yearly' = 'monthly', couponCode?: string): Promise<CreateEmandateResponse> {
    const token = authService.getAccessToken();
    if (!token) throw new Error("Authentication required");
    
    this.clearCurrentEmandateId();

    try {
      const response = await post<CreateEmandateResponse>("/api/subscriptions/emandate", {
        productType, productId, emandateType, couponCode
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (response.subscriptionId) {
        this.setCurrentEmandateId(response.subscriptionId);
      }

      this.clearCache();
      return response;
    } catch (error) {
      console.error("eMandate creation failed", error);
      throw error;
    }
  },

  verifyEmandate: async (
    subscriptionId?: string,
    polling: boolean = true
  ): Promise<VerifyEmandateResponse> => {
    try {
      const token = authService.getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const idToVerify = subscriptionId || subscriptionService.getCurrentEmandateId();
      if (!idToVerify) throw new Error("No subscription ID available for verification");

      // Configuration - Reduced timeouts
      const POLL_INTERVAL = 3000; // 3 seconds
      const MAX_POLL_DURATION = 60000; // 1 minute max
      const MAX_ATTEMPTS = MAX_POLL_DURATION / POLL_INTERVAL;

      let attempts = 0;
      let response: VerifyEmandateResponse;

      const makeVerificationRequest = async (): Promise<VerifyEmandateResponse> => {
        attempts++;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout per request
        
        try {
          const result = await post<VerifyEmandateResponse>("/api/subscriptions/emandate/verify", {
            subscription_id: idToVerify
          }, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'x-attempt': attempts.toString()
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return result;
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error('Request timed out');
          }
          throw error;
        }
      };

      // Initial request
      response = await makeVerificationRequest();

      // Polling logic with reduced duration
      if (polling && (response.subscriptionStatus === "pending" || 
          response.subscriptionStatus === "created")) {
        
        const poll = async (): Promise<VerifyEmandateResponse> => {
          while (attempts < MAX_ATTEMPTS) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            
            try {
              response = await makeVerificationRequest();
              
              // Exit conditions
              if (response.subscriptionStatus === "active" || 
                  response.subscriptionStatus === "authenticated") {
                return response;
              }
            } catch (error) {
              console.warn(`Polling attempt ${attempts} failed, retrying...`, error);
              // Continue polling even if individual requests fail
            }
          }
          
          // Timeout handling
          return {
            success: false,
            message: "Verification timed out after 1 minute. Please check your subscription status in settings.",
            subscriptionStatus: "timeout"
          };
        };

        const finalResponse = await poll();
        // On success, chain external subscribe calls with timeout
        if (finalResponse.success || ["active", "authenticated"].includes(finalResponse.subscriptionStatus || "")) {
          try {
            const { subscriptions } = await subscriptionService.getUserSubscriptions(true);
            const userProfile = await authService.getCurrentUser().catch(() => null as any);
            const email = userProfile?.email || "";
            const payloads = (subscriptions || []).map((sub: any) => {
              const productId = typeof sub.productId === 'string' ? sub.productId : sub.productId?._id;
              const productName = typeof sub.productId === 'object' ? sub.productId?.name : undefined;
              const expiration = sub.expiryDate || sub.commitmentEndDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
              return {
                email,
                product_id: productId,
                product_name: productName,
                expiration_datetime: expiration,
              };
            });
            if (externalSubscribeService.isConfigured() && payloads.length) {
              // Add timeout to external subscribe calls
              const subscribePromise = externalSubscribeService.subscribeMany(payloads);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Telegram link timeout')), 10000)
              );
              await Promise.race([subscribePromise, timeoutPromise]);
            }
          } catch (subscribeError) {
            console.error("External subscribe chaining failed (continuing anyway):", subscribeError);
            // Don't fail the entire verification for telegram link issues
          }
        }
        return finalResponse;
      }

      // Non-polling path; on success, chain external subscribe too
      if (response.success || ["active", "authenticated"].includes(response.subscriptionStatus || "")) {
        try {
          const { subscriptions } = await subscriptionService.getUserSubscriptions(true);
          const userProfile = await authService.getCurrentUser().catch(() => null as any);
          const email = userProfile?.email || "";
          const payloads = (subscriptions || []).map((sub: any) => {
            const productId = typeof sub.productId === 'string' ? sub.productId : sub.productId?._id;
            const productName = typeof sub.productId === 'object' ? sub.productId?.name : undefined;
            const expiration = sub.expiryDate || sub.commitmentEndDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
            return {
              email,
              product_id: productId,
              product_name: productName,
              expiration_datetime: expiration,
            };
          });
          if (externalSubscribeService.isConfigured() && payloads.length) {
            // Add timeout to external subscribe calls
            const subscribePromise = externalSubscribeService.subscribeMany(payloads);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Telegram link timeout')), 10000)
            );
            await Promise.race([subscribePromise, timeoutPromise]);
          }
        } catch (subscribeError) {
          console.error("External subscribe chaining failed (continuing anyway):", subscribeError);
          // Don't fail the entire verification for telegram link issues
        }
      }
      return response;
    } catch (error) {
      console.error("eMandate verification failed:", error);
      throw error;
    }
  },

  async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<any> {
    const token = authService.getAccessToken();
    if (!token) throw new Error("Authentication required");

    try {
      const response = await post("/api/subscriptions/verify", {
        paymentId, orderId, signature
      }, { headers: { Authorization: `Bearer ${token}` } });

      this.clearCache();

      // After successful verification, chain external subscribe calls
      if ((response as any)?.success) {
        try {
          const { subscriptions } = await subscriptionService.getUserSubscriptions(true);
          const userProfile = await authService.getCurrentUser().catch(() => null as any);
          const email = userProfile?.email || "";
          const payloads = (subscriptions || []).map((sub: any) => {
            const productId = typeof sub.productId === 'string' ? sub.productId : sub.productId?._id;
            const productName = typeof sub.productId === 'object' ? sub.productId?.name : undefined;
            const expiration = sub.expiryDate || sub.commitmentEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            return {
              email,
              product_id: productId,
              product_name: productName,
              expiration_datetime: expiration,
            };
          });
          if (externalSubscribeService.isConfigured() && payloads.length) {
            await externalSubscribeService.subscribeMany(payloads);
          }
        } catch (subscribeError) {
          console.error("External subscribe chaining after payment verification failed:", subscribeError);
        }
      }

      return response;
    } catch (error) {
      console.error("Payment verification failed", error);
      throw error;
    }
  },

  async cleanupOrphanedSubscriptions(): Promise<any> {
    const token = authService.getAccessToken();
    if (!token) throw new Error("Authentication required");

    try {
      const response = await post("/api/subscriptions/cleanup-orphaned", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.clearCache();
      return response;
    } catch (error) {
      console.error("Cleanup failed", error);
      throw error;
    }
  },

  async getUserSubscriptions(forceRefresh = false): Promise<{
    subscriptions: UserSubscription[];
    accessData: SubscriptionAccess;
  }> {
    const token = authService.getAccessToken();
    if (!token) return { 
      subscriptions: [], 
      accessData: { hasBasic: false, hasPremium: false, portfolioAccess: [], subscriptionType: 'none' }
    };

    const now = Date.now();
    if (!forceRefresh && this._subscriptionCache && this._accessCache && now < this._cacheExpiry) {
      return { 
        subscriptions: this._subscriptionCache, 
        accessData: this._accessCache 
      };
    }

    try {
      const response = await get<any>("/api/user/subscriptions", {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Handle new API response format
      let subscriptions: UserSubscription[] = [];
      let accessData: SubscriptionAccess;

      if (response.subscriptions) {
        // New format with subscriptions.eMandate and subscriptions.individual
        const eMandateSubscriptions = response.subscriptions.eMandate || [];
        const individualSubscriptions = response.subscriptions.individual || [];
        subscriptions = [...eMandateSubscriptions, ...individualSubscriptions];
        
        // Extract portfolio IDs from portfolio_access
        const portfolioAccess = (response.portfolio_access || []).map((p: any) => p._id);
        
        // Check for god mode - ONLY grant if explicitly true
        const isGodMode = response.godMode === true;
        
        console.log('🔍 API Response Debug:', {
          godMode: response.godMode,
          isGodMode,
          portfolio_access_count: response.portfolio_access?.length,
          portfolio_ids: portfolioAccess,
          has_basic: response.has_basic,
          premium_features: response.premium_features
        });
        
        accessData = {
          hasBasic: isGodMode ? true : (response.has_basic || false),
          hasPremium: isGodMode ? true : (response.premium_features || false),
          portfolioAccess,
          subscriptionType: isGodMode ? 'premium' : (response.premium_features ? 'premium' : (response.has_basic ? 'basic' : 'none'))
        };
        
        console.log('🎯 Final Access Data:', accessData);
      } else {
        // Old format fallback
        const bundleSubscriptions = response.bundleSubscriptions || [];
        const individualSubscriptions = response.individualSubscriptions || [];
        subscriptions = [...bundleSubscriptions, ...individualSubscriptions];
        
        accessData = response.accessData || {
          hasBasic: false,
          hasPremium: false,
          portfolioAccess: [],
          subscriptionType: 'none'
        };
      }
      
      this._subscriptionCache = subscriptions;
      this._accessCache = accessData;
      this._cacheExpiry = now + 60000; // 1 minute cache
      
      console.log('🎯 Access data from /api/user/subscriptions API:', accessData);
      console.log('🔑 Portfolio access array:', accessData.portfolioAccess);
      console.log('👑 God mode:', response.godMode);
      
      return { subscriptions, accessData };
    } catch (error) {
      console.error("Failed to fetch subscriptions", error);
      return { 
        subscriptions: [], 
        accessData: { hasBasic: false, hasPremium: false, portfolioAccess: [], subscriptionType: 'none' }
      };
    }
  },

  async getSubscriptionAccess(forceRefresh = false): Promise<SubscriptionAccess> {
    const now = Date.now();
    if (!forceRefresh && this._accessCache && now < this._cacheExpiry) {
      return this._accessCache;
    }

    // Get access data directly from the API
    const { accessData } = await this.getUserSubscriptions(forceRefresh);
    return accessData;
  },

  async hasPortfolioAccess(portfolioId: string): Promise<boolean> {
    const access = await this.getSubscriptionAccess();
    const hasAccess = access.portfolioAccess.includes(portfolioId);
    
    console.log(`🔍 Portfolio access check for ID "${portfolioId}":`, {
      portfolioId,
      portfolioAccessArray: access.portfolioAccess,
      isInArray: hasAccess,
      hasBasic: access.hasBasic,
      hasPremium: access.hasPremium
    });
    
    return hasAccess;
  },

  async hasBasicAccess(): Promise<boolean> {
    const access = await this.getSubscriptionAccess();
    return access.hasBasic || access.hasPremium;
  },

  async hasPremiumAccess(): Promise<boolean> {
    const access = await this.getSubscriptionAccess();
    return access.hasPremium;
  },

  async isGodMode(): Promise<boolean> {
    const { subscriptions, accessData } = await this.getUserSubscriptions();
    // Check if user has god mode access
    return accessData.subscriptionType === 'premium' && accessData.hasBasic && accessData.hasPremium && accessData.portfolioAccess.length > 0;
  },

  // Check if user can access tips (requires premium subscription)
  async canAccessTips(): Promise<boolean> {
    return await this.hasPremiumAccess();
  },

  // Debug method to check subscription status and tips access
  async debugSubscriptionAccess(): Promise<{
    subscriptions: UserSubscription[];
    access: SubscriptionAccess;
    canAccessTips: boolean;
    canAccessPremiumTips: boolean;
  }> {
    const { subscriptions, accessData: access } = await this.getUserSubscriptions(true);
    const canAccessTips = await this.canAccessTips();
    const canAccessPremiumTips = await this.hasPremiumAccess();
    
    console.log('🔍 Subscription Debug Info:', {
      subscriptions,
      access,
      canAccessTips,
      canAccessPremiumTips
    });
    
    return {
      subscriptions,
      access,
      canAccessTips,
      canAccessPremiumTips
    };
  },

  // Force refresh subscription data after payment
  async refreshAfterPayment(): Promise<void> {
    console.log('🔄 Refreshing subscription data after payment...');
    this.clearCache();
    // Force fresh fetch
    await this.getUserSubscriptions(true);
    console.log('✅ Subscription data refreshed');
  }
};

