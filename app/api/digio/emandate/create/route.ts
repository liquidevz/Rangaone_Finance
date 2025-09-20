import { NextRequest, NextResponse } from 'next/server';

const DIGIO_BASE_URL = process.env.DIGIO_ENVIRONMENT === 'sandbox' 
  ? 'https://ext.digio.in:444' 
  : process.env.DIGIO_BASE_URL || 'https://api.digio.in';
const DIGIO_CLIENT_ID = process.env.DIGIO_CLIENT_ID;
const DIGIO_CLIENT_SECRET = process.env.DIGIO_CLIENT_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!DIGIO_CLIENT_ID || !DIGIO_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Digio credentials not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { customerName, customerEmail, customerMobile, amount, subscriptionType, couponCode } = body;
    
    console.log("📦 Digio eMandate creation:", {
      customerName,
      customerEmail,
      amount,
      subscriptionType,
      couponCode: couponCode || "none"
    });

    // Create e-mandate document
    const emandatePayload = {
      file_name: `EMandate_${Date.now()}.pdf`,
      file_data: await generateEmandatePDF({ customerName, customerEmail, customerMobile, amount, subscriptionType, couponCode }),
      signers: [{
        identifier: customerEmail,
        name: customerName,
        reason: "E-mandate authorization for subscription payments"
      }],
      expire_in_days: 7,
      display_on_page: "last",
      notify_signers: true,
      send_sign_link: true
    };

    const credentials = Buffer.from(`${DIGIO_CLIENT_ID}:${DIGIO_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${DIGIO_BASE_URL}/v2/client/document/uploadpdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emandatePayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Digio API error: ${errorText}` },
        { status: response.status }
      );
    }

    const digioResponse = await response.json();
    
    return NextResponse.json({
      sessionId: digioResponse.access_token || digioResponse.id,
      documentId: digioResponse.id,
      authenticationUrl: digioResponse.signing_parties?.[0]?.sign_url || null,
      status: digioResponse.agreement_status,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    });

  } catch (error) {
    console.error('Error creating e-mandate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateEmandatePDF(data: any): Promise<string> {
  const response = await fetch('https://s3.eu-north-1.amazonaws.com/rangaone.finance/DIgio_Documentation/aadhaar_esign_consent.pdf');
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}