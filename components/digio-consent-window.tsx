'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { digioService } from '@/services/digio.service';

interface DigioConsentWindowProps {
  open: boolean;
  onClose: () => void;
  authenticationUrl: string;
  documentId: string;
  onSigningComplete: (success: boolean) => void;
  customerName?: string;
}

export default function DigioConsentWindow({
  open,
  onClose,
  authenticationUrl,
  documentId,
  onSigningComplete,
  customerName = 'Customer'
}: DigioConsentWindowProps) {
  const [step, setStep] = useState<'consent' | 'signing' | 'success' | 'error'>('consent');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const windowRef = useRef<Window | null>(null);

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

  // Auto-close on success
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        onSigningComplete(true);
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, onSigningComplete, onClose]);

  const handleConsent = () => {
    setStep('signing');
    openSigningWindow();
  };

  const openSigningWindow = () => {
    try {
      // Close any existing window
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
      }

      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        // For mobile, redirect to avoid popup issues
        window.location.href = authenticationUrl;
        return;
      }

      // Enhanced window features for Safari compatibility
      const windowFeatures = [
        'width=800',
        'height=700',
        'left=' + Math.max(0, (window.screen.width / 2 - 400)),
        'top=' + Math.max(0, (window.screen.height / 2 - 350)),
        'scrollbars=yes',
        'resizable=yes',
        'status=no',
        'toolbar=no',
        'menubar=no',
        'location=no'
      ].join(',');

      // Use unique window name with timestamp for Safari
      const windowName = 'digio_verification_' + Date.now();
      windowRef.current = window.open(authenticationUrl, windowName, windowFeatures);

      // Safari-specific popup handling
      if (!windowRef.current || windowRef.current.closed) {
        if (isSafari) {
          setErrorMessage(
            'Popup blocked by Safari. Please allow popups for this site and try again, or click "Open in New Tab" below.'
          );
          setStep('error');
        } else {
          // Fallback for other browsers
          window.open(authenticationUrl, '_blank');
        }
        return;
      }

      // Focus the popup window
      windowRef.current.focus();

      // Start monitoring the window and document status
      startMonitoring();

    } catch (error) {
      console.error('Error opening signing window:', error);
      setErrorMessage('Failed to open verification window. Please try again.');
      setStep('error');
    }
  };

  const startMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        // Check if window is closed
        if (windowRef.current?.closed) {
          clearInterval(intervalRef.current!);
          await checkSigningStatus();
          return;
        }

        // Check document status periodically
        const status = await digioService.checkDocumentStatus(documentId);
        if (status.agreement_status === 'completed') {
          clearInterval(intervalRef.current!);
          if (windowRef.current && !windowRef.current.closed) {
            windowRef.current.close();
          }
          setStep('success');
        }
      } catch (error) {
        // Continue monitoring even if status check fails
        console.log('Status check failed, continuing to monitor...');
      }
    }, 2000);
  };

  const checkSigningStatus = async () => {
    try {
      const status = await digioService.checkDocumentStatus(documentId);
      if (status.agreement_status === 'completed') {
        setStep('success');
      } else {
        setErrorMessage('Verification was not completed. Please try again.');
        setStep('error');
      }
    } catch (error) {
      setErrorMessage('Unable to verify signing status. Please try again.');
      setStep('error');
    }
  };

  const handleClose = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }
    onSigningComplete(step === 'success');
    onClose();
  };

  const handleRetry = () => {
    setStep('consent');
    setErrorMessage('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Secure Verification</h2>
              <p className="text-sm text-gray-600">Digital signature required</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'consent' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Hi {customerName}!
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  To proceed with your subscription, we need to verify your identity through 
                  a secure digital signature process using your Aadhaar.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• A secure verification window will open</li>
                  <li>• Enter your Aadhaar number and OTP</li>
                  <li>• Complete the digital signature</li>
                  <li>• Window will close automatically on success</li>
                </ul>
              </div>

              <Button 
                onClick={handleConsent}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Proceed to Verification
              </Button>
            </div>
          )}

          {step === 'signing' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Verification in Progress
                </h3>
                <p className="text-gray-600 text-sm">
                  Please complete the verification in the opened window. 
                  This window will close automatically once verification is successful.
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Window not opening?</strong> Please check if popups are blocked 
                  and try again.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={openSigningWindow}
                  className="flex-1"
                >
                  Reopen Window
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Verification Successful!
                </h3>
                <p className="text-gray-600 text-sm">
                  Your digital signature has been completed successfully. 
                  Proceeding to payment...
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ Identity verified through Aadhaar eSign
                </p>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Verification Failed
                </h3>
                <p className="text-gray-600 text-sm">
                  {errorMessage || 'Something went wrong during verification.'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleRetry}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Try Again
                  </Button>
                </div>
                {errorMessage.includes('Popup blocked') && (
                  <Button 
                    onClick={() => window.open(authenticationUrl, '_blank')}
                    variant="outline"
                    className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}