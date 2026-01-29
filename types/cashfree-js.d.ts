/**
 * Type declarations for @cashfreepayments/cashfree-js
 * 
 * The official Cashfree SDK doesn't include TypeScript types,
 * so we declare them here based on their documentation.
 */

declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeConfig {
    mode: 'sandbox' | 'production';
  }

  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_top' | '_modal' | HTMLElement;
    returnUrl?: string;
  }

  export interface CashfreeCheckoutError {
    message: string;
    code?: string;
    type?: string;
  }

  export interface CashfreePaymentDetails {
    paymentMessage?: string;
    paymentStatus?: string;
    [key: string]: any;
  }

  export interface CashfreeCheckoutResult {
    error?: CashfreeCheckoutError;
    redirect?: boolean;
    paymentDetails?: CashfreePaymentDetails;
  }

  export interface CashfreeInstance {
    checkout: (options: CashfreeCheckoutOptions) => Promise<CashfreeCheckoutResult>;
    version: string;
  }

  /**
   * Load the Cashfree SDK
   * 
   * @param config - Configuration options for the SDK
   * @returns Promise that resolves with Cashfree instance or null (server-side)
   */
  export function load(config: CashfreeConfig): Promise<CashfreeInstance | null>;
}
