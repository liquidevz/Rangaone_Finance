'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { digioService } from '@/services/digio.service';

interface DigioSigningModalProps {
  open: boolean;
  onClose: () => void;
  authenticationUrl: string;
  documentId: string;
  originalPayload: any;
  onSigningComplete: () => void;
}

export default function DigioSigningModal({ 
  open, 
  onClose, 
  authenticationUrl, 
  documentId, 
  originalPayload,
  onSigningComplete 
}: DigioSigningModalProps) {
  const [verifying, setVerifying] = useState(false);
  const [signed, setSigned] = useState(false);

  const handleOpenSigning = () => {
    digioService.openSigningPopup(authenticationUrl);
  };

  const handleVerifySignature = async () => {
    setVerifying(true);
    try {
      const isVerified = await digioService.verifySignature({
        ...originalPayload,
        documentId
      });
      
      if (isVerified) {
        setSigned(true);
        onSigningComplete();
      } else {
        alert('Signature verification failed. Please try signing again.');
      }
    } catch (error) {
      alert('Error verifying signature. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Document Signing</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Click below to open the signing window and complete your e-signature.
          </p>
          
          <Button onClick={handleOpenSigning} className="w-full">
            Open Signing Window
          </Button>
          
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-3">
              After completing the signing process, click below to verify and continue.
            </p>
            
            <Button 
              onClick={handleVerifySignature}
              disabled={verifying || signed}
              variant={signed ? "default" : "outline"}
              className="w-full"
            >
              {verifying ? 'Verifying...' : signed ? 'Signing Complete ✓' : 'I Have Completed Signing'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}