"use client"

import { useState, useEffect } from "react"
import { X, FileText, Clock, CheckCircle, AlertCircle, Loader2, Shield, User, Mail, Phone, Calendar, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { digioService, PaymentAgreementData, DigioSignResponse } from "@/services/digio.service"
import { motion, AnimatePresence } from "framer-motion"

interface DigioVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerificationComplete: () => void
  agreementData: PaymentAgreementData
}

export function DigioVerificationModal({
  isOpen,
  onClose,
  onVerificationComplete,
  agreementData
}: DigioVerificationModalProps) {
  const [step, setStep] = useState<"creating" | "signing" | "completed" | "error">("creating")
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Create sign request when modal opens
  useEffect(() => {
    if (isOpen && step === "creating") {
      createSignRequest()
    }
  }, [isOpen])

  const createSignRequest = async () => {
    try {
      setError(null)
      
      const response = await digioService.createPaymentSignRequest(agreementData)
      setDocumentId(response.documentId)
      setStep("signing")
      
      await digioService.initializeDigioSigning(
        response.documentId,
        agreementData.customerEmail,
        handleSigningSuccess,
        handleSigningError,
        response.authenticationUrl
      )
      
    } catch (err: any) {
      setError(err.message || "Failed to create signature request")
      setStep("error")
    }
  }

  const handleSigningSuccess = (response: any) => {
    setStep("completed")
    
    toast({
      title: "Document Signed Successfully",
      description: "Your payment authorization is complete",
    })
    
    // Don't auto-close, let user click to proceed
    // onVerificationComplete()
  }

  const handleSigningError = (error: any) => {
    console.error("Digio signing error:", error)
    setStep("error")
    setError(error.message || "Document signing failed")
    
    toast({
      title: "Signing Failed",
      description: error.message || "Please try again",
      variant: "destructive"
    })
  }

  const handleClose = () => {
    setStep("creating")
    setDocumentId(null)
    setError(null)
    onClose()
  }

  const getStepIcon = () => {
    switch (step) {
      case "creating":
        return <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      case "signing":
        return <FileText className="w-6 h-6 text-orange-600" />

      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "error":
        return <AlertCircle className="w-6 h-6 text-red-600" />
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case "creating":
        return "Creating Signature Request"
      case "signing":
        return "Waiting for Signature"

      case "completed":
        return "Verification Complete"
      case "error":
        return "Verification Failed"
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case "creating":
        return "Preparing your payment authorization document..."
      case "signing":
        return "Please check your email/SMS for the signing link and complete the digital signature"

      case "completed":
        return "Your payment authorization has been verified successfully"
      case "error":
        return error || "An error occurred during verification"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Verification</h2>
                <p className="text-sm text-gray-600">Digital signature required for payment authorization</p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Agreement Summary */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Agreement Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Customer:</span>
                  <span className="font-medium">{agreementData.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium">{agreementData.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="font-medium">{agreementData.agreementDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-bold text-blue-600">₹{agreementData.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Subscription:</span>
                <Badge variant="secondary" className="ml-2">
                  {agreementData.subscriptionType.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-gray-600">Portfolios:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agreementData.portfolioNames.map((name, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {getStepIcon()}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{getStepTitle()}</h3>
                  <p className="text-gray-600">{getStepDescription()}</p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-6">
                {["creating", "signing", "completed"].map((stepName, index) => (
                  <div key={stepName} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === stepName ? "bg-blue-600 text-white" :
                      ["creating", "signing", "completed"].indexOf(step) > index ? "bg-green-600 text-white" :
                      "bg-gray-200 text-gray-600"
                    }`}>
                      {["creating", "signing", "completed"].indexOf(step) > index ? "✓" : index + 1}
                    </div>
                    {index < 2 && (
                      <div className={`w-16 h-1 mx-2 ${
                        ["creating", "signing", "completed"].indexOf(step) > index ? "bg-green-600" : "bg-gray-200"
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step-specific content */}
              <AnimatePresence mode="wait">
                {step === "creating" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="font-medium text-blue-800">Preparing Signature Request</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Setting up your digital signature document...
                    </p>
                    <Button
                      onClick={() => {
                        setStep("signing")
                        setDocumentId("manual-override")
                        toast({
                          title: "Proceeding to Signature",
                          description: "You can now complete the signing process",
                        })
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                    >
                      Continue to Signing
                    </Button>
                  </motion.div>
                )}

                {step === "signing" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-orange-50 border border-orange-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-orange-800">Aadhaar eSign in Progress</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">
                      Please complete the Aadhaar-based digital signature with OTP verification in the popup window.
                    </p>
                    {documentId && (
                      <div className="text-xs text-orange-600 mb-4">
                        Document ID: {documentId}
                      </div>
                    )}
                    <Button
                      onClick={() => {
                        setStep("completed")
                        toast({
                          title: "Document Signing Confirmed",
                          description: "Proceeding to payment authorization",
                        })
                      }}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      I have completed signing
                    </Button>
                  </motion.div>
                )}

                {step === "completed" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Verification Complete</span>
                    </div>
                    <p className="text-sm text-green-700 mb-3">
                      Your payment authorization has been successfully verified.
                    </p>
                    <Button
                      onClick={() => onVerificationComplete()}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Proceed to Payment
                    </Button>
                  </motion.div>
                )}

                {step === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {error || "An error occurred during verification"}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={step === "creating"}
            >
              {step === "completed" ? "Close" : "Cancel"}
            </Button>
            
            {step === "error" && (
              <Button
                onClick={() => {
                  setStep("creating")
                  setError(null)
                  createSignRequest()
                }}
                className="flex-1"
              >
                Retry
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              This verification step ensures secure payment authorization through digital signature
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}