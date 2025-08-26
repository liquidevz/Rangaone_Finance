import { digioService } from './digio.service';

export interface EmandateData {
  customerName: string;
  customerEmail: string;
  customerMobile?: string;
  amount: number;
  subscriptionType: 'monthly' | 'quarterly' | 'yearly';
}

export interface EmandateResponse {
  sessionId: string;
  documentId: string;
  authenticationUrl?: string;
  status: string;
  expiresAt: string;
}

export interface EmandateStatus {
  documentId: string;
  status: string;
  isSigned: boolean;
  signingParties: any[];
  createdAt: string;
  fileName: string;
}

export const digioEmandateService = {
  // Step 1: Create e-mandate
  createEmandate: async (data: EmandateData): Promise<EmandateResponse> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/digio/emandate/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create e-mandate');
    }

    return response.json();
  },

  // Step 2: Initialize Digio SDK
  initializeDigioSDK: async (
    sessionId: string,
    documentId: string,
    customerEmail: string,
    onSuccess: (response: any) => void,
    onError: (error: any) => void
  ): Promise<void> => {
    // Load Digio SDK
    const isLoaded = await digioService.loadDigioSDK();
    
    if (!isLoaded) {
      onError(new Error('Failed to load Digio SDK'));
      return;
    }

    const options = {
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      callback: function(response: any) {
        if (response.hasOwnProperty('error_code')) {
          onError(new Error(response.message || 'Signing failed'));
          return;
        }
        onSuccess(response);
      },
      logo: '/logo.png',
      theme: {
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af'
      },
      is_iframe: true
    };

    try {
      const digio = new (window as any).Digio(options);
      digio.init();
      digio.submit(documentId, customerEmail);
    } catch (error) {
      onError(error);
    }
  },

  // Step 3: Poll status until signed
  pollDocumentStatus: async (
    documentId: string,
    onStatusChange: (status: EmandateStatus) => void,
    intervalMs: number = 5000
  ): Promise<() => void> => {
    const poll = async () => {
      try {
        const status = await digioEmandateService.getDocumentStatus(documentId);
        onStatusChange(status);
        
        // Stop polling if document is completed, expired, or failed
        if (['completed', 'expired', 'failed'].includes(status.status)) {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling document status:', error);
      }
    };

    const pollInterval = setInterval(poll, intervalMs);
    
    // Initial poll
    poll();

    // Return cleanup function
    return () => clearInterval(pollInterval);
  },

  // Get document status
  getDocumentStatus: async (documentId: string): Promise<EmandateStatus> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/digio/status/${documentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')}`,
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get document status');
    }

    return response.json();
  },

  // Step 4: Check e-mandate before payments
  checkEmandateBeforePayment: async (documentId: string, userId?: string): Promise<boolean> => {
    const params = new URLSearchParams({ documentId });
    if (userId) params.append('userId', userId);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/digio/emandate/check?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')}`,
      }
    });
    
    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.hasValidEmandate;
  },

  // Complete workflow helper
  completeEmandateWorkflow: async (
    data: EmandateData,
    onProgress: (step: string, data?: any) => void
  ): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Step 1: Create e-mandate
        onProgress('creating');
        const emandateResponse = await digioEmandateService.createEmandate(data);
        
        // Step 2: Initialize SDK and wait for signing
        onProgress('signing', { documentId: emandateResponse.documentId });
        
        await digioEmandateService.initializeDigioSDK(
          emandateResponse.sessionId,
          emandateResponse.documentId,
          data.customerEmail,
          (response) => {
            onProgress('completed', response);
            resolve(emandateResponse.documentId);
          },
          (error) => {
            onProgress('error', error);
            reject(error);
          }
        );

        // Step 3: Start polling (optional, as SDK callback should handle completion)
        const stopPolling = await digioEmandateService.pollDocumentStatus(
          emandateResponse.documentId,
          (status) => {
            onProgress('status_update', status);
            if (status.isSigned) {
              stopPolling();
              resolve(emandateResponse.documentId);
            }
          }
        );

        // Cleanup after 30 minutes (session timeout)
        setTimeout(() => {
          stopPolling();
          reject(new Error('Session expired'));
        }, 30 * 60 * 1000);

      } catch (error) {
        onProgress('error', error);
        reject(error);
      }
    });
  }
};