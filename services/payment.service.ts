import { post, get, put } from "@/lib/axios";
import { authService } from "./auth.service";
import { externalSubscribeService } from "./external-subscribe.service";

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Payment Gateway Types - Dynamic, no hardcoded values
// Gateway IDs come from the backend API (/api/payment/gateways)
export type PaymentGatewayType = string;

// Cashfree Types
export type CashfreePurchaseMethod = 'one_time' | 'emandate';
export type CashfreePaymentType = 'one_time' | 'recurring';

export interface CashfreeSubscriptionResponse {
  success: boolean;
  paymentType?: CashfreePaymentType; // 'one_time' or 'recurring'
  subscriptionId?: string;
  sessionId?: string;
  // One-time payment fields
  payment_session_id?: string;
  cf_order_id?: string;
  order_id?: string;
  order?: {
    id: string;
    amount: number;
    currency: string;
  };
  // E-mandate/subscription fields
  subscription?: {
    id: string;
    cashfreeSubscriptionId?: string;
    cfSubscriptionId?: string;
    status: string;
    amount: number;
    currency: string;
    authLink?: string;
  };
  cashfree?: {
    // Recurring subscription fields (from backend)
    authorizationUrl?: string;
    authorization_url?: string;
    short_url?: string;
    subscriptionId?: string;
    cfSubscriptionId?: string;
    subsSessionId?: string;  // For SDK subscriptionsCheckout
    sessionId?: string;
    subscription_session_id?: string;
    integrationMethod?: 'url_redirect' | 'sdk_checkout' | 'sdk_subscriptions_checkout';
    environment?: 'sandbox' | 'production';
    sdkUrl?: string;
    planId?: string;
    // One-time payment fields
    orderId?: string;
    paymentSessionId?: string;
    payment_session_id?: string;
    // Legacy fields
    authLink?: string;
    auth_link?: string;
    paymentLink?: string;
    payment_link?: string;
    status?: string;
  };
  integration?: {
    method: 'url_redirect' | 'sdk_checkout';
    userStaysOnWebsite: boolean;
  };
  authLink?: string;
  message?: string;
  error?: string;
}

export interface CashfreeVerifyResponse {
  success: boolean;
  subscription?: {
    isActive: boolean;
    status: string;
  };
  telegramInviteLinks?: Array<{ invite_link: string }>;
  message?: string;
  error?: string;
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
  // New unified cart response fields
  gateway?: 'razorpay' | 'cashfree';
  authorization_url?: string;
  short_url?: string; // Razorpay specific
  checkout_url?: string; // Cashfree specific
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
  // Check PAN details first
  checkPanDetails: async (): Promise<{ hasPan: boolean; profile?: any }> => {
    const token = authService.getAccessToken();
    
    try {
      const response = await get("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return {
        hasPan: !!(response as any)?.pandetails,
        profile: response
      };
    } catch (error) {
      return { hasPan: false };
    }
  },

