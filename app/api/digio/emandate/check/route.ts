import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const userId = searchParams.get('userId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Check if user has valid e-mandate
    // This would typically check your database for signed e-mandates
    const hasValidEmandate = await checkEmandateInDatabase(documentId, userId);

    return NextResponse.json({
      hasValidEmandate,
      documentId,
      message: hasValidEmandate 
        ? 'Valid e-mandate found. Payment authorized.' 
        : 'No valid e-mandate found. Please complete e-mandate signing first.'
    });

  } catch (error) {
    console.error('Error checking e-mandate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkEmandateInDatabase(documentId: string, userId?: string | null): Promise<boolean> {
  // This is a placeholder - implement your database check here
  // You would typically:
  // 1. Query your database for the document
  // 2. Check if it's signed and valid
  // 3. Optionally check if it belongs to the user
  
  // For now, we'll make a quick status check to Digio
  const DIGIO_BASE_URL = process.env.DIGIO_BASE_URL || 'https://api.digio.in';
  const DIGIO_CLIENT_ID = process.env.DIGIO_CLIENT_ID;
  const DIGIO_CLIENT_SECRET = process.env.DIGIO_CLIENT_SECRET;

  if (!DIGIO_CLIENT_ID || !DIGIO_CLIENT_SECRET) {
    return false;
  }

  try {
    const credentials = Buffer.from(`${DIGIO_CLIENT_ID}:${DIGIO_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${DIGIO_BASE_URL}/v2/client/document/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.agreement_status === 'completed';
    }
  } catch (error) {
    console.error('Error checking document in Digio:', error);
  }

  return false;
}