import { NextRequest, NextResponse } from 'next/server';

const DIGIO_BASE_URL = process.env.DIGIO_BASE_URL || 'https://api.digio.in';
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
    const pdfContent = generateAgreementPDF(agreementData);
    
    // Prepare the sign request payload according to Digio API spec
    const digioPayload = {
      file_name: signRequest.file_name,
      file_data: pdfContent,
      signers: signRequest.signers,
      expire_in_days: signRequest.expire_in_days || 7,
      display_on_page: signRequest.display_on_page || 'last',
      notify_signers: signRequest.notify_signers !== false,
      send_sign_link: signRequest.send_sign_link || false,
      generate_access_token: signRequest.generate_access_token !== false,
      include_authentication_url: signRequest.include_authentication_url !== false,
      comment: signRequest.comment || 'Payment authorization for subscription services'
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
        url: `${DIGIO_BASE_URL}/v2/client/document/uploadpdf`
      });
      return NextResponse.json(
        { error: `Digio API error (${response.status}): ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const digioResponse = await response.json();
    
    return NextResponse.json({
      documentId: digioResponse.id,
      status: digioResponse.agreement_status,
      authenticationUrl: digioResponse.authentication_url,
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

function generateAgreementPDF(agreementData: any): string {
  // Create a simple text-based agreement content
  const agreementContent = `
PAYMENT AUTHORIZATION AGREEMENT

Customer Details:
Name: ${agreementData.customerName}
Email: ${agreementData.customerEmail}
${agreementData.customerMobile ? `Mobile: ${agreementData.customerMobile}` : ''}

Agreement Date: ${agreementData.agreementDate}

SUBSCRIPTION DETAILS:
- Subscription Type: ${agreementData.subscriptionType.toUpperCase()}
- Amount: Rs.${agreementData.amount.toLocaleString('en-IN')}
- Portfolios: ${agreementData.portfolioNames.join(', ')}

TERMS AND CONDITIONS:
1. By signing this agreement, the customer authorizes the payment for the selected subscription services.
2. The subscription will be activated upon successful payment verification.
3. The customer agrees to the terms and conditions of the service.
4. This authorization is valid for the specified subscription period.

DIGITAL SIGNATURE:
By digitally signing this document using Aadhaar-based eSign, I confirm that:
- I have read and understood the terms of this agreement
- I authorize the payment of Rs.${agreementData.amount.toLocaleString('en-IN')} for the subscription services
- I agree to the subscription terms and conditions

Customer Signature: ___________________
Date: ${agreementData.agreementDate}

This document is digitally signed and legally binding.
  `;
  
  // Convert to base64
  return Buffer.from(agreementContent, 'utf-8').toString('base64');
}