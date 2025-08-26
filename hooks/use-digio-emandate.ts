import { useState, useCallback } from 'react';
import { digioEmandateService, EmandateData, EmandateStatus } from '@/services/digio-emandate.service';

export interface UseDigioEmandateReturn {
  // State
  isLoading: boolean;
  documentId: string | null;
  status: EmandateStatus | null;
  error: string | null;
  
  // Actions
  createEmandate: (data: EmandateData) => Promise<void>;
  checkStatus: (documentId: string) => Promise<void>;
  validateForPayment: (documentId: string, userId?: string) => Promise<boolean>;
  reset: () => void;
}

export function useDigioEmandate(): UseDigioEmandateReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [status, setStatus] = useState<EmandateStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createEmandate = useCallback(async (data: EmandateData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await digioEmandateService.createEmandate(data);
      setDocumentId(response.documentId);
      
      // Start polling for status updates
      const stopPolling = await digioEmandateService.pollDocumentStatus(
        response.documentId,
        (statusUpdate) => {
          setStatus(statusUpdate);
        }
      );

      // Cleanup polling after 30 minutes
      setTimeout(stopPolling, 30 * 60 * 1000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create e-mandate');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async (docId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const statusResponse = await digioEmandateService.getDocumentStatus(docId);
      setStatus(statusResponse);
      setDocumentId(docId);
      
    } catch (err: any) {
      setError(err.message || 'Failed to check status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateForPayment = useCallback(async (docId: string, userId?: string): Promise<boolean> => {
    try {
      return await digioEmandateService.checkEmandateBeforePayment(docId, userId);
    } catch (err: any) {
      setError(err.message || 'Failed to validate e-mandate');
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setDocumentId(null);
    setStatus(null);
    setError(null);
  }, []);

  return {
    isLoading,
    documentId,
    status,
    error,
    createEmandate,
    checkStatus,
    validateForPayment,
    reset
  };
}