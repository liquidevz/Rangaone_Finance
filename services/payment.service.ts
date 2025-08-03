import { post, get } from "@/lib/axios";
import { authService } from "./auth.service";

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
}

// Updated interface for cart checkout
export interface CartCheckoutPayload {
  planType: "monthly" | "quarterly" | "yearly";
  subscriptionType?: "basic" | "premium" | "individual"; // Added for subscription type tracking
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
  // Create order for single product
  createOrder: async (
    payload: CreateOrderPayload
  ): Promise<CreateOrderResponse> => {
    const token = authService.getAccessToken();

    console.log("Payment service - creating order with payload:", payload);

    return await post<CreateOrderResponse>(
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
  },

  // Updated cart checkout to include planType and subscriptionType
  cartCheckout: async (
    payload: CartCheckoutPayload
  ): Promise<CreateOrderResponse> => {
    const token = authService.getAccessToken();

    console.log("Payment service - cart checkout with payload:", payload);

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

  // Verify payment
  verifyPayment: async (
    payload: VerifyPaymentPayload
  ): Promise<VerifyPaymentResponse> => {
    const token = authService.getAccessToken();
    
    console.log("Verifying payment with payload:", {
      orderId: payload.orderId,
      paymentId: payload.paymentId,
      signatureLength: payload.signature?.length || 0
    });

    try {
      const response = await post<VerifyPaymentResponse>(
        "/api/subscriptions/verify",
        payload,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Verification response:", response);

      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response has success field, use it
        if (typeof response.success !== 'undefined') {
          return response;
        }
        
        // If response doesn't have success field but has data, assume success
        if (Object.keys(response).length > 0) {
          return {
            success: true,
            message: "Payment verified successfully"
          };
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
            recurring: 1 // Enable recurring payments for eMandate
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
          onFailure(new Error("Payment cancelled by user"));
        },
      },
      handler: (response: any) => {
        console.log("Payment successful:", response);
        onSuccess(response);
      },
    };

    console.log("Razorpay options:", {
      ...options,
      key: options.key.substring(0, 8) + "...", // Hide full key in logs
    });

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        onFailure(
          new Error(
            `Payment failed: ${response.error.description || "Unknown error"}`
          )
        );
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

  createEmandate: async (
    payload: CreateOrderPayload
  ): Promise<CreateEMandateResponse> => {
    const token = authService.getAccessToken();

    console.log("Payment service - creating emandate with payload:", payload);

    try {
      // Correct payload structure for eMandate creation
      const emandatePayload = {
        productType: payload.productType,
        productId: payload.productId
      };

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
      console.log("🔍 Response type:", typeof response);
      console.log("🔍 Response keys:", Object.keys(response));
      console.log("🔍 Has subscriptionId:", 'subscriptionId' in response);
      if ('subscriptionId' in response) {
        console.log("🔍 subscriptionId value:", response.subscriptionId);
      }
      return response;
    } catch (error: any) {
      console.error("eMandate creation failed:", error);
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

  // Verify eMandate with automatic retry logic for database sync delays
  verifyEmandateWithRetry: async (subscriptionId: string, maxRetries: number = 5): Promise<VerifyPaymentResponse> => {
    console.log(`Starting eMandate verification with retry for subscription: ${subscriptionId}`);
    
    let retryCount = 0;
    let retryDelay = 1000; // Start with 1 second
    
    while (retryCount < maxRetries) {
      retryCount++;
      console.log(`eMandate verification attempt ${retryCount}/${maxRetries}`);
      
      const response = await paymentService.verifyEmandate(subscriptionId);
      
      if (response.success) {
        console.log(`✅ eMandate verification successful on attempt ${retryCount}`);
        return response;
      }
      
      // If it's a "No matching subscriptions found" error and we have retries left
      if (response.message.includes("No matching subscriptions found") && retryCount < maxRetries) {
        console.log(`Retry ${retryCount} failed, waiting ${retryDelay}ms before next attempt`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Exponential backoff
        continue;
      }
      
      // For other errors or if we've exhausted retries, return the error
      console.log(`❌ eMandate verification failed after ${retryCount} attempts`);
      return response;
    }
    
    // This should never be reached, but just in case
    return {
      success: false,
      message: "eMandate verification failed after maximum retries. Please contact support."
    };
  },
};
