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
import type { PaymentAgreementData } from "@/services/digio.service";

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
    "consent" | "auth" | "pan-form" | "processing" | "success" | "error"
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
    onClose();
  };

  const handleAuthSuccess = async () => {
    setStep("consent");
  };

  const handleDigioComplete = async () => {
    setShowDigio(false);
    setDigioCompleted(true);
    
    // Wait longer for Digio to process on backend
    setStep("processing");
    setProcessing(true);
    setProcessingMsg("Processing digital signature...");
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await continueAfterDigio();
  };

  const handlePaymentFlow = async () => {
    console.log("🚀 Starting portfolio payment flow");
    
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
        console.log("🔍 eSign pending - showing Digio modal");
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

      console.log("🚀 Creating eMandate with payload:", emandatePayload);
      const emandate = await paymentService.createEmandate(emandatePayload);
      console.log("✅ eMandate created successfully:", emandate);

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
        console.log("🔍 eSign pending for eMandate - showing Digio modal");
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
          console.log("🔍 Verifying eSign status for:", { productType: "Portfolio", productId });
          
          const eSignStatus = await paymentService.verifyESignCompletion("Portfolio", productId);
          console.log("✅ eSign verification result:", eSignStatus);
          
          if (!eSignStatus.success) {
            throw new Error("eSign verification failed: " + eSignStatus.message);
          }
          
          setProcessingMsg("Creating eMandate…");
          
          const emandatePayload = {
            productType: "Portfolio" as const,
            productId: productId,
            emandateType: subscriptionType
          };

          console.log("🚀 Creating eMandate after eSign verification:", emandatePayload);
          const emandate = await paymentService.createEmandate(emandatePayload);
          console.log("✅ eMandate created successfully:", emandate);

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
                    <div className="bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="315"
                        src="https://youtube.com/embed/guetyPOoThw"
                        title="Digital Verification Process"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full"
                      ></iframe>
                    </div>

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
    </>
  );
};