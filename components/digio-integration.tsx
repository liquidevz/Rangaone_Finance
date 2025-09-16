'use client';

import { useState } from 'react';
import { digioService } from '@/services/digio.service';
import { Button } from '@/components/ui/button';
import DigioSigningModal from './digio-signing-modal';
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
  const [showSigningModal, setShowSigningModal] = useState(false);
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
        setShowSigningModal(true);
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

      {showSigningModal && signingData && (
        <DigioSigningModal
          open={showSigningModal}
          onClose={() => setShowSigningModal(false)}
          authenticationUrl={signingData.authenticationUrl}
          documentId={signingData.documentId}
          originalPayload={signingData.originalPayload}
          onSigningComplete={() => {
            setShowSigningModal(false);
            onComplete();
          }}
        />
      )}
    </>
  );
}