"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Shield, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface CashfreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFailure?: (error: any) => void;
  // For one-time payments - uses cashfree.checkout()
  paymentSessionId?: string;
  // For recurring subscriptions - uses cashfree.subscriptionsCheckout()
  subsSessionId?: string;
  // Determines which SDK method to use: 'one_time' uses checkout(), 'recurring' uses subscriptionsCheckout()
  paymentType: 'one_time' | 'recurring';
  amount?: number;
  title?: string;
}

export const CashfreeModal: React.FC<CashfreeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onFailure,
  paymentSessionId,
  subsSessionId,
  paymentType,
  amount,
  title = "Complete Payment Authorization"
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleProceedToPayment = async () => {
    try {
      setIsProcessing(true);

      // Store return URL for after payment
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cashfree_return_url', window.location.href);
        if (paymentType === 'one_time' && paymentSessionId) {
          sessionStorage.setItem('cashfree_payment_session_id', paymentSessionId);
        } else if (subsSessionId) {
          sessionStorage.setItem('cashfree_subs_session_id', subsSessionId);
        }
      }

      // Load Cashfree SDK
      const { loadCashfree } = await import('@/lib/cashfree');
      const cashfree = await loadCashfree();

      if (!cashfree) {
        throw new Error("Failed to load Cashfree SDK");
      }

      // Use different SDK methods based on payment type
      if (paymentType === 'one_time' && paymentSessionId) {
        // One-time payment - opens as modal overlay on the site

        const result = await cashfree.checkout({
          paymentSessionId: paymentSessionId,
          redirectTarget: "_modal",
        });

        console.log('📨 Cashfree one-time checkout result:', result);

        // Handle result for modal checkout
        if (result?.error) {
          throw new Error(result.error.message || 'Payment initialization failed');
        }

        // For modal checkout, handle success directly
        if (result?.paymentDetails?.paymentStatus === 'SUCCESS' || result?.paymentDetails?.paymentMessage?.toLowerCase().includes('success')) {
          onSuccess();
          return;
        }

        // If payment completed (redirect or modal close without error)
        if (result?.redirect) {
          // Payment will be verified after redirect
          return;
        }

      } else if (paymentType === 'recurring' && subsSessionId) {
        // Recurring subscription - redirects to Cashfree page for eMandate authorization

        const result = await cashfree.subscriptionsCheckout({
          subsSessionId: subsSessionId,
          redirectTarget: "_self",
        });

        console.log('📨 Cashfree subscription checkout result:', result);

        // Check for errors
        if (result.error) {
          throw new Error(result.error.message || 'Payment initialization failed');
        }
      } else {
        throw new Error('Invalid payment configuration: missing session ID');
      }

    } catch (error: any) {
      console.error('Error initializing Cashfree:', error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: error.message || "Failed to load payment gateway. Please try again.",
        variant: "destructive"
      });
      onFailure?.(error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isProcessing) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {title}
                </h2>
                {amount && (
                  <p className="text-sm text-gray-600">
                    Amount: ₹{amount.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isProcessing}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                ) : (
                  <ExternalLink className="w-8 h-8 text-blue-600" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isProcessing ? 'Redirecting to Payment...' : 'Ready to Proceed'}
                </h3>
                <p className="text-gray-600">
                  {isProcessing
                    ? 'Please wait while we redirect you to the secure payment gateway.'
                    : 'Click the button below to proceed to Cashfree\'s secure payment gateway for authorization.'
                  }
                </p>
              </div>

              {!isProcessing && (
                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleProceedToPayment}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
                    size="lg"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Proceed to Secure Payment
                  </Button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2 text-left">
                      <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-blue-900 font-medium mb-1">
                          Secure Payment Gateway
                        </p>
                        <p className="text-xs text-blue-700">
                          You will be redirected to Cashfree's secure page to complete the authorization. Your payment information is encrypted and safe.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="w-3.5 h-3.5" />
              <span>256-bit Encrypted | PCI DSS Compliant</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
