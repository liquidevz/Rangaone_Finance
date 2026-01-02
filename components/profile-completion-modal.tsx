"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { userService, UserProfile } from "@/services/user.service"
import { useAuth } from "@/components/auth/auth-context"
import { User, Phone, FileText, ArrowRight, Shield, CheckCircle, Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { digioPanService } from "@/services/digio-pan.service"

interface ProfileCompletionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProfileComplete: () => void
  forceOpen?: boolean
}

export function ProfileCompletionModal({ open, onOpenChange, onProfileComplete, forceOpen = false }: ProfileCompletionModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    pandetails: "",
    dateofBirth: ""
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [panVerified, setPanVerified] = useState(false)
  const [verifyingPan, setVerifyingPan] = useState(false)
  const { toast } = useToast()
  const { refreshUser } = useAuth()

  useEffect(() => {
    if (open) {
      loadProfile()
    }
  }, [open])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await userService.getProfile()
      setProfile(profileData)
      setFormData({
        fullName: profileData.fullName || "",
        phone: profileData.phone || "",
        pandetails: profileData.pandetails || "",
        dateofBirth: profileData.dateofBirth || ""
      })
    } catch (error) {
      console.error("ProfileCompletionModal - failed to load profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const validatePAN = (pan: string): boolean => {
    return digioPanService.validatePanFormat(pan);
  };

  const verifyPanWithDigio = async () => {
    if (!formData.pandetails || !formData.fullName || !formData.dateofBirth) {
      toast({
        title: "Missing Information",
        description: "Please fill in PAN, full name, and date of birth for verification",
        variant: "destructive"
      });
      return;
    }

    if (!validatePAN(formData.pandetails)) {
      toast({
        title: "Invalid PAN Format",
        description: "Please enter a valid PAN number",
        variant: "destructive"
      });
      return;
    }

    try {
      setVerifyingPan(true);
      const dobFormatted = digioPanService.formatDateForApi(new Date(formData.dateofBirth));
      
      const response = await digioPanService.verifyPan({
        id_no: formData.pandetails,
        name: formData.fullName,
        dob: dobFormatted
      });

      if (response.success) {
        setPanVerified(true);
        toast({
          title: "PAN Verified",
          description: "Your PAN details have been successfully verified"
        });
      } else {
        toast({
          title: "Verification Failed",
          description: response.message || "PAN verification failed",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify PAN. Please try again.",
        variant: "destructive"
      });
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your full name",
        variant: "destructive"
      });
      return;
    }

    if (!formData.pandetails.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your PAN card number",
        variant: "destructive"
      });
      return;
    }

    if (!formData.dateofBirth.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your date of birth",
        variant: "destructive"
      });
      return;
    }

    if (!validatePAN(formData.pandetails)) {
      toast({
        title: "Invalid PAN Format",
        description: "PAN must be in format: AAAAA0578L (5 letters, 4 numbers, 1 letter)",
        variant: "destructive"
      });
      return;
    }

    if (!panVerified) {
      toast({
        title: "PAN Verification Required",
        description: "Please verify your PAN card details before proceeding",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive"
      });
      return;
    }



    try {
      setSaving(true)
      
      await userService.updateProfile(formData)
      await refreshUser() // Refresh auth context
      toast({
        title: "Profile Updated",
        description: "Your profile has been completed successfully"
      })
      onProfileComplete()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false)
    }
  }

  // Auto-verify PAN when valid format is entered
  useEffect(() => {
    if (validatePAN(formData.pandetails)) {
      setPanVerified(true);
    } else {
      setPanVerified(false);
    }
  }, [formData.pandetails]);

  // Format PAN input to enforce correct pattern
  const formatPanInput = (value: string): string => {
    const cleaned = value.replace(/[^A-Z0-9]/g, '');
    let formatted = '';
    
    for (let i = 0; i < cleaned.length && i < 10; i++) {
      if (i < 5) {
        // First 5 positions: only letters
        if (/[A-Z]/.test(cleaned[i])) {
          formatted += cleaned[i];
        }
      } else if (i < 9) {
        // Positions 6-9: only numbers
        if (/[0-9]/.test(cleaned[i])) {
          formatted += cleaned[i];
        }
      } else {
        // Last position: only letter
        if (/[A-Z]/.test(cleaned[i])) {
          formatted += cleaned[i];
        }
      }
    }
    
    return formatted;
  };

  // Get appropriate input mode for mobile keyboards
  const getPanInputMode = (length: number): "text" | "numeric" => {
    if (length < 5) return 'text'; // Letters
    if (length < 9) return 'numeric'; // Numbers
    return 'text'; // Last letter
  };

  // Handle key down for PAN input
  const handlePanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentLength = formData.pandetails.length;
    const key = e.key;
    
    // Allow backspace, delete, arrow keys, tab
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) {
      return;
    }
    
    // Prevent input if max length reached
    if (currentLength >= 10) {
      e.preventDefault();
      return;
    }
    
    // Validate input based on position
    if (currentLength < 5) {
      // First 5 positions: only letters
      if (!/[A-Za-z]/.test(key)) {
        e.preventDefault();
      }
    } else if (currentLength < 9) {
      // Positions 6-9: only numbers
      if (!/[0-9]/.test(key)) {
        e.preventDefault();
      }
    } else {
      // Last position: only letter
      if (!/[A-Za-z]/.test(key)) {
        e.preventDefault();
      }
    }
  };

  // Validate phone number (10 digits only)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  // Handle phone input change (10 digits only)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 10) {
      setFormData(prev => ({ ...prev, phone: value }));
    }
  };

  // Single step completion
  const handleComplete = () => {
    handleSave();
  };
  
  const renderFormContent = () => {
    const missingFields = profile?.missingFields || [];
    
    return (
      <div className="space-y-4">
        {(!formData.fullName || missingFields.includes('fullName')) && (
        <div>
          <Label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium text-gray-700 pb-1">
            <User className="w-4 h-4" />
            Full Name *
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            placeholder="Enter your full name"
            className="focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-indigo-600 focus:bg-indigo-50 transition-colors"
          />
        </div>
        )}

        {(!formData.phone || missingFields.includes('phone')) && (
        <div>
          <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700 pb-1">
            <Phone className="w-4 h-4" />
            Mobile Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value.length <= 10) {
                setFormData(prev => ({ ...prev, phone: value }));
              }
            }}
            placeholder="1234567890"
            inputMode="numeric"
            maxLength={10}
            className="focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-indigo-600 focus:bg-indigo-50 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number</p>
        </div>
        )}
        
        {(!formData.dateofBirth || missingFields.includes('dateofBirth')) && (
        <div>
          <Label htmlFor="dateofBirth" className="flex items-center gap-2 text-sm font-medium text-gray-700 pb-1">
            <Calendar className="w-4 h-4" />
            Date of Birth *
          </Label>
          <Input
            id="dateofBirth"
            type="date"
            value={formData.dateofBirth}
            onChange={(e) => setFormData(prev => ({ ...prev, dateofBirth: e.target.value }))}
            className="focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-indigo-600 focus:bg-indigo-50 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">Required for PAN verification</p>
        </div>
        )}
        
        {(!formData.pandetails || missingFields.includes('pandetails')) && (
        <div>
          <Label htmlFor="pandetails" className="flex items-center gap-2 text-sm font-medium text-gray-700 pb-1">
            <FileText className="w-4 h-4" />
            PAN Card Number *
          </Label>
          <div className="flex gap-2">
            <Input
              id="pandetails"
              value={formData.pandetails}
              onChange={(e) => {
                const formatted = formatPanInput(e.target.value.toUpperCase());
                setFormData(prev => ({ ...prev, pandetails: formatted }));
                setPanVerified(false);
              }}
              onKeyDown={handlePanKeyDown}
              placeholder="AAAAA0578L"
              maxLength={10}
              inputMode={getPanInputMode(formData.pandetails.length)}
              className={`focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-indigo-600 focus:bg-indigo-50 transition-colors ${panVerified ? 'border-green-600 bg-green-50' : ''}`}
              disabled={panVerified}
            />
            {!panVerified && validatePAN(formData.pandetails) && formData.fullName && formData.dateofBirth && (
              <Button
                type="button"
                onClick={verifyPanWithDigio}
                disabled={verifyingPan}
                size="sm"
                className="whitespace-nowrap"
              >
                {verifyingPan ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            )}
            {panVerified && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Verified
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Format: 5 letters, 4 numbers, 1 letter (e.g., AAAAA0578L)</p>
          {panVerified && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              PAN verified successfully with government records
            </p>
          )}
        </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={forceOpen ? () => {} : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Complete Your Profile to Proceed
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">
                Complete your profile to continue using the system
              </p>
            </div>
            
            {/* Form Content */}
            <form onSubmit={(e) => { e.preventDefault(); handleComplete(); }}>
              {renderFormContent()}

              {/* Complete Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saving || !panVerified}
                  className="flex items-center gap-2"
                >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Complete Profile
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}