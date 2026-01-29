"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { XCircle, RefreshCw, Home, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const subscriptionId = searchParams?.get("subscription_id") || "";
  const reason = searchParams?.get("reason") || "";
  const error = searchParams?.get("error") || "";
  const message = searchParams?.get("message") || "";
  const gateway = searchParams?.get("gateway") || "";

  useEffect(() => {
    toast({
      title: "Payment Failed",
      description: getErrorMessage(),
      variant: "destructive",
    });
  }, [toast]);

  const getErrorMessage = () => {
    if (message) return message;
    if (reason) {
      switch (reason) {
        case "CANCELLED":
          return "You cancelled the payment process.";
        case "FAILED":
          return "The payment could not be processed by your bank.";
        case "EXPIRED":
          return "The payment session expired. Please try again.";
        case "BANK_REJECTED":
          return "Your bank rejected the authorization request.";
        default:
          return reason.replace(/_/g, " ");
      }
    }
    if (error) {
      switch (error) {
        case "processing_error":
          return "There was an error processing your payment.";
        case "verification_failed":
          return "Payment verification failed.";
        default:
          return error.replace(/_/g, " ");
      }
    }
    return "There was an issue with your payment. Please try again.";
  };

  const handleTryAgain = () => {
    // Go back to cart or subscription page
    router.push("/cart");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleContactSupport = () => {
    const subject = subscriptionId 
      ? `Payment Failed - ${subscriptionId}`
      : "Payment Failed - Need Help";
    window.open(`mailto:support@rangaone.finance?subject=${encodeURIComponent(subject)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center"
      >
        {/* Failed Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
        >
          <XCircle className="w-10 h-10 text-red-600" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Failed
        </h1>

        {/* Error Reason */}
        {(reason || error) && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-4">
            {(reason || error).replace(/_/g, " ")}
          </div>
        )}

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {getErrorMessage()}
        </p>

        {/* Subscription ID */}
        {subscriptionId && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500 mb-1">Reference ID</p>
            <p className="text-sm font-mono text-gray-700 break-all">{subscriptionId}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">What can you do?</h3>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Try again with a different payment method</li>
            <li>• Ensure your bank account has sufficient balance</li>
            <li>• Contact your bank if the issue persists</li>
            <li>• Reach out to our support team for help</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleTryAgain}
            className="w-full bg-[#001633] hover:bg-[#002244] text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={handleGoToDashboard}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              onClick={handleContactSupport}
              variant="outline"
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Support
            </Button>
          </div>

          <Button
            onClick={handleGoHome}
            variant="ghost"
            className="w-full text-gray-500"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Homepage
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
