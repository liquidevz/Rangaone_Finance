import { post, get } from "@/lib/axios";

// Digio API interfaces based on the documentation
export interface DigioSigner {
  identifier: string; // Email or mobile
  name: string;
  sign_type?: "aadhaar" | "dsc" | "electronic";
  signature_mode?: "otp" | "slate" | "kyc";
  reason?: string;
}

export interface DigioSignRequest {
  file_name: string;
  file_data: string; // Base64 encoded PDF
  signers: DigioSigner[];
  expire_in_days?: number;
  display_on_page?: "first" | "last" | "all" | "custom";
  notify_signers?: boolean;
  send_sign_link?: boolean;
  generate_access_token?: boolean;
  comment?: string;
  sign_coordinates?: {
    [signerEmail: string]: {
      [pageNumber: string]: Array<{
        llx: number;
        lly: number;
        urx: number;
        ury: number;
      }>;
    };
  };
}

export interface DigioSignResponse {
  id: string;
  agreement_status: "draft" | "requested" | "completed" | "expired" | "failed";
  file_name: string;
  created_at: string;
  signing_parties: Array<{
    name: string;
    identifier: string;
    status: "requested" | "signed" | "expired";
    signature_type: string;
  }>;
  authentication_url?: string;
}

export interface PaymentAgreementData {
  customerName: string;
  customerEmail: string;
  customerMobile?: string;
  amount: number;
  subscriptionType: "monthly" | "quarterly" | "yearly";
  portfolioNames: string[];
  agreementDate: string;
  productType?: string;
  productId?: string;
  productName?: string;
}

