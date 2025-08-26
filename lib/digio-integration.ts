/**
 * Complete DIGIO E-mandate Integration
 * 
 * API Call Sequence:
 * 1. Frontend: Call POST /digio/emandate/create
 * 2. Frontend: Initialize Digio SDK with returned sessionId
 * 3. User: Signs document in Digio interface
 * 4. Frontend: Poll GET /digio/status/{documentId} until signed
 * 5. Backend: Receives webhook automatically
 * 6. Frontend: Call GET /digio/emandate/check before payments
 */

import { digioEmandateService, EmandateData } from '@/services/digio-emandate.service';

export class DigioIntegration {
  private documentId: string | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  /**
   * Complete e-mandate workflow
   */
  async processEmandate(
    emandateData: EmandateData,
    callbacks: {
      onProgress?: (step: string, data?: any) => void;
      onSuccess?: (documentId: string) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<string> {
    const { onProgress, onSuccess, onError } = callbacks;

    try {
      // Step 1: Create e-mandate
      onProgress?.('creating');
      const response = await digioEmandateService.createEmandate(emandateData);
      this.documentId = response.documentId;

      // Step 2: Initialize Digio SDK
      onProgress?.('initializing_sdk');
      await this.initializeSDK(response.sessionId, response.documentId, emandateData.customerEmail);

      // Step 3: Start polling for completion
      onProgress?.('polling');
      await this.startPolling();

      onSuccess?.(this.documentId);
      return this.documentId;

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      throw err;
    }
  }

  /**
   * Initialize Digio SDK
   */
  private async initializeSDK(sessionId: string, documentId: string, customerEmail: string): Promise<void> {
    return new Promise((resolve, reject) => {
      digioEmandateService.initializeDigioSDK(
        sessionId,
        documentId,
        customerEmail,
        (response) => {
          console.log('Digio SDK success:', response);
          resolve();
        },
        (error) => {
          console.error('Digio SDK error:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Poll document status every 5-10 seconds
   */
  private async startPolling(): Promise<void> {
    if (!this.documentId) throw new Error('No document ID available');

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await digioEmandateService.getDocumentStatus(this.documentId!);
          
          if (status.isSigned) {
            this.stopPolling();
            resolve();
          } else if (status.status === 'expired' || status.status === 'failed') {
            this.stopPolling();
            reject(new Error(`Document ${status.status}`));
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      };

      // Poll every 5 seconds
      this.pollInterval = setInterval(poll, 5000);
      
      // Initial poll
      poll();

      // Timeout after 30 minutes
      setTimeout(() => {
        this.stopPolling();
        reject(new Error('Session expired'));
      }, 30 * 60 * 1000);
    });
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Check e-mandate before payment
   */
  async validateBeforePayment(documentId?: string, userId?: string): Promise<boolean> {
    const docId = documentId || this.documentId;
    if (!docId) return false;

    return await digioEmandateService.checkEmandateBeforePayment(docId, userId);
  }

  /**
   * Get current document status
   */
  async getCurrentStatus(): Promise<any> {
    if (!this.documentId) return null;
    return await digioEmandateService.getDocumentStatus(this.documentId);
  }

  /**
   * Reset integration state
   */
  reset(): void {
    this.stopPolling();
    this.documentId = null;
  }
}

// Singleton instance
export const digioIntegration = new DigioIntegration();

// Utility functions
export const DigioUtils = {
  /**
   * Quick e-mandate creation for simple use cases
   */
  async quickEmandate(data: EmandateData): Promise<string> {
    const integration = new DigioIntegration();
    return await integration.processEmandate(data, {});
  },

  /**
   * Check if user has valid e-mandate
   */
  async hasValidEmandate(documentId: string, userId?: string): Promise<boolean> {
    return await digioEmandateService.checkEmandateBeforePayment(documentId, userId);
  },

  /**
   * Get document status
   */
  async getStatus(documentId: string) {
    return await digioEmandateService.getDocumentStatus(documentId);
  }
};