import axiosApi from '@/lib/axios';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

class ContactService {
  private readonly baseUrl = '/api';

  async sendContactMessage(data: ContactFormData): Promise<{ message: string }> {
    try {
      const response = await axiosApi.post(`${this.baseUrl}/contactus`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'All fields are required');
      } else if (error.response?.status === 422) {
        throw new Error(error.response.data.error || 'Invalid email format');
      } else if (error.response?.status === 500) {
        throw new Error('Failed to send contact us message');
      } else {
        throw new Error('Network error. Please try again.');
      }
    }
  }
}

export const contactService = new ContactService(); 