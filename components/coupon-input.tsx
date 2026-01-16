"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Loader2 } from "lucide-react";
import { couponService, type CouponValidationResponse } from "@/services/coupon.service";

interface CouponInputProps {
  onCouponApplied: (coupon: CouponValidationResponse["coupon"] | null) => void;
  originalAmount: number;
  disabled?: boolean;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  onCouponApplied,
  originalAmount,
  disabled = false
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse["coupon"] | null>(null);
  const [error, setError] = useState("");

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidating(true);
    setError("");

    try {
      const response = await couponService.validateCoupon(couponCode.trim());

      if (response.success && response.valid && response.coupon) {
        // Check minimum order value
        if (response.coupon.minOrderValue > 0 && originalAmount < response.coupon.minOrderValue) {
          setError(`Minimum order value of ₹${response.coupon.minOrderValue} required for this coupon`);
          return;
        }

        setAppliedCoupon(response.coupon);
        onCouponApplied(response.coupon);
        setError("");
      } else {
        setError(response.error || "Invalid coupon code");
        setAppliedCoupon(null);
        onCouponApplied(null);
      }
    } catch (err) {
      setError("Failed to validate coupon");
      setAppliedCoupon(null);
      onCouponApplied(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setError("");
    onCouponApplied(null);
  };

  const handleClearCoupon = () => {
    setCouponCode("");
    setError("");
  };

  const { discountAmount, finalAmount } = appliedCoupon
    ? couponService.calculateDiscount(originalAmount, appliedCoupon)
    : { discountAmount: 0, finalAmount: originalAmount };

  return (
    <div className="space-y-3">
      {!appliedCoupon ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={disabled || isValidating}
              className="pr-8"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleApplyCoupon();
                }
              }}
            />
            {couponCode && (
              <button
                onClick={handleClearCoupon}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleApplyCoupon}
            disabled={disabled || isValidating || !couponCode.trim()}
            variant="outline"
            className="px-6"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Apply"
            )}
          </Button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <div>
                <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                <p className="text-sm text-green-600">{appliedCoupon.title}</p>
              </div>
            </div>
            <Button
              onClick={handleRemoveCoupon}
              variant="destructive"
              size="sm"
              className="h-8 px-3"
            >
              Remove
            </Button>
          </div>

          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Original Amount:</span>
              <span>₹{originalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Discount ({appliedCoupon.discountType === "percentage" ? `${appliedCoupon.discountValue}%` : `₹${appliedCoupon.discountValue}`}):</span>
              <span>-₹{discountAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-green-800 border-t border-green-200 pt-1">
              <span>Final Amount:</span>
              <span>₹{finalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};