/**
 * Cashfree Payment Gateway SDK Utility
 * 
 * This module provides utilities for integrating Cashfree payments
 * using their official JavaScript SDK loaded directly from CDN.
 * 
 * Environment Variables Required (Frontend):
 * - NEXT_PUBLIC_CASHFREE_MODE: 'sandbox' | 'production'
 * 
 * Backend Environment Variables (already configured):
 * - CASHFREE_APP_ID: Your Cashfree App ID (x-client-id)
 * - CASHFREE_SECRET_KEY: Your Cashfree Secret Key
 * - CASHFREE_MODE: sandbox or production
 * - CASHFREE_WEBHOOK_SECRET: Webhook verification secret
 */

// Types for Cashfree SDK
export interface CashfreeInstance {
  checkout: (options: CashfreeCheckoutOptions) => Promise<CashfreeCheckoutResult>;
  subscriptionsCheckout: (options: CashfreeSubscriptionCheckoutOptions) => Promise<CashfreeCheckoutResult>;
}

export interface CashfreeCheckoutOptions {
  paymentSessionId: string;
  redirectTarget?: '_self' | '_blank' | '_top' | '_modal' | HTMLElement;
  returnUrl?: string;
}

export interface CashfreeSubscriptionCheckoutOptions {
  subsSessionId: string;
  redirectTarget?: '_self' | '_blank' | '_top';
}

export interface CashfreeCheckoutResult {
  error?: {
    message: string;
    code?: string;
    type?: string;
  };
  redirect?: boolean;
  paymentDetails?: {
    paymentMessage?: string;
    paymentStatus?: string;
  };
}

// Declare global Cashfree constructor
declare global {
  interface Window {
    Cashfree?: (options: { mode: 'sandbox' | 'production' }) => CashfreeInstance;
  }
}

// SDK URL
const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

// Singleton instance
let cashfreeInstance: CashfreeInstance | null = null;
let loadingPromise: Promise<CashfreeInstance | null> | null = null;
let scriptLoaded = false;

/**
 * Get the Cashfree mode from environment variable
 */
export const getCashfreeMode = (): 'sandbox' | 'production' => {
  const mode = process.env.NEXT_PUBLIC_CASHFREE_MODE || 'sandbox';
  return mode === 'production' ? 'production' : 'sandbox';
};

/**
 * Load the Cashfree SDK script from CDN
 */
const loadCashfreeScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (scriptLoaded || window.Cashfree) {
      scriptLoaded = true;
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src="${CASHFREE_SDK_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        scriptLoaded = true;
        resolve();
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load Cashfree SDK'));
      });
      return;
    }

    // Create and append script
    const script = document.createElement('script');
    script.src = CASHFREE_SDK_URL;
    script.async = true;
    
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Cashfree SDK script');
      reject(new Error('Failed to load Cashfree SDK from CDN'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Load and initialize the Cashfree SDK from CDN
 * Returns a singleton instance
 */
export const loadCashfree = async (): Promise<CashfreeInstance | null> => {
  // Return existing instance if already loaded
  if (cashfreeInstance) {
    return cashfreeInstance;
  }

  // Return existing promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Only load on client side
  if (typeof window === 'undefined') {
    console.warn('Cashfree SDK can only be loaded on the client side');
    return null;
  }

  loadingPromise = (async () => {
    try {
      // Load SDK script from CDN
      await loadCashfreeScript();
      
      const mode = getCashfreeMode();
      
      // Use global Cashfree constructor from CDN script
      if (typeof window.Cashfree === 'function') {
        const instance = window.Cashfree({ mode });
        cashfreeInstance = instance as CashfreeInstance;
        return cashfreeInstance;
      } else {
        console.error('🚨 Cashfree constructor not found on window');
        return null;
      }
    } catch (error) {
      console.error('🚨 Failed to load Cashfree SDK:', error);
      loadingPromise = null; // Reset so we can retry
      return null;
    }
  })();

  return loadingPromise;
};

/**
 * Open Cashfree checkout with the given session ID
 * 
 * @param paymentSessionId - Session ID from backend order creation
 * @param options - Additional checkout options
 * @returns Promise with checkout result
 */
export const openCashfreeCheckout = async (
  paymentSessionId: string,
  options?: {
    redirectTarget?: '_self' | '_blank' | '_top' | '_modal';
    returnUrl?: string;
    onSuccess?: (result: CashfreeCheckoutResult) => void;
    onFailure?: (error: any) => void;
  }
): Promise<CashfreeCheckoutResult | null> => {
  try {
    const cashfree = await loadCashfree();
    
    if (!cashfree) {
      throw new Error('Failed to load Cashfree SDK. Please refresh and try again.');
    }


    const checkoutOptions: CashfreeCheckoutOptions = {
      paymentSessionId,
      redirectTarget: options?.redirectTarget || '_modal',
    };

    if (options?.returnUrl) {
      checkoutOptions.returnUrl = options.returnUrl;
    }

    // For redirect-based checkout (_self, _blank, _top)
    if (checkoutOptions.redirectTarget !== '_modal') {
      // Store return URL for post-payment navigation
      sessionStorage.setItem('cashfree_return_url', window.location.href);
      sessionStorage.setItem('cashfree_payment_session', paymentSessionId);
    }

    const result = await cashfree.checkout(checkoutOptions);
    

    // Handle result for modal checkout
    if (result?.error) {
      console.error('🚨 Cashfree checkout error:', result.error);
      options?.onFailure?.(result.error);
      return result;
    }

    if (result?.paymentDetails) {
      options?.onSuccess?.(result);
    }

    return result;
  } catch (error: any) {
    console.error('🚨 Error opening Cashfree checkout:', error);
    options?.onFailure?.(error);
    throw error;
  }
};

/**
 * Check if Cashfree SDK is available
 */
export const isCashfreeAvailable = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Open Cashfree subscription checkout with the given session ID
 * Used for e-mandate / subscription authorization flows
 * 
 * @param subsSessionId - Subscription Session ID from backend subscription creation
 * @param options - Additional checkout options
 * @returns Promise with checkout result
 */
export const openCashfreeSubscriptionCheckout = async (
  subsSessionId: string,
  options?: {
    redirectTarget?: '_self' | '_blank' | '_top';
    onSuccess?: (result: CashfreeCheckoutResult) => void;
    onFailure?: (error: any) => void;
  }
): Promise<CashfreeCheckoutResult | null> => {
  try {
    const cashfree = await loadCashfree();
    
    if (!cashfree) {
      throw new Error('Failed to load Cashfree SDK. Please refresh and try again.');
    }


    // Store return URL for post-payment navigation
    sessionStorage.setItem('cashfree_return_url', window.location.href);
    sessionStorage.setItem('cashfree_subscription_session', subsSessionId);

    // Check if subscriptionsCheckout method is available
    if (!cashfree.subscriptionsCheckout) {
      throw new Error('Cashfree SDK version does not support subscription checkout. Please contact support.');
    }

    const result = await cashfree.subscriptionsCheckout({
      subsSessionId,
      redirectTarget: options?.redirectTarget || '_self',
    });
    

    if (result?.error) {
      console.error('🚨 Cashfree subscription checkout error:', result.error);
      options?.onFailure?.(result.error);
      return result;
    }

    options?.onSuccess?.(result);
    return result;
  } catch (error: any) {
    console.error('🚨 Error opening Cashfree subscription checkout:', error);
    options?.onFailure?.(error);
    throw error;
  }
};

/**
 * Reset the Cashfree SDK instance (useful for testing or mode switching)
 */
export const resetCashfreeInstance = (): void => {
  cashfreeInstance = null;
  loadingPromise = null;
};
