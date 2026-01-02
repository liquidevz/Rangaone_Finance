"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, X, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/auth-context";
import { paymentService } from "@/services/payment.service";

type PaymentStatus = "loading" | "verifying" | "success" | "failed" | "pending";

function CashfreeCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [message, setMessage] = useState("");
  const [telegramLinks, setTelegramLinks] = useState<Array<{ invite_link: string }>>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Wait for auth to load
      if (authLoading) return;

      // Check if user is authenticated
      if (!isAuthenticated) {
        setStatus("failed");
        setMessage("Please log in to verify your payment");
        return;
      }

      // Handle null searchParams
      if (!searchParams) {
        setStatus("failed");
        setMessage("Invalid callback - no parameters found");
        return;
      }

      // Get subscription ID from URL params
      // Cashfree may return different param names
      let subscriptionId = 
        searchParams.get("subscription_id") || 
        searchParams.get("cf_subscription_id") ||
        searchParams.get("sub_id");
      
      const subscriptionStatus = searchParams.get("subscription_status");
      const cfSubId = searchParams.get("cf_subscription_id");

      // Also check sessionStorage as fallback (set before redirect)
      const storedSubscriptionId = typeof window !== 'undefined' 
        ? sessionStorage.getItem('cashfree_subscription_id') 
        : null;

      // Use stored ID if URL params don't have it
      if (!subscriptionId && !cfSubId && storedSubscriptionId) {
        subscriptionId = storedSubscriptionId;
      }

      if (!subscriptionId && !cfSubId) {
        setStatus("failed");
        setMessage("Invalid callback - missing subscription ID. Please contact support.");
        return;
      }

      setStatus("verifying");
      setMessage("Verifying your payment...");

      // Store subscription ID for retry
      const subId = subscriptionId || cfSubId!;
      setCurrentSubscriptionId(subId);

      try {
        const result = await paymentService.verifyCashfreePayment(subId);

        
        // Clear stored data after verification attempt
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('cashfree_subscription_id');
          sessionStorage.removeItem('cashfree_subs_session_id');
        }

        // Check if subscription is active
        if (result.success && result.subscription?.isActive) {
          setStatus("success");
          setMessage("Payment successful! Your subscription is now active.");
          
          // Store telegram links if available
          if (result.telegramInviteLinks && result.telegramInviteLinks.length > 0) {
            setTelegramLinks(result.telegramInviteLinks);
          }

          toast({
            title: "Payment Successful",
            description: "Your subscription has been activated.",
          });

          // Auto-redirect to dashboard after 3 seconds if no telegram links
          if (!result.telegramInviteLinks || result.telegramInviteLinks.length === 0) {
            setTimeout(() => {
              router.push("/dashboard?payment=success");
            }, 3000);
          }
        } 
        // Check if payment is pending bank approval
        else if (result.success && result.subscription?.status === "pending" && 
                 (result.subscription?.cashfreeStatus === "BANK_APPROVAL_PENDING" || 
                  result.subscription?.cashfreeStatus === "BANK_APPROVAL_PENDING")) {
          setStatus("pending");
          setMessage("Your payment is being processed. It will be activated once bank approval is complete.");
          
          toast({
            title: "Payment Pending",
            description: "Your subscription will be activated once approved by the bank.",
          });
        }
        else {
          setStatus("failed");
          setMessage(result.message || result.error || "Payment verification failed");
          
          toast({
            title: "Verification Failed",
            description: result.message || "Please contact support if payment was deducted",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Cashfree callback error:", error);
        setStatus("failed");
        setMessage(error?.message || "Failed to verify payment");
        
        toast({
          title: "Verification Error",
          description: error?.message || "Please contact support",
          variant: "destructive",
        });
      }
    };

    handleCallback();
  }, [searchParams, authLoading, isAuthenticated, router, toast, retryCount]);

  const handleRetry = async () => {
    if (!currentSubscriptionId) {
      toast({
        title: "Error",
        description: "Subscription ID not found. Please try again from the dashboard.",
        variant: "destructive",
      });
      return;
    }

    setStatus("verifying");
    setMessage("Retrying verification...");

    try {
      const result = await paymentService.verifyCashfreePayment(currentSubscriptionId);

      if (result.success && result.subscription?.isActive) {
        setStatus("success");
        setMessage("Payment successful! Your subscription is now active.");
        
        if (result.telegramInviteLinks && result.telegramInviteLinks.length > 0) {
          setTelegramLinks(result.telegramInviteLinks);
        }

        toast({
          title: "Payment Successful",
          description: "Your subscription has been activated.",
        });

        if (!result.telegramInviteLinks || result.telegramInviteLinks.length === 0) {
          setTimeout(() => {
            router.push("/dashboard?payment=success");
          }, 3000);
        }
      } else if (result.success && result.subscription?.status === "pending" && 
                 (result.subscription?.cashfreeStatus === "BANK_APPROVAL_PENDING" || 
                  result.subscription?.cashfreeStatus === "BANK_APPROVAL_PENDING")) {
        setStatus("pending");
        setMessage("Your payment is being processed. It will be activated once bank approval is complete.");
        
        toast({
          title: "Payment Still Pending",
          description: "Your subscription will be activated once approved by the bank.",
        });
      } else {
        setStatus("failed");
        setMessage(result.message || result.error || "Payment verification failed");
        
        toast({
          title: "Verification Failed",
          description: result.message || "Please contact support if payment was deducted",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Retry verification error:", error);
      setStatus("failed");
      setMessage(error?.message || "Failed to verify payment");
      
      toast({
        title: "Verification Error",
        description: error?.message || "Please contact support",
        variant: "destructive",
      });
    }
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleTryAgain = () => {
    // Go back to the previous page or subscription page
    const returnUrl = sessionStorage.getItem('cashfree_return_url');
    if (returnUrl) {
      sessionStorage.removeItem('cashfree_return_url');
      router.push(returnUrl);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 text-center"
      >
        {/* Loading State */}
        {(status === "loading" || status === "verifying") && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              {status === "loading" ? "Processing..." : "Verifying Payment"}
            </h1>
            <p className="text-muted-foreground">
              {message || "Please wait while we verify your payment..."}
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </motion.div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Payment Successful!</h1>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>

            {/* Telegram Links */}
            {telegramLinks.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Join our Telegram channels:
                </p>
                {telegramLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.invite_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-2 bg-[#0088cc] text-white rounded-lg hover:bg-[#006699] transition-colors"
                  >
                    Join Channel {telegramLinks.length > 1 ? index + 1 : ""}
                  </a>
                ))}
              </div>
            )}

            <Button onClick={handleGoToDashboard} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        )}

        {/* Pending State */}
        {status === "pending" && (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center"
            >
              <Loader2 className="w-8 h-8 text-yellow-600 dark:text-yellow-400 animate-spin" />
            </motion.div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Payment Pending</h1>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>

            <div className="space-y-3">
              <Button onClick={handleRetry} variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Verification
              </Button>
              <Button onClick={handleGoToDashboard} className="w-full">
                Go Back to Dashboard
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Your subscription will be activated automatically once the bank approves the payment.
            </p>
          </div>
        )}

        {/* Failed State */}
        {status === "failed" && (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center"
            >
              <X className="w-8 h-8 text-red-600 dark:text-red-400" />
            </motion.div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Payment Failed</h1>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>

            <div className="space-y-3">
              <Button onClick={handleRetry} variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Verification
              </Button>
              <Button onClick={handleGoToDashboard} className="w-full">
                Go Back to Dashboard
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              If payment was deducted, please contact support with your subscription details.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function CashfreeCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CashfreeCallbackContent />
    </Suspense>
  );
}
