import { NextRequest, NextResponse } from "next/server";

// Simple in-memory storage for demo (use database in production)
let userProfile = {
  fullName: "John Doe",
  email: "john@example.com", 
  phone: "9876543210",
  dateofBirth: "1990-01-01"
  // pandetails will be added when user updates profile
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.fullName || !body.dateofBirth || !body.phone || !body.pandetails) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    
    // Update the in-memory profile
    userProfile = {
      ...userProfile,
      fullName: body.fullName,
      dateofBirth: body.dateofBirth,
      phone: body.phone,
      pandetails: body.pandetails
    };
    
    // Mock successful update
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: userProfile
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}