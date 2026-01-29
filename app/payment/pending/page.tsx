"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, RefreshCw, Home, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const subscriptionId = searchParams?.get("subscription_id") || "";
  const status = searchParams?.get("status") || "PENDING";
  const gateway = searchParams?.get("gateway") || "cashfree";
  
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    toast({
      title: "Payment Pending",
      description: "Your payment is being processed by the bank.",
    });
  }, [toast]);

  const getStatusMessage = () => {
    switch (status) {
      case "BANK_APPROVAL_PENDING":
        return "Your bank is reviewing the eMandate authorization. This usually takes 2-3 business days.";
      case "INITIALIZED":
        return "Your payment has been initialized and is awaiting bank confirmation.";
      case "PENDING":
      default:
        return "Your payment is being processed. This may take a few minutes to a few business days depending on your bank.";
    }
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      // Redirect to dashboard which will refresh subscription status
      router.push("/dashboard?check_subscription=true");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not check status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleContactSupport = () => {
    // Open support - could be email, chat, or support page
    window.open("mailto:support@rangaone.finance?subject=Payment Pending - " + subscriptionId, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center"
      >
        {/* Pending Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center"
        >
          <Clock className="w-10 h-10 text-amber-600" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Pending
        </h1>

        {/* Status Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-4">
          {status.replace(/_/g, " ")}
        </div>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {getStatusMessage()}
        </p>

        {/* Subscription ID */}
        {subscriptionId && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500 mb-1">Reference ID</p>
            <p className="text-sm font-mono text-gray-700 break-all">{subscriptionId}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your bank will process the authorization</li>
            <li>• You'll receive an email once approved</li>
            <li>• Your subscription will activate automatically</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleCheckStatus}
            disabled={checkingStatus}
            className="w-full bg-[#001633] hover:bg-[#002244] text-white"
          >
            {checkingStatus ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status
              </>
            )}
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
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
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  );
}
