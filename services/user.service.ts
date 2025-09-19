// services\user.service.ts
import axiosApi from '@/lib/axios';

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  provider: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
  dateOfBirth?: string;
  dateofBirth?: string;
  phone?: string;
  state?: string;
  pnadetails?: string;
  pandetails?: string;
  adharcard?: string;
  address?: string;
  profileComplete: boolean;
  forceComplete: boolean;
  missingFields: string[];
}

export interface UserSubscription {
  _id: string;
  user: string;
  productType: 'Portfolio' | 'Bundle';
  productId: string;
  portfolio: {
    _id: string;
    name: string;
  };
  lastPaidAt: string | null;
  missedCycles: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistory {
  _id: string;
  user: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'captured';
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioHolding {
  symbol: string;
  weight: number;
  sector: string;
  stockCapType: string;
  status: string;
  buyPrice: number;
  quantity: number;
  minimumInvestmentValueStock: number;
}

export interface PortfolioDownloadLink {
  linkType: string;
  linkUrl: string;
  linkDiscription: string;
  createdAt: string;
  _id: string;
  name: string;
  url: string;
}

export interface PortfolioYouTubeLink {
  link: string;
  createdAt: string;
}

export interface UserPortfolio {
  _id: string;
  name: string;
  description: string;
  cashBalance?: number;
  currentValue?: number;
  subscriptionFee: Array<{
    type: 'monthly' | 'yearly' | 'quarterly';
    price: number;
  }>;
  minInvestment?: number;
  durationMonths?: number;
  expiryDate?: string;
  PortfolioCategory: string;
  timeHorizon?: string;
  rebalancing?: string;
  lastRebalanceDate?: string;
  nextRebalanceDate?: string;
  monthlyContribution?: number;
  index?: string;
  details?: string;
  monthlyGains?: number;
  CAGRSinceInception?: number;
  oneYearGains?: number;
  compareWith?: string;
  holdings?: PortfolioHolding[];
  downloadLinks?: PortfolioDownloadLink[];
  youTubeLinks?: PortfolioYouTubeLink[];
  holdingsValue?: number;
  createdAt: string;
  message?: string;
}

class UserService {
  private readonly baseUrl = '/api/user';

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await axiosApi.get<UserProfile>(`${this.baseUrl}/profile`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw new Error('Unable to load profile. Please try again later.');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // Whitelist only fields the backend accepts to avoid 403 due to forbidden keys
      const allowedPayload: Record<string, any> = {};
      if (typeof profileData.fullName !== 'undefined') allowedPayload.fullName = profileData.fullName;
      if (typeof profileData.phone !== 'undefined') allowedPayload.phone = profileData.phone;
      if (typeof (profileData as any).pandetails !== 'undefined') allowedPayload.pandetails = (profileData as any).pandetails;
      if (typeof profileData.dateofBirth !== 'undefined') allowedPayload.dateofBirth = profileData.dateofBirth;
      if (typeof (profileData as any).address !== 'undefined') allowedPayload.address = (profileData as any).address;
      if (typeof (profileData as any).adharcard !== 'undefined') allowedPayload.adharcard = (profileData as any).adharcard;
      if (typeof (profileData as any).state !== 'undefined') allowedPayload.state = (profileData as any).state;

      const response = await axiosApi.put<UserProfile>(
        `${this.baseUrl}/profile`,
        allowedPayload,
        { headers: { accept: 'application/json', 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Check if profile is complete for checkout
   */
  async validateProfileForCheckout(): Promise<{ isValid: boolean; missingFields: string[]; message?: string }> {
    try {
      const profile = await this.getProfile();
      
      if (profile.missingFields && profile.missingFields.length > 0) {
        return {
          isValid: false,
          missingFields: profile.missingFields,
          message: `Please complete your profile by filling in: ${profile.missingFields.join(', ')}`
        };
      }
      
      if (!profile.profileComplete) {
        return {
          isValid: false,
          missingFields: [],
          message: 'Please complete your profile before proceeding to checkout'
        };
      }
      
      return {
        isValid: true,
        missingFields: []
      };
    } catch (error) {
      console.error('Failed to validate profile:', error);
      return {
        isValid: false,
        missingFields: [],
        message: 'Unable to validate profile. Please try again later.'
      };
    }
  }

  /**
   * Get user's active subscriptions
   */
  async getSubscriptions(): Promise<UserSubscription[]> {
    try {
      const response = await axiosApi.get<{
        bundleSubscriptions: UserSubscription[];
        individualSubscriptions: UserSubscription[];
        accessData: any;
      }>(`${this.baseUrl}/subscriptions`);
      
      // Combine both subscription arrays for backward compatibility
      return [...(response.data.bundleSubscriptions || []), ...(response.data.individualSubscriptions || [])];
    } catch (error) {
      console.error('Failed to fetch user subscriptions:', error);
      throw new Error('Unable to load subscriptions. Please try again later.');
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(): Promise<PaymentHistory[]> {
    try {
      const response = await axiosApi.get<PaymentHistory[]>(`${this.baseUrl}/payments`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      throw new Error('Unable to load payment history. Please try again later.');
    }
  }

  /**
   * Check if user has active subscription for a product
   */
  async hasActiveSubscription(productId: string, productType: 'Portfolio' | 'Bundle'): Promise<boolean> {
    try {
      const subscriptions = await this.getSubscriptions();
      return subscriptions.some(
        sub => sub.productId === productId && 
               sub.productType === productType && 
               sub.isActive
      );
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  /**
   * Get subscription summary
   */
  async getSubscriptionSummary(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    totalSpent: number;
  }> {
    try {
      const [subscriptions, payments] = await Promise.all([
        this.getSubscriptions(),
        this.getPaymentHistory()
      ]);

      const activeSubscriptions = subscriptions.filter(sub => sub.isActive).length;
      const expiredSubscriptions = subscriptions.filter(sub => !sub.isActive).length;
      
      const totalSpent = payments
        .filter(payment => payment.status === 'captured')
        .reduce((total, payment) => total + payment.amount, 0) / 100; // Convert from paise to rupees

      return {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions,
        expiredSubscriptions,
        totalSpent
      };
    } catch (error) {
      console.error('Failed to get subscription summary:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        expiredSubscriptions: 0,
        totalSpent: 0
      };
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amountInPaise: number): string {
    const amountInRupees = amountInPaise / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInRupees);
  }

  /**
   * Get subscription status text
   */
  getSubscriptionStatusText(subscription: UserSubscription): string {
    if (subscription.isActive) {
      return 'Active';
    } else if (subscription.missedCycles >= 3) {
      return 'Expired';
    } else if (subscription.missedCycles > 0) {
      return 'Grace Period';
    } else {
      return 'Inactive';
    }
  }

  /**
   * Get subscription status color
   */
  getSubscriptionStatusColor(subscription: UserSubscription): string {
    if (subscription.isActive) {
      return 'text-green-600 bg-green-100';
    } else if (subscription.missedCycles >= 3) {
      return 'text-red-600 bg-red-100';
    } else if (subscription.missedCycles > 0) {
      return 'text-yellow-600 bg-yellow-100';
    } else {
      return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Calculate days until next payment (for active subscriptions)
   */
  getDaysUntilNextPayment(subscription: UserSubscription): number | null {
    if (!subscription.isActive || !subscription.lastPaidAt) return null;

    const lastPaid = new Date(subscription.lastPaidAt);
    const nextPayment = new Date(lastPaid);
    nextPayment.setMonth(nextPayment.getMonth() + 1); // Assuming monthly billing

    const now = new Date();
    const diffTime = nextPayment.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Get user's portfolio access list
   */
  async getPortfolioAccess(): Promise<string[]> {
    try {
      const subscriptions = await this.getSubscriptions();
      return subscriptions
        .filter(sub => sub.isActive)
        .map(sub => sub.portfolio._id);
    } catch (error) {
      console.error('Failed to get portfolio access:', error);
      return [];
    }
  }

  /**
   * Format subscription duration
   */
  formatSubscriptionDuration(createdAt: string): string {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Get user portfolios with access control
   */
  async getUserPortfolios(params?: {
    startDate?: string;
    endDate?: string;
    category?: 'basic' | 'premium';
  }): Promise<UserPortfolio[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.category) queryParams.append('category', params.category);
      
      const url = `${this.baseUrl}/portfolios${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await axiosApi.get<UserPortfolio[]>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user portfolios:', error);
      throw new Error('Unable to load portfolios. Please try again later.');
    }
  }
}

export const userService = new UserService();