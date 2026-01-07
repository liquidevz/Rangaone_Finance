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
import type { PaymentAgreementData } from "@/services/digio.service";
import { PaymentGatewaySelectorModal } from "@/components/payment-gateway-selector";
import { usePaymentGateways } from "@/hooks/use-payment-gateways";
import { CashfreeS2SPayment } from "@/components/cashfree-s2s-payment";
import { CashfreeModal } from "@/components/cashfree-modal";

interface PortfolioPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  subscriptionType: "monthly" | "quarterly" | "yearly";
  total: number;
  onPaymentSuccess: () => void;
}

export const PortfolioPaymentModal: React.FC<PortfolioPaymentModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subscriptionType,
  total,
  onPaymentSuccess,
}) => {
  const [step, setStep] = useState<
    "consent" | "auth" | "pan-form" | "gateway-select" | "processing" | "success" | "error"
  >("consent");
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("Preparing secure payment…");
  const [showDigio, setShowDigio] = useState(false);
  const [agreementData, setAgreementData] = useState<PaymentAgreementData | null>(null);
  const [panFormData, setPanFormData] = useState({
    fullName: "",
    dateofBirth: "",
    phone: "",
    pandetails: ""
  });
  const [panFormLoading, setPanFormLoading] = useState(false);
  const [digioCompleted, setDigioCompleted] = useState(false);
  
  // Payment gateway selection state
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType | null>(null);
  const [showGatewaySelector, setShowGatewaySelector] = useState(false);
  const { gateways, hasMultipleGateways, defaultGateway, supportsEmandate } = usePaymentGateways();

  // Cashfree S2S payment state
  const [showCashfreeS2S, setShowCashfreeS2S] = useState(false);
  const [cashfreeS2SData, setCashfreeS2SData] = useState<{
    subscriptionId: string;
    amount: number;
    productName: string;
  } | null>(null);
  
  // Cashfree modal state
  const [showCashfreeModal, setShowCashfreeModal] = useState(false);
  const [cashfreeModalData, setCashfreeModalData] = useState<{subsSessionId: string; amount: number} | null>(null);

  const cancelRequested = useRef(false);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const isEmandateFlow = subscriptionType === "yearly" || subscriptionType === "quarterly";

  useEffect(() => {
    if (!isOpen) return;
    
    document.body.style.overflow = 'hidden';
    
    if (isAuthenticated && user) {
      setStep("consent");
    } else {
      setStep("auth");
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isAuthenticated, user]);

  const handleClose = () => {
    document.body.style.overflow = 'unset';
    setStep("consent");
    setProcessing(false);
    setShowDigio(false);
    setDigioCompleted(false);
    setSelectedGateway(null); // Reset selected gateway
    setShowGatewaySelector(false); // Reset gateway selector
    onClose();
  };

  const handleAuthSuccess = async () => {
    setStep("consent");
  };

  const handleDigioComplete = async () => {
    setShowDigio(false);
    setDigioCompleted(true);
    
    // Verify eSign status with backend before proceeding
    if (cartItems && cartItems.length > 0) {
      setStep("processing");
      setProcessing(true);
      setProcessingMsg("Verifying digital signature...");
      
      try {
        const { digioService } = await import("@/services/digio.service");
        const productId = cartItems[0]?.portfolio._id;
        const verifyResult = await digioService.verifyAndUpdateEsignStatus("Portfolio", productId);
        
        if (!verifyResult.success || !verifyResult.signed) {
          // eSign not completed - show error or retry
          toast({
            title: "Signature Verification",
            description: "Please complete the digital signature process before proceeding.",
            variant: "destructive"
          });
          setProcessing(false);
          setStep("consent");
          return;
        }
      } catch (error) {
        console.error("Error verifying eSign:", error);
        // Continue anyway - backend will do final verification
      }
    }
    
    // If a gateway was already selected (e.g., Cashfree triggered eSign), proceed with that gateway
    if (selectedGateway) {
      await proceedWithPayment(selectedGateway);
      return;
    }
    
    // After eSign completion, check if we need to show gateway selector
    // Filter gateways that support emandate for this flow
    const availableGateways = isEmandateFlow 
      ? gateways.filter(g => supportsEmandate(g.id))
      : gateways;
    
    
    // Show gateway selector when we have 2+ gateways
    if (gateways.length >= 2 || availableGateways.length >= 2) {
      setShowGatewaySelector(true);
      return;
    }
    
    if (availableGateways.length === 1) {
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
    setProcessingMsg("Processing digital signature...");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (gateway === 'cashfree') {
      await handleCashfreePayment();
    } else {
      await continueAfterDigio();
    }
  };
  
  // Handle Cashfree portfolio payment flow using SDK subscriptionsCheckout
  const handleCashfreePayment = async () => {
    try {
      setProcessingMsg("Creating subscription...");
      
      const productId = cartItems[0]?.portfolio._id || "";
      const productName = cartItems[0]?.portfolio.name || "Portfolio";
      
      const result = await paymentService.createCashfreeSubscription({
        productType: "Portfolio",
        productId: productId,
        planType: subscriptionType,
        userId: user?._id,
        purchaseMethod: 'emandate',
      });
      
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create subscription');
      }
      
      // Get subsSessionId for SDK checkout
      const subsSessionId = result.cashfree?.subsSessionId;
      const subscriptionId = result.subscription?.subscriptionId || result.subscription?.id || result.cashfree?.subscriptionId;
      
      if (!subsSessionId) {
        console.error("❌ Missing subsSessionId in response:", result);
        throw new Error('Missing subscription session ID. Please contact support.');
      }
      
      
      // Store subscription info for verification after redirect
      if (subscriptionId) {
        sessionStorage.setItem('cashfree_subscription_id', subscriptionId);
      }
      sessionStorage.setItem('cashfree_subs_session_id', subsSessionId);
      sessionStorage.setItem('cashfree_return_url', window.location.href);
      
      // Open Cashfree modal instead of redirecting
      setCashfreeModalData({
        subsSessionId: subsSessionId,
        amount: total,
      });
      setShowCashfreeModal(true);
      setProcessing(false);
      
    } catch (error: any) {
      console.error("Cashfree portfolio payment error:", error);
      
      // Check for eSign requirement (412 error or ESIGN_REQUIRED code)
      if (error.response?.status === 412 && error.response?.data?.code === 'ESIGN_REQUIRED') {
        if (cartItems?.length > 0) {
          const productId = cartItems[0]?.portfolio._id || "";
          const productName = cartItems[0]?.portfolio.name || "Portfolio";
          const data: PaymentAgreementData = {
            customerName: (user as any)?.fullName || user?.username || "User",
            customerEmail: user?.email || "user@example.com",
            customerMobile: user?.phone,
            amount: total,
            subscriptionType: subscriptionType,
            portfolioNames: cartItems.map(item => item.portfolio.name),
            agreementDate: new Date().toLocaleDateString("en-IN"),
            productType: "Portfolio",
            productId: productId,
            productName: productName,
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
          const productId = cartItems[0]?.portfolio._id || "";
          const productName = cartItems[0]?.portfolio.name || "Portfolio";
          const data: PaymentAgreementData = {
            customerName: (user as any)?.fullName || user?.username || "User",
            customerEmail: user?.email || "user@example.com",
            customerMobile: user?.phone,
            amount: total,
            subscriptionType: subscriptionType,
            portfolioNames: cartItems.map(item => item.portfolio.name),
            agreementDate: new Date().toLocaleDateString("en-IN"),
            productType: "Portfolio",
            productId: productId,
            productName: productName,
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

  const handlePaymentFlow = async () => {
    
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
    
    setStep("processing");
    setProcessing(true);
    
    try {
      setProcessingMsg("Creating order...");
      
      if (isEmandateFlow) {
        await handleEmandatePaymentFlow();
      } else {
        const order = await paymentService.cartCheckout({
          planType: subscriptionType,
          subscriptionType: "premium",
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
              orderId: rp.razorpay_order_id,
              paymentId: rp?.razorpay_payment_id,
              signature: rp?.razorpay_signature,
            });
            
            if (verify.success) {
              setStep("success");
              setProcessing(false);
              onPaymentSuccess();
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
      if (error.response?.status === 412 && error.response?.data?.code === 'ESIGN_REQUIRED') {
        const data: PaymentAgreementData = {
          customerName: (user as any)?.fullName || user?.username || "User",
          customerEmail: user?.email || "user@example.com",
          customerMobile: user?.phone,
          amount: total,
          subscriptionType: subscriptionType,
          portfolioNames: cartItems.map(item => item.portfolio.name),
          agreementDate: new Date().toLocaleDateString("en-IN"),
          productType: "Portfolio",
          productId: cartItems[0]?.portfolio._id || "",
          productName: "Portfolio Subscription",
        } as any;
        
        setAgreementData(data);
        setShowDigio(true);
        setProcessing(false);
        return;
      }
      
      // Check for eSign pending
      if (error.response?.data?.success === false && error.response?.data?.code === 'ESIGN_PENDING') {
        const authUrl = error.response.data.pendingEsign?.authenticationUrl;
        if (authUrl) {
          const data: PaymentAgreementData = {
            customerName: (user as any)?.fullName || user?.username || "User",
            customerEmail: user?.email || "user@example.com",
            customerMobile: user?.phone,
            amount: total,
            subscriptionType: subscriptionType,
            portfolioNames: cartItems.map(item => item.portfolio.name),
            agreementDate: new Date().toLocaleDateString("en-IN"),
            productType: "Portfolio",
            productId: cartItems[0]?.portfolio._id || "",
            productName: "Portfolio Subscription",
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
      setProcessingMsg("Creating eMandate…");
      
      const emandatePayload = {
        productType: "Portfolio" as const,
        productId: cartItems[0]?.portfolio._id || "",
        emandateType: subscriptionType
      };

      const emandate = await paymentService.createEmandate(emandatePayload);

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
            setStep("success");
            setProcessing(false);
            onPaymentSuccess();
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
      if (error.response?.status === 412 && error.response?.data?.code === 'ESIGN_REQUIRED' && !digioCompleted) {
        const data: PaymentAgreementData = {
          customerName: (user as any)?.fullName || user?.username || "User",
          customerEmail: user?.email || "user@example.com",
          customerMobile: user?.phone,
          amount: total,
          subscriptionType: subscriptionType,
          portfolioNames: cartItems.map(item => item.portfolio.name),
          agreementDate: new Date().toLocaleDateString("en-IN"),
          productType: "Portfolio",
          productId: cartItems[0]?.portfolio._id || "",
          productName: "Portfolio Subscription",
        } as any;
        
        setAgreementData(data);
        setShowDigio(true);
        setProcessing(false);
        return;
      }
      
      // Check for eSign pending for eMandate
      if (error.response?.data?.success === false && error.response?.data?.code === 'ESIGN_PENDING') {
        const authUrl = error.response.data.pendingEsign?.authenticationUrl;
        if (authUrl) {
          const data: PaymentAgreementData = {
            customerName: (user as any)?.fullName || user?.username || "User",
            customerEmail: user?.email || "user@example.com",
            customerMobile: user?.phone,
            amount: total,
            subscriptionType: subscriptionType,
            portfolioNames: cartItems.map(item => item.portfolio.name),
            agreementDate: new Date().toLocaleDateString("en-IN"),
            productType: "Portfolio",
            productId: cartItems[0]?.portfolio._id || "",
            productName: "Portfolio Subscription",
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
        description: error?.message || "Could not create eMandate",
        variant: "destructive",
      });
    }
  };

  const continueAfterDigio = async () => {
    try {
      setStep("processing");
      setProcessing(true);
      setProcessingMsg("Verifying digital signature...");

      if (isEmandateFlow) {
        // Verify eSign status first
        try {
          const productId = cartItems[0]?.portfolio._id || "";
          
          const eSignStatus = await paymentService.verifyESignCompletion("Portfolio", productId);
          
          if (!eSignStatus.success) {
            throw new Error("eSign verification failed: " + eSignStatus.message);
          }
          
          setProcessingMsg("Creating eMandate…");
          
          const emandatePayload = {
            productType: "Portfolio" as const,
            productId: productId,
            emandateType: subscriptionType
          };

          const emandate = await paymentService.createEmandate(emandatePayload);

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
                setStep("success");
                setProcessing(false);
                onPaymentSuccess();
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
        } catch (emandateError: any) {
          console.error("eMandate creation failed after Digio:", emandateError);
          setStep("error");
          setProcessing(false);
          toast({
            title: "Payment Error",
            description: emandateError?.message || "Could not create eMandate after verification",
            variant: "destructive",
          });
        }
      } else {
        setProcessingMsg("Creating order…");
        
        const order = await paymentService.cartCheckout({
          planType: subscriptionType,
          subscriptionType: "premium",
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
              orderId: rp.razorpay_order_id,
              paymentId: rp?.razorpay_payment_id,
              signature: rp?.razorpay_signature,
            });

            if (verify.success) {
              setStep("success");
              setProcessing(false);
              onPaymentSuccess();
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
      console.error("continueAfterDigio error:", error);
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
                  : "Portfolio Purchase"
                }
              </h2>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                {step === "consent" && (
                  <div className="space-y-6">
                    <div className="bg-black rounded-lg overflow-hidden aspect-video">
                      <iframe
                          src="https://www.youtube-nocookie.com/embed/guetyPOoThw?rel=0&modestbranding=1&enablejsapi=1"
                          title="Digital Verification Process"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-xl font-semibold text-gray-900 mb-4">
                        Why Digital Verification is Required
                      </h4>
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 mb-4">
                          As per SEBI regulations and RBI guidelines, all investment platforms must verify the identity 
                          of their subscribers before processing any financial transactions.
                        </p>
                        <p className="text-gray-700">
                          Once verified, you'll have seamless access to all our premium investment services.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleClose}
                        variant="outline"
                        className="flex-1"
                      >
                        Back to Cart
                      </Button>
                      <Button
                        onClick={handlePaymentFlow}
                        className="flex-1 bg-[#001633] hover:bg-[#002244] text-white"
                      >
                        Proceed to Payment
                      </Button>
                    </div>
                  </div>
                )}

                {step === "auth" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Login to Continue</h3>
                      <p className="text-gray-600 text-sm">Amount: ₹{total.toLocaleString()}</p>
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
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">Complete Your Profile</h3>
                      <p className="text-gray-600 text-sm">We need your PAN details to comply with regulatory requirements</p>
                    </div>
                    
                    <form className="space-y-5" onSubmit={async (e) => {
                      e.preventDefault();
                      setPanFormLoading(true);
                      
                      try {
                        await paymentService.updatePanDetails(panFormData);
                        toast({ title: "Profile Updated", description: "Your PAN details have been verified and saved successfully" });
                        setStep("consent");
                      } catch (error: any) {
                        toast({ title: "Update Failed", description: error.message || "Failed to update profile", variant: "destructive" });
                      } finally {
                        setPanFormLoading(false);
                      }
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          required
                          value={panFormData.fullName}
                          onChange={(e) => setPanFormData({...panFormData, fullName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Full Name"
                        />
                        <input
                          type="date"
                          required
                          value={panFormData.dateofBirth}
                          onChange={(e) => setPanFormData({...panFormData, dateofBirth: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <input
                        type="tel"
                        required
                        value={panFormData.phone}
                        onChange={(e) => setPanFormData({...panFormData, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Phone Number"
                      />
                      
                      <input
                        type="text"
                        required
                        value={panFormData.pandetails}
                        onChange={(e) => setPanFormData({...panFormData, pandetails: e.target.value.toUpperCase()})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="PAN Card Number"
                        maxLength={10}
                      />
                      
                      <div className="flex gap-3 pt-2">
                        <Button type="button" onClick={() => setStep("consent")} variant="outline" className="flex-1" disabled={panFormLoading}>
                          Back
                        </Button>
                        <Button type="submit" className="flex-1 bg-[#001633] hover:bg-[#002244] text-white" disabled={panFormLoading}>
                          {panFormLoading ? "Verifying..." : "Verify & Continue"}
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
                    <Button variant="outline" onClick={() => { cancelRequested.current = true; setProcessing(false); setStep("consent"); }}>
                      Cancel
                    </Button>
                  </div>
                )}

                {step === "success" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-green-800">Payment Successful!</h3>
                    <p className="text-gray-600 mb-6">Your portfolio subscription has been activated successfully!</p>
                    <Button onClick={() => { handleClose(); router.push("/dashboard"); }} className="w-full bg-green-600 hover:bg-green-700 mb-4">
                      Continue to Dashboard
                    </Button>
                  </div>
                )}

                {step === "error" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-red-800">Payment Failed</h3>
                    <p className="text-gray-600 mb-6">Something went wrong with your payment. Please try again.</p>
                    <div className="space-y-2">
                      <Button onClick={() => setStep("consent")} className="w-full bg-[#001633] hover:bg-[#002244]">
                        Try Again
                      </Button>
                      <Button onClick={handleClose} variant="outline" className="w-full">
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

      {showDigio && agreementData && (
        <DigioVerificationModal
          isOpen={showDigio}
          onClose={() => setShowDigio(false)}
          onVerificationComplete={handleDigioComplete}
          agreementData={agreementData}
        />
      )}
      
      {/* Payment Gateway Selector Modal */}
      <PaymentGatewaySelectorModal
        isOpen={showGatewaySelector}
        onClose={() => {
          setShowGatewaySelector(false);
          setStep("consent");
        }}
        onSelect={handleGatewaySelect}
        title="Choose Payment Method"
        description="Select your preferred payment gateway to complete the subscription"
        isEmandate={isEmandateFlow}
      />

      {/* Cashfree S2S Payment Modal */}
      {showCashfreeS2S && cashfreeS2SData && (
        <CashfreeS2SPayment
          isOpen={showCashfreeS2S}
          onClose={() => {
            setShowCashfreeS2S(false);
            setCashfreeS2SData(null);
            setStep("consent");
          }}
          subscriptionId={cashfreeS2SData.subscriptionId}
          amount={cashfreeS2SData.amount}
          productName={cashfreeS2SData.productName}
          onSuccess={() => {
            setShowCashfreeS2S(false);
            onPaymentSuccess();
          }}
          onError={(error) => {
            console.error('Cashfree S2S error:', error);
            toast({
              title: "Payment Error",
              description: error,
              variant: "destructive",
            });
          }}
        />
      )}

      {/* Cashfree Modal */}
      {showCashfreeModal && cashfreeModalData && (
        <CashfreeModal
          isOpen={showCashfreeModal}
          onClose={() => {
            setShowCashfreeModal(false);
            setCashfreeModalData(null);
            setStep("consent");
          }}
          subsSessionId={cashfreeModalData.subsSessionId}
          amount={cashfreeModalData.amount}
          title="Complete Payment Authorization"
          onSuccess={async () => {
            setShowCashfreeModal(false);
            setCashfreeModalData(null);
            setStep("success");
            
            // Redirect to dashboard
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