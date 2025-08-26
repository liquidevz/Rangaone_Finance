"use client"

import { useState } from "react"
import { X, FileText, Clock, CheckCircle, AlertCircle, Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { digioEmandateService, EmandateData } from "@/services/digio-emandate.service"
import { motion, AnimatePresence } from "framer-motion"

interface DigioEmandateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (documentId: string) => void
  emandateData: EmandateData
}

export function DigioEmandateModal({
  isOpen,
  onClose,
  onSuccess,
  emandateData
}: DigioEmandateModalProps) {
  const [step, setStep] = useState<"creating" | "signing" | "completed" | "error">("creating")
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleStartEmandate = async () => {
    try {
      setError(null)
      
      await digioEmandateService.completeEmandateWorkflow(
        emandateData,
        (step, data) => {
          switch (step) {
            case 'creating':
              setStep('creating')
              break
            case 'signing':
              setStep('signing')
              setDocumentId(data?.documentId || null)
              toast({
                title: "E-mandate Created",
                description: "Please complete the signing process"
              })
              break
            case 'completed':
              setStep('completed')
              toast({
                title: "E-mandate Signed Successfully",
                description: "Your payment authorization is now active"
              })
              setTimeout(() => onSuccess(documentId!), 2000)
              break
            case 'error':
              setStep('error')
              setError(data?.message || 'An error occurred')
              toast({
                title: "E-mandate Failed",
                description: data?.message || "Please try again",
                variant: "destructive"
              })
              break
          }
        }
      )
    } catch (err: any) {
      setStep('error')
      setError(err.message)
    }
  }

  const handleClose = () => {
    setStep('creating')
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
        return "Creating E-mandate"
      case "signing":
        return "Waiting for Signature"
      case "completed":
        return "E-mandate Complete"
      case "error":
        return "E-mandate Failed"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold">E-mandate Authorization</h2>
                <p className="text-sm text-gray-600">Digital signature for automatic payments</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* E-mandate Details */}
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Authorization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{emandateData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{emandateData.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-blue-600">₹{emandateData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <Badge variant="secondary">{emandateData.subscriptionType}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {getStepIcon()}
                <div>
                  <h3 className="font-semibold">{getStepTitle()}</h3>
                  <p className="text-sm text-gray-600">
                    {step === "creating" && "Preparing your e-mandate document..."}
                    {step === "signing" && "Complete the Aadhaar eSign process"}
                    {step === "completed" && "E-mandate successfully authorized"}
                    {step === "error" && (error || "An error occurred")}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
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

              {documentId && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Document ID: {documentId}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={step === "creating"}
            >
              {step === "completed" ? "Close" : "Cancel"}
            </Button>
            
            {step === "creating" && (
              <Button onClick={handleStartEmandate} className="flex-1">
                Start E-mandate
              </Button>
            )}
            
            {step === "error" && (
              <Button onClick={handleStartEmandate} className="flex-1">
                Retry
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Session expires in 30 minutes if not completed
          </p>
        </div>
      </motion.div>
    </div>
  )
}