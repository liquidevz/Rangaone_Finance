import { post, get } from "@/lib/axios";
import { authService } from "./auth.service";
import { externalSubscribeService } from "./external-subscribe.service";

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface CreateOrderPayload {
  productType: "Portfolio" | "Bundle";
  productId: string;
  planType?: "monthly" | "quarterly" | "yearly";
  subscriptionType?: "basic" | "premium" | "individual"; // Added for subscription type tracking
  amount?: number; // optional explicit amount for some flows
  items?: any[]; // optional breakdown payload (cart-like)
  couponCode?: string;
}

// Updated interface for cart checkout
export interface CartCheckoutPayload {
  planType: "monthly" | "quarterly" | "yearly";
  subscriptionType?: "basic" | "premium" | "individual"; // Added for subscription type tracking
  couponCode?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  planType?: string;
  receipt?: string;
}

export interface CreateEMandateResponse {
  subscriptionId: string; // This is actually the emandateId in the database
}

export interface VerifyPaymentPayload {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  currentStatus?: string;
  statusDetails?: any;
}

export interface PaymentHistory {
  _id: string;
  user: string;
  portfolio?: {
    _id: string;
    name: string;
  };
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed" | "captured";
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    fullName: string;
  };
  portfolio?: {
    _id: string;
    name: string;
    PortfolioCategory: string;
  };
  productId: {
    _id: string;
    name: string;
    PortfolioCategory: string;
  };
  isActive: boolean;
  productType: "Portfolio" | "Bundle";
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export const paymentService = {
  // Create order for single product with duplicate prevention
  createOrder: async (
    payload: CreateOrderPayload
  ): Promise<CreateOrderResponse> => {
    const token = authService.getAccessToken();

    // Check for duplicate order creation
    const orderKey = `order_${payload.productId}_${payload.planType}`;
    const existingOrder = localStorage.getItem(orderKey);
    if (existingOrder) {
      const cached = JSON.parse(existingOrder);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        console.log("Preventing duplicate order creation");
        throw new Error("Order already in progress. Please wait or refresh the page.");
      }
    }

    console.log("Payment service - creating order with payload:", payload);

    try {
      const response = await post<CreateOrderResponse>(
        "/api/subscriptions/order",
        payload,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Cache order creation to prevent duplicates
      localStorage.setItem(orderKey, JSON.stringify({
        orderId: response.orderId,
        timestamp: Date.now()
      }));
      
      return response;
    } catch (error: any) {
      // Clear cache on error to allow retry
      localStorage.removeItem(orderKey);
      throw error;
    }
  },

  // Updated cart checkout to include planType and subscriptionType
  cartCheckout: async (
    payload: CartCheckoutPayload
  ): Promise<CreateOrderResponse> => {
    const token = authService.getAccessToken();

    if (!token) {
      throw new Error("Authentication required. Please login first.");
    }

    console.log("Payment service - cart checkout with payload:", payload);

    try {
      return await post<CreateOrderResponse>(
        "/api/subscriptions/checkout",
        payload,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error: any) {
      if (error?.response?.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },

  // Cart checkout with eMandate for yearly and quarterly subscriptions
  cartCheckoutEmandate: async (cartData: any): Promise<CreateEMandateResponse> => {
    const token = authService.getAccessToken();

    console.log("Payment service - cart checkout with eMandate", cartData);

    return await post<CreateEMandateResponse>(
      "/api/subscriptions/emandate",
      cartData,
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  // Verify payment with timeout and duplicate prevention
  verifyPayment: async (
    payload: VerifyPaymentPayload
  ): Promise<VerifyPaymentResponse> => {
    const token = authService.getAccessToken();
    
    // Check for duplicate verification attempts
    const verificationKey = `verification_${payload.orderId}_${payload.paymentId}`;
    const existingVerification = localStorage.getItem(verificationKey);
    if (existingVerification) {
      const cached = JSON.parse(existingVerification);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        console.log("Using cached verification result");
        return cached.result;
      }
    }
    
    console.log("Verifying payment with payload:", {
      orderId: payload.orderId,
      paymentId: payload.paymentId,
      signatureLength: payload.signature?.length || 0
    });

    try {
      // Add timeout to verification request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await post<VerifyPaymentResponse>(
        "/api/subscriptions/verify",
        payload,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      console.log("Verification response:", response);

      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response has success field, use it
        if (typeof response.success !== 'undefined') {
          // Cache successful verification
          if (response.success) {
            localStorage.setItem(verificationKey, JSON.stringify({
              result: response,
              timestamp: Date.now()
            }));
            
            // On success, post purchased subscriptions to external subscribe API with timeout
            try {
              const { subscriptionService } = await import('./subscription.service');
              await subscriptionService.refreshAfterPayment();
              const userProfile = await authService.getCurrentUser().catch(() => null as any);
              const email = userProfile?.email || "";
              const { subscriptions } = await subscriptionService.getUserSubscriptions(true);
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
                // Add timeout to external subscribe calls
                const subscribePromise = externalSubscribeService.subscribeMany(payloads);
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Telegram link timeout')), 15000)
                );
                await Promise.race([subscribePromise, timeoutPromise]);
              }
            } catch (e) {
              console.error('External subscribe chaining failed (continuing anyway):', e);
              // Don't fail the entire verification for telegram link issues
            }
          }
          return response;
        }
        
        // If response doesn't have success field but has data, assume success
        if (Object.keys(response).length > 0) {
          const successResponse = {
            success: true,
            message: "Payment verified successfully"
          };
          localStorage.setItem(verificationKey, JSON.stringify({
            result: successResponse,
            timestamp: Date.now()
          }));
          return successResponse;
        }
      }
      
      // If we get here, response format is unexpected
      console.warn("Unexpected verification response format:", response);
      return {
        success: true,
        message: "Payment verification completed"
      };
      
    } catch (error: any) {
      console.error("Payment verification request failed:", error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: "Verification timed out. Please try again."
        };
      }
      
      return {
        success: false,
        message: `Verification failed: ${error.message}`
      };
    }
  },

  // Get payment history
  getPaymentHistory: async (): Promise<PaymentHistory[]> => {
    const token = authService.getAccessToken();
    return await post<PaymentHistory[]>(
      "/api/subscriptions/history",
      {},
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  // Get user's active subscriptions
  getUserSubscriptions: async (): Promise<UserSubscription[]> => {
    const token = authService.getAccessToken();
    const response = await get<{
      bundleSubscriptions: UserSubscription[];
      individualSubscriptions: UserSubscription[];
      accessData: any;
    }>(
      "/api/user/subscriptions",
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    // Combine both subscription arrays for backward compatibility
    return [...(response.bundleSubscriptions || []), ...(response.individualSubscriptions || [])];
  },

  // Load Razorpay script
  loadRazorpayScript: (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  // Enhanced Razorpay checkout with better error handling and debugging
  openCheckout: async (
    orderData: CreateOrderResponse | CreateEMandateResponse,
    userInfo: { name: string; email: string },
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void
  ): Promise<void> => {
    const isLoaded = await paymentService.loadRazorpayScript();

    if (!isLoaded) {
      onFailure(new Error("Failed to load Razorpay SDK"));
      return;
    }

    // Get the Razorpay key with proper fallback and validation
    const razorpayKey =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY ||
      "rzp_test_fxQtWo40gGB277";

    console.log("Using Razorpay Key:", razorpayKey?.substring(0, 8) + "...");
    console.log("Order data for Razorpay:", orderData);

    // Validate required data
    const orderId =
      "orderId" in orderData ? orderData.orderId : orderData.subscriptionId;

    if (!orderId) {
      onFailure(
        new Error("Invalid order data: missing orderId or subscriptionId")
      );
      return;
    }

    const options = {
      key: razorpayKey,
      name: "RangaOne Finwala",
      description: `${
        "planType" in orderData ? orderData.planType || "Monthly" : "Monthly"
      } Subscription Payment`,
      ...("subscriptionId" in orderData
        ? { 
            subscription_id: orderData.subscriptionId,
            recurring: 1
          }
        : {
            order_id: orderData.orderId,
            amount: orderData.amount,
            currency: orderData.currency,
          }),
      prefill: {
        name: userInfo.name,
        email: userInfo.email,
      },
      theme: {
        color: "#001633",
      },
      modal: {
        ondismiss: () => {
          console.log("Payment modal dismissed by user");
          // Close the Razorpay modal properly
          setTimeout(() => {
            onFailure(new Error("Payment cancelled by user"));
          }, 100);
        },
      },
      handler: (response: any) => {
        console.log("Payment successful:", response);
        // Close the Razorpay modal properly before calling success
        setTimeout(() => {
          onSuccess(response);
        }, 100);
      },
    };

    console.log("🔍 RAZORPAY OPTIONS:", {
      ...options,
      key: options.key.substring(0, 8) + "...", // Hide full key in logs
    });
    
    if ("subscriptionId" in orderData) {
      console.log("🔍 SUBSCRIPTION ID:", orderData.subscriptionId);
      console.log("🔍 SUBSCRIPTION ID TYPE:", typeof orderData.subscriptionId);
      console.log("🔍 SUBSCRIPTION ID LENGTH:", orderData.subscriptionId?.length);
    }

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        // Close the Razorpay modal properly before calling failure
        setTimeout(() => {
          onFailure(
            new Error(
              `Payment failed: ${response.error.description || "Unknown error"}`
            )
          );
        }, 100);
      });

      razorpay.open();
    } catch (error) {
      console.error("Error opening Razorpay checkout:", error);
      onFailure(error);
    }
  },

  // Added utility method to test Razorpay configuration
  testRazorpayConfig: async (): Promise<boolean> => {
    try {
      const isLoaded = await paymentService.loadRazorpayScript();
      if (!isLoaded) {
        console.error("Razorpay script failed to load");
        return false;
      }

      const razorpayKey =
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY ||
        "rzp_test_fxQtWo40gGB277";

      if (!razorpayKey || !razorpayKey.startsWith("rzp_")) {
        console.error(
          "Invalid Razorpay key format:",
          razorpayKey?.substring(0, 8) + "..."
        );
        return false;
      }

      console.log("Razorpay configuration is valid");
      return true;
    } catch (error) {
      console.error("Error testing Razorpay config:", error);
      return false;
    }
  },

  // Clear duplicate prevention caches
  clearDuplicatePreventionCaches: (): void => {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => 
      key.startsWith('order_') || 
      key.startsWith('emandate_') || 
      key.startsWith('verification_') || 
      key.startsWith('emandate_verification_')
    );
    
    cacheKeys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${cacheKeys.length} duplicate prevention cache entries`);
  },

  // Check if user has active pending transactions
  hasPendingTransactions: (): boolean => {
    const keys = Object.keys(localStorage);
    const pendingKeys = keys.filter(key => 
      (key.startsWith('order_') || key.startsWith('emandate_')) &&
      !key.includes('verification_')
    );
    
    return pendingKeys.some(key => {
      try {
        const cached = JSON.parse(localStorage.getItem(key) || '{}');
        return Date.now() - cached.timestamp < 300000; // 5 minutes
      } catch {
        return false;
      }
    });
  },

  createEmandate: async (
    payload: CreateOrderPayload
  ): Promise<CreateEMandateResponse> => {
    const token = authService.getAccessToken();

    // Check for duplicate eMandate creation
    const emandateKey = `emandate_${payload.productId}_${payload.planType}`;
    const existingEmandate = localStorage.getItem(emandateKey);
    if (existingEmandate) {
      const cached = JSON.parse(existingEmandate);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        console.log("Preventing duplicate eMandate creation");
        throw new Error("eMandate already in progress. Please wait or refresh the page.");
      }
    }

    // Transform payload to match backend API expectations
    const emandatePayload = {
      productType: payload.productType,
      productId: payload.productId,
      emandateType: payload.planType || "monthly",
      ...(payload.amount && { amount: payload.amount }),
      ...(payload.couponCode && { couponCode: payload.couponCode })
    };

    console.log("🔍 EMANDATE PAYLOAD BEING SENT:", JSON.stringify(emandatePayload, null, 2));

    try {
      const response = await post<CreateEMandateResponse>(
        "/api/subscriptions/emandate",
        emandatePayload,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("eMandate creation response:", response);
      
      // Cache eMandate creation to prevent duplicates
      localStorage.setItem(emandateKey, JSON.stringify({
        subscriptionId: response?.subscriptionId,
        timestamp: Date.now()
      }));
      
      return response;
    } catch (error: any) {
      // Clear cache on error to allow retry
      localStorage.removeItem(emandateKey);
      console.error("🚨 EMANDATE ERROR:", error?.response?.data?.message || error?.message);
      throw error;
    }
  },

  // Verify eMandate after customer authorization
  verifyEmandate: async (subscriptionId: string): Promise<VerifyPaymentResponse> => {
    const token = authService.getAccessToken();
    console.log("Payment service - verifying emandate for subscription:", subscriptionId);

    try {
      // Correct payload structure for eMandate verification
      const verifyPayload = {
        subscription_id: subscriptionId  // This should be the emandateId from the database
      };

      console.log("eMandate verification payload:", verifyPayload);

      const response = await post<VerifyPaymentResponse>(
        "/api/subscriptions/emandate/verify",
        verifyPayload,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("eMandate verification response:", response);
      
      // Refresh subscription data if verification was successful
      if (response.success) {
        try {
          const { subscriptionService } = await import('./subscription.service');
          await subscriptionService.refreshAfterPayment();
          // Chain external subscribe API calls
          try {
            const userProfile = await authService.getCurrentUser().catch(() => null as any);
            const email = userProfile?.email || "";
            const { subscriptions } = await subscriptionService.getUserSubscriptions(true);
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
              await externalSubscribeService.subscribeMany(payloads);
            }
          } catch (subscribeError) {
            console.error('External subscribe chaining after verifyEmandate failed:', subscribeError);
          }
        } catch (error) {
          console.error('Failed to refresh subscription data:', error);
        }
      }
      
      return response;
      
    } catch (error: any) {
      console.error("eMandate verification failed:", error);
      
      // Handle specific HTTP status codes
      if (error.response?.status === 403) {
        return {
          success: false,
          message: "eMandate verification failed: Unauthorized eMandate verification - No matching subscriptions found"
        };
      }
      
      if (error.response?.status === 404) {
        return {
          success: false,
          message: "eMandate verification failed: Subscription not found"
        };
      }
      
      if (error.response?.status === 400) {
        return {
          success: false,
          message: "eMandate verification failed: Invalid eMandate data or setup incomplete"
        };
      }
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      
      return {
        success: false,
        message: `eMandate verification failed: ${errorMessage}`
      };
    }
  },

  // Verify eMandate with timeout and duplicate prevention
  verifyEmandateWithRetry: async (subscriptionId: string, maxRetries: number = 3): Promise<VerifyPaymentResponse> => {
    console.log(`Starting eMandate verification with retry for subscription: ${subscriptionId}`);
    
    // Check for duplicate verification attempts
    const verificationKey = `emandate_verification_${subscriptionId}`;
    const existingVerification = localStorage.getItem(verificationKey);
    if (existingVerification) {
      const cached = JSON.parse(existingVerification);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        console.log("Using cached eMandate verification result");
        return cached.result;
      }
    }
    
    let retryCount = 0;
    let retryDelay = 2000; // Start with 2 seconds
    const maxTotalTime = 60000; // Maximum 1 minute total
    const startTime = Date.now();
    
    while (retryCount < maxRetries && (Date.now() - startTime) < maxTotalTime) {
      retryCount++;
      console.log(`eMandate verification attempt ${retryCount}/${maxRetries}`);
      
      try {
        const response = await paymentService.verifyEmandate(subscriptionId);
        
        if (response.success) {
          console.log(`✅ eMandate verification successful on attempt ${retryCount}`);
          // Cache successful verification
          localStorage.setItem(verificationKey, JSON.stringify({
            result: response,
            timestamp: Date.now()
          }));
          return response;
        }
        
        // If it's a "No matching subscriptions found" error and we have retries left
        if (response.message.includes("No matching subscriptions found") && retryCount < maxRetries) {
          console.log(`Retry ${retryCount} failed, waiting ${retryDelay}ms before next attempt`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay = Math.min(retryDelay * 1.5, 5000); // Cap at 5 seconds
          continue;
        }
        
        // For other errors, return immediately
        console.log(`❌ eMandate verification failed after ${retryCount} attempts`);
        return response;
        
      } catch (error: any) {
        console.error(`Attempt ${retryCount} failed with error:`, error);
        if (retryCount >= maxRetries) {
          return {
            success: false,
            message: "eMandate verification failed due to network issues. Please try again."
          };
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay = Math.min(retryDelay * 1.5, 5000);
      }
    }
    
    // Timeout reached
    return {
      success: false,
      message: "eMandate verification timed out. Please contact support if payment was deducted."
    };
  },
};
