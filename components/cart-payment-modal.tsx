"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/auth-context";
import { useRouter } from "next/navigation";
import { paymentService, PaymentGatewayType } from "@/services/payment.service";
import CartAuthForm from "@/components/cart-auth-form";
import { DigioVerificationModal } from "@/components/digio-verification-modal";
import { paymentFlowState } from "@/lib/payment-flow-state";
import type { PaymentAgreementData } from "@/services/digio.service";
import { CouponInput } from "@/components/coupon-input";
import type { CouponValidationResponse } from "@/services/coupon.service";
import { useCart } from "@/components/cart/cart-context";
import { PaymentGatewaySelectorModal } from "@/components/payment-gateway-selector";
import { usePaymentGateways } from "@/hooks/use-payment-gateways";
import { CashfreeModal } from "@/components/cashfree-modal";

interface CartPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  subscriptionType: "monthly" | "quarterly" | "yearly";
  total: number;
  onPaymentSuccess: () => void;
}

export const CartPaymentModal: React.FC<CartPaymentModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subscriptionType,
  total,
  onPaymentSuccess,
}) => {

  const [step, setStep] = useState<
    "plan" | "consent" | "auth" | "pan-form" | "gateway-select" | "processing" | "success" | "error"
  >("plan");
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("Preparing secure payment…");
  const [showDigio, setShowDigio] = useState(false);
  const [agreementData, setAgreementData] = useState<PaymentAgreementData | null>(null);
  const [telegramLinks, setTelegramLinks] = useState<Array<{
    invite_link: string;
  }> | null>(null);
  const [panFormData, setPanFormData] = useState({
    fullName: "",
    dateofBirth: "",
    phone: "",
    pandetails: ""
  });
  const [panFormLoading, setPanFormLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse["coupon"] | null>(null);
  const [finalTotal, setFinalTotal] = useState(total);

  // Payment gateway selection state
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType | null>(null);
  const [showGatewaySelector, setShowGatewaySelector] = useState(false);
  const { gateways, hasMultipleGateways, defaultGateway, supportsEmandate } = usePaymentGateways();

  // Cashfree modal state
  const [showCashfreeModal, setShowCashfreeModal] = useState(false);
  const [cashfreeModalData, setCashfreeModalData] = useState<{
    paymentSessionId?: string;
    subsSessionId?: string;
    paymentType: 'one_time' | 'recurring';
    amount: number;
  } | null>(null);

  // Update finalTotal when total changes (e.g., when subscription type changes)
  useEffect(() => {
    if (!appliedCoupon) {
      setFinalTotal(total);
    }
  }, [total, appliedCoupon]);

  const cancelRequested = useRef(false);
  const { isAuthenticated, user } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  // Always use eMandate flow for cart payments
  const isEmandateFlow = true;

  const handleCouponApplied = (coupon: CouponValidationResponse["coupon"] | null) => {
    setAppliedCoupon(coupon);
    if (coupon) {
      const discountAmount = coupon.discountType === "percentage"
        ? Math.min((total * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
        : coupon.discountValue;
      setFinalTotal(Math.round(Math.max(0, total - discountAmount) * 100) / 100);
    } else {
      setFinalTotal(total);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    setStep("plan");

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    document.body.style.overflow = 'unset';
    setStep("plan");
    setProcessing(false);
    setShowDigio(false);
    setAgreementData(null);
    setTelegramLinks(null);
    setSelectedGateway(null); // Reset selected gateway
    setShowGatewaySelector(false); // Reset gateway selector

    // Clear any cached payment data to prevent reusing expired subscription IDs
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('razorpay_subscription_id');
      sessionStorage.removeItem('razorpay_return_url');
      sessionStorage.removeItem('cashfree_subscription_id');
      sessionStorage.removeItem('cashfree_return_url');
      sessionStorage.removeItem('cashfree_gateway');
    }

    paymentFlowState.clear();
    onClose();
  };

  const handleAuthSuccess = async () => {
    setStep("processing");
    setProcessing(true);
    setProcessingMsg("Checking profile...");
    await handlePaymentFlow();
  };

  const handleDigioComplete = async () => {
    setShowDigio(false);

    // Verify cart eSign status with backend before proceeding (with polling)
    const cartId = cart?._id && cart._id !== "local" ? cart._id : undefined;
    if (cartId) {
      setStep("processing");
      setProcessing(true);
      setProcessingMsg("Verifying digital signature...");

      try {
        const { digioService } = await import("@/services/digio.service");
        // Use cart-specific eSign verification with polling
        const verifyResult = await digioService.verifyAndUpdateCartEsignStatus(cartId, {
          poll: true,
          maxAttempts: 10,
          delayMs: 2000
        });

        if (!verifyResult.success || !verifyResult.signed) {
          // eSign not completed - show error or retry
          toast({
            title: "Signature Verification",
            description: verifyResult.error || "Please complete the digital signature process before proceeding.",
            variant: "destructive"
          });
          setProcessing(false);
          setStep("plan");
          return;
        }

        // eSign completed successfully
        toast({
          title: "Signature Verified",
          description: "Digital signature completed. Proceeding to payment...",
        });
      } catch (error) {
        console.error("Error verifying cart eSign:", error);
        // Continue anyway - backend will do final verification
      }
    }

    // If a gateway was already selected (e.g., Cashfree triggered eSign), proceed with that gateway
    if (selectedGateway) {
      await proceedWithPayment(selectedGateway);
      return;
    }

    // After eSign completion, check if we need to show gateway selector
    // Filter gateways that support emandate for cart flow
    const availableGateways = gateways.filter(g => supportsEmandate(g.id));

    if (availableGateways.length > 1) {
      // Multiple gateways available - show selector
      setShowGatewaySelector(true);
    } else if (availableGateways.length === 1) {
      // Only one gateway - auto-select and proceed
      setSelectedGateway(availableGateways[0].id);
      await proceedWithPayment(availableGateways[0].id);
    } else {
      // No gateways available - use default (Razorpay)
      setSelectedGateway('razorpay');
      await proceedWithPayment('razorpay');
    }
  };

  // Handle gateway selection from modal
  const handleGatewaySelect = async (gatewayId: PaymentGatewayType) => {
    setSelectedGateway(gatewayId);
    setShowGatewaySelector(false);
    await proceedWithPayment(gatewayId);
  };

  // Proceed with payment after gateway selection
  const proceedWithPayment = async (gateway: PaymentGatewayType) => {
    setStep("processing");
    setProcessing(true);

    if (gateway === 'cashfree') {
      await handleCashfreePayment();
    } else {
      await handleEmandatePaymentFlow();
    }
  };

  // Handle Cashfree cart payment flow using unified API
  const handleCashfreePayment = async () => {
    try {
      setProcessingMsg("Creating subscription...");

      // Clear any old cached data before creating new subscription
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('cashfree_subscription_id');
        sessionStorage.removeItem('cashfree_return_url');
        sessionStorage.removeItem('cashfree_gateway');
        sessionStorage.removeItem('cashfree_subscription_session');
      }

      // Use unified cart API with gateway='cashfree'
      const cartPayload = {
        ...(cart?._id && cart._id !== "local" && { cartId: cart._id }),
        interval: subscriptionType as "monthly" | "quarterly" | "yearly",
        ...(appliedCoupon && { couponCode: appliedCoupon.code }),
        gateway: "cashfree" as const,
      };

      const result = await paymentService.createCartEmandate(cartPayload);

      const subsSessionId = result.cashfree?.subsSessionId ||
        result.cashfree?.sessionId ||
        result.cashfree?.subscription_session_id ||
        (result as any).subscription_session_id;

      console.log('🔍 Cashfree API response:', result);
      console.log('🔑 Extracted subsSessionId:', subsSessionId);

      if (!subsSessionId) {
        console.error("❌ Missing subsSessionId in response:", result);
        throw new Error('Missing subscription session ID. Please contact support.');
      }

      setProcessingMsg("Opening Cashfree authorization...");

      // Store subscription info for verification after redirect
      if (result.subscriptionId) {
        sessionStorage.setItem('cashfree_subscription_id', result.subscriptionId);
      }
      sessionStorage.setItem('cashfree_subs_session_id', subsSessionId);
      sessionStorage.setItem('cashfree_return_url', window.location.href);

      // Open Cashfree modal instead of redirecting
      setCashfreeModalData({
        subsSessionId: subsSessionId,
        paymentType: 'recurring', // Cart payments always use eMandate (recurring)
        amount: finalTotal,
      });
      setShowCashfreeModal(true);
      setProcessing(false);

    } catch (error: any) {
      console.error("Cashfree cart payment error:", error);

      // Check for eSign requirement (412 error or ESIGN_REQUIRED code)
      if (error.response?.status === 412 && error.response?.data?.code === 'ESIGN_REQUIRED') {
        if (cartItems?.length > 0) {
          const data: PaymentAgreementData = {
            customerName: (user as any)?.fullName || user?.username || "User",
            customerEmail: user?.email || "user@example.com",
            customerMobile: user?.phone,
            amount: finalTotal,
            subscriptionType: subscriptionType,
            portfolioNames: cartItems.map(item => item.portfolio.name),
            agreementDate: new Date().toLocaleDateString("en-IN"),
            productType: "Portfolio",
            productId: cartItems[0]?.portfolio._id,
            productName: cartItems[0]?.portfolio.name,
          } as any;

          // Store selected gateway for after eSign
          setSelectedGateway('cashfree');
          setAgreementData(data);
          setShowDigio(true);
        }
        setProcessing(false);
        return;
      }

      // Check for eSign pending
      if (error.response?.data?.success === false && error.response?.data?.code === 'ESIGN_PENDING') {
        const authUrl = error.response.data.pendingEsign?.authenticationUrl;
        if (authUrl && cartItems?.length > 0) {
          const data: PaymentAgreementData = {
            customerName: (user as any)?.fullName || user?.username || "User",
            customerEmail: user?.email || "user@example.com",
            customerMobile: user?.phone,
            amount: finalTotal,
            subscriptionType: subscriptionType,
            portfolioNames: cartItems.map(item => item.portfolio.name),
            agreementDate: new Date().toLocaleDateString("en-IN"),
            productType: "Portfolio",
            productId: cartItems[0]?.portfolio._id,
            productName: cartItems[0]?.portfolio.name,
          } as any;

          // Store selected gateway for after eSign
          setSelectedGateway('cashfree');
          setAgreementData(data);
          setShowDigio(true);
        }
        setProcessing(false);
        return;
      }

      setStep("error");
      setProcessing(false);
      toast({
        title: "Payment Error",
        description: error?.message || "Could not process Cashfree payment",
        variant: "destructive",
      });
    }
  };

  const startDigioFlow = useCallback(() => {
    if (!cartItems || cartItems.length === 0) return;

    const data: PaymentAgreementData = {
      customerName: (user as any)?.fullName || user?.username || "User",
      customerEmail: user?.email || "user@example.com",
      customerMobile: user?.phone,
      amount: total,
      subscriptionType: subscriptionType,
      portfolioNames: cartItems.map(item => item.portfolio.name),
      agreementDate: new Date().toLocaleDateString("en-IN"),
      productType: "Portfolio",
      productId: cartItems[0]?.portfolio._id,
      productName: cartItems[0]?.portfolio.name,
    } as any;

    setAgreementData(data);
    setShowDigio(true);
  }, [cartItems, user, subscriptionType, total]);

  const handlePaymentFlow = async () => {

    try {
      // Step 1: Check PAN details first
      const panCheck = await paymentService.checkPanDetails();
      if (!panCheck.hasPan) {
        const dobFromProfile = panCheck.profile?.dateOfBirth || panCheck.profile?.dateofBirth;
        const dobFromUser = (user as any)?.dateOfBirth || (user as any)?.dateofBirth;
        let finalDob = dobFromProfile || dobFromUser || "";

        if (finalDob && finalDob.includes('T')) {
          finalDob = finalDob.split('T')[0];
        }

        setPanFormData({
          fullName: panCheck.profile?.fullName || (user as any)?.fullName || "",
          dateofBirth: finalDob,
          phone: panCheck.profile?.phone || (user as any)?.phone || "",
          pandetails: ""
        });
        setStep("pan-form");
        setProcessing(false);
        return;
      }

      // Step 2: Show gateway selector instead of directly proceeding
      setProcessing(false);

      // Filter gateways that support emandate for cart flow
      const availableGateways = gateways.filter(g => supportsEmandate(g.id));

      if (availableGateways.length > 1) {
        // Multiple gateways available - show selector
        setShowGatewaySelector(true);
      } else if (availableGateways.length === 1) {
        // Only one gateway - auto-select and proceed
        setSelectedGateway(availableGateways[0].id);
        await proceedWithPayment(availableGateways[0].id);
      } else {
        // No gateways with eMandate support - default to Razorpay
        setSelectedGateway('razorpay');
        await proceedWithPayment('razorpay');
      }
    } catch (error: any) {
      // Check for eSign requirement
      if (error.response?.data?.success === false && error.response?.data?.code === 'ESIGN_REQUIRED') {
        startDigioFlow();
        setProcessing(false);
        return;
      }

      // Check for eSign pending
      if (error.response?.data?.success === false && error.response?.data?.code === 'ESIGN_PENDING') {
        const authUrl = error.response.data.pendingEsign?.authenticationUrl;
        if (authUrl && cartItems?.length > 0) {
          const data: PaymentAgreementData = {
            customerName: (user as any)?.fullName || user?.username || "User",
            customerEmail: user?.email || "user@example.com",
            customerMobile: user?.phone,
            amount: total,
            subscriptionType: subscriptionType,
            portfolioNames: cartItems.map(item => item.portfolio.name),
            agreementDate: new Date().toLocaleDateString("en-IN"),
            productType: "Portfolio",
            productId: cartItems[0]?.portfolio._id,
            productName: cartItems[0]?.portfolio.name,
          } as any;
          setAgreementData(data);
          setShowDigio(true);
        }
        setProcessing(false);
        return;
      }

      setStep("error");
      setProcessing(false);
      toast({
        title: "Payment Error",
        description: error?.message || "Could not start payment",
        variant: "destructive",
      });
    }
  };

  const handleEmandatePaymentFlow = async () => {
    try {
      cancelRequested.current = false;
      setProcessingMsg("Creating eMandate…");

      // Clear any old cached data before creating new subscription
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('razorpay_subscription_id');
        sessionStorage.removeItem('razorpay_return_url');
      }

      // Create cart eMandate payload with unified API (gateway='razorpay')
      const cartEmandatePayload = {
        ...(cart?._id && cart._id !== "local" && { cartId: cart._id }),
        interval: subscriptionType as "monthly" | "quarterly" | "yearly",
        ...(appliedCoupon && { couponCode: appliedCoupon.code }),
        gateway: "razorpay" as const,
      };


      const emandate = await paymentService.createCartEmandate(cartEmandatePayload);

      if (cancelRequested.current) {
        setProcessing(false);
        setStep("consent");
        return;
      }

      setProcessingMsg("Opening payment gateway…");

      // For Razorpay subscriptions, ALWAYS use SDK popup method (not redirect)
      // short_url is only a fallback for cases where SDK cannot load
      // This keeps user on our site and provides better UX
      try {
        // Use Razorpay SDK popup with subscription_id
        await paymentService.openCheckout(
          emandate,
          {
            name: (user as any)?.fullName || user?.username || "User",
            email: user?.email || "user@example.com",
          },
          async () => {
            setProcessingMsg("Verifying payment…");
            const verify = await paymentService.verifyEmandateWithRetry(emandate.subscriptionId);

            if (verify.success || ["active", "authenticated"].includes((verify as any).subscriptionStatus || "")) {
              const links = (verify as any)?.telegramInviteLinks;
              setTelegramLinks(links || []);

              setStep("success");
              setProcessing(false);
              paymentFlowState.clear();

              // Call onPaymentSuccess but don't auto-close modal
              onPaymentSuccess();
              toast({
                title: "Payment Successful",
                description: (verify as any)?.isCartEmandate
                  ? `${(verify as any)?.activatedSubscriptions || cartItems.length} subscriptions activated successfully!`
                  : "Subscription activated"
              });
            } else {
              setStep("error");
              setProcessing(false);
              toast({ title: "Verification Failed", description: verify.message || "Please try again", variant: "destructive" });
            }
          },
          (err) => {
            setStep("error");
            setProcessing(false);
            toast({ title: "Payment Cancelled", description: err?.message || "Payment was cancelled", variant: "destructive" });
          }
        );
      } catch (sdkError: any) {
        // SDK failed to load - fallback to redirect with short_url
        console.warn("Razorpay SDK failed, falling back to redirect:", sdkError);

        if (emandate.short_url) {
          setProcessingMsg("Redirecting to payment page...");
          sessionStorage.setItem('razorpay_subscription_id', emandate.subscriptionId);
          sessionStorage.setItem('razorpay_return_url', window.location.href);
          window.location.href = emandate.short_url;
        } else if (emandate.authorization_url) {
          setProcessingMsg("Redirecting to payment page...");
          sessionStorage.setItem('razorpay_subscription_id', emandate.subscriptionId);
          sessionStorage.setItem('razorpay_return_url', window.location.href);
          window.location.href = emandate.authorization_url;
        } else {
          setStep("error");
          setProcessing(false);
          toast({
            title: "Payment Error",
            description: "Failed to load payment gateway. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      // Check for eSign requirement for eMandate
      if (error.response?.status === 412 || error.response?.data?.code === 'ESIGN_REQUIRED') {
        startDigioFlow();
        setProcessing(false);
        return;
      }

      // Check for eSign pending for eMandate
      if (error.response?.data?.success === false && error.response?.data?.code === 'ESIGN_PENDING') {
        const authUrl = error.response.data.pendingEsign?.authenticationUrl;
        if (authUrl && cartItems?.length > 0) {
          const data: PaymentAgreementData = {
            customerName: (user as any)?.fullName || user?.username || "User",
            customerEmail: user?.email || "user@example.com",
            customerMobile: user?.phone,
            amount: finalTotal,
            subscriptionType: subscriptionType,
            portfolioNames: cartItems.map(item => item.portfolio.name),
            agreementDate: new Date().toLocaleDateString("en-IN"),
            productType: "Portfolio",
            productId: cartItems[0]?.portfolio._id,
            productName: cartItems[0]?.portfolio.name,
          } as any;
          setAgreementData(data);
          setShowDigio(true);
        }
        setProcessing(false);
        return;
      }

      // Handle subscription conflict errors
      const errorData = error?.response?.data;
      if (errorData?.error === "Active subscription conflicts" && errorData?.details?.conflicts) {
        const conflicts = errorData.details.conflicts;
        const conflictNames = conflicts.map((c: any) => c.portfolioName).join(", ");
        setStep("error");
        setProcessing(false);
        toast({
          title: "Active Subscriptions Found",
          description: `You already have active subscriptions for: ${conflictNames}. Please remove them from cart or wait until they expire.`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      setStep("error");
      setProcessing(false);
      toast({
        title: "Checkout Error",
        description: errorData?.error || errorData?.message || error?.message || "Could not start checkout",
        variant: "destructive",
      });
    }
  };

  const continueAfterDigio = async () => {
    try {
      cancelRequested.current = false;
      setStep("processing");
      setProcessing(true);
      setProcessingMsg("Proceeding to payment after verification...");

      // Proceed directly to eMandate creation after Digio completion
      await handleEmandatePaymentFlow();
    } catch (error: any) {
      setStep("error");
      setProcessing(false);
      toast({
        title: "Checkout Error",
        description: error?.message || "Could not start checkout after verification",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && step !== "pan-form" && !panFormLoading) {
              handleClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-white rounded-t-xl flex-shrink-0">
              <h2 className="text-xl font-bold">
                {step === "success"
                  ? "Payment Successful!"
                  : step === "error"
                    ? "Payment Failed"
                    : step === "processing"
                      ? "Processing Payment"
                      : step === "auth"
                        ? "Login Required"
                        : step === "consent"
                          ? "Complete Your Digital Verification"
                          : step === "pan-form"
                            ? "Complete Your Profile"
                            : step === "plan"
                              ? "Cart Checkout"
                              : "Cart Checkout"
                }
              </h2>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                {step === "plan" && (
                  <div className="space-y-6">
                    {/* Cart Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Order Summary</h4>
                      <div className="space-y-2">
                        {cartItems.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-blue-800">{item.portfolio.name}</span>
                            <span className="text-blue-900 font-medium">Qty: {item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-blue-300 pt-2 mt-2">
                          {appliedCoupon && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-blue-700">Subtotal:</span>
                                <span className="text-blue-800">₹{total.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm text-green-600">
                                <span>Discount ({appliedCoupon.code}):</span>
                                <span>-₹{(Math.round((total - finalTotal) * 100) / 100).toLocaleString()}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between font-semibold">
                            <span className="text-blue-900">Total Amount:</span>
                            <span className="text-blue-900">₹{finalTotal.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-blue-700 mt-1">
                            Billing: {subscriptionType === "yearly" ? "Yearly" : subscriptionType === "quarterly" ? "Quarterly" : "Monthly"} (eMandate)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coupon Input */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Have a Coupon Code?</h4>
                      <CouponInput
                        onCouponApplied={handleCouponApplied}
                        originalAmount={total}
                        disabled={processing}
                      />
                    </div>


                  </div>
                )}

                {step === "consent" && (
                  <div className="space-y-6">
                    {/* Cart Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Order Summary</h4>
                      <div className="space-y-2">
                        {cartItems.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-blue-800">{item.portfolio.name}</span>
                            <span className="text-blue-900 font-medium">Qty: {item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-blue-300 pt-2 mt-2">
                          {appliedCoupon && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-blue-700">Subtotal:</span>
                                <span className="text-blue-800">₹{total.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm text-green-600">
                                <span>Discount ({appliedCoupon.code}):</span>
                                <span>-₹{(total - finalTotal).toLocaleString()}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between font-semibold">
                            <span className="text-blue-900">Total Amount:</span>
                            <span className="text-blue-900">₹{finalTotal.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-blue-700 mt-1">
                            Billing: {subscriptionType === "yearly" ? "Yearly" : subscriptionType === "quarterly" ? "Quarterly" : "Monthly"} (eMandate)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coupon Input */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Have a Coupon Code?</h4>
                      <CouponInput
                        onCouponApplied={handleCouponApplied}
                        originalAmount={total}
                        disabled={processing}
                      />
                    </div>

                    {/* YouTube Video */}
                    <div className="bg-black rounded-lg overflow-hidden aspect-video">
                      <iframe
                        src="https://www.youtube-nocookie.com/embed/guetyPOoThw?rel=0&modestbranding=1&enablejsapi=1"
                        title="Digital Verification Process"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      ></iframe>
                    </div>

                    {/* Content Below Video */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-xl font-semibold text-gray-900 mb-4">
                        Why Digital Verification is Required
                      </h4>
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 mb-4">
                          As per SEBI regulations and RBI guidelines, all investment platforms must verify the identity
                          of their subscribers before processing any financial transactions. This digital verification
                          ensures the security of your investments and compliance with regulatory requirements.
                        </p>
                        <p className="text-gray-700 mb-4">
                          The process is completely secure, government-approved, and takes only a few minutes to complete.
                          Your personal information is encrypted and protected throughout the verification process.
                        </p>
                        <p className="text-gray-700">
                          Once verified, you'll have seamless access to all our premium investment services and
                          portfolio recommendations.
                        </p>
                      </div>
                    </div>




                  </div>
                )}

                {step === "auth" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Login to Continue</h3>
                      <p className="text-gray-600 text-sm">Amount: ₹{total.toLocaleString()}</p>
                      <p className="text-gray-600 text-sm">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart</p>
                    </div>
                    <CartAuthForm
                      onAuthSuccess={handleAuthSuccess}
                      onPaymentTrigger={() => { }}
                      cartTotal={total}
                      cartItemCount={cartItems.length}
                    />
                  </div>
                )}

                {step === "pan-form" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        Complete Your Profile
                      </h3>
                      <p className="text-gray-600 text-sm">
                        We need your PAN details to comply with regulatory requirements
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-blue-800">Why PAN is Required</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            As per SEBI regulations, PAN verification is mandatory for all investment services. Your details are secure and encrypted.
                          </p>
                        </div>
                      </div>
                    </div>

                    <form className="space-y-5" onSubmit={async (e) => {
                      e.preventDefault();
                      setPanFormLoading(true);

                      try {
                        if (!panFormData.fullName.trim()) {
                          throw new Error("Full name is required");
                        }
                        if (!panFormData.dateofBirth) {
                          throw new Error("Date of birth is required");
                        }
                        if (!panFormData.phone.trim()) {
                          throw new Error("Phone number is required");
                        }
                        if (!panFormData.pandetails.trim()) {
                          throw new Error("PAN details are required");
                        }

                        await paymentService.updatePanDetails(panFormData);

                        const profileCheck = await paymentService.checkPanDetails();
                        if (!profileCheck.hasPan) {
                          toast({
                            title: "Profile Update Failed",
                            description: "PAN details could not be saved. Please try again.",
                            variant: "destructive",
                          });
                          return;
                        }

                        toast({
                          title: "Profile Updated",
                          description: "Your PAN details have been verified and saved successfully",
                        });
                        setStep("consent");
                      } catch (error: any) {
                        toast({
                          title: "Update Failed",
                          description: error.message || "Failed to update profile",
                          variant: "destructive",
                        });
                      } finally {
                        setPanFormLoading(false);
                      }
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={panFormData.fullName}
                            onChange={(e) => setPanFormData({ ...panFormData, fullName: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter your full name as per PAN"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date of Birth *
                          </label>
                          <input
                            type="date"
                            required
                            value={panFormData.dateofBirth}
                            onChange={(e) => setPanFormData({ ...panFormData, dateofBirth: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={panFormData.phone}
                          onChange={(e) => setPanFormData({ ...panFormData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter your phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PAN Card Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={panFormData.pandetails}
                          onChange={(e) => setPanFormData({ ...panFormData, pandetails: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-lg tracking-wider"
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
                        </p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => setStep("consent")}
                          className="flex-1 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          disabled={panFormLoading}
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-[#001633] hover:bg-[#002244] text-white py-3"
                          disabled={panFormLoading}
                        >
                          {panFormLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Verifying PAN...
                            </>
                          ) : (
                            "Verify & Continue"
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {step === "processing" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
                    <p className="text-gray-600 mb-4">{processingMsg}</p>
                    <p className="text-xs text-gray-500 mb-4">
                      If the Razorpay window is open, you can close it to cancel.
                    </p>
                    <Button
                      className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        cancelRequested.current = true;
                        setProcessing(false);
                        setStep("consent");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {step === "success" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-green-800">
                      Payment Successful!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Your portfolio subscription has been activated successfully!
                    </p>
                    <Button
                      onClick={() => {
                        handleClose();
                        router.push("/dashboard");
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 mb-4"
                    >
                      Continue to Dashboard
                    </Button>

                    {/* Telegram Links Section */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      {telegramLinks && telegramLinks.length > 0 ? (
                        <>
                          <h4 className="text-sm font-semibold text-blue-800 mb-3">
                            🎉 Join Your Exclusive Telegram Groups:
                          </h4>
                          <div className="space-y-2">
                            {telegramLinks.map((link, index) => (
                              <a
                                key={index}
                                href={link.invite_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.858-.896 6.728-.896 6.728-.377 2.655-.377 2.655-1.377 2.655-.896 0-1.377-1.377-1.377-2.655 0-1.858.896-6.728.896-6.728C15.186 6.302 16.582 6.302 17.568 8.16zM8.432 8.16c.169 1.858.896 6.728.896 6.728.377 2.655.377 2.655 1.377 2.655.896 0 1.377-1.377 1.377-2.655 0-1.858-.896-6.728-.896-6.728C8.814 6.302 7.418 6.302 8.432 8.16z" />
                                </svg>
                                Join Telegram Group {index + 1}
                              </a>
                            ))}
                          </div>
                          <p className="text-xs text-blue-600 mt-3 text-center">
                            💡 Click the buttons above to join your exclusive investment groups
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-sm font-semibold text-blue-800 mb-3">
                            📱 Telegram Group Access
                          </h4>
                          <p className="text-sm text-blue-700 mb-3">
                            Your Telegram group links will be available shortly. Please check your subscriptions tab in your profile page.
                          </p>
                          <button
                            onClick={() => {
                              handleClose();
                              router.push("/settings");
                            }}
                            className="w-full px-4 py-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Go to Profile Settings
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {step === "error" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-red-800">
                      Payment Failed
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Something went wrong with your payment. Please try again.
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={() => setStep("plan")}
                        className="w-full bg-[#001633] hover:bg-[#002244]"
                      >
                        Try Again
                      </Button>
                      <Button
                        onClick={handleClose}
                        className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="p-4 sm:p-6 border-t bg-white flex-shrink-0">
              {step === "plan" && (
                <Button
                  onClick={() => {
                    if (isAuthenticated && user) {
                      setStep("processing");
                      setProcessing(true);
                      setProcessingMsg("Checking profile...");
                      handlePaymentFlow();
                    } else {
                      setStep("auth");
                    }
                  }}
                  className="w-full bg-[#001633] hover:bg-[#002244] text-white py-3"
                >
                  {isAuthenticated ? "Continue to Payment" : "Proceed to Payment"}
                </Button>
              )}

              {step === "consent" && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep("plan")}
                    className="flex-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Back to Plan
                  </Button>
                  <Button
                    onClick={() => {
                      setStep("processing");
                      setProcessing(true);
                      setProcessingMsg("Creating order...");
                      handlePaymentFlow();
                    }}
                    className="flex-1 bg-[#001633] hover:bg-[#002244] text-white"
                  >
                    Proceed to Verification
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Digio Verification Modal */}
      {showDigio && agreementData && (
        <DigioVerificationModal
          isOpen={showDigio}
          onClose={() => setShowDigio(false)}
          onVerificationComplete={handleDigioComplete}
          agreementData={agreementData}
          cartId={cart?._id && cart._id !== "local" ? cart._id : undefined}
        />
      )}

      {/* Payment Gateway Selector Modal */}
      <PaymentGatewaySelectorModal
        isOpen={showGatewaySelector}
        onClose={() => {
          setShowGatewaySelector(false);
          setStep("plan");
        }}
        onSelect={handleGatewaySelect}
        title="Choose Payment Method"
        description="Select your preferred payment gateway to complete the subscription"
        isEmandate={true}
      />

      {/* Cashfree Modal */}
      {showCashfreeModal && cashfreeModalData && (
        <CashfreeModal
          isOpen={showCashfreeModal}
          onClose={() => {
            setShowCashfreeModal(false);
            setCashfreeModalData(null);
            setStep("plan");
          }}
          paymentSessionId={cashfreeModalData.paymentSessionId}
          subsSessionId={cashfreeModalData.subsSessionId}
          paymentType={cashfreeModalData.paymentType}
          amount={cashfreeModalData.amount}
          title={cashfreeModalData.paymentType === 'one_time' ? "Complete Payment" : "Complete Payment Authorization"}
          onSuccess={async () => {
            setShowCashfreeModal(false);
            setCashfreeModalData(null);
            setStep("success");

            // Clear cart and redirect
            setTimeout(() => {
              onPaymentSuccess();
              router.push('/dashboard?payment=success');
            }, 2000);
          }}
          onFailure={(error) => {
            console.error('Cashfree modal error:', error);
            setShowCashfreeModal(false);
            setCashfreeModalData(null);
            setStep("error");
            toast({
              title: "Payment Failed",
              description: error?.message || "Payment authorization failed. Please try again.",
              variant: "destructive",
            });
          }}
        />
      )}
    </>
  );
};