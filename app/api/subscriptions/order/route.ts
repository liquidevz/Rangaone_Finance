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
    
    // Always require eSign for all products to test the enhanced flow
    return NextResponse.json(
      { 
        error: "eSign required for this product",
        code: "ESIGN_REQUIRED"
      },
      { status: 412 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}