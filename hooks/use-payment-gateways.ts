import { useState, useEffect, useCallback } from 'react';
import { get } from '@/lib/axios';

/**
 * Payment Gateway Interface
 * 
 * Gateway IDs are dynamic and come from the backend API.
 * No hardcoded gateway types - the backend controls which gateways are available.
 */
export interface PaymentGateway {
  id: string; // Dynamic gateway ID from backend (e.g., 'razorpay', 'cashfree', etc.)
  name: string;
  description: string;
  logo: string;
  supportedMethods: string[];
  supportsSubscriptions: boolean;
  supportsOneTime: boolean;
  requiredFields?: {
    oneTime?: {
      create: string[];
      verify: string[];
    };
    emandate?: {
      create: string[];
    };
    sdk?: {
      type: string;
      scriptUrl?: string;
    };
  };
}

export interface GatewaysResponse {
  success: boolean;
  gateways: PaymentGateway[];
  count: number;
  defaultGateway: string | null;
}

// Default fallback gateway when API fails
const DEFAULT_FALLBACK_GATEWAY: PaymentGateway = {
  id: 'razorpay',
  name: 'Razorpay',
  description: 'UPI, Cards, Net Banking, Wallets',
  logo: '/images/razorpay-logo.svg',
  supportedMethods: ['upi', 'card', 'netbanking', 'wallet', 'emandate'],
  supportsSubscriptions: true,
  supportsOneTime: true,
};

// Helper to fix logo paths (backend may return wrong extensions)
const fixLogoPath = (logo: string): string => {
  if (!logo) return '';
  // Convert .png to .svg if the file likely doesn't exist as png
  if (logo.includes('/images/') && logo.endsWith('.png')) {
    return logo.replace('.png', '.svg');
  }
  return logo;
};

export function usePaymentGateways() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultGateway, setDefaultGateway] = useState<string | null>(null);

  const fetchGateways = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await get<GatewaysResponse>('/api/payment/gateways');
      
      if (response.success) {
        // Fix logo paths if needed (backend returns .png but files are .svg)
        const fixedGateways = (response.gateways || []).map(g => {
          const fixedLogo = fixLogoPath(g.logo);
          return {
            ...g,
            logo: fixedLogo
          };
        });
        setGateways(fixedGateways);
        setDefaultGateway(response.defaultGateway);
      } else {
        console.warn("🔍 API returned success=false, using fallback");
        setError('Failed to load payment methods');
        // Fallback to default gateway if API fails
        setGateways([DEFAULT_FALLBACK_GATEWAY]);
        setDefaultGateway(DEFAULT_FALLBACK_GATEWAY.id);
      }
    } catch (err: any) {
      console.error('🔍 Error fetching payment gateways:', err);
      setError('Payment services unavailable');
      // Fallback to default gateway if API fails
      setGateways([DEFAULT_FALLBACK_GATEWAY]);
      setDefaultGateway(DEFAULT_FALLBACK_GATEWAY.id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  const refreshGateways = useCallback(() => {
    fetchGateways();
  }, [fetchGateways]);

  // Helper to check if a specific gateway is enabled
  const isGatewayEnabled = useCallback((gatewayId: string) => {
    return gateways.some(g => g.id === gatewayId);
  }, [gateways]);

  // Helper to get gateway by ID
  const getGateway = useCallback((gatewayId: string) => {
    return gateways.find(g => g.id === gatewayId);
  }, [gateways]);

  // Helper to check if gateway supports emandate
  const supportsEmandate = useCallback((gatewayId: string) => {
    const gateway = gateways.find(g => g.id === gatewayId);
    return gateway?.supportedMethods?.includes('emandate') || 
           gateway?.supportedMethods?.includes('upi_autopay') ||
           gateway?.supportedMethods?.includes('enach');
  }, [gateways]);

  return { 
    gateways, 
    loading, 
    error, 
    defaultGateway,
    refreshGateways,
    isGatewayEnabled,
    getGateway,
    supportsEmandate,
    // Convenience properties
    hasMultipleGateways: gateways.length > 1,
    hasSingleGateway: gateways.length === 1,
    singleGateway: gateways.length === 1 ? gateways[0] : null,
  };
}
