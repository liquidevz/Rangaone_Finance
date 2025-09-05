// app/signup/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/components/auth/auth-context";
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, agreeTerms: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Phone required",
        description: "Please enter your phone number.",
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
      // Call the signup API
      const response = await authService.signup({
        username: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      toast({
        title: "Account created successfully!",
        description: response.message || "Please check your email to verify your account, then login.",
      });

      // Store email for auto-filling login form
      sessionStorage.setItem("signupEmail", formData.email.trim());

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
      <div className="hidden lg:flex flex-1 bg-[#001633] items-center justify-center p-8">
        <div className="text-center text-[#FFFFF0]">
          <h1 className="text-4xl font-bold mb-4">
            Join RangaOne Finwala
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Start your journey to financial success with expert portfolio management
          </p>
          <div className="w-64 h-64 bg-white/10 rounded-full mx-auto flex items-center justify-center">
            <span className="text-6xl font-bold">R</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-[#001633] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#FFFFF0] font-bold text-xl">R</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-2 text-gray-600">
              Join thousands of investors who trust us
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                disabled={formLoading}
              />
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
                placeholder="Enter your phone number (e.g., +91-9876543210)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                disabled={formLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (min. 6 characters)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                disabled={formLoading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001633] focus:border-transparent"
                disabled={formLoading}
              />
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
              <Image src="../../google.svg" alt="Google" width={20} height={20} className="mr-2" /> Sign up with Google
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