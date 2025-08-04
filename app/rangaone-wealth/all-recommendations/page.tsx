'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
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
  isModelPortfolio: boolean = false
) => {
  if (isModelPortfolio) {
    return {
      gradient: 'linear-gradient(90deg, #00B7FF 0%, #85D437 100%)',
      textColor: '#047857',
      bgGradient: 'linear-gradient(90deg, #e0f7ff 0%, #f1fef2 100%)',
      borderColor: '#10B981',
      badge: {
        bg: '#000000',
        text: '#FFFFFF',
      },
    };
  } else if (category === 'premium') {
    return {
      gradient: 'linear-gradient(90deg, #FFD700 30%, #3333330A 90%)',
      textColor: '#92400E',
      bgGradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      borderColor: '#F59E0B',
      badge: {
        bg: '#92400E',
        text: 'linear-gradient(to right, #92400E, #FEF3C7)',
      },
    };
  } else {
    return {
      gradient: 'linear-gradient(90deg, #595CFFCC 30%, #3333330A 90%)',
      textColor: '#1E40AF',
      bgGradient: 'linear-gradient(135deg, #18657B 0%, #131859 100%)',
      borderColor: '#595CFFCC',
      badge: {
        bg: '#18657B',
        text: '#DBEAFE',
      },
    };
  }
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
  const colorScheme = getTipColorScheme(tip.category);

  const hasAccess = () => {
    if (!subscriptionAccess) {
      return false;
    }

    if (subscriptionAccess.hasPremium) {
      return true;
    }

    if (tip.category === 'premium') {
      return false;
    } else if (tip.category === 'basic') {
      return subscriptionAccess.hasBasic;
    }

    if (tip.portfolioId) {
      return subscriptionAccess.portfolioAccess.includes(tip.portfolioId);
    }

    return true;
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
                <div className={`p-[4px] rounded-xl inline-block shadow-sm whitespace-nowrap ${
                  tip.category === 'premium' 
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                    : 'bg-gradient-to-r from-[#A0A2FF] to-[#6E6E6E]'
                }`}>
                  <div className={`text-sm lg:text-xs font-semibold rounded-lg px-2.5 lg:px-2 py-1 lg:py-0.5 ${
                    tip.category === 'premium' 
                      ? 'bg-gray-800 text-yellow-400' 
                      : 'bg-gradient-to-r from-[#396C87] to-[#151D5C] text-white'
                  }`}>
                    {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}
                  </div>
                </div>
              </div>

              <div className="text-xl lg:text-lg font-bold text-black mt-0.5 truncate">
                {tip.stockName}
              </div>
              <p className="text-sm lg:text-xs text-gray-500">{tip.exchange}</p>
            </div>
            <div className={`relative p-[4px] rounded-xl flex-shrink-0 ${
              tip.status === 'closed'
                ? (tip.exitStatus?.toLowerCase().includes('loss') || (tip.exitStatusPercentage && tip.exitStatusPercentage < 0))
                  ? 'bg-gradient-to-r from-[#627281] to-[#A6AFB6]' 
                  : 'bg-[#219612]'
                : 'bg-[#219612]'
            }`}>
              <div className={`rounded-lg px-2.5 py-1.5 text-center min-w-[50px] ${
                tip.status === 'closed'
                  ? (tip.exitStatus?.toLowerCase().includes('loss') || (tip.exitStatusPercentage && tip.exitStatusPercentage < 0))
                    ? 'bg-gradient-to-tr from-[#A6AFB6] to-[#627281]' 
                    : 'bg-gradient-to-r from-green-50 to-green-100'
                  : 'bg-gradient-to-r from-green-50 to-green-100'
              }`}>
                <p className={`text-[15px] lg:text-xs mb-0 leading-tight font-bold ${
                  tip.status === 'closed'
                    ? (tip.exitStatus?.toLowerCase().includes('loss') || (tip.exitStatusPercentage && tip.exitStatusPercentage < 0))
                      ? 'text-white' 
                      : 'text-black'
                    : 'text-black'
                }`}>
                  {tip.status === 'closed' ? tip.exitStatus : 'Target'}
                </p>
                <p className={`text-right text-[30px] lg:text-xl font-bold leading-tight ${
                  tip.status === 'closed'
                    ? (tip.exitStatus?.toLowerCase().includes('loss') || (tip.exitStatusPercentage && tip.exitStatusPercentage < 0))
                      ? 'text-white' 
                      : 'text-black'
                    : 'text-black'
                }`}>
                  {tip.status === 'closed' ? `${tip.exitStatusPercentage}%` : `${tip.targetPercentage}%`}
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

        </div>
      </div>

      {shouldBlurContent && (
        <div className="absolute inset-0 bg-black bg-opacity-10 rounded-[10px] flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-4 text-center shadow-lg max-w-[200px]">
            <p className="text-sm text-gray-600 mb-3">
              {tip.category === 'premium'
                ? 'Premium subscription required'
                : 'Basic subscription required'}
            </p>
            <button
              className={cn(
                'px-4 py-1.5 rounded text-sm font-medium text-[#FFFFF0] transition-all',
                tip.category === 'premium'
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                  : 'bg-gradient-to-r from-[#18657B] to-[#131859] hover:from-blue-600 hover:to-blue-700'
              )}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href =
                  tip.category === 'premium'
                    ? '/premium-subscription'
                    : '/basic-subscription';
              }}
            >
              {tip.category === 'premium' ? 'Get Premium' : 'Get Basic'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AllRecommendationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | undefined>();
  const [stockSymbols, setStockSymbols] = useState<Map<string, string>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const tipsPerPage = 9;
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'Active',
    action: 'all',
    stockId: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    horizon: 'Long Term' as string,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch all tips (load all tips without server-side filtering)
  const fetchTips = async () => {
    try {
      setLoading(true);
      // Fetch all tips without any filters to enable client-side filtering
      const data = await tipsService.getAll({});
      const tipsArray = Array.isArray(data) ? data : [];
      setTips(tipsArray);
      
      // Fetch stock symbols in the background (non-blocking)
      fetchStockSymbols(tipsArray);
    } catch (error) {
      console.error('Error fetching tips:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tips. Please try again later.',
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

  // Get horizon counts
  const horizonCounts = useMemo(() => {
    const counts = {
      'Long Term': 0,
      'Short Term': 0,
      'Swing': 0,
    };
    
    tips.forEach(tip => {
      if (tip.horizon === 'Long Term') counts['Long Term']++;
      else if (tip.horizon === 'Short Term') counts['Short Term']++;
      else if (tip.horizon === 'Swing') counts['Swing']++;
    });
    
    return counts;
  }, [tips]);

  // Filter tips based on current filters with comprehensive search
  const filteredTips = useMemo(() => {
    const filtered = tips.filter(tip => {
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
      
      // Horizon filter
      if (filters.horizon && tip.horizon !== filters.horizon) {
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
  }, [tips, filters, stockSymbols]);

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
      stockId: '',
      startDate: null,
      endDate: null,
      horizon: 'Long Term',
    });
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  // Navigate to tip details
  const handleTipClick = (tipId: string) => {
    router.push(`/rangaone-wealth/recommendation/${tipId}`);
  };

  // Fetch stock symbols for tips that have stockId using global cache (non-blocking)
  const fetchStockSymbols = async (apiTips: Tip[]) => {
    const tipsWithStockId = apiTips.filter((tip) => tip.stockId);
    if (tipsWithStockId.length === 0) {
      return;
    }

    try {
      // Extract unique stock IDs
      const stockIds = Array.from(new Set(tipsWithStockId.map((tip) => {
        return tip.stockId!.replace(/\.[A-Z]+$/, '').trim();
      })));

      // Get immediately available cached symbols first
      const initialSymbols = new Map<string, string>();
      stockIds.forEach(stockId => {
        const cachedSymbol = stockSymbolCacheService.getCachedSymbol(stockId);
        if (cachedSymbol) {
          initialSymbols.set(stockId, cachedSymbol);
        }
      });

      // Set initial cached symbols immediately if any are available
      if (initialSymbols.size > 0) {
        setStockSymbols(initialSymbols);
      }

      // Then fetch the remaining symbols in the background
      const uncachedIds = stockIds.filter(id => !stockSymbolCacheService.isSymbolCached(id));
      
      if (uncachedIds.length > 0) {
        // Fetch missing symbols without blocking the UI
        const symbolResults = await stockSymbolCacheService.getMultipleSymbols(uncachedIds);
        
        // Update state with new symbols (merge with existing)
        setStockSymbols(prevSymbols => {
          const newSymbols = new Map(prevSymbols);
          symbolResults.forEach((symbol, stockId) => {
            newSymbols.set(stockId, symbol);
          });
          return newSymbols;
        });
      }
      
    } catch (error) {
      console.error('Failed to fetch stock symbols:', error);
    }
  };

  // Convert Tip to TipCardData format for consistency with carousel
  const convertTipToCardData = (tip: Tip): TipCardData => {
    // Priority order for stock name:
    // 1. Cached symbol from state
    // 2. Cached symbol from cache service
    // 3. Parsed from title
    // 4. Stock ID (as last resort)
    // 5. Generic fallback
    
    let stockName = stockSymbols.get(tip.stockId || '');
    
    // If not in state, check the cache service directly
    if (!stockName && tip.stockId) {
      stockName = stockSymbolCacheService.getCachedSymbol(tip.stockId) || undefined;
    }
    
    // Try to extract from title (often contains readable names)
    if (!stockName && tip.title) {
      const titleParts = tip.title.split(/[:\-]/);
      const potentialName = titleParts[0]?.trim();
      if (potentialName && potentialName.length > 2 && potentialName !== tip.stockId) {
        stockName = potentialName;
      }
    }
    
    // Only use stockId as last resort (and only if it looks like a readable symbol)
    if (!stockName && tip.stockId) {
      // Only use stock ID if it's relatively short and looks like a symbol
      if (tip.stockId.length <= 12 && /^[A-Z0-9&\-\.]+$/i.test(tip.stockId)) {
        stockName = tip.stockId;
      }
    }
    
    // Final fallback
    if (!stockName) {
      stockName = 'Unknown Stock';
    }

    return {
      id: tip._id,
      portfolioId: typeof tip.portfolio === 'string' ? tip.portfolio : tip.portfolio?._id,
      portfolioName: typeof tip.portfolio === 'object' ? tip.portfolio?.name : undefined,
      date: tip.createdAt,
      stockName,
      exchange: 'NSE',
      buyRange: tip.buyRange || '₹ 1000 - 1050',
      action: (tip.action as 'HOLD' | 'Partial Profit Booked' | 'BUY' | 'SELL') || 'BUY',
      category: tip.category || 'basic',
      title: tip.title,
      status: tip.status?.toLowerCase(),
      targetPercentage: tip.targetPercentage ? parseFloat(tip.targetPercentage.replace('%', '')) : undefined,
      exitStatus: tip.exitStatus,
      exitStatusPercentage: tip.exitStatusPercentage ? parseFloat(tip.exitStatusPercentage.replace('%', '')) : undefined,
    };
  };

  if (loading) {
    return (
      <DashboardLayout userId="1">
        <div className="space-y-8">
          <PageHeader
            title="All Recommendations"
            subtitle="Complete list of investment tips"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userId="1">
      <PageHeader
        title="All Recommendations"
        subtitle="Complete list of investment tips"
      />

      {/* Filters Section - Exact UI Match */}
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
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-5 h-5 rounded border-2 border-gray-400 flex items-center justify-center ${
                filters.status === 'Active' ? 'bg-black' : 'bg-white'
              }`}>
                {filters.status === 'Active' && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span 
                className="font-bold text-base lg:text-lg text-black"
                onClick={() => handleFilterChange('status', filters.status === 'Active' ? 'all' : 'Active')}
              >
                Live Calls
              </span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-5 h-5 rounded border-2 border-gray-400 flex items-center justify-center ${
                filters.status === 'Closed' ? 'bg-black' : 'bg-white'
              }`}>
                {filters.status === 'Closed' && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span 
                className="font-bold text-base lg:text-lg text-gray-400"
                onClick={() => handleFilterChange('status', filters.status === 'Closed' ? 'all' : 'Closed')}
              >
                Closed Calls
              </span>
            </label>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center mb-2 gap-2">
          <span className="font-bold text-black text-base lg:text-xl mr-2">Filter by :</span>
          <div className="flex items-center gap-2">
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button
                  className={`rounded-[12px] lg:rounded-[16px] border-2 border-gray-400 bg-white text-gray-600 font-bold text-base lg:text-lg px-4 lg:px-7 py-1 lg:py-1.5 transition-colors
                    ${filters.startDate || filters.endDate ? 'bg-[#f5f5f5] text-[#101e5a] border-[#101e5a]' : ''}`}
                >
                  Date
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.startDate ? format(filters.startDate, "PPP") : "Pick start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.startDate || undefined}
                          onSelect={(date) => handleFilterChange('startDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.endDate ? format(filters.endDate, "PPP") : "Pick end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.endDate || undefined}
                          onSelect={(date) => handleFilterChange('endDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        handleFilterChange('startDate', null);
                        handleFilterChange('endDate', null);
                        setShowDatePicker(false);
                      }}
                    >
                      Clear Dates
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setShowDatePicker(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
          </Popover>
            <button
              className={`rounded-[12px] lg:rounded-[16px] border-2 border-gray-400 bg-white text-gray-600 font-bold text-base lg:text-lg px-4 lg:px-7 py-1 lg:py-1.5 transition-colors
                ${filters.category === 'premium' ? 'bg-[#f5f5f5] text-[#101e5a] border-[#101e5a]' : ''}`}
              onClick={() => handleFilterChange('category', filters.category === 'premium' ? 'all' : 'premium')}
            >
              Premium
            </button>
            <button
              className={`rounded-[12px] lg:rounded-[16px] border-2 border-gray-400 bg-white text-gray-600 font-bold text-base lg:text-lg px-4 lg:px-7 py-1 lg:py-1.5 transition-colors
                ${filters.category === 'basic' ? 'bg-[#f5f5f5] text-[#101e5a] border-[#101e5a]' : ''}`}
              onClick={() => handleFilterChange('category', filters.category === 'basic' ? 'all' : 'basic')}
            >
              Basic
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex w-full border-b-2 border-gray-300 mt-2">
          <button
            className={`flex-1 text-center font-bold text-sm sm:text-lg lg:text-2xl py-2 lg:py-3 cursor-pointer transition-colors
              ${filters.horizon === 'Long Term' ? 'text-[#101e5a] border-b-4 border-[#101e5a] bg-white' : 'text-gray-400 border-b-4 border-transparent'}`}
            onClick={() => handleFilterChange('horizon', 'Long Term')}
          >
            <span className="hidden sm:inline">Long Term ({horizonCounts['Long Term'].toString().padStart(2, '0')})</span>
            <span className="sm:hidden">Long ({horizonCounts['Long Term'].toString().padStart(2, '0')})</span>
          </button>
          <button
            className={`flex-1 text-center font-bold text-sm sm:text-lg lg:text-2xl py-2 lg:py-3 cursor-pointer transition-colors
              ${filters.horizon === 'Short Term' ? 'text-[#101e5a] border-b-4 border-[#101e5a] bg-white' : 'text-gray-400 border-b-4 border-transparent'}`}
            onClick={() => handleFilterChange('horizon', 'Short Term')}
          >
            <span className="hidden sm:inline">Short Term ({horizonCounts['Short Term'].toString().padStart(2, '0')})</span>
            <span className="sm:hidden">Short ({horizonCounts['Short Term'].toString().padStart(2, '0')})</span>
          </button>
          <button
            className={`flex-1 text-center font-bold text-sm sm:text-lg lg:text-2xl py-2 lg:py-3 cursor-pointer transition-colors
              ${filters.horizon === 'Swing' ? 'text-[#101e5a] border-b-4 border-[#101e5a] bg-white' : 'text-gray-400 border-b-4 border-transparent'}`}
            onClick={() => handleFilterChange('horizon', 'Swing')}
          >
            Swing ({horizonCounts['Swing'].toString().padStart(2, '0')})
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
      {filteredTips.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:p-0 p-5">
            {currentTips.map(tip => {
              const cardData = convertTipToCardData(tip);
              return (
                <div key={tip._id} className="h-48">
                  <TipCard
                    tip={cardData}
                    onClick={() => handleTipClick(tip._id)}
                    subscriptionAccess={subscriptionAccess}
                  />
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
    </DashboardLayout>
  );
}