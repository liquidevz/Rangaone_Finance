// components/checkout-modal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, CreditCard, Check, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "./auth/auth-context";
import { useCart } from "./cart/cart-context";
import { useRouter } from "next/navigation";
import { Bundle } from "@/services/bundle.service";
import { paymentService, type CreateOrderResponse, type CreateEMandateResponse } from "@/services/payment.service";
import { DigioVerificationModal } from "@/components/digio-verification-modal";
import type { PaymentAgreementData } from "@/services/digio.service";
import {
  UserPortfolio,
  userPortfolioService,
} from "@/services/user-portfolio.service";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "single" | "cart";
  bundle?: Bundle;
  portfolio?: UserPortfolio;
  subscriptionType?: "monthly" | "quarterly" | "yearly";
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  type,
  bundle,
  portfolio,
  subscriptionType = "monthly",
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    "review" | "processing" | "success" | "telegram" | "error"
  >("review");
  const [telegramLinks, setTelegramLinks] = useState<any[]>([]);
  const [showDigio, setShowDigio] = useState(false);
  const [agreementData, setAgreementData] = useState<PaymentAgreementData | null>(null);
  const [pendingEmandateId, setPendingEmandateId] = useState<string | null>(null);
  const [fetchingLinks, setFetchingLinks] = useState(false);
  const pollTimerRef = useRef<any>(null);
  
  const { user, isAuthenticated } = useAuth();
  const { cart, refreshCart, calculateTotal: cartCalculateTotal } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && type === "cart") {
      refreshCart();
    }
  }, [isOpen, type, refreshCart]);

  useEffect(() => {
    if (!isOpen) {
      setPaymentStep("review");
    }
  }, [isOpen]);

  const handleCreateOrder = async () => {
    if (loading) return;

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to complete your purchase",
        variant: "destructive",
      });
      onClose();
      router.push("/login");
      return;
    }

    setLoading(true);
    setPaymentStep("processing");

    const userInfo = {
      name: (user as any)?.fullName || user?.username || "User",
      email: user?.email || "user@example.com",
    };

    const finishSuccess = (verifyResponse?: any) => {
      console.log("🔍 VERIFY RESPONSE:", verifyResponse);
      console.log("🔍 TELEGRAM LINKS:", verifyResponse?.telegramInviteLinks);
      
      // Check for telegram links in response
      const telegramLinks = verifyResponse?.telegramInviteLinks || verifyResponse?.telegram_invite_links || [];
      
      if (telegramLinks?.length > 0) {
        setTelegramLinks(telegramLinks);
        setPaymentStep("telegram");
      } else if (pendingEmandateId) {
        // Poll for telegram links shortly after activation
        setPaymentStep("telegram");
        setFetchingLinks(true);
        let attempts = 0;
        const maxAttempts = 10;
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(async () => {
          attempts += 1;
          try {
            const latest = await paymentService.verifyEmandate(pendingEmandateId as string);
            const newLinks = (latest as any)?.telegramInviteLinks || (latest as any)?.telegram_invite_links;
            if (newLinks && newLinks.length) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
              setFetchingLinks(false);
              setTelegramLinks(newLinks);
            }
          } catch {}
          if (attempts >= maxAttempts) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
            setFetchingLinks(false);
          }
        }, 2000);
      } else {
        setPaymentStep("success");
      }
      toast({ 
        title: "Payment Successful", 
        description: telegramLinks?.length > 0 
          ? "Your subscription has been activated" 
          : "Your subscription has been activated. Please check your email for Telegram group links."
      });
      setLoading(false);
    };

    const finishError = (message: string) => {
      setPaymentStep("error");
      toast({ title: "Payment Failed", description: message || "Something went wrong. Please try again.", variant: "destructive" });
      setLoading(false);
    };

    try {
      // CART checkout flow
      if (type === "cart") {
        if (subscriptionType === "yearly" || subscriptionType === "quarterly") {
          // eMandate for cart
          const emandate: CreateEMandateResponse = await paymentService.cartCheckoutEmandate({ planType: subscriptionType });
          await paymentService.openCheckout(
            emandate,
            userInfo,
            async () => {
              const verify = await paymentService.verifyEmandateWithRetry(emandate.subscriptionId);
              if (verify.success || ["active", "authenticated"].includes((verify as any).subscriptionStatus || "")) {
                finishSuccess(verify);
              } else {
                finishError(verify.message || "eMandate verification failed");
              }
            },
            (err) => finishError(err?.message || "Payment cancelled")
          );
        } else {
          // Regular order for cart
          const order: CreateOrderResponse = await paymentService.cartCheckout({ planType: "monthly" });
          await paymentService.openCheckout(
            order,
            userInfo,
            async (resp) => {
              const verify = await paymentService.verifyPayment({
                orderId: resp.razorpay_order_id,
                paymentId: resp.razorpay_payment_id,
                signature: resp.razorpay_signature
              });
              if (verify.success) finishSuccess(verify); else finishError(verify.message);
            },
            (err) => finishError(err?.message || "Payment cancelled")
          );
        }
        return;
      }

      // SINGLE checkout flow (bundle or portfolio)
      const productType: "Bundle" | "Portfolio" = bundle ? "Bundle" : "Portfolio";
      const productId = bundle?._id || (portfolio as any)?._id;
      if (!productId) {
        finishError("Invalid product");
        return;
      }

      if (subscriptionType === "yearly" || subscriptionType === "quarterly") {
        // Show Digio first, payment will start after verification
        startDigioFlow();
      } else {
        // Monthly one-time payment
        const order = await paymentService.createOrder({ 
          productType, 
          productId, 
          planType: "monthly",
          subscriptionType: (bundle?.category as any) || "premium"
        });
        await paymentService.openCheckout(
          order,
          userInfo,
          async (resp) => {
            const verify = await paymentService.verifyPayment({
              orderId: resp.razorpay_order_id,
              paymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature
            });
            if (verify.success) finishSuccess(verify); else finishError(verify.message);
          },
          (err) => finishError(err?.message || "Payment cancelled")
        );
      }
    } catch (error: any) {
      finishError(error?.message || "Unexpected error while creating payment");
    }
  };

  const handleClose = () => {
    setPaymentStep("review");
    setLoading(false);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setPendingEmandateId(null);
    setFetchingLinks(false);
    onClose();
  };

  const startDigioFlow = () => {
    if (!bundle) return;
    const price = calculateTotal();
    const data: PaymentAgreementData = {
      customerName: (user as any)?.fullName || user?.username || "User",
      customerEmail: user?.email || "user@example.com",
      amount: price,
      subscriptionType,
      portfolioNames: [bundle.name, ...bundle.portfolios.map(p => p.name)],
      agreementDate: new Date().toLocaleDateString("en-IN"),
    } as any;
    setAgreementData(data);
    setShowDigio(true);
  };

  const handleDigioSuccess = async () => {
    if (!bundle) return;
    
    const productType: "Bundle" | "Portfolio" = "Bundle";
    const productId = bundle._id;
    
    try {
      const emandate = await paymentService.createEmandate({ 
        productType, 
        productId, 
        planType: subscriptionType
      });
      setPendingEmandateId(emandate.subscriptionId);
      
      if (!emandate?.subscriptionId) {
        throw new Error("Invalid eMandate response: missing subscriptionId");
      }
      
      console.log("Opening Razorpay with subscriptionId:", emandate.subscriptionId);
      
      await paymentService.openCheckout(
        emandate,
        {
          name: (user as any)?.fullName || user?.username || "User",
          email: user?.email || "user@example.com",
        },
        async () => {
          const verify = await paymentService.verifyEmandateWithRetry(emandate.subscriptionId);
          console.log("🔍 EMANDATE VERIFY RESULT:", verify);
          if (verify.success || ["active", "authenticated"].includes((verify as any).subscriptionStatus || "")) {
            const links = (verify as any)?.telegramInviteLinks || (verify as any)?.telegram_invite_links || [];
            if (links.length > 0) {
              setTelegramLinks(links);
              setPaymentStep("telegram");
            } else {
              setPaymentStep("success");
            }
            toast({ title: "Payment Successful", description: "Your subscription has been activated" });
            setLoading(false);
          } else {
            const handleError = (message: string) => {
              setPaymentStep("error");
              toast({ title: "Payment Failed", description: message || "Something went wrong. Please try again.", variant: "destructive" });
              setLoading(false);
            };
            handleError((verify as any)?.message || "eMandate verification failed");
          }
        },
        (err) => {
          const handleError = (message: string) => {
            setPaymentStep("error");
            toast({ title: "Payment Failed", description: message || "Something went wrong. Please try again.", variant: "destructive" });
            setLoading(false);
          };
          handleError(err?.message || "Payment cancelled");
        }
      );
    } catch (error: any) {
      const handleError = (message: string) => {
        setPaymentStep("error");
        toast({ title: "Payment Failed", description: message || "Something went wrong. Please try again.", variant: "destructive" });
        setLoading(false);
      };
      handleError(error?.message || "Failed to create eMandate");
    }
  };

  const getCheckoutDescription = (portfolio: UserPortfolio) => {
    return userPortfolioService.getDescriptionByKey(
      portfolio?.description,
      "checkout card"
    );
  };

  const calculateTotal = () => {
    if (type === "single") {
      if (bundle) {
        switch (subscriptionType) {
          case "yearly":
            return bundle.quarterlyPrice;
          case "quarterly":
            return bundle.quarterlyPrice;
          default:
            return bundle.monthlyPrice;
        }
      }

      if (portfolio) {
        return userPortfolioService.getPriceByType(
          portfolio.subscriptionFee,
          subscriptionType
        );
      }
    }

    if (type === "cart" && cart) {
      return cartCalculateTotal(subscriptionType);
    }

    return 0;
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
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {type === "cart" ? (
                <ShoppingCart className="h-5 w-5" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              {paymentStep === "success" ? "Payment Successful" : "Checkout"}
            </h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {paymentStep === "review" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Order Summary</h3>

                {/* Single Portfolio */}
                {type === "single" && portfolio && (
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {portfolio.name}
                    </h4>

                    {getCheckoutDescription(portfolio) && (
                      <div className="mb-4">
                        <div 
                          className="checkout-description text-sm text-gray-600"
                          dangerouslySetInnerHTML={{ __html: getCheckoutDescription(portfolio) }}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-white rounded border">
                      <div className="text-center">
                        <div className="text-sm font-bold text-green-600">
                          {portfolio.CAGRSinceInception || "N/A"}%
                        </div>
                        <div className="text-xs text-gray-500">CAGR</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-blue-600">
                          {portfolio.oneYearGains || "N/A"}%
                        </div>
                        <div className="text-xs text-gray-500">1Y Returns</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-purple-600">
                          {portfolio.monthlyGains || "N/A"}%
                        </div>
                        <div className="text-xs text-gray-500">Monthly</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <span className="text-sm text-gray-500">
                        {subscriptionType === "yearly"
                          ? "Yearly"
                          : subscriptionType === "quarterly"
                          ? "Quarterly (3 Months)"
                          : "Monthly"}{" "}
                        Subscription
                      </span>
                      <span className="font-bold text-lg text-blue-600">
                        ₹{calculateTotal()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Single Bundle */}
                {type === "single" && bundle && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium">{bundle.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {bundle.description}
                    </p>

                    {bundle.portfolios.length > 0 && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Includes {bundle.portfolios.length} Portfolio
                          {bundle.portfolios.length > 1 ? "s" : ""}:
                        </p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {bundle.portfolios
                            .slice(0, 3)
                            .map((portfolio, index) => (
                              <li key={index}>• {portfolio.name}</li>
                            ))}
                          {bundle.portfolios.length > 3 && (
                            <li>
                              • And {bundle.portfolios.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm text-gray-500">
                        {subscriptionType === "yearly"
                          ? "Yearly"
                          : subscriptionType === "quarterly"
                          ? "Quarterly (3 Months)"
                          : "Monthly"}{" "}
                        Subscription
                      </span>
                      <span className="font-bold text-lg">
                        ₹{calculateTotal()}
                      </span>
                    </div>

                    {bundle.discountPercentage > 0 && (
                      <div className="text-sm text-green-600 mt-2 flex items-center">
                        <Check className="w-4 h-4 mr-1" />
                        {bundle.discountPercentage}% bundle discount applied
                      </div>
                    )}
                  </div>
                )}

                {/* Cart Items */}
                {type === "cart" && cart && cart.items.length > 0 && (
                  <div className="space-y-3">
                    {cart.items.map((item) => {
                      let price = 0;

                      switch (subscriptionType) {
                        case "yearly":
                          price =
                            item.portfolio.subscriptionFee.find(
                              (fee) => fee.type === "yearly"
                            )?.price || 0;
                          break;
                        case "quarterly":
                          price =
                            item.portfolio.subscriptionFee.find(
                              (fee) => fee.type === "quarterly"
                            )?.price || 0;
                          break;
                        default:
                          price =
                            item.portfolio.subscriptionFee.find(
                              (fee) => fee.type === "monthly"
                            )?.price || 0;
                          break;
                      }

                      const checkoutDesc =
                        userPortfolioService.getDescriptionByKey(
                          item.portfolio?.description,
                          "checkout card"
                        );

                      return (
                        <div
                          key={item._id}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">
                                {item.portfolio.name}
                              </h4>
                              {checkoutDesc && (
                                <div className="mt-1">
                                  <div 
                                    className="checkout-description text-xs text-gray-600"
                                    dangerouslySetInnerHTML={{ __html: checkoutDesc }}
                                  />
                                </div>
                              )}
                              <p className="text-sm text-gray-600 mt-1">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <span className="font-bold">
                              ₹{price * item.quantity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty cart */}
                {type === "cart" && (!cart || cart.items.length === 0) && (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Your cart is empty</p>
                  </div>
                )}

                {/* Total */}
                {((type === "cart" && cart && cart.items.length > 0) ||
                  type === "single") && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-blue-600">₹{calculateTotal()}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Billed{" "}
                      {subscriptionType === "yearly"
                        ? "annually"
                        : subscriptionType === "quarterly"
                        ? "every 3 months"
                        : "monthly"}
                    </p>
                  </div>
                )}

                {/* Payment Button */}
                {((type === "cart" && cart && cart.items.length > 0) ||
                  type === "single") && (
                  <Button
                    onClick={handleCreateOrder}
                    disabled={loading}
                    className="w-full bg-[#001633] hover:bg-[#002244] text-[#FFFFF0] py-3"
                  >
                    {loading ? "Processing..." : `Pay ₹${calculateTotal()}`}
                  </Button>
                )}
              </div>
            )}

            {paymentStep === "processing" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">
                  Processing Payment
                </h3>
                <p className="text-gray-600">
                  Please wait while we process your payment...
                </p>
              </div>
            )}

            {paymentStep === "telegram" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-blue-800">
                  Join Your Telegram Groups
                </h3>
                <p className="text-gray-600 mb-6">
                  Click the links below to join your exclusive Telegram groups for portfolio updates and insights.
                </p>
                
                <div className="space-y-3 mb-6">
                  {telegramLinks.map((link, index) => (
                    <div key={index} className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-blue-800">
                          Telegram Group {index + 1}
                        </div>
                        <div className="text-xs text-blue-600">
                          Expires: {new Date(link.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={link.invite_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Join Group
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(link.invite_link);
                            toast({ title: "Link copied to clipboard" });
                          }}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors flex items-center gap-1"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => {
                    handleClose();
                    refreshCart();
                    router.push('/dashboard');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Dashboard
                </Button>
              </div>
            )}

            {paymentStep === "success" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-green-800">
                  Payment Successful!
                </h3>

                {type === "single" && bundle ? (
                  <div className="text-gray-600 mb-6">
                    <p className="mb-2">
                      {bundle.name} subscription activated successfully!
                    </p>
                    <p className="text-sm">
                      You now have access to all {bundle.portfolios.length} portfolio
                      {bundle.portfolios.length > 1 ? "s" : ""} in this bundle.
                    </p>
                  </div>
                ) : type === "single" && portfolio ? (
                  <div className="text-gray-600 mb-6">
                    <p className="mb-2">
                      {portfolio.name} subscription activated!
                    </p>
                    <p className="text-sm">
                      You now have full access to this portfolio's
                      recommendations and insights.
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-600 mb-6">
                    <p className="mb-2">
                      Your subscription has been activated successfully.
                    </p>
                    <p className="text-sm text-blue-600">
                      Please check your email for Telegram group invitation links.
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => {
                    handleClose();
                    refreshCart();
                    router.push('/dashboard');
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Continue to Dashboard
                </Button>
              </div>
            )}

            {paymentStep === "error" && (
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
                    onClick={() => setPaymentStep("review")}
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
    {showDigio && agreementData && (
      <DigioVerificationModal
        isOpen={showDigio}
        onClose={() => setShowDigio(false)}
        onVerificationComplete={() => {
          setShowDigio(false);
          handleDigioSuccess();
        }}
        agreementData={agreementData}
      />
    )}
    </>
  );
};