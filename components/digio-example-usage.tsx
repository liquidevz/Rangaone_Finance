'use client';

import { useState } from 'react';
import DigioConsentIntegration from './digio-consent-integration';
import { useToast } from '@/components/ui/use-toast';

// Example usage component showing how to integrate the new consent-based Digio verification
export default function DigioExampleUsage() {
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const handleVerificationComplete = () => {
    setIsComplete(true);
    toast({
      title: "Verification Complete",
      description: "Digital signature completed successfully!",
    });
    
    // Proceed with your payment or subscription logic here
    console.log('Proceeding to payment...');
  };

  const handleVerificationError = (error: string) => {
    toast({
      title: "Verification Failed",
      description: error,
      variant: "destructive"
    });
  };

  if (isComplete) {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-semibold text-green-600 mb-2">
          ✓ Verification Complete
        </h3>
        <p className="text-gray-600">
          You can now proceed with your subscription.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Complete Your Subscription</h2>
      <p className="text-gray-600 mb-6">
        To activate your subscription, please complete the secure verification process.
      </p>
      
      <DigioConsentIntegration
        productType="Bundle"
        productId="686a629db4f9ab73bb2dba3d"
        productName="Premium Subscription"
        customerName="John Doe" // Get from user context
        onComplete={handleVerificationComplete}
        onError={handleVerificationError}
      />
    </div>
  );
}

// Usage in your existing components:
/*
// Replace your existing digio integration with:

import DigioConsentIntegration from '@/components/digio-consent-integration';

// In your component:
<DigioConsentIntegration
  productType={productType}
  productId={productId}
  productName={productName}
  customerName={user?.name}
  onComplete={() => {
    // Handle successful verification
    proceedToPayment();
  }}
  onError={(error) => {
    // Handle verification error
    showErrorMessage(error);
  }}
/>
*/