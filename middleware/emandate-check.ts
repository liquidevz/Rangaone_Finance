import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to check e-mandate authorization before allowing payments
 * Add this to your payment routes to enforce e-mandate verification
 */
export async function emandateCheckMiddleware(
  request: NextRequest,
  documentId?: string,
  userId?: string
): Promise<NextResponse | null> {
  
  // Skip check for non-payment routes
  const url = request.nextUrl.pathname;
  if (!url.includes('/payment') && !url.includes('/checkout')) {
    return null;
  }

  try {
    // Get documentId from request if not provided
    if (!documentId) {
      const body = await request.json();
      documentId = body.documentId || body.emandateId;
    }

    if (!documentId) {
      return NextResponse.json(
        { 
          error: 'E-mandate verification required',
          code: 'EMANDATE_REQUIRED',
          message: 'Please complete e-mandate authorization before proceeding with payment'
        },
        { status: 403 }
      );
    }

    // Check e-mandate status
    const params = new URLSearchParams({ documentId });
    if (userId) params.append('userId', userId);

    const checkUrl = new URL(`/api/digio/emandate/check?${params}`, request.url);
    const response = await fetch(checkUrl);

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'E-mandate verification failed',
          code: 'EMANDATE_CHECK_FAILED',
          message: 'Unable to verify e-mandate status'
        },
        { status: 500 }
      );
    }

    const result = await response.json();
    
    if (!result.hasValidEmandate) {
      return NextResponse.json(
        { 
          error: 'Invalid e-mandate',
          code: 'EMANDATE_INVALID',
          message: 'No valid e-mandate found. Please complete e-mandate signing first.',
          documentId
        },
        { status: 403 }
      );
    }

    // E-mandate is valid, allow request to proceed
    return null;

  } catch (error) {
    console.error('E-mandate check middleware error:', error);
    return NextResponse.json(
      { 
        error: 'E-mandate verification error',
        code: 'EMANDATE_ERROR',
        message: 'An error occurred while verifying e-mandate'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to use in API routes
 */
export async function requireEmandate(
  request: NextRequest,
  documentId?: string,
  userId?: string
): Promise<boolean> {
  const middlewareResponse = await emandateCheckMiddleware(request, documentId, userId);
  return middlewareResponse === null; // null means check passed
}