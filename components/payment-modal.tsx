"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/auth-context";
import { useRouter } from "next/navigation";
import { Bundle } from "@/services/bundle.service";
import { paymentService } from "@/services/payment.service";
import CartAuthForm from "@/components/cart-auth-form";
import { DigioVerificationModal } from "@/components/digio-verification-modal";
import { paymentFlowState } from "@/lib/payment-flow-state";
import { profileCompletionState } from "@/lib/profile-completion-state";
import type { PaymentAgreementData } from "@/services/digio.service";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundle: Bundle | null;
  isEmandateFlow?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bundle,
  isEmandateFlow = false,
}) => {
  // Use isEmandateFlow to determine which options to show
  console.log("isEmandateFlow:", isEmandateFlow);
  const [step, setStep] = useState<
    "plan" | "consent" | "auth" | "pan-form" | "esign" | "processing" | "success" | "error"
  >("plan");
  const [subscriptionType, setSubscriptionType] = useState<
    "monthly" | "yearly"
  >("monthly");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState(
    "Preparing secure payment…"
  );
  const [showDigio, setShowDigio] = useState(false);
  const [agreementData, setAgreementData] =
    useState<PaymentAgreementData | null>(null);
  const [eSignData, setESignData] = useState<{
    documentId?: string;
    authUrl?: string;
  } | null>(null);
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
  const [panVerifying, setPanVerifying] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const cancelRequested = useRef(false);
  const continuedAfterAuthRef = useRef(false);

  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const isPremium = bundle?.category === "premium";

  const getPrice = useCallback(() => {
    if (!bundle) return 0;
    let basePrice = 0;
    if (isEmandateFlow) {
      basePrice =
        subscriptionType === "yearly"
          ? (bundle as any).yearlyemandateprice || bundle.yearlyPrice || 0
          : (bundle as any).monthlyemandateprice || bundle.monthlyPrice || 0;
    } else {
      basePrice = bundle.monthlyPrice || 0;
    }

    if (appliedCoupon) {
      return Math.round(basePrice * (1 - appliedCoupon.discount / 100));
    }
    return basePrice;
  }, [bundle, isEmandateFlow, subscriptionType, appliedCoupon]);

  const startDigioFlow = useCallback(() => {
    if (!bundle) return;

    const price = getPrice();
    const data: PaymentAgreementData = {
      customerName: (user as any)?.fullName || user?.username || "User",
      customerEmail: user?.email || "user@example.com",
      customerMobile: user?.phone,
      amount: price,
      subscriptionType: subscriptionType,
      portfolioNames: bundle.portfolios.map((p) => p.name),
      agreementDate: new Date().toLocaleDateString("en-IN"),
    } as any;

    setAgreementData(data);
    setShowDigio(true);
  }, [bundle, user, subscriptionType, getPrice]);

  // When modal opens, restore or start with plan selection
  useEffect(() => {
    if (!isOpen || !bundle) return;
    
    // Check if we should continue an existing flow
    const continueStep = paymentFlowState.shouldContinueFlow(bundle._id, isAuthenticated);
    if (continueStep) {
      setStep(continueStep as any);
    } else {
      setStep("plan");
      // Save initial flow state
      paymentFlowState.save({
        bundleId: bundle._id,
        pricingType: isEmandateFlow ? "monthlyEmandate" : "monthly",
        currentStep: "plan",
        isAuthenticated
      });
    }
    
    continuedAfterAuthRef.current = false;
  }, [isOpen, isAuthenticated, bundle, isEmandateFlow]);

  // If user authenticates while viewing the auth step, automatically continue to enhanced flow
  useEffect(() => {
    if (!isOpen) return;
    if (step !== "auth") return;
    if (isAuthenticated && bundle && !continuedAfterAuthRef.current) {
      continuedAfterAuthRef.current = true;
      paymentFlowState.update({ 
        currentStep: "processing", 
        isAuthenticated: true 
      });
      handlePaymentFlow();
    }
  }, [isOpen, step, isAuthenticated, bundle]);

  const computeMonthlyEmandateDiscount = () => {
    if (!bundle) return 0;
    const monthly = bundle.monthlyPrice || 0;
    const emandateMonthly = (bundle as any).monthlyemandateprice || 0;
    if (!monthly || !emandateMonthly) return 0;
    const pct = Math.round(((monthly - emandateMonthly) / monthly) * 100);
    return Math.max(0, pct);
  };

  const computeYearlyDiscount = () => {
    if (!bundle) return 0;
    const monthly = bundle.monthlyPrice || 0;
    const yearly = bundle.yearlyPrice || 0;
    const annualFromMonthly = monthly * 12;
    if (!annualFromMonthly || !yearly) return 0;
    const pct = Math.round(
      ((annualFromMonthly - yearly) / annualFromMonthly) * 100
    );
    return Math.max(0, pct);
  };


  const getOriginalPrice = () => {
    if (!bundle) return 0;
    if (isEmandateFlow) {
      return subscriptionType === "yearly"
        ? (bundle as any).yearlyemandateprice || bundle.yearlyPrice || 0
        : (bundle as any).monthlyemandateprice || bundle.monthlyPrice || 0;
    }
    return bundle.monthlyPrice || 0;
  };

  const applyCoupon = () => {
    const code = couponCode.toUpperCase();
    if (code === "WELCOME10") {
      setAppliedCoupon({ code, discount: 10 });
    } else if (code === "SAVE20") {
      setAppliedCoupon({ code, discount: 20 });
    } else {
      toast({
        title: "Invalid Coupon",
        description: "Coupon code not found",
        variant: "destructive",
      });
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handleClose = () => {
    setStep("plan");
    setProcessing(false);
    setShowDigio(false);
    setTelegramLinks(null);
    setESignData(null);
    // Clear payment flow state when modal is closed
    paymentFlowState.clear();
    onClose();
  };

  const handleProceed = async () => {
    if (!bundle) return;

    // Update flow state
    paymentFlowState.update({ currentStep: "consent" });
    
    // First show consent step
    setStep("consent");
  };

  const handleConsentProceed = async () => {
    if (!bundle) return;

    console.log("🚀 Consent proceed clicked - Flow type:", isEmandateFlow ? "eMandate" : "One-time");
    
    // Always check authentication before proceeding
    if (!isAuthenticated || !user) {
      console.log("⚠️ User not authenticated - showing auth form");
      paymentFlowState.update({ currentStep: "auth" });
      setStep("auth");
      return;
    }

    // Verify token is still valid
    const token =
      (user as any)?.accessToken ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");
    if (!token) {
      console.log("⚠️ No valid token found - showing auth form");
      paymentFlowState.update({ currentStep: "auth" });
      setStep("auth");
      return;
    }

    console.log("✅ User authenticated with token");
    
    // Apply enhanced order flow to BOTH eMandate and one-time payments
    console.log("🔍 Starting enhanced payment flow for", isEmandateFlow ? "eMandate" : "one-time payment");
    paymentFlowState.update({ currentStep: "processing" });
    await handlePaymentFlow();
  };

  const handleAuthSuccess = async () => {
    continuedAfterAuthRef.current = true;
    // Continue the enhanced payment flow for both eMandate and one-time payments
    console.log("🔍 Auth success - starting enhanced payment flow for", isEmandateFlow ? "eMandate" : "one-time payment");
    paymentFlowState.update({ 
      currentStep: "processing", 
      isAuthenticated: true 
    });
    await handlePaymentFlow();
  };


  const handleDigioComplete = async () => {
    setShowDigio(false);
    if (!bundle) return;

    try {
      setStep("processing");
      setProcessing(true);
      setProcessingMsg("Creating order after Digio...");
      
      const order = await paymentService.createOrder({
        productType: "Bundle",
        productId: bundle._id,
        planType: "monthly",
        subscriptionType: (bundle.category as any) || "premium",
        couponCode: appliedCoupon?.code || undefined,
      });
      
      setProcessingMsg("Opening payment gateway…");
      await paymentService.openCheckout(
        order,
        {
          name: (user as any)?.fullName || user?.username || "User",
          email: user?.email || "user@example.com",
        },
        async (rp) => {
          setProcessingMsg("Verifying payment…");
          const verify = await paymentService.verifyPayment({
            orderId: order.orderId,
            paymentId: rp?.razorpay_payment_id,
            signature: rp?.razorpay_signature,
          });
          
          if (verify.success) {
            const links = (verify as any)?.telegramInviteLinks;
            if (links?.length) setTelegramLinks(links);
            setStep("success");
            setProcessing(false);
            paymentFlowState.clear();
            profileCompletionState.markFirstPaymentComplete();
            toast({ title: "Payment Successful", description: "Subscription activated" });
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
    } catch (error: any) {
      setStep("error");
      setProcessing(false);
      toast({ title: "Checkout Error", description: error?.message || "Could not start checkout", variant: "destructive" });
    }
  };

  const handleEmandatePaymentFlow = async () => {
    if (!bundle) return;

    try {
      cancelRequested.current = false;
      setStep("processing");
      setProcessing(true);
      setProcessingMsg("Creating eMandate…");
      
      const emandateAmount =
        subscriptionType === "yearly"
          ? ((bundle as any).yearlyemandateprice as number) ||
            bundle.yearlyPrice ||
            0
          : ((bundle as any).monthlyemandateprice as number) ||
            bundle.monthlyPrice ||
            0;

      const emandate = await paymentService.createEmandate({
        productType: "Bundle",
        productId: bundle._id,
        planType: subscriptionType,
        subscriptionType: (bundle.category as any) || "premium",
        amount: emandateAmount,
        couponCode: appliedCoupon?.code || undefined,
        items: [
          {
            productType: "Bundle",
            productId: bundle._id,
            planType: subscriptionType,
            amount: emandateAmount,
          },
        ],
      });

      if (cancelRequested.current) {
        setProcessing(false);
        setStep("plan");
        return;
      }

      setProcessingMsg("Opening payment gateway…");
      await paymentService.openCheckout(
        emandate,
        {
          name: (user as any)?.fullName || user?.username || "User",
          email: user?.email || "user@example.com",
        },
        async () => {
          setProcessingMsg("Verifying payment…");
          const verify = await paymentService.verifyEmandateWithRetry(
            emandate.subscriptionId
          );

          if (
            verify.success ||
            ["active", "authenticated"].includes(
              (verify as any).subscriptionStatus || ""
            )
          ) {
            const links = (verify as any)?.telegramInviteLinks as
              | Array<{ invite_link: string }>
              | undefined;
            console.log("Telegram links received:", links);
            if (links && links.length) {
              setTelegramLinks(links);
            }

            setStep("success");
            setProcessing(false);
            // Clear flow state on successful payment
            paymentFlowState.clear();
            // Mark first payment complete for profile completion
            profileCompletionState.markFirstPaymentComplete();
            toast({
              title: "Payment Successful",
              description: "Subscription activated",
            });
          } else {
            setStep("error");
            setProcessing(false);
            toast({
              title: "Verification Failed",
              description: verify.message || "Please try again",
              variant: "destructive",
            });
          }
        },
        (err) => {
          setStep("error");
          setProcessing(false);
          toast({
            title: "Payment Cancelled",
            description: err?.message || "Payment was cancelled",
            variant: "destructive",
          });
        }
      );
    } catch (error: any) {
      setStep("error");
      setProcessing(false);
      toast({
        title: "Checkout Error",
        description: error?.message || "Could not start checkout",
        variant: "destructive",
      });
    }
  };

  const handlePaymentFlow = async () => {
    if (!bundle) return;

    console.log("🚀 Starting enhanced payment flow for bundle:", bundle.name);
    
    // Step 1: Check PAN details first
    console.log("🔍 Step 1: Checking PAN details...");
    const panCheck = await paymentService.checkPanDetails();
    console.log("🔍 PAN check result:", panCheck);
    
    if (!panCheck.hasPan) {
      console.log("❌ PAN details missing - showing PAN form");
      // Pre-fill form with existing profile data
      if (panCheck.profile) {
        setPanFormData({
          fullName: panCheck.profile.fullName || "",
          dateofBirth: panCheck.profile.dateofBirth || "",
          phone: panCheck.profile.phone || "",
          pandetails: ""
        });
      }
      setStep("pan-form");
      setProcessing(false);
      return;
    }
    
    console.log("✅ PAN details found - proceeding with Digio verification");

    // Show Digio verification for all flows
    const price = getPrice();
    const data: PaymentAgreementData = {
      customerName: (user as any)?.fullName || user?.username || "User",
      customerEmail: user?.email || "user@example.com",
      customerMobile: user?.phone,
      amount: price,
      subscriptionType: isEmandateFlow ? subscriptionType : "monthly",
      portfolioNames: bundle.portfolios.map((p) => p.name),
      agreementDate: new Date().toLocaleDateString("en-IN"),
    } as any;
    
    setAgreementData(data);
    setShowDigio(true);
    setProcessing(false);
  };

  const continueAfterDigio = async () => {
    if (!bundle) return;

    try {
      cancelRequested.current = false;
      setStep("processing");
      setProcessing(true);

      // Enhanced order flow now handles both eMandate and one-time payments
      if (isEmandateFlow) {
        // eMandate flow after enhanced checks (PAN + Digio)
        await handleEmandatePaymentFlow();
      } else {
        // One-time order flow
        console.log("🔍 Step 2: Creating order...");
        setProcessingMsg("Creating order…");
        let order;
        try {
          order = await paymentService.createOrder({
            productType: "Bundle",
            productId: bundle._id,
            planType: "monthly",
            subscriptionType: (bundle.category as any) || "premium",
            couponCode: appliedCoupon?.code || undefined,
          });
          console.log("✅ Order created successfully:", order);
        } catch (error: any) {
          console.log("⚠️ Order creation failed:", error);
          if (error.response?.status === 412 && error.response?.data?.code === 'ESIGN_REQUIRED') {
            console.log("🔍 Step 3: eSign required - creating eSign request...");
            setProcessingMsg("Creating eSign request...");
            
            // Create eSign request immediately
            const eSignResult = await paymentService.createESignRequest({
              signerEmail: user?.email || "user@example.com",
              signerName: (user as any)?.fullName || user?.username || "User",
              signerPhone: (user as any)?.phone || "",
              reason: "Investment Agreement",
              expireInDays: 10,
              displayOnPage: "all",
              notifySigners: true,
              sendSignLink: true,
              productType: "Bundle",
              productId: bundle._id,
              productName: bundle.name
            });
            
            console.log("✅ eSign request created:", eSignResult);
            setProcessingMsg("Please complete eSign and enter DID token...");
            
            // Show Digio modal
            const price = getPrice();
            const data: PaymentAgreementData = {
              customerName: (user as any)?.fullName || user?.username || "User",
              customerEmail: user?.email || "user@example.com",
              customerMobile: user?.phone,
              amount: price,
              subscriptionType: "monthly",
              portfolioNames: bundle.portfolios.map((p) => p.name),
              agreementDate: new Date().toLocaleDateString("en-IN"),
            } as any;
            
            setAgreementData(data);
            setShowDigio(true);
            setProcessing(false);
            return;
          } else {
            throw error;
          }
        }

        if (cancelRequested.current) {
          setProcessing(false);
          setStep("plan");
          return;
        }

        console.log("🔍 Step 6: Opening payment gateway...");
        setProcessingMsg("Opening payment gateway…");
        await paymentService.openCheckout(
          order,
          {
            name: (user as any)?.fullName || user?.username || "User",
            email: user?.email || "user@example.com",
          },
          async (rp) => {
            console.log("🔍 Step 7: Payment successful, verifying...");
            setProcessingMsg("Verifying payment…");
            const verify = await paymentService.verifyPayment({
              orderId: order.orderId,
              paymentId: rp?.razorpay_payment_id,
              signature: rp?.razorpay_signature,
            });

            if (verify.success) {
              console.log("✅ Payment verified successfully");
              const links = (verify as any)?.telegramInviteLinks as
                | Array<{ invite_link: string }>
                | undefined;
              console.log("Telegram links received:", links);
              if (links && links.length) {
                setTelegramLinks(links);
              }

              setStep("success");
              setProcessing(false);
              // Clear flow state on successful payment
              paymentFlowState.clear();
              // Mark first payment complete for profile completion
              profileCompletionState.markFirstPaymentComplete();
              toast({
                title: "Payment Successful",
                description: "Subscription activated",
              });
            } else {
              console.log("❌ Payment verification failed:", verify.message);
              setStep("error");
              setProcessing(false);
              toast({
                title: "Verification Failed",
                description: verify.message || "Please try again",
                variant: "destructive",
              });
            }
          },
          (err) => {
            console.log("❌ Payment cancelled or failed:", err?.message);
            setStep("error");
            setProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: err?.message || "Payment was cancelled",
              variant: "destructive",
            });
          }
        );
      }
    } catch (error: any) {
      setStep("error");
      setProcessing(false);
      toast({
        title: "Checkout Error",
        description: error?.message || "Could not start checkout",
        variant: "destructive",
      });
    }
  };

  if (!isOpen || !bundle) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            // Prevent closing modal when clicking on backdrop during form interactions
            if (e.target === e.currentTarget && step !== "pan-form" && !panVerifying && !panFormLoading) {
              handleClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
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
                  : step === "esign"
                  ? "Complete Digio Verification"
                  : "Choose Your Plan"
                }
              </h2>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {step === "plan" && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-gray-900">
                      {bundle.name}
                    </h3>
                    <div
                      className="mx-auto text-left sm:text-center text-xs sm:text-sm leading-4 sm:leading-5 text-gray-600 break-words prose prose-sm prose-gray max-w-none [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1 [&>h1]:text-sm [&>h2]:text-sm [&>h3]:text-xs [&>strong]:font-semibold [&>em]:italic"
                      dangerouslySetInnerHTML={{ __html: bundle.description }}
                    />
                  </div>

                  {/* Subscription Type Toggle */}
                  {isEmandateFlow ? (
                    <div className="space-y-4">
                      <h4 className="font-medium text-base sm:text-lg">
                        Choose Subscription Period:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Annual billed monthly (eMandate monthly) */}
                        <button
                          onClick={() => setSubscriptionType("monthly")}
                          className={`p-4 sm:p-5 md:p-6 rounded-xl border-2 transition-all text-left relative overflow-hidden h-full flex flex-col ${
                            subscriptionType === "monthly"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div
                            className={`${
                              isPremium
                                ? "bg-amber-400 text-amber-900"
                                : "bg-blue-600 text-white"
                            } absolute left-0 right-0 top-0 px-3 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between`}
                          >
                            <span>
                              {(() => {
                                const pct = computeMonthlyEmandateDiscount();
                                return pct > 0
                                  ? `${pct}% off for 12 months`
                                  : "Special offer";
                              })()}
                            </span>
                            <span className="underline text-xs">
                              View terms
                            </span>
                          </div>
                          <div className="pt-9 sm:pt-10" />
                          <div className="font-semibold text-base sm:text-lg md:text-xl">
                            Annual, billed monthly
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 line-through">
                            ₹
                            {(bundle as any).strikeMonthly ||
                              Math.round(
                                ((bundle as any).monthlyemandateprice || 0) *
                                  1.5
                              )}{" "}
                            /mo
                          </div>
                          <div className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700">
                            ₹{(bundle as any).monthlyemandateprice || 0}
                            <span className="text-base font-medium">/mo</span>
                          </div>
                          <div className="text-[11px] sm:text-xs text-gray-500 mt-1">
                            Fee applies if you cancel mid-commitment
                          </div>
                        </button>

                        {/* Annual prepaid (yearly) */}
                        <button
                          onClick={() => setSubscriptionType("yearly")}
                          className={`p-4 sm:p-5 md:p-6 rounded-xl border-2 transition-all text-left relative overflow-hidden h-full flex flex-col ${
                            subscriptionType === "yearly"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div
                            className={`${
                              isPremium
                                ? "bg-amber-400 text-amber-900"
                                : "bg-blue-600 text-white"
                            } absolute left-0 right-0 top-0 px-3 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between`}
                          >
                            <span>
                              {(() => {
                                const pct = computeYearlyDiscount();
                                return pct > 0
                                  ? `${pct}% off the first year`
                                  : "Best value";
                              })()}
                            </span>
                            <span className="underline text-xs">
                              View terms
                            </span>
                          </div>
                          <div className="pt-9 sm:pt-10" />
                          <div className="font-semibold text-base sm:text-lg md:text-xl">
                            Annual, prepaid
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 line-through">
                            ₹
                            {(bundle as any).strikeYear ||
                              Math.round((bundle.yearlyPrice || 0) * 1.3)}{" "}
                            /yr
                          </div>
                          <div className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700">
                            ₹{(bundle as any).yearlyemandateprice || 0}
                            <span className="text-base font-medium">/yr</span>
                          </div>
                          <div className="text-[11px] sm:text-xs text-gray-500 mt-1">
                            No refund if you cancel after payment
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-medium text-base sm:text-lg">
                        Monthly Subscription:
                      </h4>
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <div
                          className={`p-4 sm:p-5 md:p-6 rounded-xl border-2 border-blue-500 bg-blue-50 text-left relative overflow-hidden h-full flex flex-col`}
                        >
                          <div
                            className={`${
                              isPremium
                                ? "bg-amber-400 text-amber-900"
                                : "bg-blue-600 text-white"
                            } absolute left-0 right-0 top-0 px-3 py-2 text-xs sm:text-sm font-semibold`}
                          >
                            <span>One-time monthly payment</span>
                          </div>
                          <div className="pt-9 sm:pt-10" />
                          <div className="font-semibold text-base sm:text-lg md:text-xl">
                            Monthly
                          </div>
                          <div className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700">
                            ₹{bundle.monthlyPrice || 0}
                            <span className="text-base font-medium">/mo</span>
                          </div>
                          <div className="text-[11px] sm:text-xs text-gray-500 mt-1">
                            Pay once, use for one month
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Portfolio List */}
                  {bundle.portfolios.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        Includes {bundle.portfolios.length} Portfolio
                        {bundle.portfolios.length > 1 ? "s" : ""}:
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {bundle.portfolios
                          .slice(0, 3)
                          .map((portfolio, index) => (
                            <li key={index}>• {portfolio.name}</li>
                          ))}
                        {bundle.portfolios.length > 3 && (
                          <li>• And {bundle.portfolios.length - 3} more...</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t pt-4">
                    {appliedCoupon && (
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                        <span>Original Price</span>
                        <span className="line-through">
                          ₹{getOriginalPrice()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-blue-600">₹{getPrice()}</span>
                    </div>
                    {appliedCoupon && (
                      <p className="text-sm text-green-600 mt-1">
                        You save ₹{getOriginalPrice() - getPrice()} with{" "}
                        {appliedCoupon.code}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Billed{" "}
                      {subscriptionType === "yearly" ? "annually" : "monthly"}
                    </p>
                  </div>

                  {/* Coupon Code Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Coupon Code (Optional)
                    </label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-medium">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-green-600 text-sm">
                            ({appliedCoupon.discount}% off)
                          </span>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={applyCoupon}
                          disabled={!couponCode.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleProceed}
                    className="w-full bg-[#001633] hover:bg-[#002244] text-white py-3"
                  >
                    Proceed to Payment
                  </Button>
                </div>
              )}

              {step === "consent" && (
                <div className="space-y-6">
                  {/* YouTube Video */}
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="315"
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                      title="Digital Verification Process"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full"
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

                  {/* Consent Checkbox */}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep("plan")}
                      variant="outline"
                      className="flex-1"
                    >
                      Back to Plan
                    </Button>
                    <Button
                      onClick={handleConsentProceed}
                      className="flex-1 bg-[#001633] hover:bg-[#002244] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Proceed to Verification
                    </Button>
                  </div>
                </div>
              )}

              {step === "auth" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                      Login to Continue
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Bundle: {bundle.name}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Amount: ₹{getPrice()}
                    </p>
                  </div>
                  <CartAuthForm
                    onAuthSuccess={handleAuthSuccess}
                    onPaymentTrigger={() => handlePaymentFlow()}
                    cartTotal={getPrice()}
                    cartItemCount={1}
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
                      if (!panVerified) {
                        toast({
                          title: "PAN Not Verified",
                          description: "Please verify your PAN details first",
                          variant: "destructive",
                        });
                        setPanFormLoading(false);
                        return;
                      }
                      // Validate form data before sending
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
                      
                      console.log('Updating PAN details:', panFormData);
                      await paymentService.updatePanDetails(panFormData);
                      console.log('PAN details updated successfully');
                      
                      // Re-check profile to confirm PAN details are saved
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
                      // Continue with payment flow
                      await handlePaymentFlow();
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
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={panFormData.fullName}
                            onChange={(e) => setPanFormData({...panFormData, fullName: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter your full name as per PAN"
                          />
                          <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth *
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            required
                            value={panFormData.dateofBirth}
                            onChange={(e) => setPanFormData({...panFormData, dateofBirth: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={panFormData.phone}
                          onChange={(e) => setPanFormData({...panFormData, phone: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter your phone number"
                        />
                        <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Card Number *
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={panFormData.pandetails}
                            onChange={(e) => {
                              setPanFormData({...panFormData, pandetails: e.target.value.toUpperCase()});
                              setPanVerified(false);
                            }}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all font-mono text-lg tracking-wider ${
                              panVerified 
                                ? 'border-green-300 bg-green-50 focus:ring-green-500' 
                                : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            pattern={"[A-Z]{5}[0-9]{4}[A-Z]{1}"}
                          />
                          {panVerified ? (
                            <svg className="absolute right-3 top-3 w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        
                        <Button
                          type="button"
                          onClick={async () => {
                            if (!panFormData.pandetails || !panFormData.fullName || !panFormData.dateofBirth) {
                              toast({
                                title: "Missing Information",
                                description: "Please fill in PAN, name, and date of birth first",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            setPanVerifying(true);
                            try {
                              // Convert YYYY-MM-DD to DD/MM/YYYY
                              const [year, month, day] = panFormData.dateofBirth.split('-');
                              const dobFormatted = `${day}/${month}/${year}`;
                              console.log('Date conversion:', panFormData.dateofBirth, '->', dobFormatted);
                              const verifyResult = await paymentService.verifyPanDetails({
                                id_no: panFormData.pandetails,
                                name: panFormData.fullName,
                                dob: dobFormatted
                              });
                              
                              if (verifyResult.success === true) {
                                setPanVerified(true);
                                toast({
                                  title: "PAN Verified",
                                  description: "Your PAN details have been successfully verified",
                                });
                              } else {
                                setPanVerified(false);
                                toast({
                                  title: "PAN Verification Failed",
                                  description: verifyResult.message || "Please check your PAN details",
                                  variant: "destructive",
                                });
                              }
                            } catch (error: any) {
                              setPanVerified(false);
                              toast({
                                title: "Verification Error",
                                description: error.message || "Failed to verify PAN",
                                variant: "destructive",
                              });
                            } finally {
                              setPanVerifying(false);
                            }
                          }}
                          disabled={panVerifying || !panFormData.pandetails || !panFormData.fullName || !panFormData.dateofBirth}
                          className={`w-full ${
                            panVerified 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {panVerifying ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Verifying PAN...
                            </>
                          ) : panVerified ? (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              PAN Verified ✓
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Verify PAN Details
                            </>
                          )}
                        </Button>
                        
                        <p className="text-xs text-gray-500">
                          Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={() => setStep("consent")}
                        variant="outline"
                        className="flex-1 py-3"
                        disabled={panFormLoading}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-[#001633] hover:bg-[#002244] text-white py-3 relative"
                        disabled={panFormLoading || !panVerified}
                      >
                        {panFormLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Verifying PAN...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Verify & Continue
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {step === "esign" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      Complete Digio Verification
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Please complete the Digio verification process and enter your DID token below
                    </p>
                  </div>
                  
                  {eSignData?.authUrl && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-700 mb-3">
                        Click the button below to complete Digio verification:
                      </p>
                      <a
                        href={eSignData.authUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Complete Digio
                      </a>
                    </div>
                  )}
                  
                  <form className="space-y-4" onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const didToken = formData.get('didToken') as string;
                    
                    if (!didToken?.trim()) {
                      toast({
                        title: "DID Token Required",
                        description: "Please enter your DID token",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    setProcessing(true);
                    setStep("processing");
                    setProcessingMsg("Verifying Digio...");
                    
                    try {
                      const verifyResult = await paymentService.verifyESignToken(didToken);
                      if (verifyResult.success) {
                        setProcessingMsg("Creating order after Digio...");
                        const order = await paymentService.createOrder({
                          productType: "Bundle",
                          productId: bundle._id,
                          planType: "monthly",
                          subscriptionType: (bundle.category as any) || "premium",
                          couponCode: appliedCoupon?.code || undefined,
                        });
                        
                        // Continue with payment flow
                        setProcessingMsg("Opening payment gateway…");
                        await paymentService.openCheckout(
                          order,
                          {
                            name: (user as any)?.fullName || user?.username || "User",
                            email: user?.email || "user@example.com",
                          },
                          async (rp) => {
                            setProcessingMsg("Verifying payment…");
                            const verify = await paymentService.verifyPayment({
                              orderId: order.orderId,
                              paymentId: rp?.razorpay_payment_id,
                              signature: rp?.razorpay_signature,
                            });
                            
                            if (verify.success) {
                              const links = (verify as any)?.telegramInviteLinks;
                              if (links?.length) setTelegramLinks(links);
                              setStep("success");
                              setProcessing(false);
                              paymentFlowState.clear();
                              profileCompletionState.markFirstPaymentComplete();
                              toast({ title: "Payment Successful", description: "Subscription activated" });
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
                      } else {
                        setStep("error");
                        setProcessing(false);
                        toast({
                          title: "Digio Verification Failed",
                          description: verifyResult.message || "Please try again",
                          variant: "destructive",
                        });
                      }
                    } catch (error: any) {
                      setStep("error");
                      setProcessing(false);
                      toast({
                        title: "Verification Error",
                        description: error.message || "Failed to verify Digio",
                        variant: "destructive",
                      });
                    }
                  }}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        DID Token *
                      </label>
                      <input
                        type="text"
                        name="didToken"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your DID token from Digio completion"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You'll receive this token after completing the Digio process
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={() => setStep("processing")}
                        variant="outline"
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-[#001633] hover:bg-[#002244] text-white"
                      >
                        Verify & Continue
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {step === "processing" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">
                    Processing Payment
                  </h3>
                  <p className="text-gray-600 mb-4">{processingMsg}</p>
                  <p className="text-xs text-gray-500 mb-4">
                    If the Razorpay window is open, you can close it to cancel.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      cancelRequested.current = true;
                      setProcessing(false);
                      setStep("plan");
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
                    Your {bundle.name} subscription has been activated
                    successfully!
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
                  {telegramLinks && telegramLinks.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                        💡 Click the buttons above to join your exclusive
                        investment groups
                      </p>
                    </div>
                  )}

                  {/* Debug info - remove in production */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                      <p>
                        Debug: Telegram links count:{" "}
                        {telegramLinks?.length || 0}
                      </p>
                      {telegramLinks &&
                        telegramLinks.map((link, i) => (
                          <p key={i}>
                            Link {i + 1}: {link.invite_link ? "✓" : "✗"}
                          </p>
                        ))}
                    </div>
                  )}
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
                      variant="outline"
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
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
        />
      )}
    </>
  );
};
