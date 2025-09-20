import { NextRequest, NextResponse } from "next/server";

// This replaces hardcoded coupons with dynamic validation
// You should replace this with actual database/API calls to your coupon system
const VALID_COUPONS = {
  "SAVE20": {
    code: "SAVE20",
    title: "20% Off Premium Bundle",
    description: "Get 20% discount on all premium bundles",
    discountType: "percentage" as const,
    discountValue: 20,
    validFrom: "2025-08-25T12:52:24.186Z",
    validUntil: "2025-12-31T23:59:59.000Z",
    usageLimit: 100,
    remainingUses: 99,
    minOrderValue: 100,
    maxDiscountAmount: 500,
    applicableProducts: {
      applyToAll: true,
      portfolios: [],
      bundles: []
    }
  },
  "WELCOME10": {
    code: "WELCOME10",
    title: "Welcome 10% Off",
    description: "Welcome discount for new users",
    discountType: "percentage" as const,
    discountValue: 10,
    validFrom: "2025-01-01T00:00:00.000Z",
    validUntil: "2025-12-31T23:59:59.000Z",
    usageLimit: 1000,
    remainingUses: 950,
    minOrderValue: 50,
    maxDiscountAmount: 200,
    applicableProducts: {
      applyToAll: true,
      portfolios: [],
      bundles: []
    }
  },
  "FLAT100": {
    code: "FLAT100",
    title: "Flat ₹100 Off",
    description: "Get flat ₹100 discount on orders above ₹500",
    discountType: "fixed" as const,
    discountValue: 100,
    validFrom: "2025-01-01T00:00:00.000Z",
    validUntil: "2025-12-31T23:59:59.000Z",
    usageLimit: 500,
    remainingUses: 450,
    minOrderValue: 500,
    maxDiscountAmount: 100,
    applicableProducts: {
      applyToAll: true,
      portfolios: [],
      bundles: []
    }
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const couponCode = params.code.toUpperCase();
    
    // Check if coupon exists
    const coupon = VALID_COUPONS[couponCode as keyof typeof VALID_COUPONS];
    
    if (!coupon) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: "Invalid coupon code"
      }, { status: 404 });
    }

    // Check if coupon is still valid (date range)
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom || now > validUntil) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: "Coupon has expired or is not yet active"
      }, { status: 400 });
    }

    // Check usage limit
    if (coupon.remainingUses <= 0) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: "Coupon usage limit exceeded"
      }, { status: 400 });
    }

    // Return valid coupon
    return NextResponse.json({
      success: true,
      valid: true,
      message: "Coupon is valid",
      coupon
    });

  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({
      success: false,
      valid: false,
      error: "Failed to validate coupon"
    }, { status: 500 });
  }
}