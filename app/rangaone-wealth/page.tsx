"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Tip, tipsService } from "@/services/tip.service";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { format, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import TipsCarousel from "@/components/tips-carousel";
import { useAuth } from "@/components/auth/auth-context"; // Import useAuth
import { subscriptionService, type SubscriptionAccess } from "@/services/subscription.service"; // Import subscriptionService and SubscriptionAccess

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

// Helper function to parse buy range
const parseBuyRange = (buyRange: string) => {
  if (!buyRange) return { min: 0, max: 0 };
  const cleanRange = buyRange.replace(/[₹,]/g, '').trim();
  if (cleanRange.includes('-')) {
    const [min, max] = cleanRange.split('-').map(num => parseFloat(num.trim()));
    return { min: min || 0, max: max || 0 };
  }
  const value = parseFloat(cleanRange);
  return { min: value || 0, max: value || 0 };
};

export default function RangaOneWealth() {
  const [allTips, setAllTips] = useState<Tip[]>([]);
  const [activeTips, setActiveTips] = useState<Tip[]>([]);
  const [closedTips, setClosedTips] = useState<Tip[]>([]);
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const [closedDate, setClosedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState<{basic: boolean, premium: boolean}>({basic: false, premium: false});
  const { toast } = useToast();
  const router = useRouter();
  const [mainFilter, setMainFilter] = useState<string>("basic");
  const [closedFilter, setClosedFilter] = useState<string>("basic");

  const { isAuthenticated, isLoading: authLoading } = useAuth(); // Get auth state
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | undefined>(); // State for subscription access

  // Load tips efficiently by category
  const loadTipsByCategory = async (category: 'basic' | 'premium') => {
    setCategoryLoading(prev => ({ ...prev, [category]: true }));
    try {
      console.log(`Loading ${category} tips from API...`);
      const data = await tipsService.getAll({ category }); // Server-side filtering
      console.log(`${category} tips loaded:`, data.length);
      
      // Ensure data is an array
      const tipsArray = Array.isArray(data) ? data : [];
      
      // Sort tips by date (oldest first for chronological order)
      const sortedTips = [...tipsArray].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // Update the appropriate tips based on category
      const active = sortedTips.filter(tip => tip.status === "Active");
      const closed = sortedTips.filter(tip => tip.status !== "Active");
      
      // Update state based on current filter
      setActiveTips(prevActive => {
        // Remove old tips of this category and add new ones
        const filteredOld = prevActive.filter(tip => tip.category?.toLowerCase() !== category);
        return [...filteredOld, ...active].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      
      setClosedTips(prevClosed => {
        // Remove old tips of this category and add new ones
        const filteredOld = prevClosed.filter(tip => tip.category?.toLowerCase() !== category);
        return [...filteredOld, ...closed].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      
      console.log(`✅ ${category} tips loaded: ${active.length} active, ${closed.length} closed`);
      
    } catch (error) {
      console.error(`Failed to load ${category} tips:`, error);
      toast({
        title: "Error",
        description: `Failed to load ${category} tips. Please try again later.`,
        variant: "destructive",
      });
    } finally {
      setCategoryLoading(prev => ({ ...prev, [category]: false }));
    }
  };

  // Load initial data and subscription access
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        // Load subscription access
        const access = await subscriptionService.getSubscriptionAccess(true);
        setSubscriptionAccess(access);
        console.log("Subscription access data:", access);
        
        // Load initial category (basic) tips
        await loadTipsByCategory('basic');
        
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [toast]);

  // Handle filter changes
  const handleMainFilterChange = async (newFilter: string) => {
    if (newFilter === mainFilter) return; // No change
    
    setMainFilter(newFilter);
    
    if (newFilter === 'basic' || newFilter === 'premium') {
      await loadTipsByCategory(newFilter as 'basic' | 'premium');
    }
  };

  const handleClosedFilterChange = async (newFilter: string) => {
    if (newFilter === closedFilter) return; // No change
    
    setClosedFilter(newFilter);
    
    if (newFilter === 'basic' || newFilter === 'premium') {
      await loadTipsByCategory(newFilter as 'basic' | 'premium');
    }
  };

  // Memoized date ranges
  const { activeDateRange, closedDateRange } = useMemo(() => {
    return {
      activeDateRange: activeTips.length > 0 ? {
        min: new Date(Math.min(...activeTips.map(tip => new Date(tip.createdAt).getTime()))),
        max: new Date(Math.max(...activeTips.map(tip => new Date(tip.createdAt).getTime())))
      } : {
        min: new Date('2024-01-01'),
        max: new Date('2025-12-31')
      },
      closedDateRange: closedTips.length > 0 ? {
        min: new Date(Math.min(...closedTips.map(tip => new Date(tip.createdAt).getTime()))),
        max: new Date(Math.max(...closedTips.map(tip => new Date(tip.createdAt).getTime())))
      } : {
        min: new Date('2024-01-01'),
        max: new Date('2025-12-31')
      }
    };
  }, [activeTips, closedTips]);

  // Enhanced tip filtering with date and category handling
  const filterTipsWithHighlight = useCallback((tips: Tip[], selectedDate: Date) => {
    return tips
      .filter(tip => {
        const tipDate = new Date(tip.createdAt);
        return tipDate <= selectedDate;
      })
      .map(tip => ({
        ...tip,
        isCurrentDate: isSameDay(new Date(tip.createdAt), selectedDate)
      }))
      .sort((a, b) => {
        // Sort by current date first, then by creation date
        if (a.isCurrentDate && !b.isCurrentDate) return -1;
        if (!a.isCurrentDate && b.isCurrentDate) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, []);

  // Slider change handler with smooth updates and animations
  const handleSliderChange = useCallback((value: number, setDate: (date: Date) => void) => {
    const newDate = new Date(value);
    setDate(newDate);
  }, []);

  // Filtering logic for carousels - filter by status AND category
  const filteredMainTips = useMemo(() => {
    // First filter by status (Active tips only)
    const activeOnly = activeTips;
    
    // Then filter by category if needed
    if (mainFilter === "all") {
      return activeOnly;
    } else {
      return activeOnly.filter(tip => tip.category?.toLowerCase() === mainFilter);
    }
  }, [activeTips, mainFilter]);
  
  const filteredClosedTips = useMemo(() => {
    // First filter by status (Closed tips only)
    const closedOnly = closedTips;
    
    // Then filter by category if needed
    if (closedFilter === "all") {
      return closedOnly;
    } else {
      return closedOnly.filter(tip => tip.category?.toLowerCase() === closedFilter);
    }
  }, [closedTips, closedFilter]);

  // Navigation handler for tips
  const handleTipClick = (tipId: string) => {
    router.push(`/rangaone-wealth/recommendation/${tipId}`);
  };

  // Loading skeleton
  if (loading) {
    return (
      <DashboardLayout userId="1">
        <div className="space-y-8">
          <PageHeader
            title="RangaOne Wealth"
            subtitle="Expert Stock Recommendations"
          />
          <div className="space-y-8">
            <div className="text-center">
              <Skeleton className="h-8 w-64 mx-auto mb-4" />
              <Skeleton className="h-10 w-80 mx-auto mb-8" />
            </div>
            <div className="flex gap-6 justify-center">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-80 h-64" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userId="1">
      <PageHeader
          title="RANGAONE WEALTH"
          subtitle="Expert Stock Recommendations"
      />



      {/* Open Recommendations Section */}
      <Card className="mt-1 mb-1 shadow-sm border border-gray-200" data-tour="recommendations-list">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4 text-center font-helvetica">Open Recommendations</h2>
          <div className="flex justify-center mb-4 gap-3">
            <div 
              className={`p-[4px] rounded-xl inline-block shadow-sm cursor-pointer transition-all bg-gradient-to-r from-[#A0A2FF] to-[#6E6E6E] ${
                categoryLoading.basic ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={() => handleMainFilterChange("basic")}
            >
              <div className="text-xl font-bold rounded-lg px-4 py-2 bg-gradient-to-r from-[#396C87] to-[#151D5C] text-white">
                {categoryLoading.basic ? "Loading..." : "Basic"}
              </div>
            </div>
            <div 
              className={`p-[4px] rounded-xl inline-block shadow-sm cursor-pointer transition-all bg-gradient-to-r from-yellow-400 to-yellow-500 ${
                categoryLoading.premium ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={() => handleMainFilterChange("premium")}
            >
              <div className="text-xl font-outfit font-bold rounded-lg px-4 py-2 bg-gray-800 text-yellow-400">
                {categoryLoading.premium ? "Loading..." : "Premium"}
              </div>
            </div>
          </div>
          <TipsCarousel 
            tips={filteredMainTips} 
            loading={loading || categoryLoading[mainFilter as keyof typeof categoryLoading]} 
            onTipClick={handleTipClick} 
            categoryFilter={mainFilter as 'basic' | 'premium'}
            sliderSize="large"
            userSubscriptionAccess={subscriptionAccess} // Pass subscription access
          />
          
          {/* View All Recommendations Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => router.push('/rangaone-wealth/all-recommendations')}
              className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] hover:from-[#1d4ed8] hover:to-[#2563eb] text-white font-bold text-lg px-12 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] border-0"
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                boxShadow: '0 8px 25px rgba(30, 58, 138, 0.3)',
              }}
            >
              View All Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Closed Recommendations Section */}
      <Card className="mt-1 mb-12 shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Closed Recommendations</h2>
          <div className="flex justify-center mb-4 gap-3">
            <div 
              className={`p-[4px] rounded-xl inline-block shadow-sm cursor-pointer transition-all bg-gradient-to-r from-[#A0A2FF] to-[#6E6E6E] ${
                categoryLoading.basic ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={() => handleClosedFilterChange("basic")}
            >
              <div className="text-xl font-bold rounded-lg px-4 py-2 bg-gradient-to-r from-[#396C87] to-[#151D5C] text-white">
                {categoryLoading.basic ? "Loading..." : "Basic"}
              </div>
            </div>
            <div 
              className={`p-[4px] rounded-xl inline-block shadow-sm cursor-pointer transition-all bg-gradient-to-r from-yellow-400 to-yellow-500 ${
                categoryLoading.premium ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={() => handleClosedFilterChange("premium")}
            >
              <div className="text-xl font-outfit font-bold rounded-lg px-4 py-2 bg-gray-800 text-yellow-400">
                {categoryLoading.premium ? "Loading..." : "Premium"}
              </div>
            </div>
          </div>
          <TipsCarousel 
            tips={filteredClosedTips} 
            loading={loading || categoryLoading[closedFilter as keyof typeof categoryLoading]} 
            onTipClick={handleTipClick} 
            categoryFilter={closedFilter as 'basic' | 'premium'}
            userSubscriptionAccess={subscriptionAccess} // Pass subscription access
          />
          
          {/* View All Recommendations Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => router.push('/rangaone-wealth/all-recommendations')}
              className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] hover:from-[#1d4ed8] hover:to-[#2563eb] text-white font-bold text-lg px-12 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] border-0"
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                boxShadow: '0 8px 25px rgba(30, 58, 138, 0.3)',
              }}
            >
              View All Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
