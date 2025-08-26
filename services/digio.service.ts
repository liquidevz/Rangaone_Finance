import { post } from "@/lib/axios";
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

  // Mock Digio API - completely fake
  createPaymentSignRequest: async (
    agreementData: PaymentAgreementData
  ): Promise<{ documentId: string; authenticationUrl?: string; accessToken?: any }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockDocumentId = `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      documentId: mockDocumentId,
      authenticationUrl: undefined, // Will use demo interface
      accessToken: `mock_token_${Date.now()}`
    };
  },

  // Initialize Digio SDK and handle signing
  initializeDigioSigning: async (
    documentId: string,
    customerEmail: string,
    onSuccess: (response: any) => void,
    onError: (error: any) => void,
    authenticationUrl?: string
  ): Promise<void> => {
    // If authentication URL is provided, open it directly
    if (authenticationUrl) {
      const popup = window.open(authenticationUrl, 'digio-sign', 'width=800,height=600,scrollbars=yes,resizable=yes');
      if (!popup) {
        onError(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await digioService.checkDocumentStatus(documentId);
          if (status.agreement_status === 'completed') {
            clearInterval(pollInterval);
            popup.close();
            onSuccess({ document_id: documentId, status: 'completed' });
          } else if (status.agreement_status === 'expired' || status.agreement_status === 'failed') {
            clearInterval(pollInterval);
            popup.close();
            onError(new Error(`Signing ${status.agreement_status}`));
          }
        } catch (error) {
          // Continue polling on error
        }
      }, 3000);

      // Check if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          clearInterval(pollInterval);
        }
      }, 1000);

      return;
    }

    // Use demo interface for mock
    digioService.showDemoESignInterface(documentId, customerEmail, onSuccess, onError);
  },

  // Mock document status check
  checkDocumentStatus: async (documentId: string): Promise<DigioSignResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: documentId,
      agreement_status: "completed",
      file_name: "mock_agreement.pdf",
      created_at: new Date().toISOString(),
      signing_parties: [{
        name: "Mock Signer",
        identifier: "mock@example.com",
        status: "signed",
        signature_type: "aadhaar"
      }]
    };
  },

  showDemoESignInterface: (
    documentId: string,
    customerEmail: string,
    onSuccess: (response: any) => void,
    onError: (error: any) => void
  ) => {
    const popup = window.open('', 'digio-demo', 'width=500,height=600');
    if (!popup) {
      onError(new Error('Popup blocked'));
      return;
    }

    popup.document.write(`<!DOCTYPE html><html><head><title>Aadhaar eSign</title><style>body{font-family:Arial;padding:20px;background:#f5f5f5}.container{background:white;padding:30px;border-radius:10px}.header{text-align:center;margin-bottom:30px}.logo{width:60px;height:60px;background:#2563eb;border-radius:50%;margin:0 auto 15px;display:flex;align-items:center;justify-content:center;color:white;font-size:24px}.form-group{margin-bottom:20px}label{display:block;margin-bottom:5px;font-weight:bold}input{width:100%;padding:10px;border:1px solid #ddd;border-radius:5px;box-sizing:border-box}button{width:100%;padding:12px;background:#2563eb;color:white;border:none;border-radius:5px;cursor:pointer}.step{margin-bottom:15px;padding:10px;background:#f8f9fa;border-left:4px solid #2563eb}</style></head><body><div class="container"><div class="header"><div class="logo">🔐</div><h2>Aadhaar eSign</h2><p>Demo - ${documentId}</p></div><div id="step1"><div class="step"><strong>Step 1:</strong> Enter Aadhaar</div><div class="form-group"><label>Aadhaar:</label><input type="text" id="aadhaar" placeholder="XXXX-XXXX-XXXX" maxlength="14"></div><button onclick="sendOTP()">Send OTP</button></div><div id="step2" style="display:none"><div class="step"><strong>Step 2:</strong> Enter OTP</div><div class="form-group"><label>OTP:</label><input type="text" id="otp" placeholder="6-digit OTP" maxlength="6"></div><button onclick="verifyOTP()">Verify & Sign</button></div><div id="step3" style="display:none"><div class="step"><strong>Step 3:</strong> Signed!</div><button onclick="closeAndComplete()">Complete</button></div></div><script>function sendOTP(){const a=document.getElementById('aadhaar').value;if(a.length<12){alert('Enter valid Aadhaar');return}document.getElementById('step1').style.display='none';document.getElementById('step2').style.display='block'}function verifyOTP(){const o=document.getElementById('otp').value;if(o.length!==6){alert('Enter valid OTP');return}document.getElementById('step2').style.display='none';document.getElementById('step3').style.display='block'}function closeAndComplete(){window.opener.postMessage({type:'digio-success',data:{document_id:'${documentId}',status:'completed',message:'Signed (demo)'}},'*');window.close()}</script></body></html>`);

    const messageHandler = (event: MessageEvent) => {
      if (event.data.type === 'digio-success') {
        window.removeEventListener('message', messageHandler);
        onSuccess(event.data.data);
      }
    };
    window.addEventListener('message', messageHandler);
    
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
      }
    }, 1000);
  },

  // Check document status
  checkDocumentStatus: async (documentId: string): Promise<DigioSignResponse> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/digio/status/${documentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to check document status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking document status:', error);
      throw error;
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