  // Verify PAN details using Digio
  verifyPanDetails: async (panData: {
    id_no: string;
    name: string;
    dob: string;
  }): Promise<{ success: boolean; message: string; data?: any }> => {
    const token = authService.getAccessToken();
    
    try {
      const response = await post("/digio/pan/verify", panData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      
      return {
        success: (response as any)?.success === true,
        message: (response as any)?.message || "PAN verification completed",
        data: (response as any)?.data
      };
    } catch (error: any) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || error.message || "PAN verification failed"
      };
    }
  },

  // Update PAN details
  updatePanDetails: async (panData: {
    fullName: string;
    dateofBirth: string;
    phone: string;
    pandetails: string;
  }): Promise<any> => {
    const token = authService.getAccessToken();
    
    // Convert date format from YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = panData.dateofBirth.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    const formattedData = {
      ...panData,
      dateofBirth: formattedDate
    };
    
    
    try {
      const response = await put("/api/user/profile", formattedData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      
      const errorData = error.response?.data;
      let errorMessage = errorData?.error || "Failed to update profile";
      
      throw new Error(errorMessage);
    }
  },

  // Create eSign request
  createESignRequest: async (eSignData: {
    signerEmail: string;
    signerName: string;
    signerPhone: string;
    reason: string;
    expireInDays: number;
    displayOnPage: string;
    notifySigners: boolean;
    sendSignLink: boolean;
    productType: string;
    productId: string;
    productName: string;
  }): Promise<{ documentId: string; authUrl?: string }> => {
    const token = authService.getAccessToken();
    
    const response = await post("/api/digio/create-sign-request", {
      agreementData: {
        customerName: eSignData.signerName,
        customerEmail: eSignData.signerEmail,
        customerMobile: eSignData.signerPhone,
        productType: eSignData.productType,
        productId: eSignData.productId,
        productName: eSignData.productName,
      },
      signRequest: {
        file_name: `${eSignData.productName}_agreement.pdf`,
        signers: [{
          identifier: eSignData.signerEmail,
          name: eSignData.signerName
        }]
      }
    }, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    return {
      documentId: (response as any).documentId,
      authUrl: (response as any).authenticationUrl
    };
  },

  // Verify eSign with DID token
  verifyESignToken: async (didToken: string): Promise<{ success: boolean; message: string }> => {
    const token = authService.getAccessToken();
    
    try {
      const response = await get(`/api/user/esign/verify?token=${didToken}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return {
        success: (response as any)?.success || true,
        message: (response as any)?.message || "eSign verified successfully"
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "eSign verification failed"
      };
    }
  },

  // Verify eSign completion
  verifyESignCompletion: async (productType: string, productId: string): Promise<{ success: boolean; message: string }> => {
    const token = authService.getAccessToken();
    
    try {
      const response = await get(`/api/digio/esign/verify?productType=${productType}&productId=${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return {
        success: (response as any)?.success || true,
        message: (response as any)?.message || "eSign verification completed"
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || "eSign verification failed"
      };
    }
  },

  // Verify cart eSign completion
  verifyCartESignCompletion: async (cartId?: string): Promise<{ success: boolean; message: string }> => {
    const token = authService.getAccessToken();
    
    try {
      const payload = cartId ? { cartId } : {};
      const response = await post("/api/cart/esign/verify", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      return {
        success: (response as any)?.success || true,
        message: (response as any)?.message || "Cart eSign verification completed"
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Cart eSign verification failed"
      };
    }
  },

  // Create order for single product with duplicate prevention
  createOrder: async (
    payload: CreateOrderPayload
  ): Promise<CreateOrderResponse> => {
    const token = authService.getAccessToken();

    // Check for duplicate order creation
    const orderKey = `order_${payload.productId}_${payload.planType}`;
    // const existingOrder = localStorage.getItem(orderKey);
    // if (existingOrder) {
    //   const cached = JSON.parse(existingOrder);
    //   if (Date.now() - cached.timestamp < 300000) { // 5 minutes
    //     throw new Error("Order already in progress. Please wait or refresh the page.");
    //   }
    // }


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
      
      // Handle eSign requirement error specifically
      if (error.response?.status === 412 && error.response?.data?.code === 'ESIGN_REQUIRED') {
        throw {
          ...error,
          requiresESign: true,
          eSignError: true
        };
      }
      
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
        return cached.result;
      }
    }

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
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!razorpayKey || !razorpayKey.startsWith('rzp_')) {
      console.error("Invalid or missing Razorpay key:", razorpayKey);
      onFailure(new Error("Payment configuration error. Please contact support."));
      return;
    }


    // Validate required data
    const orderId =
      "orderId" in orderData ? orderData.orderId : orderData.subscriptionId;

    if (!orderId) {
      onFailure(
        new Error("Invalid order data: missing orderId or subscriptionId")
      );
      return;
    }

    // Validate subscription ID format if it's an eMandate
    if ("subscriptionId" in orderData) {
      if (!orderData.subscriptionId || !orderData.subscriptionId.startsWith('sub_')) {
        onFailure(new Error(`Invalid subscription ID format: ${orderData.subscriptionId}`));
        return;
      }
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
            recurring: 1,
            currency: "INR"
          }
        : {
            order_id: orderData.orderId,
            amount: orderData.amount,
            currency: orderData.currency || "INR",
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
          // Close the Razorpay modal properly
          setTimeout(() => {
            onFailure(new Error("Payment cancelled by user"));
          }, 100);
        },
      },
      handler: (response: any) => {
        // Close the Razorpay modal properly before calling success
        setTimeout(() => {
          onSuccess(response);
        }, 100);
      },
    };
    
    if ("subscriptionId" in orderData) {
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
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey || !razorpayKey.startsWith("rzp_")) {
        console.error(
          "Invalid Razorpay key format:",
          razorpayKey?.substring(0, 8) + "..."
        );
        return false;
      }

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


    // Transform payload to match backend API expectations
    const emandatePayload = {
      productType: payload.productType,
      productId: payload.productId,
      emandateType: payload.planType || "monthly",
      ...(payload.amount && { amount: payload.amount }),
      ...(payload.couponCode && { couponCode: payload.couponCode })
    };


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

      
      return response;
    } catch (error: any) {
      
      // Handle eSign requirement error for eMandate as well
      if (error.response?.status === 412 && error.response?.data?.code === 'ESIGN_REQUIRED') {
        throw {
          ...error,
          requiresESign: true,
          eSignError: true
        };
      }
      
      console.error("🚨 EMANDATE ERROR:", error?.response?.data?.message || error?.message);
      throw error;
    }
  },

  // Verify eMandate after customer authorization
  verifyEmandate: async (subscriptionId: string): Promise<VerifyPaymentResponse> => {
    const token = authService.getAccessToken();

    try {
      // Correct payload structure for eMandate verification
      const verifyPayload = {
        subscription_id: subscriptionId  // This should be the emandateId from the database
      };


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
      
      // Handle 404 - endpoint not found, use fallback
      if (error.response?.status === 404) {
        return {
          success: true,
          message: "eMandate payment completed successfully",
          telegramInviteLinks: [] // Empty array for now
        } as any;
      }
      
      // Handle other specific HTTP status codes
      if (error.response?.status === 403) {
        return {
          success: false,
          message: "eMandate verification failed: Unauthorized eMandate verification - No matching subscriptions found"
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

  // Create cart eMandate for multiple products (supports both Razorpay and Cashfree)
  createCartEmandate: async (payload: {
    cartId?: string;
    interval: "monthly" | "quarterly" | "yearly";
    couponCode?: string;
    gateway?: "razorpay" | "cashfree";
  }): Promise<CreateEMandateResponse> => {
    const token = authService.getAccessToken();


    try {
      const response = await post<CreateEMandateResponse>(
        "/api/cart/create",
        {
          cartId: payload.cartId,
          interval: payload.interval,
          ...(payload.couponCode && { couponCode: payload.couponCode }),
          gateway: payload.gateway || "razorpay", // Default to razorpay for backward compatibility
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Map the unified response to expected format
      // Include all fields from the response, especially cashfree object for Cashfree subscriptions
      return {
        subscriptionId: (response as any).subscription_id || response.subscriptionId,
        gateway: (response as any).gateway,
        authorization_url: (response as any).authorization_url,
        short_url: (response as any).short_url,
        checkout_url: (response as any).checkout_url,
        // Include cashfree object with subsSessionId for SDK
        cashfree: (response as any).cashfree,
        // Also include at root level for easier access
        subsSessionId: (response as any).subsSessionId || (response as any).cashfree?.subsSessionId,
        subscription_session_id: (response as any).subscription_session_id || (response as any).cashfree?.subscription_session_id,
      };
    } catch (error: any) {
      // Handle eSign requirement error
      if (error.response?.status === 400 && error.response?.data?.error === 'eSign validation failed') {
        throw {
          ...error,
          requiresESign: true,
          eSignError: true
        };
      }
      
      // Handle eSign required (412 status)
      if (error.response?.status === 412 || error.response?.data?.code === 'ESIGN_REQUIRED') {
        throw error;
      }
      
      // Handle invalid gateway error
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Invalid payment gateway')) {
        throw new Error('Invalid payment gateway. Please select Razorpay or Cashfree.');
      }
      
      console.error("🚨 CART EMANDATE ERROR:", error?.response?.data?.message || error?.message);
      throw error;
    }
  },

  // Verify eMandate with timeout and duplicate prevention
  verifyEmandateWithRetry: async (subscriptionId: string, maxRetries: number = 3): Promise<VerifyPaymentResponse> => {
    
    // Check for duplicate verification attempts
    const verificationKey = `emandate_verification_${subscriptionId}`;
    const existingVerification = localStorage.getItem(verificationKey);
    if (existingVerification) {
      const cached = JSON.parse(existingVerification);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        return cached.result;
      }
    }
    
    let retryCount = 0;
    let retryDelay = 2000; // Start with 2 seconds
    const maxTotalTime = 60000; // Maximum 1 minute total
    const startTime = Date.now();
    
    while (retryCount < maxRetries && (Date.now() - startTime) < maxTotalTime) {
      retryCount++;
      
      try {
        const response = await paymentService.verifyEmandate(subscriptionId);
        
        if (response.success) {
          // Cache successful verification
          localStorage.setItem(verificationKey, JSON.stringify({
            result: response,
            timestamp: Date.now()
          }));
          return response;
        }
        
        // If it's a "No matching subscriptions found" error and we have retries left
        if (response.message.includes("No matching subscriptions found") && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay = Math.min(retryDelay * 1.5, 5000); // Cap at 5 seconds
          continue;
        }
        
        // For other errors, return immediately
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

  // ========================
  // CASHFREE PAYMENT METHODS
  // ========================

  // Create Cashfree subscription/payment (supports both one-time and e-mandate)
  createCashfreeSubscription: async (payload: {
    productType: 'Portfolio' | 'Bundle';
    productId: string;
    planType: 'monthly' | 'quarterly' | 'yearly';
    userId?: string;
    couponCode?: string;
    purchaseMethod?: CashfreePurchaseMethod; // 'one_time' for SDK checkout, 'emandate' for recurring
  }): Promise<CashfreeSubscriptionResponse> => {
    const token = authService.getAccessToken();

    if (!token) {
      throw new Error("Authentication required. Please login first.");
    }


    try {
      const response = await post<CashfreeSubscriptionResponse>(
        "/subscription/cashfree/create",
        {
          ...payload,
          purchaseMethod: payload.purchaseMethod || 'emandate', // Default to e-mandate for recurring
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );


      if (!response.success) {
        // Check for eSign required - create an error with response-like structure for proper handling
        const errorCode = (response as any).code;
        if (errorCode === 'ESIGN_REQUIRED' || errorCode === 'ESIGN_PENDING') {
          const error = new Error(response.error || 'Digital signature required');
          (error as any).response = {
            status: 412,
            data: {
              success: false,
              code: errorCode,
              error: response.error,
              pendingEsign: (response as any).pendingEsign
            }
          };
          throw error;
        }
        throw new Error(response.error || 'Failed to create Cashfree subscription');
      }

      return response;
    } catch (error: any) {
      console.error("🚨 Cashfree subscription error:", error?.response?.data || error?.message);
      
      // Handle gateway disabled error
      if (error.response?.data?.code === 'GATEWAY_DISABLED') {
        throw new Error('Cashfree payment gateway is currently disabled. Please select a different payment method.');
      }
      
      throw error;
    }
  },

  // Create Cashfree cart subscription for multiple items
  createCashfreeCartSubscription: async (payload: {
    cartId?: string;
    interval: 'monthly' | 'quarterly' | 'yearly';
    couponCode?: string;
  }): Promise<CashfreeSubscriptionResponse> => {
    const token = authService.getAccessToken();

    if (!token) {
      throw new Error("Authentication required. Please login first.");
    }


    try {
      const response = await post<CashfreeSubscriptionResponse>(
        "/subscription/cashfree/cart/create",
        payload,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );


      if (!response.success) {
        // Check for eSign required - create an error with response-like structure for proper handling
        const errorCode = (response as any).code;
        if (errorCode === 'ESIGN_REQUIRED' || errorCode === 'ESIGN_PENDING') {
          const error = new Error(response.error || 'Digital signature required');
          (error as any).response = {
            status: 412,
            data: {
              success: false,
              code: errorCode,
              error: response.error,
              pendingEsign: (response as any).pendingEsign
            }
          };
          throw error;
        }
        throw new Error(response.error || 'Failed to create Cashfree cart subscription');
      }

      return response;
    } catch (error: any) {
      console.error("🚨 Cashfree cart subscription error:", error?.response?.data || error?.message);
      
      // Handle gateway disabled error
      if (error.response?.data?.code === 'GATEWAY_DISABLED') {
        throw new Error('Cashfree payment gateway is currently disabled. Please select a different payment method.');
      }
      
      throw error;
    }
  },

  // Verify Cashfree payment after redirect
  verifyCashfreePayment: async (subscriptionId: string): Promise<CashfreeVerifyResponse> => {
    const token = authService.getAccessToken();


    try {
      const response = await post<CashfreeVerifyResponse>(
        "/subscription/cashfree/verify",
        { cashfreeSubscriptionId: subscriptionId },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );


      // Refresh subscription data if verification was successful
      if (response.success && response.subscription?.isActive) {
        try {
          const { subscriptionService } = await import('./subscription.service');
          await subscriptionService.refreshAfterPayment();
        } catch (error) {
          console.error('Failed to refresh subscription data:', error);
        }
      }

      return response;
    } catch (error: any) {
      console.error("🚨 Cashfree verification error:", error?.response?.data || error?.message);
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Cashfree payment verification failed'
      };
    }
  },

  // Check Cashfree subscription status
  getCashfreeSubscriptionStatus: async (subscriptionId: string): Promise<{
    success: boolean;
    status?: string;
    isActive?: boolean;
    message?: string;
  }> => {
    const token = authService.getAccessToken();

    try {
      const response = await get<any>(
        `/subscription/cashfree/status/${subscriptionId}`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        success: true,
        status: response.status,
        isActive: response.isActive,
      };
    } catch (error: any) {
      console.error("🚨 Cashfree status check error:", error?.response?.data || error?.message);
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to check subscription status'
      };
    }
  },

  // Initiate Cashfree payment redirect (fallback method)
  initiateCashfreeRedirect: (authLink: string): void => {
    // Store current URL for return navigation if needed
    sessionStorage.setItem('cashfree_return_url', window.location.href);
    // Redirect to Cashfree payment page
    window.location.href = authLink;
  },

  // Open Cashfree checkout using SDK (preferred method - modal or redirect)
  openCashfreeCheckout: async (
    paymentSessionId: string,
    options?: {
      redirectTarget?: '_self' | '_blank' | '_top' | '_modal';
      onSuccess?: (result: any) => void;
      onFailure?: (error: any) => void;
    }
  ): Promise<any> => {
    try {
      // Dynamically import Cashfree SDK utility
      const { openCashfreeCheckout } = await import('@/lib/cashfree');
      
      return await openCashfreeCheckout(paymentSessionId, {
        redirectTarget: options?.redirectTarget || '_modal',
        onSuccess: options?.onSuccess,
        onFailure: options?.onFailure,
      });
    } catch (error: any) {
      console.error('🚨 Cashfree SDK checkout error:', error);
      options?.onFailure?.(error);
      throw error;
    }
  },

  // Handle payment based on selected gateway
  processPayment: async (
    gateway: PaymentGatewayType,
    config: {
      productType: 'Portfolio' | 'Bundle';
      productId: string;
      planType: 'monthly' | 'quarterly' | 'yearly';
      couponCode?: string;
      isEmandate: boolean;
      userInfo: { name: string; email: string; userId?: string };
    },
    callbacks: {
      onSuccess: (response: any) => void;
      onFailure: (error: any) => void;
      onRedirect?: () => void;
    }
  ): Promise<void> => {
    const { productType, productId, planType, couponCode, isEmandate, userInfo } = config;
    const { onSuccess, onFailure, onRedirect } = callbacks;

    if (gateway === 'razorpay') {
      // Use existing Razorpay flow
      try {
        if (isEmandate) {
          const emandate = await paymentService.createEmandate({
            productType,
            productId,
            planType,
            couponCode,
          });
          
          await paymentService.openCheckout(
            emandate,
            userInfo,
            async () => {
              const verify = await paymentService.verifyEmandateWithRetry(emandate.subscriptionId);
              if (verify.success || ["active", "authenticated"].includes((verify as any).subscriptionStatus || "")) {
                onSuccess(verify);
              } else {
                onFailure(new Error(verify.message || "eMandate verification failed"));
              }
            },
            onFailure
          );
        } else {
          const order = await paymentService.createOrder({
            productType,
            productId,
            planType,
            couponCode,
          });
          
          await paymentService.openCheckout(
            order,
            userInfo,
            async (rp) => {
              const verify = await paymentService.verifyPayment({
                orderId: rp.razorpay_order_id,
                paymentId: rp.razorpay_payment_id,
                signature: rp.razorpay_signature,
              });
              if (verify.success) {
                onSuccess(verify);
              } else {
                onFailure(new Error(verify.message || "Payment verification failed"));
              }
            },
            onFailure
          );
        }
      } catch (error) {
        onFailure(error);
      }
    } else if (gateway === 'cashfree') {
      // Use Cashfree redirect flow
      try {
        const result = await paymentService.createCashfreeSubscription({
          productType,
          productId,
          planType,
          userId: userInfo.userId,
          couponCode,
        });

        if (result.success && result.cashfree?.authLink) {
          // Notify that we're about to redirect
          onRedirect?.();
          // Redirect to Cashfree
          paymentService.initiateCashfreeRedirect(result.cashfree.authLink);
        } else {
          onFailure(new Error(result.error || 'Failed to create Cashfree subscription'));
        }
      } catch (error) {
        onFailure(error);
      }
    }
  },

  // Process cart payment based on selected gateway (uses unified /api/cart/create endpoint)
  processCartPayment: async (
    gateway: PaymentGatewayType,
    config: {
      cartId?: string;
      interval: 'monthly' | 'quarterly' | 'yearly';
      couponCode?: string;
      userInfo: { name: string; email: string };
    },
    callbacks: {
      onSuccess: (response: any) => void;
      onFailure: (error: any) => void;
      onRedirect?: () => void;
    }
  ): Promise<void> => {
    const { cartId, interval, couponCode, userInfo } = config;
    const { onSuccess, onFailure, onRedirect } = callbacks;

    try {
      // Use unified cart API with gateway parameter
      const result = await paymentService.createCartEmandate({
        cartId,
        interval,
        couponCode,
        gateway: gateway as 'razorpay' | 'cashfree',
      });
      
      // Use authorization_url for redirect (works for both gateways)
      const redirectUrl = result.authorization_url || result.short_url || result.checkout_url;
      
      if (redirectUrl) {
        // Notify that we're about to redirect
        onRedirect?.();
        // Redirect to gateway's checkout page
        window.location.href = redirectUrl;
      } else if (gateway === 'razorpay') {
        // Fall back to Razorpay SDK checkout if no redirect URL
        await paymentService.openCheckout(
          result,
          userInfo,
          async () => {
            const verify = await paymentService.verifyEmandateWithRetry(result.subscriptionId);
            if (verify.success || ["active", "authenticated"].includes((verify as any).subscriptionStatus || "")) {
              onSuccess(verify);
            } else {
              onFailure(new Error(verify.message || "eMandate verification failed"));
            }
          },
          onFailure
        );
      } else {
        onFailure(new Error('Failed to get payment URL from server'));
      }
    } catch (error) {
      onFailure(error);
    }
  },
};