export const digioService = {

  // Create Digio document for signing via backend API
  createPaymentSignRequest: async (
    agreementData: any,     // First parameter you're passing
    productType: string,    // "Bundle" 
    productId: string       // "686a629db4f9ab73bb2dba3d"
  ): Promise<{ documentId: string; authenticationUrl?: string; }> => {
    const response = await post('/api/digio/document/create', {
      productType,
      productId,
      productName: agreementData.productName || productType
    }) as any;

    if (response.success) {
      return {
        documentId: response.data.documentId,
        authenticationUrl: response.data.authenticationUrl || response.data.signUrl
      };
    }
    throw new Error(response.error || 'Failed to create document');
  },

  // Create document with profile check
  createDocumentWithProfileCheck: async (
    agreementData: any,
    productType: string,
    productId: string,
    onProfileIncomplete: () => Promise<void>
  ): Promise<{ documentId: string; authenticationUrl?: string; }> => {
    try {
      return await digioService.createPaymentSignRequest(agreementData, productType, productId);
    } catch (error: any) {
      if (error.message?.includes('Missing required user data')) {
        await onProfileIncomplete();
        return await digioService.createPaymentSignRequest(agreementData, productType, productId);
      }
      throw error;
    }
  },

  // Open authentication URL for signing - now returns URL for iframe usage
  openSigningPopup: (authenticationUrl: string): string => {
    // Return URL for iframe modal usage instead of opening popup
    return authenticationUrl;
  },

  // Initialize Digio signing (legacy method for compatibility)
  initializeDigioSigning: async (
    documentId: string,
    customerEmail: string,
    onSuccess: (response: any) => void,
    onError: (error: any) => void,
    authenticationUrl?: string
  ): Promise<void> => {
    if (authenticationUrl) {
      onSuccess({ documentId, authenticationUrl, digioUrl: authenticationUrl });
    } else {
      onError(new Error('No authentication URL provided'));
    }
  },

  // Verify signature after signing
  verifySignature: async (payload: any): Promise<boolean> => {
    try {
      const response = await get('/digio/esign/verify', {
        params: payload
      }) as any;
      
      return response.success && response.verified;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  },

  // Check document status via API
  checkDocumentStatus: async (documentId: string): Promise<DigioSignResponse> => {
    try {
      const response = await get(`/api/digio/document/status/${documentId}`) as any;
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to check document status');
      }
    } catch (error: any) {
      console.error('Error checking document status:', error);
      throw new Error(error.response?.message || error.message || 'Failed to check document status');
    }
  },

  validateSignatureForPayment: async (documentId: string): Promise<boolean> => {
    try {
      const response = await digioService.checkDocumentStatus(documentId);
      return response.agreement_status === "completed";
    } catch (error) {
      console.error("Error validating signature:", error);
      return false;
    }
  },

  // Check signature status for polling
  checkSignatureStatus: async (documentId: string): Promise<{ completed: boolean; failed: boolean; error?: string }> => {
    try {
      const response = await digioService.checkDocumentStatus(documentId);
      
      if (response.agreement_status === "completed") {
        return { completed: true, failed: false };
      } else if (response.agreement_status === "failed" || response.agreement_status === "expired") {
        return { completed: false, failed: true, error: `Document ${response.agreement_status}` };
      } else {
        return { completed: false, failed: false };
      }
    } catch (error: any) {
      console.error("Error checking signature status:", error);
      return { completed: false, failed: true, error: error.message || "Failed to check status" };
    }
  },

  // Create cart eSign document
  createCartSignRequest: async (cartId: string): Promise<{ documentId: string; authenticationUrl?: string; }> => {
    const response = await post('/api/digio/cart/create', {
      cartId
    }) as any;

    if (response.success) {
      return {
        documentId: response.data.documentId,
        authenticationUrl: response.data.authenticationUrl || response.data.signUrl
      };
    }
    throw new Error(response.error || 'Failed to create cart document');
  },

  // Verify cart eSign completion
  verifyCartSignature: async (cartId: string, documentId: string): Promise<boolean> => {
    try {
      const response = await post('/api/cart/esign/verify', {
        cartId,
        documentId
      }) as any;
      
      return response.success && response.esign_status?.isCompleted;
    } catch (error) {
      console.error('Error verifying cart signature:', error);
      return false;
    }
  },

  // Verify and update eSign status for a cart (calls backend to sync with Digio)
  // Supports polling with maxAttempts and delayMs parameters
  verifyAndUpdateCartEsignStatus: async (
    cartId: string,
    options?: { poll?: boolean; maxAttempts?: number; delayMs?: number }
  ): Promise<{ 
    success: boolean; 
    status?: string; 
    signed?: boolean;
    documentId?: string;
    signedAt?: string | null;
    error?: string;
  }> => {
    const { poll = false, maxAttempts = 10, delayMs = 2000 } = options || {};
    
    const checkStatus = async () => {
      const response = await post('/api/digio/cart/esign/verify-status', {
        cartId
      }) as any;
      
      return {
        success: response.success,
        status: response.status,
        signed: response.signed || response.status === 'signed' || response.status === 'completed',
        documentId: response.documentId,
        signedAt: response.signedAt,
        error: response.error
      };
    };
    
    try {
      if (!poll) {
        // Single check
        return await checkStatus();
      }
      
      // Polling mode - keep checking until signed or max attempts reached
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const result = await checkStatus();
        
        if (result.signed) {
          return result;
        }
        
        if (result.status === 'failed' || result.status === 'expired') {
          return {
            ...result,
            success: false,
            error: `eSign ${result.status}. Please try again.`
          };
        }
        
        if (attempt < maxAttempts) {
          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
      
      // Max attempts reached without signing
      return {
        success: false,
        signed: false,
        error: 'eSign verification timed out. Please complete the signing process and try again.'
      };
    } catch (error: any) {
      console.error('Error verifying cart eSign status:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify cart eSign status'
      };
    }
  },

  // Verify and update eSign status for a product (calls backend to sync with Digio)
  verifyAndUpdateEsignStatus: async (productType: string, productId: string): Promise<{ 
    success: boolean; 
    status?: string; 
    signed?: boolean;
    error?: string;
  }> => {
    try {
      const response = await post('/api/digio/esign/verify-status', {
        productType,
        productId
      }) as any;
      
      return {
        success: response.success,
        status: response.status,
        signed: response.signed || response.status === 'signed' || response.status === 'completed',
        error: response.error
      };
    } catch (error: any) {
      console.error('Error verifying eSign status:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify eSign status'
      };
    }
  }
};