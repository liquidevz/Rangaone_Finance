import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_no, name, dob } = body;

    // Validate required fields
    if (!id_no || !name || !dob) {
      return NextResponse.json(
        { 
          success: false,
          code: "INVALID_INPUT",
          message: "PAN number, name, and date of birth are required" 
        },
        { status: 400 }
      );
    }

    // Validate PAN format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(id_no)) {
      return NextResponse.json({
        success: false,
        code: "INVALID_PAN_FORMAT",
        message: "The provided PAN number has an invalid format."
      });
    }

    // Validate DOB format (DD/MM/YYYY)
    const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dobRegex.test(dob)) {
      return NextResponse.json({
        success: false,
        code: "INVALID_DOB_FORMAT",
        message: "Date of birth must be in DD/MM/YYYY format",
        details: "INVALID_DOB_FORMAT"
      });
    }

    // For testing, return success for valid format
    return NextResponse.json({
      success: true,
      message: "PAN verification successful",
      data: {
        pan: id_no,
        name: name,
        verified: true
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        message: "Internal server error during PAN verification" 
      },
      { status: 500 }
    );
  }
}