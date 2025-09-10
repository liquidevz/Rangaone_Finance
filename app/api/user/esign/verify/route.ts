import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: "DID token is required" },
        { status: 400 }
      );
    }
    
    // Mock eSign verification
    if (token.startsWith('DID')) {
      return NextResponse.json({
        success: true,
        message: "eSign verified successfully"
      });
    }
    
    return NextResponse.json(
      { error: "Invalid DID token" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "eSign verification failed" },
      { status: 500 }
    );
  }
}