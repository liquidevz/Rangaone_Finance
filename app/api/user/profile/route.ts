import { NextRequest, NextResponse } from "next/server";

// Simple in-memory storage for demo (use database in production)
let userProfile = {
  fullName: "John Doe",
  email: "john@example.com", 
  phoneNumber: "9876543210",
  dateOfBirth: "1990-01-01",
  state: "Maharashtra",
  panNumber: "ABCDE1234F"
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
    if (!body.fullName || !body.dateOfBirth || !body.phoneNumber || !body.panNumber || !body.state) {
      return NextResponse.json(
        { error: "All fields are required: fullName, dateOfBirth, phoneNumber, panNumber, state" },
        { status: 400 }
      );
    }
    
    // Update the in-memory profile
    userProfile = {
      ...userProfile,
      fullName: body.fullName,
      dateOfBirth: body.dateOfBirth,
      phoneNumber: body.phoneNumber,
      panNumber: body.panNumber,
      state: body.state
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