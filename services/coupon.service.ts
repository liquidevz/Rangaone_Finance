import { get } from "@/lib/axios";

export interface CouponValidationResponse {
  success: boolean;
  valid: boolean;
  message?: string;
  error?: string;
  coupon?: {
    code: string;
    title: string;
    description: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    validFrom: string;
    validUntil: string;
    usageLimit: number;
    remainingUses: number;
    minOrderValue: number;
    maxDiscountAmount: number;
    applicableProducts: {
      applyToAll: boolean;
      portfolios: string[];
      bundles: string[];
    };
  };
}

export const couponService = {
  async validateCoupon(couponCode: string): Promise<CouponValidationResponse> {
    try {
      const response = await get<CouponValidationResponse>(`/api/coupons/check/${couponCode}`);
      return response;
    } catch (error: any) {
      console.error("Coupon validation failed:", error);
      return {
        success: false,
        valid: false,
        error: error.response?.data?.error || "Invalid coupon code"
      };
    }
  },

  calculateDiscount(
    originalAmount: number,
    coupon: CouponValidationResponse["coupon"]
  ): { discountAmount: number; finalAmount: number } {
    if (!coupon) {
      return { discountAmount: 0, finalAmount: originalAmount };
    }

    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
      discountAmount = (originalAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === "fixed") {
      discountAmount = coupon.discountValue;
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);
    return { discountAmount, finalAmount };
  }
};