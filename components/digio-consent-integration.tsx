'use client';

import { Button } from '@/components/ui/button';
import { useDigioConsent } from '@/hooks/use-digio-consent';
import DigioConsentWindow from './digio-consent-window';
import DigioProfileCheck from './digio-profile-check';
import { useState } from 'react';

interface DigioConsentIntegrationProps {
  productType: string;
  productId: string;
  productName: string;
  customerName?: string;
  onComplete: () => void;
  onError?: (error: string) => void;
}

export default function DigioConsentIntegration({
  productType,
  productId,
  productName,
  customerName,
  onComplete,
  onError
}: DigioConsentIntegrationProps) {
  const [showProfileCheck, setShowProfileCheck] = useState(false);
  
  const {
    isOpen,
    authenticationUrl,
    documentId,
    isLoading,
    startVerification,
    handleSigningComplete,
    closeWindow
  } = useDigioConsent({
    onSuccess: onComplete,
    onError: (error) => {
      if (error.includes('Missing required user data')) {
        setShowProfileCheck(true);
      } else {
        onError?.(error);
      }
    }
  });

  const handleStartVerification = async () => {
    const agreementData = { productName };
    await startVerification(agreementData, productType, productId);
  };

  const handleProfileComplete = async () => {
    setShowProfileCheck(false);
    await handleStartVerification();
  };

  return (
    <>
      <Button 
        onClick={handleStartVerification} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Preparing Verification...' : 'Start Secure Verification'}
      </Button>

      {showProfileCheck && (
        <DigioProfileCheck 
          onComplete={handleProfileComplete}
          onCancel={() => setShowProfileCheck(false)}
        />
      )}

      <DigioConsentWindow
        open={isOpen}
        onClose={closeWindow}
        authenticationUrl={authenticationUrl}
        documentId={documentId}
        onSigningComplete={handleSigningComplete}
        customerName={customerName}
      />
    </>
  );
}