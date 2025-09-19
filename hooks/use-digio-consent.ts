'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { digioService } from '@/services/digio.service';

interface UseDigioConsentProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useDigioConsent({ onSuccess, onError }: UseDigioConsentProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [authenticationUrl, setAuthenticationUrl] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const windowRef = useRef<Window | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
      }
    };
  }, []);

  const startVerification = useCallback(async (
    agreementData: any,
    productType: string,
    productId: string
  ) => {
    setIsLoading(true);
    try {
      const response = await digioService.createPaymentSignRequest(
        agreementData,
        productType,
        productId
      );

      if (response.authenticationUrl) {
        setAuthenticationUrl(response.authenticationUrl);
        setDocumentId(response.documentId);
        setIsOpen(true);
      } else {
        throw new Error('No authentication URL received');
      }
    } catch (error: any) {
      onError?.(error.message || 'Failed to start verification');
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  const handleSigningComplete = useCallback((success: boolean) => {
    setIsOpen(false);
    if (success) {
      onSuccess?.();
    }
    // Reset state
    setAuthenticationUrl('');
    setDocumentId('');
  }, [onSuccess]);

  const closeWindow = useCallback(() => {
    setIsOpen(false);
    setAuthenticationUrl('');
    setDocumentId('');
  }, []);

  return {
    isOpen,
    authenticationUrl,
    documentId,
    isLoading,
    startVerification,
    handleSigningComplete,
    closeWindow
  };
}