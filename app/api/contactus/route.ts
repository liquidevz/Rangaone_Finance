import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 422 }
      );
    }

    // Forward to external API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contactus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 400) {
        return NextResponse.json(
          { error: errorData.error || 'All fields are required' },
          { status: 400 }
        );
      } else if (response.status === 422) {
        return NextResponse.json(
          { error: errorData.error || 'Invalid email format' },
          { status: 422 }
        );
      } else {
        return NextResponse.json(
          { error: 'Failed to send contact us message' },
          { status: 500 }
        );
      }
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Failed to send contact us message' },
      { status: 500 }
    );
  }
}