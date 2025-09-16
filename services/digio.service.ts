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
        authenticationUrl: response.data.authenticationUrl
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

  // Open authentication URL for signing with mobile compatibility
  openSigningPopup: (authenticationUrl: string): Window | null => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.open(authenticationUrl, '_blank');
      return null;
    } else {
      const popup = window.open(
        authenticationUrl, 
        'digio-sign', 
        'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no,location=no'
      );
      
      if (!popup) {
        window.open(authenticationUrl, '_blank');
      }
      
      return popup;
    }
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
      digioService.openSigningPopup(authenticationUrl);
      onSuccess({ documentId, authenticationUrl });
    } else {
      onError(new Error('No authentication URL provided'));
    }
  },

  // Verify signature after signing
  verifySignature: async (payload: any): Promise<boolean> => {
    // Skip verification in sandbox
    if (process.env.NEXT_PUBLIC_DIGIO_ENVIRONMENT === 'sandbox') {
      return true;
    }
    
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
      const response = await get(`api/digio/document/status/${documentId}`) as any;
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
  }
};