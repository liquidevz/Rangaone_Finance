'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { InnerPageHeader } from '@/components/inner-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { tipsService } from '@/services/tip.service';
import { useAuth } from '@/components/auth/auth-context';
import { subscriptionService, type SubscriptionAccess } from '@/services/subscription.service';
import { useToast } from '@/components/ui/use-toast';
import { stockSymbolCacheService } from '@/services/stock-symbol-cache.service';
import { userPortfolioService } from '@/services/user-portfolio.service';

import { Tip } from '@/services/tip.service';

interface TipCardData {
  id: string;
  portfolioId?: string;
  portfolioName?: string;
  date: string;
  stockName: string;
  exchange: string;
  weightage?: number;
  buyRange: string;
  action: 'HOLD' | 'Partial Profit Booked' | 'BUY' | 'SELL';
  category: 'basic' | 'premium';
  title: string;
  message?: string;
  status?: string;
  targetPercentage?: number;
  exitStatus?: string;
  exitStatusPercentage?: number;
}

const getTipColorScheme = (
  category: 'basic' | 'premium',
  isModelPortfolio: boolean = true
) => {
  // Always use model portfolio color scheme for this page
  return {
    gradient: "linear-gradient(90deg, #00B7FF 0%, #85D437 100%)",
    textColor: "#047857",
    bgGradient: "linear-gradient(90deg, #e0f7ff 0%, #f1fef2 100%)",
    borderColor: "#10B981",
    badge: {
      bg: "#000000",
      text: "#FFFFFF",
    },
  };
};

