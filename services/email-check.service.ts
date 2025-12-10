// services/email-check.service.ts
import { post } from "@/lib/axios";

interface EmailCheckResponse {
  exists: boolean;
  message?: string;
}

interface EmailCheckError {
  error: string;
  message?: string;
  statusCode?: number;
}

export const emailCheckService = {
  /**
   * Check if an email is already registered in the system
   * @param email - Email address to check
   * @returns Promise<boolean> - true if email exists, false otherwise
   */
  checkEmailExists: async (email: string): Promise<boolean> => {
    // First validate email format
    if (!emailCheckService.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    try {
      const response = await post<EmailCheckResponse>("/auth/check-email", { email }, {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      
      return response.exists;
    } catch (error: any) {
      
      // If the endpoint doesn't exist, use the login-based fallback
      if (error?.response?.status === 404 || error?.response?.status === 405) {
        return await emailCheckService.checkEmailExistsByLogin(email);
      }
      
      // For other errors, use fallback method
      return await emailCheckService.checkEmailExistsByLogin(email);
    }
  },

  /**
   * Alternative method using login attempt to check if email exists
   * This is a fallback if the dedicated endpoint is not available
   * @param email - Email address to check
   * @returns Promise<boolean> - true if email exists, false otherwise
   */
  checkEmailExistsByLogin: async (email: string): Promise<boolean> => {
    try {
      // Try to login with a dummy password to see if the email exists
      const response = await post("/auth/login", {
        username: email,
        password: "__dummy_password_for_email_check__"
      }, {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      
      // If we get here, it means the request was processed
      // but we should never reach here with a dummy password
      return false;
    } catch (error: any) {
      
      // If we get a 401 (Unauthorized), it means the email exists but password is wrong
      if (error?.response?.status === 401) {
        const errorMessage = error?.response?.data?.error || error?.response?.data?.message || '';
        // Check if the error message indicates invalid credentials (user exists)
        if (errorMessage.toLowerCase().includes('invalid') && 
            (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('credentials'))) {
          return true;
        }
        return true; // Default to true for 401 errors
      }
      
      // If we get a 404 or user not found error, the email doesn't exist
      if (error?.response?.status === 404) {
        return false;
      }
      
      // Check error message for user not found indicators
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || '';
      if (errorMessage.toLowerCase().includes('user not found') || 
          errorMessage.toLowerCase().includes('invalid username') ||
          errorMessage.toLowerCase().includes('user does not exist')) {
        return false;
      }
      
      // For other errors, assume email doesn't exist to allow signup
      return false;
    }
  },

  /**
   * Simple email validation
   * @param email - Email to validate
   * @returns boolean - true if email format is valid
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};