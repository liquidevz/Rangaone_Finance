export interface User {
  id: string;
  name: string;
  company: string;
  avatar?: string;
}

export interface StockData {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  target: number;
  timeHorizon: string;
  closed?: boolean;
  returnPercentage?: number;
  buyRange?: { min: number; max: number };
  targetPrice?: { min: number; max: number };
  addMoreAt?: { min: number; max: number };
  recommendedDate?: string;
  ltp?: { price: number; change: number; changePercent: number };
  whyBuy?: string[];
  category?: string;
}

export interface Stock {
  symbol: string;
  allocation: number;
  currentPrice: number;
  purchasePrice: number;
}

export interface Holding {
  symbol: string;
  weight: number;
  sector: string;
  stockCapType: string;
  status: string;
  buyPrice: number;
  minimumInvestmentValueStock: number;
  quantity: number;
  // Additional fields that may come from backend
  currentPrice?: number;
  previousPrice?: number;
  change?: number;
  changePercent?: number;
  currentValue?: number;
  remainingCash?: number;
  allocatedAmount?: number;
}

export interface DownloadLink {
  link: string;
  createdAt: string;
}

export interface YoutubeLink {
  link: string;
  createdAt: string;
}

export interface Portfolio {
  data: any;
  portfolio: any;
  _id: string;
  name: string;
  description: string;
  cashRemaining: number;
  subscriptionFee: number;
  minInvestment: number;
  durationMonths: number;
  expiryDate: string;
  PortfolioCategory: string;
  holdings: Holding[];
  downloadLinks: DownloadLink[];
  youTubeLinks?: YoutubeLink[];
  monthlyGains?: number;
  oneYearGains?: number;
  totalInvestment?: number;
  currentValue?: number;
  isPurchased?: boolean;
  cagr?: number;
  returns?: number;
  message?: string; // For subscription access control - if present, user needs to subscribe
}

export interface TipDownloadLink {
  linkType: string;
  linkUrl: string;
  linkDiscription: string;
  createdAt: string;
  _id: string;
  name: string;
  url: string;
}

export interface Tip {
  analysistConfidence: any;
  _id: string;
  portfolio: string | {
    name: string;
    description: string;
    _id: string;
    [key: string]: any;
  };
  title: string;
  stockId: string;
  category?: 'basic' | 'premium';
  content: string | { key: string; value: string; _id?: string; }[];
  description: string;
  status: string;
  action?: string;
  buyRange: string;
  targetPrice: string;
  targetPercentage?: string;
  addMoreAt: string;
  tipUrl: string;
  exitPrice?: string;
  exitStatus?: string;
  exitStatusPercentage?: string;
  horizon: string;
  downloadLinks: TipDownloadLink[];
  createdAt: string;
  updatedAt: string;
  message?: string;
}

export interface LocalCartItem {
  portfolioId: string;
  quantity: number;
  addedAt: string;
  itemType: "portfolio" | "bundle";
  bundleId?: string;
  subscriptionType?: "monthly" | "quarterly" | "yearly";
  itemData: any; // To store essential product details for display without fetching again
  planCategory?: "basic" | "premium" | "individual"; // Added to track basic/premium status
}

// eMandate API Types
export interface EmandateRequest {
  productType: 'Bundle' | 'Portfolio';
  productId: string;
  emandateType: 'monthly' | 'quarterly' | 'yearly';
  couponCode?: string;
}

export interface EmandateSuccessResponse {
  success: true;
  subscriptionId: string;
  setupUrl: string;
  amount: number;
  emandateType: 'monthly' | 'quarterly' | 'yearly';
  interval: number;
  status: string;
}

export interface EmandateErrorResponse {
  success: false;
  error: string;
  message: string;
}

// eMandate Verification Types
export interface VerifyEmandateRequest {
  subscription_id: string;
}

export interface VerifyEmandateSuccessResponse {
  success: true;
  message: string;
  subscriptionStatus: 'pending' | 'created' | 'active' | 'authenticated' | 'failed' | 'cancelled';
  activatedSubscriptions?: number;
  nextSteps?: string;
}

export interface VerifyEmandateErrorResponse {
  success: false;
  message: string;
  subscriptionStatus?: 'pending' | 'created' | 'active' | 'authenticated' | 'failed' | 'cancelled' | 'timeout';
}
