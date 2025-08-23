import { NextRequest, NextResponse } from 'next/server';

const DIGIO_BASE_URL = process.env.DIGIO_BASE_URL || 'https://api.digio.in';
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
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Create Basic Auth header
    const credentials = Buffer.from(`${DIGIO_CLIENT_ID}:${DIGIO_CLIENT_SECRET}`).toString('base64');

    // Make request to Digio API to check document status
    const response = await fetch(`${DIGIO_BASE_URL}/v2/client/document/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Digio API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to check document status', details: errorText },
        { status: response.status }
      );
    }

    const digioResponse = await response.json();
    
    return NextResponse.json({
      id: digioResponse.id,
      agreement_status: digioResponse.agreement_status,
      file_name: digioResponse.file_name,
      created_at: digioResponse.created_at,
      signing_parties: digioResponse.signing_parties,
      self_signed: digioResponse.self_signed
    });

  } catch (error) {
    console.error('Error checking Digio document status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}