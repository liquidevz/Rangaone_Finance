"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-context"
import { useRouter } from "next/navigation"
import { Bundle } from "@/services/bundle.service"
import { paymentService } from "@/services/payment.service"
import CartAuthForm from "@/components/cart-auth-form"
import { DigioVerificationModal } from "@/components/digio-verification-modal"
import type { PaymentAgreementData } from "@/services/digio.service"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  bundle: Bundle | null
  isEmandateFlow?: boolean
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bundle,
  isEmandateFlow = false
}) => {
  // Use isEmandateFlow to determine which options to show
  console.log('isEmandateFlow:', isEmandateFlow);
  const [step, setStep] = useState<"plan" | "auth" | "digio" | "processing" | "success" | "error">("plan")
  const [subscriptionType, setSubscriptionType] = useState<"monthly" | "yearly">("monthly")
  const [processing, setProcessing] = useState(false)
  const [processingMsg, setProcessingMsg] = useState("Preparing secure payment…")
  const [showDigio, setShowDigio] = useState(false)
  const [agreementData, setAgreementData] = useState<PaymentAgreementData | null>(null)
  const [telegramLinks, setTelegramLinks] = useState<Array<{ invite_link: string }> | null>(null)
  const cancelRequested = useRef(false)
  const continuedAfterAuthRef = useRef(false)
  
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const isPremium = bundle?.category === "premium"

  // When modal opens, if the user is not authenticated, show login as the first step
  useEffect(() => {
    if (!isOpen) return
    if (!isAuthenticated) {
      setStep("auth")
      continuedAfterAuthRef.current = false
    } else {
      setStep("plan")
    }
  }, [isOpen, isAuthenticated])

  // If user authenticates while viewing the auth step, automatically continue to Digio
  useEffect(() => {
    if (!isOpen) return
    if (step !== "auth") return
    if (isAuthenticated && bundle && !continuedAfterAuthRef.current) {
      continuedAfterAuthRef.current = true
      startDigioFlow()
    }
  }, [isOpen, step, isAuthenticated, bundle])

  const computeMonthlyEmandateDiscount = () => {
    if (!bundle) return 0
    const monthly = bundle.monthlyPrice || 0
    const emandateMonthly = (bundle as any).monthlyemandateprice || 0
    if (!monthly || !emandateMonthly) return 0
    const pct = Math.round(((monthly - emandateMonthly) / monthly) * 100)
    return Math.max(0, pct)
  }

  const computeYearlyDiscount = () => {
    if (!bundle) return 0
    const monthly = bundle.monthlyPrice || 0
    const yearly = bundle.yearlyPrice || 0
    const annualFromMonthly = monthly * 12
    if (!annualFromMonthly || !yearly) return 0
    const pct = Math.round(((annualFromMonthly - yearly) / annualFromMonthly) * 100)
    return Math.max(0, pct)
  }

  const getPrice = () => {
    if (!bundle) return 0
    if (isEmandateFlow) {
      return subscriptionType === "yearly"
        ? ((bundle as any).yearlyemandateprice || bundle.yearlyPrice || 0)
        : ((bundle as any).monthlyemandateprice || bundle.monthlyPrice || 0)
    }
    // normal one-time monthly purchase
    return bundle.monthlyPrice || 0
  }

  const handleClose = () => {
    setStep("plan")
    setProcessing(false)
    setShowDigio(false)
    setTelegramLinks(null)
    onClose()
  }

  const handleProceed = async () => {
    if (!bundle) return

    // Step 1: Check authentication
    if (!isAuthenticated) {
      setStep("auth")
      return
    }

    // Step 2: Start Digio verification (5-step flow for both paths)
    startDigioFlow()
  }

  const handleAuthSuccess = async () => {
    // Immediately continue the flow after successful login
    continuedAfterAuthRef.current = true
    startDigioFlow()
  }

  const startDigioFlow = () => {
    if (!bundle) return
    
    const price = getPrice()
    const data: PaymentAgreementData = {
      customerName: (user as any)?.fullName || user?.username || "User",
      customerEmail: user?.email || "user@example.com",
      amount: price,
      subscriptionType: subscriptionType,
      portfolioNames: bundle.portfolios.map(p => p.name),
      agreementDate: new Date().toLocaleDateString('en-IN')
    } as any
    
    setAgreementData(data)
    setShowDigio(true)
  }

  const handleDigioComplete = async () => {
    setShowDigio(false)
    if (!bundle) return
    
    // Step 3: Create eMandate
    // Step 4: Open payment gateway
    // Step 5: Verify payment
    await handlePaymentFlow()
  }

  const handlePaymentFlow = async () => {
    if (!bundle) return

    try {
      cancelRequested.current = false
      setStep("processing")
      setProcessing(true)

      if (isEmandateFlow) {
        setProcessingMsg("Creating eMandate…")
        const emandateAmount =
          subscriptionType === "yearly"
            ? (((bundle as any).yearlyemandateprice as number) || bundle.yearlyPrice || 0)
            : (((bundle as any).monthlyemandateprice as number) || bundle.monthlyPrice || 0)

        const emandate = await paymentService.createEmandate({
          productType: "Bundle",
          productId: bundle._id,
          planType: subscriptionType,
          subscriptionType: (bundle.category as any) || "premium",
          amount: emandateAmount,
          items: [
            {
              productType: "Bundle",
              productId: bundle._id,
              planType: subscriptionType,
              amount: emandateAmount,
            },
          ],
        })

        if (cancelRequested.current) {
          setProcessing(false)
          setStep("plan")
          return
        }

        setProcessingMsg("Opening payment gateway…")
        await paymentService.openCheckout(
          emandate,
          {
            name: (user as any)?.fullName || user?.username || "User",
            email: user?.email || "user@example.com",
          },
          async () => {
            setProcessingMsg("Verifying payment…")
            const verify = await paymentService.verifyEmandateWithRetry(emandate.subscriptionId)
            
            if (verify.success || ["active", "authenticated"].includes((verify as any).subscriptionStatus || "")) {
              const links = (verify as any)?.telegramInviteLinks as Array<{ invite_link: string }> | undefined
              if (links && links.length) {
                setTelegramLinks(links)
              }
              
              setStep("success")
              setProcessing(false)
              toast({ title: "Payment Successful", description: "Subscription activated" })
            } else {
              setStep("error")
              setProcessing(false)
              toast({ title: "Verification Failed", description: verify.message || "Please try again", variant: "destructive" })
            }
          },
          (err) => {
            setStep("error")
            setProcessing(false)
            toast({ title: "Payment Cancelled", description: err?.message || "Payment was cancelled", variant: "destructive" })
          }
        )
      } else {
        // One-time order flow (still uses Digio as part of 5-step UX)
        setProcessingMsg("Creating order…")
        const order = await paymentService.createOrder({
          productType: "Bundle",
          productId: bundle._id,
          planType: "monthly",
          subscriptionType: (bundle.category as any) || "premium",
        })

        if (cancelRequested.current) {
          setProcessing(false)
          setStep("plan")
          return
        }

        setProcessingMsg("Opening payment gateway…")
        await paymentService.openCheckout(
          order,
          {
            name: (user as any)?.fullName || user?.username || "User",
            email: user?.email || "user@example.com",
          },
          async (rp) => {
            setProcessingMsg("Verifying payment…")
            const verify = await paymentService.verifyPayment({
              orderId: order.orderId,
              paymentId: rp?.razorpay_payment_id,
              signature: rp?.razorpay_signature,
            })

            if (verify.success) {
              const links = (verify as any)?.telegramInviteLinks as Array<{ invite_link: string }> | undefined
              if (links && links.length) {
                setTelegramLinks(links)
              }
              
              setStep("success")
              setProcessing(false)
              toast({ title: "Payment Successful", description: "Subscription activated" })
            } else {
              setStep("error")
              setProcessing(false)
              toast({ title: "Verification Failed", description: verify.message || "Please try again", variant: "destructive" })
            }
          },
          (err) => {
            setStep("error")
            setProcessing(false)
            toast({ title: "Payment Cancelled", description: err?.message || "Payment was cancelled", variant: "destructive" })
          }
        )
      }
    } catch (error: any) {
      setStep("error")
      setProcessing(false)
      toast({ title: "Checkout Error", description: error?.message || "Could not start checkout", variant: "destructive" })
    }
  }

  if (!isOpen || !bundle) return null

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
                {step === "success" ? "Payment Successful!" : 
                 step === "error" ? "Payment Failed" :
                 step === "processing" ? "Processing Payment" :
                 step === "auth" ? "Login Required" :
                 "Choose Your Plan"}
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
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-gray-900">{bundle.name}</h3>
                    <p
                      className="max-w-prose mx-auto text-left sm:text-center text-[13px] sm:text-[15px] md:text-base leading-6 sm:leading-7 md:leading-8 text-gray-600 break-words"
                    >
                      {bundle.description}
                    </p>
                  </div>

                  {/* Subscription Type Toggle */}
                  {isEmandateFlow ? (
                    <div className="space-y-4">
                      <h4 className="font-medium text-base sm:text-lg">Choose Subscription Period:</h4>
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
                          <div className={`${isPremium ? "bg-amber-400 text-amber-900" : "bg-blue-600 text-white"} absolute left-0 right-0 top-0 px-3 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between`}>
                            <span>
                              {(() => {
                                const pct = computeMonthlyEmandateDiscount()
                                return pct > 0 ? `${pct}% off for 12 months` : "Special offer"
                              })()}
                            </span>
                            <span className="underline text-xs">View terms</span>
                          </div>
                          <div className="pt-9 sm:pt-10" />
                          <div className="font-semibold text-base sm:text-lg md:text-xl">Annual, billed monthly</div>
                          <div className="text-xs sm:text-sm text-gray-600 line-through">
                            ₹{(bundle as any).strikeMonthly || Math.round(((bundle as any).monthlyemandateprice || 0) * 1.5)} /mo
                          </div>
                          <div className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700">
                            ₹{(bundle as any).monthlyemandateprice || 0}
                            <span className="text-base font-medium">/mo</span>
                          </div>
                          <div className="text-[11px] sm:text-xs text-gray-500 mt-1">Fee applies if you cancel mid-commitment</div>
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
                          <div className={`${isPremium ? "bg-amber-400 text-amber-900" : "bg-blue-600 text-white"} absolute left-0 right-0 top-0 px-3 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between`}>
                            <span>
                              {(() => {
                                const pct = computeYearlyDiscount()
                                return pct > 0 ? `${pct}% off the first year` : "Best value"
                              })()}
                            </span>
                            <span className="underline text-xs">View terms</span>
                          </div>
                          <div className="pt-9 sm:pt-10" />
                          <div className="font-semibold text-base sm:text-lg md:text-xl">Annual, prepaid</div>
                          <div className="text-xs sm:text-sm text-gray-600 line-through">
                            ₹{(bundle as any).strikeYear || Math.round((bundle.yearlyPrice || 0) * 1.3)} /yr
                          </div>
                          <div className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700">₹{(bundle as any).yearlyemandateprice || 0}<span className="text-base font-medium">/yr</span></div>
                          <div className="text-[11px] sm:text-xs text-gray-500 mt-1">No refund if you cancel after payment</div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-medium text-base sm:text-lg">Monthly Subscription:</h4>
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <div className={`p-4 sm:p-5 md:p-6 rounded-xl border-2 border-blue-500 bg-blue-50 text-left relative overflow-hidden h-full flex flex-col`}>
                          <div className={`${isPremium ? "bg-amber-400 text-amber-900" : "bg-blue-600 text-white"} absolute left-0 right-0 top-0 px-3 py-2 text-xs sm:text-sm font-semibold`}>
                            <span>One-time monthly payment</span>
                          </div>
                          <div className="pt-9 sm:pt-10" />
                          <div className="font-semibold text-base sm:text-lg md:text-xl">Monthly</div>
                          <div className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700">
                            ₹{bundle.monthlyPrice || 0}
                            <span className="text-base font-medium">/mo</span>
                          </div>
                          <div className="text-[11px] sm:text-xs text-gray-500 mt-1">Pay once, use for one month</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Portfolio List */}
                  {bundle.portfolios.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Includes {bundle.portfolios.length} Portfolio{bundle.portfolios.length > 1 ? 's' : ''}:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {bundle.portfolios.slice(0, 3).map((portfolio, index) => (
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
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-blue-600">₹{getPrice()}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Billed {subscriptionType === "yearly" ? "annually" : "every 3 months"}
                    </p>
                  </div>

                  <Button
                    onClick={handleProceed}
                    className="w-full bg-[#001633] hover:bg-[#002244] text-white py-3"
                  >
                    Proceed to Payment
                  </Button>
                </div>
              )}

              {step === "auth" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Login to Continue</h3>
                    <p className="text-gray-600 text-sm">Bundle: {bundle.name}</p>
                    <p className="text-gray-600 text-sm">Amount: ₹{getPrice()}</p>
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
                  <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
                  <p className="text-gray-600 mb-4">{processingMsg}</p>
                  <p className="text-xs text-gray-500 mb-4">If the Razorpay window is open, you can close it to cancel.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      cancelRequested.current = true
                      setProcessing(false)
                      setStep("plan")
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
                    Your {bundle.name} subscription has been activated successfully!
                  </p>
                  <Button
                    onClick={() => {
                      handleClose()
                      router.push('/dashboard')
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 mb-4"
                  >
                    Continue to Dashboard
                  </Button>
                  
                  {/* Telegram Links Section */}
                  {telegramLinks && telegramLinks.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-800 mb-3">
                        Join Your Telegram Groups:
                      </h4>
                      <div className="space-y-2">
                        {telegramLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link.invite_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
                          >
                            Join Telegram Group {index + 1}
                          </a>
                        ))}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        Click the links above to join your exclusive Telegram groups
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
  )
}