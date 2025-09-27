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
import { CouponInput } from "@/components/coupon-input";
import type { CouponValidationResponse } from "@/services/coupon.service";
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
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse["coupon"] | null>(null);
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

  const cancelRequested = useRef(false);
  const continuedAfterAuthRef = useRef(false);

  const { isAuthenticated, user, isLoading } = useAuth();
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
      const discountAmount = appliedCoupon.discountType === "percentage" 
        ? Math.min((basePrice * appliedCoupon.discountValue) / 100, appliedCoupon.maxDiscountAmount || Infinity)
        : appliedCoupon.discountValue;
      return Math.max(0, basePrice - discountAmount);
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
      productType: "Bundle",
      productId: bundle._id,
      productName: bundle.name,
    } as any;

    setAgreementData(data);
    setShowDigio(true);
  }, [bundle, user, subscriptionType, getPrice]);

  // When modal opens, restore saved state and determine starting step
  useEffect(() => {
    if (!isOpen || !bundle) return;
    
    // Block body scroll when modal opens
    document.body.style.overflow = 'hidden';
    
    const savedState = paymentFlowState.get();
    if (savedState && savedState.bundleId === bundle._id) {
      // Restore saved plan selection
      if (savedState.subscriptionType) {
        setSubscriptionType(savedState.subscriptionType);
      }
      if (savedState.appliedCoupon) {
        setAppliedCoupon(savedState.appliedCoupon);
      }
      
      // If user is authenticated and has saved state, skip to payment flow
      if (isAuthenticated && user && savedState.subscriptionType) {
        console.log("✅ User authenticated with saved plan - proceeding to PAN verification");
        setStep("processing");
        setProcessing(true);
        setProcessingMsg("Checking profile...");
        handlePaymentFlow();
        return;
      }
    }
    
    setStep("plan");
    paymentFlowState.save({
      bundleId: bundle._id,
      pricingType: isEmandateFlow ? "monthlyEmandate" : "monthly",
      currentStep: "plan",
      isAuthenticated,
      subscriptionType,
      appliedCoupon
    });
    
    continuedAfterAuthRef.current = false;
    
    // Cleanup function to restore body scroll
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, bundle, isEmandateFlow, isAuthenticated, user]);



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
    const yearly = (bundle as any).yearlyemandateprice || 0;
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

  const handleCouponApplied = (coupon: CouponValidationResponse["coupon"] | null) => {
    setAppliedCoupon(coupon);
    paymentFlowState.update({ appliedCoupon: coupon });
  };

  const handleClose = () => {
    // Restore body scroll
    document.body.style.overflow = 'unset';
    setStep("plan");
    setProcessing(false);
    setShowDigio(false);
    setTelegramLinks(null);
    setESignData(null);
    continuedAfterAuthRef.current = false;
    // Clear payment flow state when modal is closed
    paymentFlowState.clear();
    onClose();
  };

  const handleProceed = async () => {
    if (!bundle) return;

    if (isAuthenticated && user) {
      setStep("processing");
      setProcessing(true);
      setProcessingMsg("Checking profile...");
      await handlePaymentFlow();
    } else {
      setStep("auth");
    }
  };



  const handleAuthSuccess = async () => {
    console.log("✅ Auth success - proceeding to payment flow");
    // Update payment flow state with current selections
    paymentFlowState.update({ 
      isAuthenticated: true,
      subscriptionType,
      appliedCoupon
    });
    setStep("processing");
    setProcessing(true);
    setProcessingMsg("Checking profile...");
    await handlePaymentFlow();
  };


  const handleDigioComplete = async () => {
    setShowDigio(false);
    
    // // Verify eSign completion
    // try {
    //   setStep("processing");
    //   setProcessing(true);
    //   setProcessingMsg("Verifying eSign completion...");
    //   
    //   const verification = await paymentService.verifyESignCompletion("Bundle", bundle?._id || "");
    //   
    //   if (!verification.success) {
    //     setStep("error");
    //     setProcessing(false);
    //     toast({
    //       title: "eSign Verification Failed",
    //       description: verification.message,
    //       variant: "destructive",
    //     });
    //     return;
    //   }
    //   
    //   console.log("✅ eSign verified - retrying payment API");
    //   await continueAfterDigio();
    // } catch (error: any) {
    //   setStep("error");
    //   setProcessing(false);
    //   toast({
    //     title: "eSign Verification Error",
    //     description: error?.message || "Failed to verify eSign",
    //     variant: "destructive",
    //   });
    // }
    
    await continueAfterDigio();
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

          console.log("🔍 eMandate verification response:", verify);

          if (
            verify.success ||
            ["active", "authenticated"].includes(
              (verify as any).subscriptionStatus || ""
            )
          ) {
            // Check for Telegram links in the response
            const links = (verify as any)?.telegramInviteLinks;
            console.log("🔍 Telegram links from eMandate verification:", links);
            if (links && Array.isArray(links) && links.length > 0) {
              setTelegramLinks(links);
            }

            setStep("success");
            setProcessing(false);
            paymentFlowState.clear();
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
      // Check for eSign requirement (412 error)
      if (error.response?.status === 412 && error.response?.data?.code === 'ESIGN_REQUIRED') {
        console.log("🔍 eSign required for eMandate - showing Digio verification");
        const amount = subscriptionType === "yearly"
          ? ((bundle as any).yearlyemandateprice as number) || bundle.yearlyPrice || 0
          : ((bundle as any).monthlyemandateprice as number) || bundle.monthlyPrice || 0;
        const data: PaymentAgreementData = {
          customerName: (user as any)?.fullName || user?.username || "User",
          customerEmail: user?.email || "user@example.com",
          customerMobile: user?.phone,
          amount: amount,
          subscriptionType: subscriptionType,
          portfolioNames: bundle.portfolios.map((p) => p.name),
          agreementDate: new Date().toLocaleDateString("en-IN"),
          productType: "Bundle",
          productId: bundle._id,
          productName: bundle.name,
        } as any;
        
        setAgreementData(data);
        setShowDigio(true);
        setProcessing(false);
        return;
      }
      
      // Check for eSign pending for eMandate
      if (error.response?.data?.success === false && error.response?.data?.code === 'ESIGN_PENDING') {
        console.log("🔍 eSign pending for eMandate - showing Digio modal");
        const authUrl = error.response.data.pendingEsign?.authenticationUrl;
        if (authUrl) {
          const amount = subscriptionType === "yearly"
            ? ((bundle as any).yearlyemandateprice as number) || bundle.yearlyPrice || 0
            : ((bundle as any).monthlyemandateprice as number) || bundle.monthlyPrice || 0;
          const data: PaymentAgreementData = {
            customerName: (user as any)?.fullName || user?.username || "User",
            customerEmail: user?.email || "user@example.com",
            customerMobile: user?.phone,
            amount: amount,
            subscriptionType: subscriptionType,
            portfolioNames: bundle.portfolios.map((p) => p.name),
            agreementDate: new Date().toLocaleDateString("en-IN"),
            productType: "Bundle",
            productId: bundle._id,
            productName: bundle.name,
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
        title: "Checkout Error",
        description: error?.message || "Could not start checkout",
        variant: "destructive",
      });
    }
  };

  const handlePaymentFlow = async () => {
    if (!bundle) return;

    console.log("🚀 Starting payment flow for bundle:", bundle.name);
    
    // Step 1: Check PAN details first
    console.log("🔍 Step 1: Checking PAN details...");
    const panCheck = await paymentService.checkPanDetails();
    console.log("🔍 PAN check result:", panCheck);
    
    if (!panCheck.hasPan) {
      console.log("❌ PAN details missing - showing PAN form");
      console.log("🔍 Profile data:", panCheck.profile);
      
      // Try to get DOB from profile or user data
      const dobFromProfile = panCheck.profile?.dateOfBirth || panCheck.profile?.dateofBirth;
      const dobFromUser = (user as any)?.dateOfBirth || (user as any)?.dateofBirth;
      let finalDob = dobFromProfile || dobFromUser || "";
      
      // Convert ISO date to YYYY-MM-DD format for HTML date input
      if (finalDob && finalDob.includes('T')) {
        finalDob = finalDob.split('T')[0]; // Extract YYYY-MM-DD part
      }
      
      console.log("🔍 DOB sources:", { dobFromProfile, dobFromUser, finalDob });
      
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
    
    console.log("✅ PAN details found - showing video modal first");
    
    // Step 2: Show video modal before payment
    setStep("consent");
    setProcessing(false);
  };

  const proceedAfterVideo = async () => {
    if (!bundle) return;
    
    setStep("processing");
    setProcessing(true);
    
    // Try payment API directly
    try {
      setProcessingMsg("Creating order...");
      
      if (isEmandateFlow) {
        await handleEmandatePaymentFlow();
      } else {
        const order = await paymentService.createOrder({
          productType: "Bundle",
          productId: bundle._id,
          planType: "monthly",
          subscriptionType: (bundle.category as any) || "premium",
          couponCode: appliedCoupon?.code || undefined,
        });
        
        setProcessingMsg("Opening payment gateway...");
        await paymentService.openCheckout(
          order,
          {
            name: (user as any)?.fullName || user?.username || "User",
            email: user?.email || "user@example.com",
          },
          async (rp) => {
            setProcessingMsg("Verifying payment...");
            const verify = await paymentService.verifyPayment({
              orderId: order.orderId,
              paymentId: rp?.razorpay_payment_id,
              signature: rp?.razorpay_signature,
            });
            
            if (verify.success) {
              const links = (verify as any)?.telegramInviteLinks;
              if (links && Array.isArray(links) && links.length > 0) {
                setTelegramLinks(links);
              }
              setStep("success");
              setProcessing(false);
              paymentFlowState.clear();
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
      }
    } catch (error: any) {
      // Check for eSign requirement (412 error) - only for one-time payments
      if (!isEmandateFlow && error.response?.status === 412 && error.response?.data?.code === 'ESIGN_REQUIRED') {
        console.log("🔍 eSign required for one-time payment - showing Digio verification");
        const price = getPrice();
        const data: PaymentAgreementData = {
          customerName: (user as any)?.fullName || user?.username || "User",
          customerEmail: user?.email || "user@example.com",
          customerMobile: user?.phone,
          amount: price,
          subscriptionType: "monthly",
          portfolioNames: bundle.portfolios.map((p) => p.name),
          agreementDate: new Date().toLocaleDateString("en-IN"),
          productType: "Bundle",
          productId: bundle._id,
          productName: bundle.name,
        } as any;
        
        setAgreementData(data);
        setShowDigio(true);
        setProcessing(false);
        return;
      }
      
      // Check for eSign pending - only for one-time payments
      if (!isEmandateFlow && error.response?.data?.success === false && error.response?.data?.code === 'ESIGN_PENDING') {
        console.log("🔍 eSign pending for one-time payment - showing Digio modal");
        const authUrl = error.response.data.pendingEsign?.authenticationUrl;
        if (authUrl) {
          const price = getPrice();
          const data: PaymentAgreementData = {
            customerName: (user as any)?.fullName || user?.username || "User",
            customerEmail: user?.email || "user@example.com",
            customerMobile: user?.phone,
            amount: price,
            subscriptionType: "monthly",
            portfolioNames: bundle.portfolios.map((p) => p.name),
            agreementDate: new Date().toLocaleDateString("en-IN"),
            productType: "Bundle",
            productId: bundle._id,
            productName: bundle.name,
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

  const continueAfterDigio = async () => {
    if (!bundle) return;

    try {
      cancelRequested.current = false;
      setStep("processing");
      setProcessing(true);

      if (isEmandateFlow) {
        console.log("🔍 Starting eMandate flow after Digio verification");
        await handleEmandatePaymentFlow();
      } else {
        console.log("🔍 Starting one-time payment flow after Digio verification");
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

            console.log("🔍 Payment verification response:", verify);

            if (verify.success) {
              const links = (verify as any)?.telegramInviteLinks;
              console.log("🔍 Telegram links from payment verification:", links);
              if (links && Array.isArray(links) && links.length > 0) {
                setTelegramLinks(links);
              }
              setStep("success");
              setProcessing(false);
              paymentFlowState.clear();
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
            {/* Header - Fixed */}
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
                  : step === "esign"
                  ? "Complete Digio Verification"
                  : "Choose Your Plan"
                }
              </h2>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
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
                          onClick={() => {
                            setSubscriptionType("monthly");
                            paymentFlowState.update({ subscriptionType: "monthly" });
                          }}
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
                                  ? `Special offer - Save ${pct}%`
                                  : "Special offer";
                              })()}
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
                          onClick={() => {
                            setSubscriptionType("yearly");
                            paymentFlowState.update({ subscriptionType: "yearly" });
                          }}
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
                                  ? `Save More - ${pct}% Off`
                                  : "Best value";
                              })()}
                            </span>
                          </div>
                          <div className="pt-9 sm:pt-10" />
                          <div className="font-semibold text-base sm:text-lg md:text-xl">
                            Annual, billed Yearly
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
                    <CouponInput
                      onCouponApplied={handleCouponApplied}
                      originalAmount={getOriginalPrice()}
                      disabled={processing}
                    />
                  </div>


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
                      // Show video modal after PAN completion
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
                            onChange={(e) => setPanFormData({...panFormData, pandetails: e.target.value.toUpperCase()})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-lg tracking-wider"
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            pattern={"[A-Z]{5}[0-9]{4}[A-Z]{1}"}
                          />
                          <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        
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
                        disabled={panFormLoading}
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
                      variant="outline"
                      className="w-full"
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
                  onClick={handleProceed}
                  className="w-full bg-[#001633] hover:bg-[#002244] text-white py-3"
                >
                  {isAuthenticated ? "Continue to Payment" : "Proceed to Payment"}
                </Button>
              )}
              
              {step === "consent" && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep("plan")}
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Plan
                  </Button>
                  <Button
                    onClick={proceedAfterVideo}
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
        />
      )}
    </>
  );
};
