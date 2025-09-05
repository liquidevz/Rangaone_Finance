"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/auth-context";
import { ShoppingCart, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItemCount: number;
  cartTotal: number;
  onSuccessfulAuth?: () => void;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  cartItemCount,
  cartTotal,
  onSuccessfulAuth
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });

  const { login } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Handle login
        await login(formData.email, formData.password);
        toast({
          title: "Welcome back!",
          description: "Your cart items will be transferred to your account.",
        });
      } else {
        // Handle signup
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Password Mismatch",
            description: "Please ensure your passwords match.",
            variant: "destructive",
          });
          return;
        }

        // Redirect to signup page with cart preservation
        toast({
          title: "Redirecting to Signup",
          description: "Your cart items will be saved when you create your account.",
        });
        
        // Close modal and redirect to signup page
        onClose();
        window.location.href = "/signup";
      }

      // Call success callback and close modal
      onSuccessfulAuth?.();
      onClose();
    } catch (error: any) {
      toast({
        title: isLogin ? "Login Failed" : "Signup Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: ""
    });
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
    setShowPassword(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Complete Your Purchase
          </DialogTitle>
          <DialogDescription>
            You have {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} worth ₹{cartTotal.toFixed(2)} in your cart. 
            Please sign in or create an account to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Why create an account?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Save your cart items across devices</li>
              <li>• Track your subscription and orders</li>
              <li>• Get personalized recommendations</li>
              <li>• Access exclusive member benefits</li>
            </ul>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required={!isLogin}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required={!isLogin}
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">{isLogin ? "Email, Phone, or Username" : "Email Address"}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type={isLogin ? "text" : "email"}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="pl-10"
                  placeholder={isLogin ? "Enter email, phone, or username" : "your@email.com"}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  className="pl-10 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required={!isLogin}
                    className="pl-10"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-[#FFFFF0] py-3"
              disabled={loading}
            >
              {loading 
                ? "Processing..." 
                : isLogin 
                  ? "Sign In & Continue" 
                  : "Create Account & Continue"
              }
            </Button>
          </form>

          <div className="text-center">
            <Separator className="my-4" />
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={switchMode}
                className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {isLogin ? "Create Account" : "Sign In"}
              </button>
            </p>
          </div>

          {/* Alternative Options */}
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800"
            >
              Continue browsing instead
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 