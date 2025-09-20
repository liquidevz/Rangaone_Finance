"use client"

import { useState, useEffect } from "react"
import { X, FileText, Clock, CheckCircle, AlertCircle, Loader2, Shield, User, Mail, Phone, Calendar, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { digioService, PaymentAgreementData, DigioSignResponse } from "@/services/digio.service"
import { DigioIframeModal } from "@/components/digio-iframe-modal"
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
  const [showIframe, setShowIframe] = useState(false)
  const [digioUrl, setDigioUrl] = useState<string>("")

  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && step === "creating") {
      createSignRequest()
    }
  }, [isOpen])

  const createSignRequest = async () => {
    try {
      const response = await digioService.createPaymentSignRequest(
        agreementData,
        agreementData.productType || "Bundle",
        agreementData.productId || "",
        agreementData.productName || ""
      )
      
      if (response.authenticationUrl) {
        setDigioUrl(response.authenticationUrl)
        setShowIframe(true)
      }
      
    } catch (err: any) {
      console.error('Digio API Error:', err)
      toast({
        title: "Digio Error",
        description: err.message || "Failed to create signature request",
        variant: "destructive"
      })
      onClose()
    }
  }

  const handleClose = () => {
    setShowIframe(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {showIframe && (
        <DigioIframeModal
          isOpen={showIframe}
          onClose={() => setShowIframe(false)}
          onComplete={() => {
            setShowIframe(false)
            onVerificationComplete()
          }}
          digioUrl={digioUrl}
          title="Complete Digio Verification"
        />
      )}
    </>
  )
}