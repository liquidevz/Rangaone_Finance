"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/auth-context";
import { useRouter } from "next/navigation";
import { paymentService } from "@/services/payment.service";
import CartAuthForm from "@/components/cart-auth-form";
import { DigioVerificationModal } from "@/components/digio-verification-modal";
import { paymentFlowState } from "@/lib/payment-flow-state";
import type { PaymentAgreementData } from "@/services/digio.service";
import { CouponInput } from "@/components/coupon-input";
import type { CouponValidationResponse } from "@/services/coupon.service";
import { useCart } from "@/components/cart/cart-context";

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
  
  // Debug props received
  useEffect(() => {
    if (isOpen) {
      console.log("🔍 CART PAYMENT MODAL - Props received:", {
        subscriptionType,
        total,
        cartItemsCount: cartItems?.length
      });
    }
  }, [isOpen, subscriptionType, total, cartItems]);
  const [step, setStep] = useState<
    "plan" | "consent" | "auth" | "pan-form" | "processing" | "success" | "error"
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
      setFinalTotal(Math.max(0, total - discountAmount));
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
    
    // Verify cart eSign completion when user clicks "I'm Done"
    try {
      setStep("processing");
      setProcessing(true);
      setProcessingMsg("Verifying digital signature...");
      
      const cartId = cart?._id && cart._id !== "local" ? cart._id : undefined;
      const eSignStatus = await paymentService.verifyCartESignCompletion(cartId);
      if (!eSignStatus.success) {
        throw new Error("eSign verification failed: " + eSignStatus.message);
      }
      
      await continueAfterDigio();
    } catch (error: any) {
      setStep("error");
      setProcessing(false);
      toast({
        title: "eSign Verification Failed",
        description: error?.message || "Please complete the digital signature process",
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
    console.log("🚀 Starting cart payment flow");
    
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
    
    // Step 2: Proceed with payment flow
    setStep("processing");
    setProcessing(true);
    
    try {
      setProcessingMsg("Creating order...");
      
      // Always use eMandate flow for cart payments
      await handleEmandatePaymentFlow();
    } catch (error: any) {
      // Check for eSign requirement (412 error)
      if (error.response?.status === 412 && error.response?.data?.code === 'ESIGN_REQUIRED') {
        console.log("🔍 eSign required - showing Digio verification");
        const data: PaymentAgreementData = {
          customerName: (user as any)?.fullName || user?.username || "User",
          customerEmail: user?.email || "user@example.com",
          customerMobile: user?.phone,
          amount: total,
          subscriptionType: subscriptionType,
          portfolioNames: cartItems.map(item => item.portfolio.name),
          agreementDate: new Date().toLocaleDateString("en-IN"),
          productType: "Portfolio",
          productId: "cart",
          productName: `Portfolio Cart (${cartItems.length} items)`,
        } as any;
        
        setAgreementData(data);
        setShowDigio(true);
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
      
      console.log("🔍 CART MODAL - Current subscriptionType:", subscriptionType);
      console.log("🔍 CART MODAL - typeof subscriptionType:", typeof subscriptionType);
      
      // Create cart eMandate payload
      const cartEmandatePayload = {
        ...(cart?._id && cart._id !== "local" && { cartId: cart._id }),
        interval: subscriptionType,
        ...(appliedCoupon && { couponCode: appliedCoupon.code }),
      };
      
      console.log("🔍 CART MODAL - Cart Emandate payload before sending:", JSON.stringify(cartEmandatePayload, null, 2));

      const emandate = await paymentService.createCartEmandate(cartEmandatePayload);

      if (cancelRequested.current) {
        setProcessing(false);
        setStep("consent");
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
          const verify = await paymentService.verifyEmandateWithRetry(emandate.subscriptionId);

          if (verify.success || ["active", "authenticated"].includes((verify as any).subscriptionStatus || "")) {
            const links = (verify as any)?.telegramInviteLinks;
            if (links && Array.isArray(links) && links.length > 0) {
              setTelegramLinks(links);
            }

            setStep("success");
            setProcessing(false);
            paymentFlowState.clear();
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
    } catch (error: any) {
      // Check for eSign requirement for eMandate
      if (error.response?.status === 412 && error.response?.data?.code === 'ESIGN_REQUIRED') {
        console.log("🔍 eSign required for eMandate - showing Digio verification");
        const data: PaymentAgreementData = {
          customerName: (user as any)?.fullName || user?.username || "User",
          customerEmail: user?.email || "user@example.com",
          customerMobile: user?.phone,
          amount: total,
          subscriptionType: subscriptionType,
          portfolioNames: cartItems.map(item => item.portfolio.name),
          agreementDate: new Date().toLocaleDateString("en-IN"),
          productType: "Portfolio",
          productId: "cart",
          productName: `Portfolio Cart (${cartItems.length} items)`,
        } as any;
        
        setAgreementData(data);
        setShowDigio(true);
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

  const continueAfterDigio = async () => {
    try {
      cancelRequested.current = false;
      setStep("processing");
      setProcessing(true);
      setProcessingMsg("Verifying digital signature...");

      // Skip eSign verification - proceed directly to eMandate

      // Always use eMandate flow for cart payments
      console.log("🔍 Starting eMandate flow after Digio verification");
      console.log("🔍 CART MODAL - Current subscriptionType after Digio:", subscriptionType);
      setProcessingMsg("Creating eMandate…");
      
      const cartEmandatePayload = {
        ...(cart?._id && cart._id !== "local" && { cartId: cart._id }),
        interval: subscriptionType,
        ...(appliedCoupon && { couponCode: appliedCoupon.code }),
      };
      
      console.log("🔍 CART MODAL - Cart Emandate payload after Digio:", JSON.stringify(cartEmandatePayload, null, 2));

      const emandate = await paymentService.createCartEmandate(cartEmandatePayload);

      if (cancelRequested.current) {
        setProcessing(false);
        setStep("consent");
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
          const verify = await paymentService.verifyEmandateWithRetry(emandate.subscriptionId);

          if (verify.success || ["active", "authenticated"].includes((verify as any).subscriptionStatus || "")) {
            const links = (verify as any)?.telegramInviteLinks;
            if (links && Array.isArray(links) && links.length > 0) {
              setTelegramLinks(links);
            }
            setStep("success");
            setProcessing(false);
            paymentFlowState.clear();
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
                      onPaymentTrigger={() => {}}
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
                            onChange={(e) => setPanFormData({...panFormData, fullName: e.target.value})}
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
                            onChange={(e) => setPanFormData({...panFormData, dateofBirth: e.target.value})}
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
                          onChange={(e) => setPanFormData({...panFormData, phone: e.target.value})}
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
                          onChange={(e) => setPanFormData({...panFormData, pandetails: e.target.value.toUpperCase()})}
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
                          type="button"
                          onClick={() => setStep("consent")}
                          variant="outline"
                          className="flex-1 py-3"
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
                      variant="outline"
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
                          💡 Click the buttons above to join your exclusive investment groups
                        </p>
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
    </>
  );
};