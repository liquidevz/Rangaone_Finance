import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Digio webhook received:', {
      documentId: body.document_id,
      status: body.status,
      timestamp: new Date().toISOString(),
      payload: body
    });

    // Validate webhook (you might want to add signature verification)
    if (!body.document_id || !body.status) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Process the webhook based on status
    switch (body.status) {
      case 'completed':
        await handleDocumentSigned(body);
        break;
      case 'expired':
        await handleDocumentExpired(body);
        break;
      case 'failed':
        await handleDocumentFailed(body);
        break;
      default:
        console.log('Unhandled webhook status:', body.status);
    }

    // Always return success to Digio
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing Digio webhook:', error);
    // Still return success to avoid webhook retries
    return NextResponse.json({ success: true });
  }
}

async function handleDocumentSigned(webhookData: any) {
  console.log('Document signed successfully:', webhookData.document_id);
  
  // Here you would typically:
  // 1. Update your database with the signed status
  // 2. Send confirmation email to user
  // 3. Activate the subscription/service
  // 4. Trigger any post-signing workflows
  
  // Example database update (implement based on your DB):
  // await updateDocumentStatus(webhookData.document_id, 'signed');
  // await activateUserSubscription(webhookData.signer_email);
}

async function handleDocumentExpired(webhookData: any) {
  console.log('Document expired:', webhookData.document_id);
  
  // Handle expired documents:
  // 1. Update database status
  // 2. Notify user about expiration
  // 3. Optionally create new signing request
}

async function handleDocumentFailed(webhookData: any) {
  console.log('Document signing failed:', webhookData.document_id);
  
  // Handle failed signings:
  // 1. Update database status
  // 2. Notify user about failure
  // 3. Log error details for debugging
}