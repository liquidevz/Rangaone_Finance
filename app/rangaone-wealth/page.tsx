"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Tip, tipsService } from "@/services/tip.service";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; // Import hooks
import { useCallback, useEffect, useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { format, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import TipsCarousel from "@/components/tips-carousel";
import { useAuth } from "@/components/auth/auth-context";
import { subscriptionService, type SubscriptionAccess } from "@/services/subscription.service";

// Helper functions remain the same...
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // --- STATE MANAGEMENT WITH URL ---
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read filters from URL or default to 'basic'
  const mainFilter = searchParams.get("open") || "basic";
  const closedFilter = searchParams.get("closed") || "basic";
  // --- END STATE MANAGEMENT ---

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | undefined>();
  const [categoryLoading, setCategoryLoading] = useState({ basic: false, premium: false });

  // Load initial data and subscription access
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const access = await subscriptionService.getSubscriptionAccess(true);
        setSubscriptionAccess(access);
        
        const data = await tipsService.getAll();
        const tipsArray = Array.isArray(data) ? data : [];
        const sortedTips = [...tipsArray].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setAllTips(sortedTips);
        
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [toast]);

  // --- UPDATE URL ON FILTER CHANGE ---
  const handleMainFilterChange = (newFilter: string) => {
    if (newFilter === mainFilter) return;
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("open", newFilter);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  };

  const handleClosedFilterChange = (newFilter: string) => {
    if (newFilter === closedFilter) return;
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("closed", newFilter);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  };
  // --- END URL UPDATE ---

  // Filtering logic for carousels - filter by status AND category
  const filteredMainTips = useMemo(() => {
    return allTips
      .filter(tip => tip.status === "Active")
      .filter(tip => tip.category?.toLowerCase() === mainFilter);
  }, [allTips, mainFilter]);
  
  const filteredClosedTips = useMemo(() => {
    return allTips
      .filter(tip => tip.status !== "Active")
      .filter(tip => tip.category?.toLowerCase() === closedFilter);
  }, [allTips, closedFilter]);

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
                mainFilter === 'basic' ? 'ring-2 ring-blue-400' : ''
              }`}
              onClick={() => handleMainFilterChange("basic")}
            >
              <div className="text-xl font-bold rounded-lg px-4 py-2 bg-gradient-to-r from-[#396C87] to-[#151D5C] text-white">
                Basic
              </div>
            </div>
            <div 
              className={`p-[4px] rounded-xl inline-block shadow-sm cursor-pointer transition-all bg-gradient-to-r from-yellow-400 to-yellow-500 ${
                mainFilter === 'premium' ? 'ring-2 ring-yellow-300' : ''
              }`}
              onClick={() => handleMainFilterChange("premium")}
            >
              <div className="text-xl font-outfit font-bold rounded-lg px-4 py-2 bg-gray-800 text-yellow-400">
                Premium
              </div>
            </div>
          </div>
          <TipsCarousel 
            tips={filteredMainTips} 
            loading={loading} 
            onTipClick={handleTipClick} 
            categoryFilter={mainFilter as 'basic' | 'premium'}
            sliderSize="large"
            userSubscriptionAccess={subscriptionAccess}
          />
          
          <div className="flex justify-center">
            <Button
              onClick={() => router.push('/rangaone-wealth/all-recommendations?filter=live')}
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
                closedFilter === 'basic' ? 'ring-2 ring-blue-400' : ''
              }`}
              onClick={() => handleClosedFilterChange("basic")}
            >
              <div className="text-xl font-bold rounded-lg px-4 py-2 bg-gradient-to-r from-[#396C87] to-[#151D5C] text-white">
                Basic
              </div>
            </div>
            <div 
              className={`p-[4px] rounded-xl inline-block shadow-sm cursor-pointer transition-all bg-gradient-to-r from-yellow-400 to-yellow-500 ${
                closedFilter === 'premium' ? 'ring-2 ring-yellow-300' : ''
              }`}
              onClick={() => handleClosedFilterChange("premium")}
            >
              <div className="text-xl font-outfit font-bold rounded-lg px-4 py-2 bg-gray-800 text-yellow-400">
                Premium
              </div>
            </div>
          </div>
          <TipsCarousel 
            tips={filteredClosedTips} 
            loading={loading} 
            onTipClick={handleTipClick} 
            categoryFilter={closedFilter as 'basic' | 'premium'}
            userSubscriptionAccess={subscriptionAccess}
          />
          
          <div className="flex justify-center">
            <Button
              onClick={() => router.push('/rangaone-wealth/all-recommendations?filter=closed')}
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
