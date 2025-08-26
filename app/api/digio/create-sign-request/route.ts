import { NextRequest, NextResponse } from 'next/server';

const DIGIO_BASE_URL = process.env.DIGIO_ENVIRONMENT === 'sandbox' 
  ? 'https://ext.digio.in:444' 
  : process.env.DIGIO_BASE_URL || 'https://api.digio.in';
const DIGIO_CLIENT_ID = process.env.DIGIO_CLIENT_ID;
const DIGIO_CLIENT_SECRET = process.env.DIGIO_CLIENT_SECRET;

export async function POST(request: NextRequest) {
  try {
    console.log('Digio API request:', {
      hasClientId: !!DIGIO_CLIENT_ID,
      hasClientSecret: !!DIGIO_CLIENT_SECRET,
      baseUrl: DIGIO_BASE_URL,
      endpoint: `${DIGIO_BASE_URL}/v2/client/document/uploadpdf`
    });

    if (!DIGIO_CLIENT_ID || !DIGIO_CLIENT_SECRET || 
        DIGIO_CLIENT_ID === 'your-digio-client-id' || 
        DIGIO_CLIENT_SECRET === 'your-digio-client-secret') {
      return NextResponse.json(
        { error: 'Digio credentials not configured. Please add DIGIO_CLIENT_ID and DIGIO_CLIENT_SECRET to your environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { agreementData, signRequest } = body;

    // Generate PDF content for the agreement
    const pdfContent = await generateAgreementPDF(agreementData);
    
    const digioPayload = {
      file_name: signRequest.file_name || 'agreement.pdf',
      file_data: pdfContent,
      signers: [{
        identifier: signRequest.signers[0].identifier,
        name: signRequest.signers[0].name,
        reason: 'Payment authorization'
      }]
    };

    console.log('Digio API payload:', JSON.stringify(digioPayload, null, 2));

    // Create Basic Auth header
    const credentials = Buffer.from(`${DIGIO_CLIENT_ID}:${DIGIO_CLIENT_SECRET}`).toString('base64');

    // Make request to Digio API
    const response = await fetch(`${DIGIO_BASE_URL}/v2/client/document/uploadpdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(digioPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Digio API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        payload: digioPayload,
        url: `${DIGIO_BASE_URL}/v2/client/document/uploadpdf`
      });
      return NextResponse.json(
        { error: `Digio API error: ${errorText}`, details: errorText },
        { status: 400 }
      );
    }

    const digioResponse = await response.json();
    
    return NextResponse.json({
      documentId: digioResponse.id,
      status: digioResponse.agreement_status,
      authenticationUrl: digioResponse.signing_parties?.[0]?.sign_url || null,
      accessToken: digioResponse.access_token
    });

  } catch (error) {
    console.error('Error creating Digio sign request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAgreementPDF(agreementData: any): Promise<string> {
  const response = await fetch('https://s3.eu-north-1.amazonaws.com/rangaone.finance/DIgio_Documentation/aadhaar_esign_consent.pdf');
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}