const TipCard = ({
  tip,
  onClick,
  subscriptionAccess,
}: {
  tip: TipCardData;
  onClick?: () => void;
  subscriptionAccess?: SubscriptionAccess;
}) => {
  const colorScheme = getTipColorScheme(tip.category, true);

  const hasAccess = () => {
    if (!subscriptionAccess) {
      return false;
    }

    // For model portfolios, check portfolio access
    if (tip.portfolioId) {
      return subscriptionAccess.portfolioAccess.includes(tip.portfolioId);
    }

    return subscriptionAccess.hasPremium || subscriptionAccess.hasBasic;
  };

  const canAccessTip = hasAccess();
  const shouldBlurContent = !canAccessTip;

  return (
    <div
      className="relative w-full h-full rounded-xl transition-all duration-500 cursor-pointer flex-shrink-0 hover:shadow-lg"
      style={{
        background: colorScheme.gradient,
        padding: '4px',
      }}
      onClick={canAccessTip ? onClick : undefined}
    >
      <div className="w-full h-full bg-white rounded-[10px] p-4 lg:p-3 flex flex-col justify-between relative overflow-hidden">
        <div
          className={cn(
            'w-full h-full flex flex-col justify-between relative z-10',
            shouldBlurContent && 'blur-md'
          )}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 lg:gap-1.5 mb-1.5 lg:mb-1">
                {/* Model Portfolio Badge - Using model portfolio colors */}
                <div className="relative bg-gradient-to-r from-[#00B7FF] to-[#85D437] p-[3px] rounded-xl overflow-hidden">
                  <div className="bg-black text-sm lg:text-xs font-bold rounded-lg px-2.5 lg:px-2 py-1 lg:py-0.5">
                    {tip.portfolioName ? (
                      <span className="bg-gradient-to-r from-[#00B7FF] to-[#85D437] font-bold bg-clip-text text-transparent">
                        {tip.portfolioName.replace(/\bportfolio\b/i, "").trim() || tip.portfolioName}
                      </span>
                    ) : (
                      <span className="bg-gradient-to-r from-[#00B7FF] to-[#85D437] bg-clip-text text-transparent font-bold">
                        Model Portfolio
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xl lg:text-lg font-bold text-black mt-0.5 truncate">
                {tip.stockName}
              </div>
              <p className="text-sm lg:text-xs text-gray-500">{tip.exchange}</p>
            </div>
            
            {/* Target/Status section with model portfolio colors */}
            <div className={`relative p-[4px] rounded-xl flex-shrink-0 bg-gradient-to-r from-[#00B7FF] to-[#85D437]`}>
              <div className="rounded-lg px-2.5 py-1.5 text-center min-w-[50px] bg-cyan-50">
                <p className="text-[15px] lg:text-xs mb-0 leading-tight font-bold text-gray-700">
                  {tip.status === 'closed' ? tip.exitStatus : 'Weightage'}
                </p>
                <p className="text-right text-[30px] lg:text-xl font-bold leading-tight text-black">
                  {tip.status === 'closed' ? `${tip.exitStatusPercentage}%` : `${tip.weightage || 0}%`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-3 lg:mt-2 gap-3 lg:gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] lg:text-xs text-black-500 mb-1 leading-tight font-medium">
                Buy Range
              </p>
              <div className="text-xl lg:text-lg font-bold text-black truncate">
                {tip.buyRange}
              </div>
            </div>
            <div className="flex-shrink-0">
              <p className="text-sm lg:text-xs text-black mb-1 leading-tight font-medium text-right">
                Action
              </p>
              <div className="px-3 lg:px-2 py-1.5 lg:py-1 rounded text-base lg:text-sm font-medium bg-gray-700 text-[#FFFFF0] inline-block whitespace-nowrap">
                {tip.action}
              </div>
            </div>
          </div>

          {/* Message if available */}
          {tip.message && (
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <div className="text-xs text-gray-600 leading-tight line-clamp-2">
                {tip.message}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Access overlay */}
      {shouldBlurContent && (
        <div className="absolute inset-0 bg-black bg-opacity-10 rounded-[10px] flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-4 text-center shadow-lg max-w-[200px]">
            <p className="text-sm text-gray-600 mb-3">
              Model Portfolio subscription required
            </p>
            <button
              className="px-4 py-1.5 rounded text-sm font-medium text-[#FFFFF0] bg-gradient-to-r from-[#00B7FF] to-[#85D437] hover:opacity-90 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = "/model-portfolios";
              }}
            >
              Subscribe Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ModelPortfolioAllRecommendationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | undefined>();
  const [userPortfolios, setUserPortfolios] = useState<string[]>([]);
  const [stockSymbols, setStockSymbols] = useState<Map<string, string>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const tipsPerPage = 999;
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'Active',
    action: 'all',
    portfolioId: 'all',
    stockId: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    horizon: 'Long Term' as string,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch user's available portfolios
  const fetchUserPortfolios = async (): Promise<string[]> => {
    try {
      const portfolios = await userPortfolioService.getSubscribedPortfolios();
      const portfolioIds = portfolios.map(p => p._id);
      return portfolioIds;
    } catch (error) {
      console.error('Error fetching user portfolios:', error);
      return [];
    }
  };

  // Fetch all model portfolio tips using the portfolio-specific endpoint
  const fetchTips = async () => {
    try {
      setLoading(true);
       
       // First, get user's available portfolios
       const availablePortfolioIds = await fetchUserPortfolios();
       setUserPortfolios(availablePortfolioIds);
       
       // Use the portfolio-specific tips endpoint which returns all portfolio-associated tips
       const portfolioTips = await tipsService.getPortfolioTips({});
       const tipsArray = Array.isArray(portfolioTips) ? portfolioTips : [];
       
       // Filter tips to only show those from portfolios the user has access to
       const validTips = tipsArray.filter(tip => {
         // Must have portfolio field
         if (!tip.portfolio) return false;
         
         let portfolioId: string;
         
         // If string, must be non-empty
         if (typeof tip.portfolio === 'string') {
           if (!tip.portfolio.trim().length) return false;
           portfolioId = tip.portfolio;
         }
         // If object, must have valid _id
         else if (typeof tip.portfolio === 'object') {
           if (!tip.portfolio._id || !tip.portfolio._id.trim().length) return false;
           portfolioId = tip.portfolio._id;
         }
         else {
           return false;
         }
         
         // Only include tips from portfolios the user has access to
         return availablePortfolioIds.includes(portfolioId);
       });
       
       setTips(validTips);
       
       // Fetch stock symbols in the background (non-blocking)
       fetchStockSymbols(validTips);
    } catch (error) {
      console.error('Error fetching model portfolio tips:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch model portfolio tips. Please try again later.',
        variant: 'destructive',
      });
      setTips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      // Wait for cache service to initialize
      await stockSymbolCacheService.waitForInitialization();
      
      // Load subscription access
      try {
        const access = await subscriptionService.getSubscriptionAccess(true);
        setSubscriptionAccess(access);
      } catch (error) {
        console.error('Failed to load subscription access:', error);
      }
      
      // Load tips only once
      await fetchTips();
    }
    
    loadInitialData();
  }, []); // Remove filters dependency to load tips only once

  // Re-convert tips when stock symbols are updated (progressive updates)
  useEffect(() => {
    if (tips.length > 0 && !loading && stockSymbols.size > 0) {
      // Force re-render by updating tips state to trigger convertTipToCardData with new symbols
      setTips(prevTips => [...prevTips]);
    }
  }, [stockSymbols, loading]);

  // Filter tips based on current filters with comprehensive search
  const filteredTips = useMemo(() => {
    const filtered = tips.filter(tip => {
      // CRITICAL: Only show tips from portfolios the user has access to
      if (!tip.portfolio) {
        return false;
      }
      
      let portfolioId: string;
      
      // If portfolio is a string (ID), it should be a valid non-empty string
      if (typeof tip.portfolio === 'string') {
        if (!tip.portfolio.trim().length) return false;
        portfolioId = tip.portfolio;
      }
      // If portfolio is an object, it should have a valid _id
      else if (typeof tip.portfolio === 'object') {
        if (!tip.portfolio._id || !tip.portfolio._id.trim().length) return false;
        portfolioId = tip.portfolio._id;
      }
      else {
        return false;
      }
      
      // Only show tips from portfolios the user has access to
      if (!userPortfolios.includes(portfolioId)) {
        return false;
      }

      // Search functionality - search in multiple fields
      if (filters.stockId) {
        const searchTerm = filters.stockId.toLowerCase();
        const stockName = stockSymbols.get(tip.stockId || '') || tip.stockId || '';
        const searchableText = [
          tip.stockId,
          stockName,
          tip.title,
          tip.description
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }
      
      // Horizon filter (if horizon field exists)
      if (filters.horizon && tip.horizon && tip.horizon !== filters.horizon) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && tip.status?.toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }
      
      // Category filter
      if (filters.category !== 'all' && tip.category !== filters.category) {
        return false;
      }

      // Portfolio filter
      if (filters.portfolioId !== 'all') {
        const portfolioId = typeof tip.portfolio === 'string' ? tip.portfolio : tip.portfolio?._id;
        if (portfolioId !== filters.portfolioId) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.startDate) {
        const tipDate = new Date(tip.createdAt);
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (tipDate < startDate) {
          return false;
        }
      }
      
      if (filters.endDate) {
        const tipDate = new Date(tip.createdAt);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (tipDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
    
    // Reset to first page when filters change
    setCurrentPage(1);
    return filtered;
  }, [tips, filters, stockSymbols, userPortfolios]);

  // Convert tips to card format
  const convertTipsToCardFormat = (apiTips: Tip[]): TipCardData[] => {
    return apiTips.map((tip) => {
      // Get stock name from symbols map or fallback
      let stockName = stockSymbols.get(tip.stockId || "");
      if (!stockName && tip.title) {
        const titleParts = tip.title.split(/[:\-]/);
        const potentialName = titleParts[0]?.trim();
        if (potentialName && potentialName.length > 2) {
          stockName = potentialName;
        }
      }
      if (!stockName && tip.stockId) {
        stockName = tip.stockId;
      }
      if (!stockName) {
        stockName = "Unknown Stock";
      }

      // Extract portfolio name and ID
      let portfolioName: string | undefined;
      let portfolioId: string | undefined;
      
      if (typeof tip.portfolio === "string") {
        portfolioId = tip.portfolio;
        portfolioName = undefined; // Will need to be fetched separately if needed
      } else if (tip.portfolio && typeof tip.portfolio === "object") {
        portfolioId = tip.portfolio._id;
        portfolioName = tip.portfolio.name;
      }

      return {
        id: tip._id,
        portfolioId: portfolioId,
        portfolioName,
        date: tip.status?.toLowerCase() === 'closed' ? tip.updatedAt : tip.createdAt,
        stockName,
        exchange: "NSE",
        buyRange: tip.buyRange || "₹ 1000 - 1050",
        action: (tip.action as "HOLD" | "Partial Profit Booked" | "BUY" | "SELL") || "BUY",
        category: tip.category || "basic",
        title: tip.title,
        message: tip.message,
        status: tip.status?.toLowerCase(),
        targetPercentage: tip.targetPercentage ? parseFloat(tip.targetPercentage.replace("%", "")) : undefined,
        weightage: tip.mpWeightage,
        exitStatus: tip.exitStatus,
        exitStatusPercentage: tip.exitStatusPercentage ? parseFloat(tip.exitStatusPercentage.replace("%", "")) : undefined,
      };
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredTips.length / tipsPerPage);
  const startIndex = (currentPage - 1) * tipsPerPage;
  const endIndex = startIndex + tipsPerPage;
  const currentTips = filteredTips.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: 'all',
      status: 'all', // Show all tips when clearing filters
      action: 'all',
      portfolioId: 'all',
      stockId: '',
      startDate: null,
      endDate: null,
      horizon: 'Long Term',
    });
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  // Navigate to tip details
  const handleTipClick = (tipId: string, portfolioId?: string) => {
    if (portfolioId) {
      router.push(`/model-portfolios/${portfolioId}/tips/${tipId}`);
    }
  };

  // Fetch stock symbols for tips that have stockId using global cache (non-blocking)
  const fetchStockSymbols = async (apiTips: Tip[]) => {
    const tipsWithStockId = apiTips.filter((tip) => tip.stockId);
    if (tipsWithStockId.length === 0) return;

    try {
      const stockIds = Array.from(new Set(tipsWithStockId.map((tip) => 
        tip.stockId!.replace(/\.[A-Z]+$/, '').trim()
      )));

      const symbolResults = await stockSymbolCacheService.getMultipleSymbols(stockIds);
      setStockSymbols(symbolResults);
    } catch (error) {
      console.error("Failed to fetch stock symbols:", error);
    }
  };

  // Get unique portfolios for filter dropdown
  const availablePortfolios = useMemo(() => {
    const portfolioMap = new Map();
    tips.forEach(tip => {
      const portfolioId = typeof tip.portfolio === 'string' ? tip.portfolio : tip.portfolio?._id;
      const portfolioName = typeof tip.portfolio === 'object' ? tip.portfolio?.name : 'Unknown Portfolio';
      
      // Only add portfolios with valid IDs and names
      if (portfolioId && portfolioId.trim().length > 0 && !portfolioMap.has(portfolioId)) {
        portfolioMap.set(portfolioId, portfolioName || `Portfolio ${portfolioId.substring(0, 8)}...`);
      }
    });
    
    const portfolios = Array.from(portfolioMap.entries()).map(([id, name]) => ({ id, name }));
    console.log('Available portfolios for filter:', portfolios);
    return portfolios;
  }, [tips]);

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to view model portfolio recommendations.</p>
          <Button onClick={() => router.push('/login')}>Log In</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <InnerPageHeader title="MODEL PORTFOLIO RECOMMENDATIONS" subtitle="All expert recommendations for model portfolios" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <InnerPageHeader title="MODEL PORTFOLIO RECOMMENDATIONS" subtitle="All expert recommendations for model portfolios" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters Section - Matching rangaone-wealth UI */}
        <div className="mb-8">
          {/* Top Row: Search Bar + Checkboxes */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full mb-4 gap-4">
            {/* Search Bar and Button */}
            <div className="flex items-center w-full lg:max-w-2xl">
              <input
                type="text"
                placeholder="Enter Stock Name"
                value={filters.stockId}
                onChange={e => handleFilterChange('stockId', e.target.value)}
                className="h-12 lg:h-14 w-full rounded-[12px] lg:rounded-[16px] border-[2px] border-gray-400 px-4 lg:px-6 font-medium text-base lg:text-lg bg-white placeholder:text-gray-400 focus:outline-none"
                style={{ boxShadow: 'none' }}
              />
              <button
                className="ml-2 lg:ml-4 h-12 lg:h-14 px-4 lg:px-8 rounded-[12px] lg:rounded-[16px] bg-[#101e5a] text-white font-bold text-base lg:text-lg border-[2px] border-[#1e3a8a] focus:outline-none focus:ring-0 transition-colors whitespace-nowrap"
                style={{ boxShadow: 'none' }}
                onClick={() => {/* search logic if needed */}}
              >
                Search
              </button>
            </div>
            
            {/* Live/Closed Calls Checkboxes */}
            <div className="flex items-center justify-center lg:ml-8 gap-4 lg:gap-6">
              <label className="flex items-center gap-3 cursor-pointer select-none transition-all duration-200 hover:scale-105">
                <input
                  type="checkbox"
                  checked={filters.status === 'Active'}
                  onChange={() => handleFilterChange('status', filters.status === 'Active' ? 'all' : 'Active')}
                  className="w-5 h-5 border-2 border-gray-400 rounded-[6px] accent-[#101e5a] focus:ring-0 focus:outline-none transition-all duration-200 hover:border-[#101e5a]"
                  style={{ boxShadow: 'none' }}
                />
                <span className={`font-bold text-base lg:text-lg transition-colors duration-200 ${
                  filters.status === 'Active' 
                    ? 'text-[#101e5a]' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}>
                  Live Calls
                </span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer select-none transition-all duration-200 hover:scale-105">
                <input
                  type="checkbox"
                  checked={filters.status === 'Closed'}
                  onChange={() => handleFilterChange('status', filters.status === 'Closed' ? 'all' : 'Closed')}
                  className="w-5 h-5 border-2 border-gray-400 rounded-[6px] accent-[#101e5a] focus:ring-0 focus:outline-none transition-all duration-200 hover:border-[#101e5a]"
                  style={{ boxShadow: 'none' }}
                />
                <span className={`font-bold text-base lg:text-lg transition-colors duration-200 ${
                  filters.status === 'Closed' 
                    ? 'text-[#101e5a]' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}>
                  Closed Calls
                </span>
              </label>
            </div>
          </div>

          {/* Filter Pills Row */}
          <div className="flex items-center mb-2 gap-2">
            <span className="font-bold text-black text-base lg:text-xl mr-2">Filter by :</span>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Portfolio Filter */}
              {availablePortfolios.length > 0 && (
                <Select value={filters.portfolioId} onValueChange={(value) => handleFilterChange('portfolioId', value)}>
                  <SelectTrigger className="rounded-[12px] lg:rounded-[16px] border-2 font-bold text-base lg:text-lg lg:px-7 py-1 lg:py-1.5 min-w-[120px]">
                    <SelectValue placeholder="Portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Portfolios</SelectItem>
                    {availablePortfolios.map(portfolio => (
                      <SelectItem key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex w-full border-b-2 border-gray-300 mt-2">
            <button
              className={`flex-1 text-center font-bold text-sm sm:text-lg lg:text-2xl py-2 lg:py-3 cursor-pointer transition-all duration-200 hover:bg-gray-50
                ${filters.horizon === 'Long Term' 
                  ? 'text-[#101e5a] border-b-4 border-[#101e5a] bg-white shadow-sm' 
                  : 'text-gray-400 border-b-4 border-transparent hover:text-gray-600'
                }`}
              onClick={() => handleFilterChange('horizon', 'Long Term')}
            >
              <span className="hidden sm:inline">Long Term</span>
              <span className="sm:hidden">Long</span>
            </button>
            <button
              className={`flex-1 text-center font-bold text-sm sm:text-lg lg:text-2xl py-2 lg:py-3 cursor-pointer transition-all duration-200 hover:bg-gray-50
                ${filters.horizon === 'Short Term' 
                  ? 'text-[#101e5a] border-b-4 border-[#101e5a] bg-white shadow-sm' 
                  : 'text-gray-400 border-b-4 border-transparent hover:text-gray-600'
                }`}
              onClick={() => handleFilterChange('horizon', 'Short Term')}
            >
              <span className="hidden sm:inline">Short Term</span>
              <span className="sm:hidden">Short</span>
            </button>
            <button
              className={`flex-1 text-center font-bold text-sm sm:text-lg lg:text-2xl py-2 lg:py-3 cursor-pointer transition-all duration-200 hover:bg-gray-50
                ${filters.horizon === 'Swing' 
                  ? 'text-[#101e5a] border-b-4 border-[#101e5a] bg-white shadow-sm' 
                  : 'text-gray-400 border-b-4 border-transparent hover:text-gray-600'
                }`}
              onClick={() => handleFilterChange('horizon', 'Swing')}
            >
              Swing
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h3 className="text-base lg:text-lg font-semibold">
            {filteredTips.length} Recommendation{filteredTips.length !== 1 ? 's' : ''} Found
          </h3>
          <Button 
            onClick={clearFilters} 
            variant="outline" 
            size="sm"
            className="text-sm w-full sm:w-auto"
          >
            Clear All Filters
          </Button>
        </div>

        {/* Tips Grid */}
        {userPortfolios.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No model portfolios available.</p>
              <p className="text-gray-400 text-sm mb-6">Subscribe to model portfolios to view recommendations.</p>
              <Button onClick={() => router.push('/model-portfolios')}>View Portfolios</Button>
            </CardContent>
          </Card>
        ) : filteredTips.length > 0 ? (
          <>
            {/* Mobile/Tablet Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:hidden gap-6 md:p-0 p-5 group">
              {currentTips.map(tip => {
                const cardData = convertTipsToCardFormat([tip])[0];
                return (
                  <div key={tip._id} className="h-48 sm:h-52 md:h-56 transition-all duration-300 group-hover:opacity-50 hover:!opacity-100 hover:scale-105 hover:z-10 relative">
                    <TipCard
                      tip={cardData}
                      onClick={() => handleTipClick(tip._id, cardData.portfolioId)}
                      subscriptionAccess={subscriptionAccess}
                    />
                  </div>
                );
              })}
            </div>

            {/* Desktop List View */}
            <div className="hidden xl:block space-y-2">
              {currentTips.map((tip) => {
                const cardData = convertTipsToCardFormat([tip])[0];
                const hasAccess = () => {
                  if (!subscriptionAccess) return false;
                  if (subscriptionAccess.hasPremium) return true;
                  if (cardData.category === 'premium') return false;
                  if (cardData.category === 'basic') return subscriptionAccess.hasBasic;
                  if (cardData.portfolioId) return subscriptionAccess.portfolioAccess.includes(cardData.portfolioId);
                  return true;
                };
                const canAccessTip = hasAccess();
                const shouldBlurContent = !canAccessTip;

                return (
                  <div
                    key={tip._id}
                    className="relative w-full h-full rounded-xl transition-all duration-300 cursor-pointer flex-shrink-0 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1"
                    style={{
                      background: 'linear-gradient(90deg, #00B7FF 0%, #85D437 100%)',
                      padding: '2px',
                    }}
                    onClick={canAccessTip ? () => handleTipClick(tip._id, cardData.portfolioId) : undefined}
                  >
                    <div className="w-full h-full bg-white rounded-[10px] py-2 px-8">
                    <div className={cn('flex items-center justify-between', shouldBlurContent && 'blur-sm')}>
                      {/* Left: Portfolio + Stock Name */}
                      <div className="flex items-center gap-3">
                        <div className="relative bg-gradient-to-r from-[#00B7FF] to-[#85D437] p-[3px] rounded-xl overflow-hidden">
                          <div className="bg-black text-xs font-semibold rounded-lg py-1 px-2 text-center min-w-[80px]">
                            <span className="bg-gradient-to-r from-[#00B7FF] to-[#85D437] font-bold bg-clip-text text-transparent">
                              {cardData.portfolioName ? cardData.portfolioName.replace(/\bportfolio\b/i, "").trim() : "Model Portfolio"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-black">{cardData.stockName}</div>
                          <div className="text-xs text-gray-500">{cardData.exchange}</div>
                        </div>
                      </div>

                      {/* Right: Action + Date + Target */}
                      <div className="flex items-center gap-6">
                        <div className="text-center w-20">
                          <div className="text-[10px] text-gray-600">Action</div>
                          <div className="text-lg font-bold text-black uppercase -mt-1">
                            {cardData.status === 'closed' ? cardData.exitStatus : cardData.action}
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-gray-600 w-28 text-center whitespace-nowrap">
                          {new Date(cardData.date).toLocaleDateString('en-GB')} | {new Date(cardData.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                        <div className="relative p-[2px] rounded-lg flex-shrink-0 w-20 bg-gradient-to-r from-[#00B7FF] to-[#85D437]">
                          <div className="rounded-md px-2 py-1 text-center h-full bg-cyan-50">
                            <p className="text-[10px] mb-0 leading-tight font-bold text-gray-700">
                              {cardData.status === 'closed' ? cardData.exitStatus : 'Weightage'}
                            </p>
                            <p className="text-center text-lg font-bold leading-tight text-black">
                              {cardData.status === 'closed' ? `${cardData.exitStatusPercentage}%` : `${cardData.weightage || 0}%`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Subscription Overlay */}
                    {shouldBlurContent && (
                      <div className="absolute inset-0 bg-white bg-opacity-95 rounded-xl flex items-center justify-center z-20">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-3">
                            Model Portfolio subscription required
                          </p>
                          <button
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#00B7FF] to-[#85D437] hover:opacity-90 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = "/model-portfolios";
                            }}
                          >
                            Subscribe Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 sm:gap-2 mt-8 flex-wrap">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={index} className="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">...</span>
                  ) : (
                    <Button
                      key={index}
                      onClick={() => setCurrentPage(page as number)}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      className="px-2 sm:px-3 py-2 min-w-[32px] sm:min-w-[40px] text-xs sm:text-sm"
                    >
                      {page}
                    </Button>
                  )
                ))}
                
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">No recommendations found matching your filters.</p>
              <Button onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
