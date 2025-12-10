// app/signup/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/components/auth/auth-context";
import { generateUsernameFromParts } from "@/lib/username-generator";
import { IconEye, IconEyeOff } from "@/components/ui/icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState, useEffect } from "react";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    state: "",
    agreeTerms: false,
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

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Trim spaces for all fields and enforce phone validation
    if (name === "phone") {
      processedValue = value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 10);
    } else {
      processedValue = value.trimStart();
    }
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, agreeTerms: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.firstName.trim()) {
      toast({
        title: "First name required",
        description: "Please enter your first name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: "Last name required",
        description: "Please enter your last name.",
        variant: "destructive",
      });
      return;
    }

    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const phoneTrimmed = formData.phone.trim();
    if (!phoneTrimmed) {
      toast({
        title: "Phone required",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      return;
    }

    if (phoneTrimmed.length !== 10 || !/^\d{10}$/.test(phoneTrimmed)) {
      toast({
        title: "Invalid phone number",
        description: "Phone number must be exactly 10 digits.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.dateOfBirth) {
      toast({
        title: "Date of birth required",
        description: "Please enter your date of birth.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.state.trim()) {
      toast({
        title: "State required",
        description: "Please enter your state.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agreeTerms) {
      toast({
        title: "Terms and Conditions",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);

    try {
      // Generate username and full name
      const generatedUsername = generateUsernameFromParts(
        formData.firstName, 
        formData.lastName, 
        formData.middleName
      );
      const fullName = getFullName();
      
      const response = await authService.signup({
        username: generatedUsername.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        fullName: fullName.trim(),
        dateOfBirth: formData.dateOfBirth,
        state: formData.state.trim(),
      });

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account, then login.",
      });

      // Store email for auto-filling login form
      sessionStorage.setItem("signupEmail", formData.email.trim());
      
      // Check if there was a pending cart action and preserve redirect path
      const redirectPath = sessionStorage.getItem("redirectPath");
      const pendingPortfolioId = sessionStorage.getItem("pendingPortfolioId");
      
      // If there's a pending action, show specific message
      if (pendingPortfolioId && redirectPath === "/cart") {
        toast({
          title: "Account created! Please log in",
          description: "Your account has been created. Please log in to complete adding items to your cart.",
        });
      }

      // Redirect to login page after successful signup
      router.push("/login");
    } catch (error: any) {
      console.error("Signup error:", error);

      let errorMessage = "There was an error creating your account. Please try again.";
      
      if (error?.response?.data?.error) {
        const apiError = error.response.data.error;
        if (apiError.includes("User already exists")) {
          errorMessage = "An account with this email or username already exists. Please try logging in instead.";
        } else if (apiError.includes("Missing required fields")) {
          errorMessage = "Please fill in all required fields.";
        } else {
          errorMessage = apiError;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  // Show loading if authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-20 h-20 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render signup form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image/Branding */}
      <div className="hidden lg:flex flex-1 bg-transparent items-top justify-center p-8 fixed left-0 top-0 bottom-0 w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('/signup-bg.png')" }}>
        <div className="absolute inset-0 bg-transparent"></div>
        <div className="text-center text-[#FFFFF0] relative z-10">
          <h1 className="text-4xl font-bold mb-2">
            Join RangaOne Finance
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Your Growth, Our Priority
          </p>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 lg:ml-[50%] overflow-y-auto flex items-center justify-center p-4 sm:p-8 lg:pt-32 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mx-auto mb-12 lg:-mt-24">
              <Image 
                src="/landing-page/rlogodark.png" 
                alt="RangaOne Logo" 
                width={80}
                height={80}
                priority
              />
              <Image 
                src="/landing-page/namelogodark.png" 
                alt="RangaOne Name" 
                width={180}
                height={180}
                priority
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-2 text-gray-600">
              Join thousands of investors who trust us
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                disabled={formLoading}
              />
            </div>

            <div>
              <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-2">
                Middle Name (Optional)
              </label>
              <Input
                id="middleName"
                name="middleName"
                type="text"
                value={formData.middleName}
                onChange={handleChange}
                placeholder="Enter your middle name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                disabled={formLoading}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                disabled={formLoading}
              />
              {generatedUsername && (
                <p className="text-sm text-gray-500 mt-1">
                  Username will be: <span className="font-medium text-gray-700">{generatedUsername}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                disabled={formLoading}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                disabled={formLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Enter 10 digits only (no country code)</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min. 6 characters)"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                  disabled={formLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={formLoading}
                >
                  {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                  disabled={formLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={formLoading}
                >
                  {showConfirmPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                disabled={formLoading}
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
                id="state"
                name="state"
                required
                value={formData.state}
                onChange={(e) => handleChange(e)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                disabled={formLoading}
              >
                <option value="">Select your state</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeTerms"
                checked={formData.agreeTerms}
                onCheckedChange={handleCheckboxChange}
                disabled={formLoading}
                className="mt-0.5"
              />
              <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                I agree to the{" "}
                <Link href="/terms" className="text-[#001633] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#001633] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={formLoading}
              className="w-full bg-[#001633] hover:bg-[#002244] text-[#FFFFF0] py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </div>
              ) : (
                "Create account"
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Signup */}
            <Button
              type="button"
              onClick={handleGoogleSignup}
              disabled={formLoading}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image src="/google.svg" alt="Google" width={20} height={20} className="mr-2" /> Sign up with Google
            </Button>
            {/* Login link */}
            <div className="text-center">
              <span className="text-gray-600">Already have an account? </span>
              <Link
                href="/login"
                className="text-[#001633] hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}