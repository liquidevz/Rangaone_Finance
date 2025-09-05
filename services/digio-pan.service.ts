"use client";

import axiosApi from '@/lib/axios';

export interface PanVerificationRequest {
  id_no: string;
  name: string;
  dob: string; // Format: DD/MM/YYYY
}

export interface PanVerificationResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface PanVerificationError {
  code: string;
  message: string;
}

class DigioPanService {
  private readonly baseUrl = '/api/digio/pan';

  async verifyPan(request: PanVerificationRequest): Promise<PanVerificationResponse> {
    try {
      const response = await axiosApi.post<PanVerificationResponse>(
        `${this.baseUrl}/verify`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('PAN verification failed:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data as PanVerificationError;
        throw new Error(errorData.message || 'Invalid PAN details provided');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required for PAN verification');
      }
      
      if (error.response?.status === 503) {
        const errorData = error.response.data as PanVerificationError;
        throw new Error(errorData.message || 'PAN verification service is currently unavailable');
      }
      
      throw new Error('PAN verification failed. Please try again later.');
    }
  }

  validatePanFormat(pan: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  }

  validateDateFormat(date: string): boolean {
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    return dateRegex.test(date);
  }

  formatDateForApi(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

export const digioPanService = new DigioPanService();