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
    "plan" | "consent" | "auth" | "digio" | "processing" | "success" | "error"
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
  const [telegramLinks, setTelegramLinks] = useState<Array<{
    invite_link: string;
  }> | null>(null);
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
      if (continueStep === "digio") {
        startDigioFlow();
      } else {
        setStep(continueStep as any);
        if (continueStep === "consent") {
        }
      }
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

  // If user authenticates while viewing the auth step, automatically continue to Digio
  useEffect(() => {
    if (!isOpen) return;
    if (step !== "auth") return;
    if (isAuthenticated && bundle && !continuedAfterAuthRef.current) {
      continuedAfterAuthRef.current = true;
      paymentFlowState.update({ 
        currentStep: "digio", 
        isAuthenticated: true 
      });
      startDigioFlow();
    }
  }, [isOpen, step, isAuthenticated, bundle, startDigioFlow]);

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

    // Check authentication only when proceeding to payment
    if (!isAuthenticated || !user) {
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
      paymentFlowState.update({ currentStep: "auth" });
      setStep("auth");
      return;
    }

    // Start Digio verification
    paymentFlowState.update({ currentStep: "digio" });
    startDigioFlow();
  };

  const handleAuthSuccess = async () => {
    continuedAfterAuthRef.current = true;
    // Continue the flow immediately after successful authentication
    // Skip consent and go directly to Digio verification
    paymentFlowState.update({ 
      currentStep: "digio", 
      isAuthenticated: true 
    });
    startDigioFlow();
  };


  const handleDigioComplete = async () => {
    setShowDigio(false);
    if (!bundle) return;

    // Step 3: Create eMandate
    // Step 4: Open payment gateway
    // Step 5: Verify payment
    await handlePaymentFlow();
  };

  const handlePaymentFlow = async () => {
    if (!bundle) return;

    try {
      cancelRequested.current = false;
      setStep("processing");
      setProcessing(true);

      if (isEmandateFlow) {
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
      } else {
        // One-time order flow (still uses Digio as part of 5-step UX)
        setProcessingMsg("Creating order…");
        const order = await paymentService.createOrder({
          productType: "Bundle",
          productId: bundle._id,
          planType: "monthly",
          subscriptionType: (bundle.category as any) || "premium",
          couponCode: appliedCoupon?.code || undefined,
        });

        if (cancelRequested.current) {
          setProcessing(false);
          setStep("plan");
          return;
        }

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
          onClick={(e) => e.target === e.currentTarget && handleClose()}
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
                  : "Choose Your Plan"}
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
