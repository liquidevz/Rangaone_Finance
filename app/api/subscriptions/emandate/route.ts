import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productType, productId, planType, couponCode } = body;
    

    
    // Always require eSign for eMandate products to test the enhanced flow
    return NextResponse.json(
      { 
        error: "eSign required for eMandate subscription",
        code: "ESIGN_REQUIRED"
      },
      { status: 412 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create eMandate" },
      { status: 500 }
    );
  }
}