import { post, get } from "@/lib/axios";
import { authService } from "./auth.service";

// Digio Web SDK types
declare global {
  interface Window {
    Digio: any;
  }
}

// Digio SDK Configuration
const DIGIO_SDK_URL = "https://ext.digio.in/sdk/v15/digio.js";
const DIGIO_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';

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
  // Load Digio SDK
  loadDigioSDK: (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Digio) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = DIGIO_SDK_URL;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  },

  // Generate payment agreement PDF content
  generatePaymentAgreementPDF: (data: PaymentAgreementData): string => {
    const agreementContent = `
      PAYMENT AGREEMENT
      
      Customer: ${data.customerName}
      Email: ${data.customerEmail}
      ${data.customerMobile ? `Mobile: ${data.customerMobile}` : ''}
      
      Agreement Date: ${data.agreementDate}
      
      SUBSCRIPTION DETAILS:
      - Type: ${data.subscriptionType.toUpperCase()}
      - Amount: Rs.${data.amount.toLocaleString('en-IN')}
      - Portfolios: ${data.portfolioNames.join(', ')}
      
      By signing this agreement, the customer agrees to the subscription terms
      and authorizes the payment for the selected portfolio services.
      
      Signature: ___________________
      Date: ${data.agreementDate}
    `;
    
    return btoa(unescape(encodeURIComponent(agreementContent)));
  },

  // Create Digio document for signing
  createPaymentSignRequest: async (
    agreementData: PaymentAgreementData,
    productType: string,
    productId: string,
    productName: string
  ): Promise<{ documentId: string; authenticationUrl?: string; }> => {
    try {
      const response = await post('api/digio/document/create', {
        signerEmail: agreementData.customerEmail,
        signerName: agreementData.customerName,
        signerPhone: agreementData.customerMobile || "",
        reason: "Document Agreement",
        expireInDays: 1,
        displayOnPage: "all",
        notifySigners: true,
        sendSignLink: true,
        productType,
        productId,
        productName,
      }) as any;

      if (response.success) {
        const { documentId } = response.data;
        const authenticationUrl = response.data.digioResponse.signing_parties[0].authentication_url;
        console.log("Digio document created:", {
          documentId,
          authenticationUrl,
        });
        return {
          documentId,
          authenticationUrl: authenticationUrl || undefined,
        };
      } else {
        throw new Error(response.message || 'Failed to create document');
      }
    } catch (error: any) {
      console.error('Error creating Digio document:', error);
      throw new Error(error.response?.message || error.message || 'Failed to create document');
    }
  },

  // Initialize Digio SDK and handle signing
  initializeDigioSigning: async (
    documentId: string,
    customerEmail: string,
    onSuccess: (response: any) => void,
    onError: (error: any) => void,
    authenticationUrl?: string
  ): Promise<void> => {
    if (authenticationUrl) {
      console.log("Opening authentication URL:", authenticationUrl);
      const popup = window.open(authenticationUrl, 'digio-sign', 'width=800,height=600,scrollbars=yes,resizable=yes');
      if (!popup) {
        onError(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      // Poll for document status
      const pollInterval = setInterval(async () => {
        try {
          const status = await digioService.checkDocumentStatus(documentId);
          if (status.agreement_status === 'completed') {
            clearInterval(pollInterval);
            popup.close();
            onSuccess({ documentId, status: 'completed' });
          } else if (status.agreement_status === 'failed' || status.agreement_status === 'expired') {
            clearInterval(pollInterval);
            popup.close();
            onError(new Error(`Signing ${status.agreement_status}`));
          }
        } catch (error) {
          console.error('Error polling document status:', error);
        }
      }, 3000);

      // Clean up if popup is closed
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollInterval);
          clearInterval(checkClosed);
        }
      }, 1000);

      return;
    }

    onError(new Error('No authentication URL provided'));
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