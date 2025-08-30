"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-context"
import { useRouter } from "next/navigation"
import { paymentService } from "@/services/payment.service"
import CartAuthForm from "@/components/cart-auth-form"
import { usePayment } from "@/components/payment/simple-payment-context"

export function SimplePaymentModal() {
  const [subscriptionType, setSubscriptionType] = useState<"monthly" | "yearly">("monthly")
  const [processing, setProcessing] = useState(false)
  const [processingMsg, setProcessingMsg] = useState("")
  const cancelRequested = useRef(false)
  
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { state, closeModal, setStep } = usePayment()

  const { selectedBundle: bundle, modalStep: step } = state
  const isEmandateFlow = state.selectedPlan === "monthlyEmandate"

  const getPrice = () => {
    if (!bundle || !state.selectedPlan) return 0
    
    switch (state.selectedPlan) {
      case "monthlyEmandate":
        return (bundle as any).monthlyemandateprice || bundle.monthlyPrice || 0
      case "yearly":
        return bundle.yearlyPrice || 0
      default:
        return bundle.monthlyPrice || 0
    }
  }

  const handleClose = () => {
    setProcessing(false)
    closeModal()
  }

  const handleProceed = async () => {
    if (!bundle) return

    if (!isAuthenticated) {
      setStep("auth")
      return
    }

    await handlePaymentFlow()
  }

  const handleAuthSuccess = async () => {
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
        const emandateAmount = getPrice()

        const emandate = await paymentService.createEmandate({
          productType: "Bundle",
          productId: bundle._id,
          planType: subscriptionType,
          subscriptionType: (bundle.category as any) || "premium",
          amount: emandateAmount,
          items: [{
            productType: "Bundle",
            productId: bundle._id,
            planType: subscriptionType,
            amount: emandateAmount,
          }],
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

  if (!state.isModalOpen || !bundle) return null

  return (
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
          className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold">
              {step === "success" ? "Payment Successful!" : 
               step === "error" ? "Payment Failed" :
               step === "processing" ? "Processing Payment" :
               step === "auth" ? "Login Required" :
               "Confirm Purchase"}
            </h2>
            <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {step === "plan" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{bundle.name}</h3>
                  <p className="text-gray-600">₹{getPrice()}</p>
                </div>

                <Button onClick={handleProceed} className="w-full">
                  Proceed to Payment
                </Button>
              </div>
            )}

            {step === "auth" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Login to Continue</h3>
                  <p className="text-gray-600">Amount: ₹{getPrice()}</p>
                </div>
                <CartAuthForm 
                  onAuthSuccess={handleAuthSuccess}
                  onPaymentTrigger={handlePaymentFlow}
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
                <h3 className="text-lg font-semibold mb-2 text-green-800">Payment Successful!</h3>
                <p className="text-gray-600 mb-6">Your subscription has been activated!</p>
                <Button
                  onClick={() => {
                    handleClose()
                    router.push('/dashboard')
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
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
                <p className="text-gray-600 mb-6">Something went wrong. Please try again.</p>
                <div className="space-y-2">
                  <Button onClick={() => setStep("plan")} className="w-full">Try Again</Button>
                  <Button onClick={handleClose} variant="outline" className="w-full">Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}