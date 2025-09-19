'use client';

import { useState } from 'react';
import { digioService } from '@/services/digio.service';
import { Button } from '@/components/ui/button';
import DigioConsentWindow from './digio-consent-window';
import DigioProfileCheck from './digio-profile-check';

interface DigioIntegrationProps {
  productType: string;
  productId: string;
  productName: string;
  onComplete: () => void;
}

export default function DigioIntegration({ 
  productType, 
  productId, 
  productName, 
  onComplete 
}: DigioIntegrationProps) {
  const [loading, setLoading] = useState(false);
  const [showProfileCheck, setShowProfileCheck] = useState(false);
  const [showConsentWindow, setShowConsentWindow] = useState(false);
  const [signingData, setSigningData] = useState<any>(null);

  const handleStartSigning = async () => {
    setLoading(true);
    
    try {
      const agreementData = { productName };
      const response = await digioService.createPaymentSignRequest(
        agreementData,
        productType,
        productId
      );

      if (response.authenticationUrl) {
        setSigningData({
          authenticationUrl: response.authenticationUrl,
          documentId: response.documentId,
          originalPayload: { productType, productId, productName }
        });
        setShowConsentWindow(true);
      }
    } catch (error: any) {
      if (error.message?.includes('Missing required user data')) {
        setShowProfileCheck(true);
      } else {
        console.error('Error creating document:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = async () => {
    setShowProfileCheck(false);
    await handleStartSigning();
  };

  return (
    <>
      <Button onClick={handleStartSigning} disabled={loading}>
        {loading ? 'Creating Document...' : 'Start E-Signing'}
      </Button>

      {showProfileCheck && (
        <DigioProfileCheck 
          onComplete={handleProfileComplete}
          onCancel={() => setShowProfileCheck(false)}
        />
      )}

      {showConsentWindow && signingData && (
        <DigioConsentWindow
          open={showConsentWindow}
          onClose={() => setShowConsentWindow(false)}
          authenticationUrl={signingData.authenticationUrl}
          documentId={signingData.documentId}
          onSigningComplete={(success) => {
            setShowConsentWindow(false);
            if (success) {
              onComplete();
            }
          }}
        />
      )}
    </>
  );
}