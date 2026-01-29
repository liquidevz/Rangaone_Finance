// components/cart-auth-form.tsx
"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Shield, Phone, Calendar, FileText } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { authService } from "@/services/auth.service";
import { emailCheckService } from "@/services/email-check.service";
import { userService } from "@/services/user.service";
import { generateUsernameFromParts } from "@/lib/username-generator";
import { useToast } from "@/components/ui/use-toast";

interface CartAuthFormProps {
  onAuthSuccess: () => void;
  onPaymentTrigger: () => void;
  cartTotal: number;
  cartItemCount: number;
}

const CartAuthForm: React.FC<CartAuthFormProps> = ({ onAuthSuccess, onPaymentTrigger, cartTotal, cartItemCount }) => {
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(isAuthenticated ? 1 : 0);
  const [isSignupMode, setIsSignupMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    state: ""
  });

  // Indian states list
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh", "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
  ];

  // Get full name from parts
  const getFullName = (): string => {
    const parts = [formData.firstName, formData.middleName, formData.lastName]
      .filter(part => part.trim())
      .map(part => part.trim());
    return parts.join(" ");
  };

  // Get generated username for display
  const generatedUsername = formData.firstName && formData.lastName 
    ? generateUsernameFromParts(formData.firstName, formData.lastName, formData.middleName)
    : "";
  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
    dateofBirth: "",
    pandetails: "",
    address: "",
    adharcard: ""
  });
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login } = useAuth();
  const { toast } = useToast();

  // Debug effect
  useEffect(() => {
  }, [isSignupMode, formData.email]);

  const steps = ["Authentication", "Aadhaar eSign", "Payment", "Complete Profile"];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };



  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (isSignupMode) {
        if (!formData.firstName.trim()) {
          newErrors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = "Last name is required";
        }
        if (!formData.email.trim()) {
          newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Please enter a valid email";
        }
        if (!formData.phone.trim()) {
          newErrors.phone = "Phone is required";
        }
        if (!formData.dateOfBirth) {
          newErrors.dateOfBirth = "Date of birth is required";
        }
        if (!formData.state.trim()) {
          newErrors.state = "State is required";
        }
        if (!formData.password) {
          newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
      } else {
        if (!formData.username.trim()) {
          newErrors.username = "Email, phone, or username is required";
        }
        if (!formData.password) {
          newErrors.password = "Password is required";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      return await emailCheckService.checkEmailExists(email);
    } catch (error) {
      console.error('Error checking email:', error);
      // Fallback to login-based check
      try {
        return await emailCheckService.checkEmailExistsByLogin(email);
      } catch (fallbackError) {
        console.error('Fallback email check also failed:', fallbackError);
        return false;
      }
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep === 0) {
      setLoading(true);
      try {
        if (isSignupMode) {
          // Generate username and full name
          const generatedUsername = generateUsernameFromParts(
            formData.firstName, 
            formData.lastName, 
            formData.middleName
          );
          const fullName = getFullName();
          
          const signupData = {
            username: generatedUsername,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            fullName: fullName,
            dateOfBirth: formData.dateOfBirth,
            state: formData.state
          };
          
          
          // Signup first
          await authService.signup(signupData);
          // Then automatically login with the generated username
          await login(generatedUsername, formData.password, formData.rememberMe);
        } else {
          // Try login first
          try {
            await login(formData.username, formData.password, formData.rememberMe);
          } catch (loginError: any) {
            const isEmail = /\S+@\S+\.\S+/.test(formData.username);
            const errorMessage = loginError.message || loginError.toString();
            
            // If it's an email and login fails, switch to signup mode
            if (isEmail) {
              const email = formData.username;
              setFormData({ 
                username: "", 
                email: email, 
                phone: "",
                password: formData.password, 
                confirmPassword: formData.password, 
                rememberMe: false 
              });
              setIsSignupMode(true);
              setErrors({});
              setLoading(false);
              return;
            } else {
              throw loginError;
            }
          }
        }
        // Load profile and check for missing fields
        try {
          const profile = await userService.getProfile();
          const missing = profile.missingFields || [];
          setMissingFields(missing);
          setProfileData({
            fullName: profile.fullName || "",
            phone: profile.phone || "",
            dateofBirth: profile.dateofBirth || "",
            pandetails: profile.pandetails || "",
            address: profile.address || "",
            adharcard: profile.adharcard || ""
          });
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
        // Trigger auth success callback to proceed to PAN verification
        onAuthSuccess();
      } catch (error: any) {
        setErrors({ general: error.message || "Authentication failed" });
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 1) {
      // Digio Verification - proceed to payment
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Payment - check if profile is complete
      if (missingFields.length > 0) {
        setCurrentStep(3); // Go to profile completion
      } else {
        // Profile complete, close modal and trigger payment
        onAuthSuccess();
        setTimeout(() => {
          onPaymentTrigger();
        }, 100);
      }
    } else if (currentStep === 3) {
      // Complete Profile - validate and save
      const missingFieldsToFill = missingFields.filter(field => {
        const value = profileData[field as keyof typeof profileData];
        return !value || value.trim() === '';
      });

      if (missingFieldsToFill.length > 0) {
        setErrors({ general: `Please fill in all required fields: ${missingFieldsToFill.join(', ')}` });
        return;
      }

      try {
        setLoading(true);
        await userService.updateProfile(profileData);
        toast({
          title: "Profile Updated",
          description: "Your profile has been completed successfully"
        });
        // Profile complete, close modal and trigger payment
        onAuthSuccess();
        setTimeout(() => {
          onPaymentTrigger();
        }, 100);
      } catch (error: any) {
        setErrors({ general: error.message || "Failed to update profile" });
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleAuthMode = () => {
    setIsSignupMode(!isSignupMode);
    setShowPassword(false);
    setShowConfirmPassword(false);
    if (!isSignupMode) {
      // Switching to signup, preserve email if it's an email
      const preserveEmail = /\S+@\S+\.\S+/.test(formData.username);
      setFormData({
        username: "",
        email: preserveEmail ? formData.username : "",
        phone: "",
        password: "",
        confirmPassword: "",
        rememberMe: false
      });
    } else {
      // Switching to login, clear all
      setFormData({
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        rememberMe: false,
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: "",
        state: ""
      });
    }
    setErrors({});
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Authentication (merged login/signup)
        if (isSignupMode) {
          return (
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleAuthMode}
                  className="text-sm"
                >
                  Login if existing user
                </Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Creating account</span>
                </p>
              </div>
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="middleName" className="text-sm font-medium">Middle Name (Optional)</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="middleName"
                    type="text"
                    placeholder="Enter your middle name"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange("middleName", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                {generatedUsername && (
                  <p className="text-xs text-gray-500 mt-1">
                    Username: <span className="font-medium">{generatedUsername}</span>
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min. 6 characters)"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
              <div>
                <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
              </div>
              <div>
                <Label htmlFor="state" className="text-sm font-medium">State</Label>
                <div className="relative mt-1">
                  <select
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select your state</option>
                    {indianStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium">Email, Phone, or Username</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your email, phone, or username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  We'll automatically detect if you need to sign up or sign in
                </p>
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
            </div>
          );
        }
      case 1: // Digio Verification
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Aadhaar eSign Required</h3>
            <p className="text-gray-600">Complete Aadhaar-based digital signature for payment authorization</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Secure Aadhaar Verification</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">Your Aadhaar will be used for secure digital signing</p>
            </div>
          </div>
        );
      case 2: // Payment
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Processing Payment</h3>
            <p className="text-gray-600">Completing your purchase...</p>
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{cartItemCount} item(s) in cart</span>
                <span className="font-semibold">₹{cartTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      case 3: // Complete Profile
        if (missingFields.length === 0) {
          return (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Profile Complete!</h3>
              <p className="text-gray-600">All required fields have been filled</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Complete your profile to continue</span>
              </p>
            </div>
            {missingFields.map((field) => {
              switch (field) {
                case "fullName":
                  return (
                    <div key={field}>
                      <Label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium">
                        <User className="w-4 h-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Enter your full name"
                        className="mt-1"
                      />
                    </div>
                  );
                case "phone":
                  return (
                    <div key={field}>
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="w-4 h-4" />
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1234567890"
                        className="mt-1"
                      />
                    </div>
                  );
                case "dateofBirth":
                  return (
                    <div key={field}>
                      <Label htmlFor="dateofBirth" className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="w-4 h-4" />
                        Date of Birth *
                      </Label>
                      <Input
                        id="dateofBirth"
                        type="date"
                        value={profileData.dateofBirth}
                        onChange={(e) => setProfileData(prev => ({ ...prev, dateofBirth: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  );
                case "pandetails":
                  return (
                    <div key={field}>
                      <Label htmlFor="pandetails" className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="w-4 h-4" />
                        PAN Details *
                      </Label>
                      <Input
                        id="pandetails"
                        value={profileData.pandetails}
                        onChange={(e) => setProfileData(prev => ({ ...prev, pandetails: e.target.value }))}
                        placeholder="AAAAA9999A"
                        className="mt-1"
                      />
                    </div>
                  );
                case "address":
                  return (
                    <div key={field}>
                      <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="w-4 h-4" />
                        Address *
                      </Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter your address"
                        className="mt-1"
                      />
                    </div>
                  );
                case "adharcard":
                  return (
                    <div key={field}>
                      <Label htmlFor="adharcard" className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="w-4 h-4" />
                        Aadhaar Card Number *
                      </Label>
                      <Input
                        id="adharcard"
                        value={profileData.adharcard}
                        onChange={(e) => setProfileData(prev => ({ ...prev, adharcard: e.target.value }))}
                        placeholder="XXXX-XXXX-XXXX"
                        className="mt-1"
                      />
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between gap-3">
            {steps.map((step, index) => {
              const isActive = index <= currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <React.Fragment key={index}>
                  <div className="relative">
                    <div
                      className={`w-8 h-8 flex items-center justify-center shrink-0 border-2 rounded-full font-semibold text-xs relative z-10 transition-colors duration-300 ${
                        isActive
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-gray-300 text-gray-300"
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {isCompleted ? (
                          <motion.svg
                            key="check"
                            stroke="currentColor"
                            fill="currentColor"
                            strokeWidth="0"
                            viewBox="0 0 16 16"
                            height="1em"
                            width="1em"
                            xmlns="http://www.w3.org/2000/svg"
                            initial={{ rotate: 180, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -180, opacity: 0 }}
                            transition={{ duration: 0.125 }}
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"></path>
                          </motion.svg>
                        ) : (
                          <motion.span
                            key="number"
                            initial={{ rotate: 180, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -180, opacity: 0 }}
                            transition={{ duration: 0.125 }}
                          >
                            {index + 1}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    {isActive && (
                      <div className="absolute z-0 -inset-1.5 bg-indigo-100 rounded-full animate-pulse" />
                    )}
                  </div>
                  {index !== steps.length - 1 && (
                    <div className="flex-1 h-1 rounded-full bg-gray-200 relative">
                      <motion.div
                        className="absolute top-0 bottom-0 left-0 bg-indigo-600 rounded-full"
                        animate={{ width: isCompleted ? "100%" : "0%" }}
                        transition={{ ease: "easeIn", duration: 0.3 }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentStep}-${isSignupMode}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Error Display */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0 || loading}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {currentStep === 0 && (isSignupMode ? "Create Account" : "Sign In")}
                  {currentStep === 1 && "Verify"}
                  {currentStep === 2 && (missingFields.length > 0 ? "Continue" : "Pay Now")}
                  {currentStep === 3 && "Complete & Pay"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Toggle Auth Mode */}
          {/* Toggle Auth Mode */}
          <div className="text-center pt-4 border-t">
            {currentStep === 0 && !isSignupMode && (
              <p className="text-sm text-gray-600">
                Don't have an account?
                <button
                  onClick={toggleAuthMode}
                  className="ml-1 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  disabled={loading}
                >
                  Sign up
                </button>
              </p>
            )}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield className="w-3 h-3" />
              <span>Your information is secure and encrypted</span>
            </div>
          </div>
      </div>
    </div>
  );
};

export default CartAuthForm;