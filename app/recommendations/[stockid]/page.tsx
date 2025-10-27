"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { tipsService, type Tip } from "@/services/tip.service";
import { subscriptionService, type SubscriptionAccess } from "@/services/subscription.service";
import { stockPriceService, type StockPriceData } from "@/services/stock-price.service";
import { ArrowLeft, ExternalLink, Lock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { formatActionForDisplay } from '@/lib/action-display-utils';

export default function StockRecommendationPage() {
  const params = useParams();
  const stockId = params.stockid as string;
  const { toast } = useToast();
  const [tipData, setTipData] = useState<Tip | undefined>();
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | undefined>();
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<StockPriceData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load both tip data and subscription access in parallel
        const [tipResult, accessResult] = await Promise.all([
          tipsService.getById(stockId),
          subscriptionService.getSubscriptionAccess()
        ]);
        
        setTipData(tipResult);
        setSubscriptionAccess(accessResult);
        
        // Fetch stock data if stockId is available
        if (tipResult?.stockId) {
          try {
            // Use stockPriceService to get stock data
            const stockResponse = await stockPriceService.getStockPriceById(tipResult.stockId);
            if (stockResponse.success && stockResponse.data) {
              setStockData(stockResponse.data);
            }
          } catch (symbolError) {
            console.error("Failed to fetch stock data:", symbolError);
            // Continue without stock data - we'll use fallbacks
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Failed to load tip details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [stockId, toast]);

  // Check if user has access to this tip
  const hasAccess = () => {
    if (!subscriptionAccess || !tipData) return false;
    
    if (tipData.category === 'premium') {
      return subscriptionAccess.hasPremium;
    } else if (tipData.category === 'basic') {
      return subscriptionAccess.hasBasic || subscriptionAccess.hasPremium;
    }
    
    return true; // Default access for uncategorized tips
  };

  const canAccessTip = hasAccess();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tipData) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Tip Not Found</h2>
            <Link href="/recommendations/all">
              <Button>Back to Recommendations</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If user doesn't have access, show access denied screen
  if (!canAccessTip) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-4">
          <div className="mb-6">
            <Link
              href="/recommendations/all"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Recommendations
            </Link>
          </div>
          
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                <p className="text-gray-600">
                  This {tipData.category || 'premium'} tip requires a subscription to view.
                </p>
              </div>
              
              <div className="space-y-3">
                <Link href={tipData.category === 'premium' ? '/premium-subscription' : '/basic-subscription'}>
                  <Button 
                    className={
                      tipData.category === 'premium'
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-[#FFFFF0]"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-[#FFFFF0]"
                    }
                  >
                    {tipData.category === 'premium' ? 'Upgrade to Premium' : 'Get Basic Plan'}
                  </Button>
                </Link>
                <div>
                  <Link href="/recommendations/all">
                    <Button variant="outline">Back to Recommendations</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const recommendedDate = tipData.createdAt ? format(new Date(tipData.createdAt), 'dd MMMM yyyy') : 'N/A';

  return (
    <DashboardLayout>
      {/* Header - RangaOne WEALTH */}
      <PageHeader title="RECOMMENDATIONS" subtitle="                             " />
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          
          {/* Expert Recommendations Label */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">EXPERT RECOMMENDATIONS</h2>
          </div>

          {/* Small Card - Stock Info */}
          <div 
            className="p-[3px] rounded-lg mb-6 mx-auto md:max-w-md relative max-w-[18rem]"
            style={{ background: "linear-gradient(90deg, #00B7FF 0%, #85D437 100%)" }}
          >
            <div className="bg-white rounded-lg p-4 h-full">
              <div className="flex justify-between items-start"> 
                <div>
                  {/* Premium Label */}
                   <div className="relative bg-gradient-to-r from-[#00B7FF] to-[#85D437] p-[4px] rounded-xl overflow-hidden">
                    <div className="bg-black text-xs sm:text-sm font-bold rounded-md px-2 sm:px-3 py-0.5 sm:py-1 overflow-hidden">
                      <span className="bg-gradient-to-r from-[#00B7FF] to-[#85D437] bg-clip-text text-transparent font-bold">
                        {tipData.category === 'premium' ? 'Premium' : 'Basic'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Stock Symbol and Exchange */}
                  <h3 className="text-xl font-bold">{stockData?.symbol || tipData.stockId || 'STOCK'}</h3>
                  <p className="text-sm">{stockData?.exchange || 'NSE'}</p>
                </div>
                
                {/* Weightage Box */}
                <div className="flex-shrink-0">
                  <div className="relative bg-gradient-to-r from-[#00B7FF] to-[#85D437] p-[4px] rounded-xl">
                    <div className="bg-cyan-50 rounded-md px-2 py-1.5 text-center min-w-[60px]">
                      <p className="text-xs text-gray-700 mb-0 leading-tight font-medium">Weightage</p>
                      <p className="text-right text-2xl font-bold text-black leading-tight">
                        {tipData.targetPercentage || '5%'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Profit Booked (if available) */}
                  {tipData.exitStatusPercentage && (
                    <div className="bg-green-100 border border-green-300 rounded p-2 mt-2">
                      <p className="text-xs mb-0">Profit Booked</p>
                      <p className="text-xl font-bold text-green-700">{tipData.exitStatusPercentage}</p>
                    </div>
                  )}
                  
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          {tipData.title && (
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold">
                Title:- {tipData.title}
              </h2>
            </div>
          )}

          {/* Medium Card - Recommendation Details */}
          <div 
            className="p-[3px] rounded-lg mb-6 mx-auto md:max-w-2xl"
            style={{ background: "linear-gradient(90deg, #00B7FF 0%, #85D437 100%)" }}
          >
            <div className="bg-white rounded-lg p-4 h-full">
              {/* Header */}
              <div className="text-center my-1">
                <div className="bg-[#131859] text-[#FFFFF0] rounded-lg px-6 py-2 inline-block">
                  <h3 className="text-lg font-bold">Recommendation Details</h3>
                </div>
              </div>
              
              {/* Grid of Details */}
              <div className="grid grid-cols-2 gap-4">
                {/* Buy Range */}
                {tipData.buyRange && (
                  <div className="md:text-center sm:text-center text-left mt-2">
                    <p className="font-bold mb-1">Buy Range</p>
                    <p className="text-xl text-green-600 font-bold">{tipData.buyRange}</p>
                  </div>
                )}
                
                {/* Target Price */}
                {tipData.targetPrice && (
                  <div className="text-center">
                    <p className="font-bold mb-1">Target Price</p>
                    <p className="text-xl text-green-600 font-bold">{tipData.targetPrice}</p>
                  </div>
                )}
                
                {/* Add More At */}
                {tipData.addMoreAt && (
                  <div className="md:text-center sm:text-center text-left mt-2">
                    <p className="font-bold mb-1">Add More At</p>
                    <p className="text-xl text-green-600 font-bold">{tipData.addMoreAt}</p>
                  </div>
                )}

                {/* Action */}
                {tipData.action && (
                  <div className="md:text-center sm:text-center text-left">
                    <p className="font-bold mb-1">Action</p>
                    <p className="text-xl text-green-600 font-bold">{formatActionForDisplay(tipData.action)}</p>
                  </div>
                )}
                
                {/* Recommended Date */}
                {tipData.createdAt && (
                  <div className="md:text-center sm:text-center text-left">
                    <p className="font-bold mb-1">Created On</p>
                    <p className="text-xl text-green-600 font-bold">{recommendedDate}</p>
                  </div>
                )}
                
                {/* Exited Price */}
                {tipData.exitPrice && (
                  <div className="text-center">
                    <p className="font-bold mb-1">Exited Price</p>
                    <p className="text-xl text-green-600 font-bold">{tipData.exitPrice}</p>
                  </div>
                )}
                
                {/* Exit Status */}
                {tipData.exitStatus && (
                  <div className="text-center">
                    <p className="font-bold mb-1">Exit Status</p>
                    <p className="text-xl text-green-600 font-bold">{tipData.exitStatus}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Large Card - Why Buy This */}
          <div 
            className="p-[3px] rounded-lg mx-auto max-w-4xl"
            style={{ background: "linear-gradient(90deg, #00B7FF 0%, #85D437 100%)" }}
          >
            <div className="bg-white rounded-lg p-4 h-full">
              {/* Header */}
              <div className="mb-4">
                <div className="bg-[#131859] text-[#FFFFF0] rounded-lg px-6 py-2 inline-block">
                  <h3 className="text-lg font-bold">Why Buy This?</h3>
                </div>
              </div>
              
              {/* Bullet Points */}
              <ul className="list-disc pl-6 space-y-3 mb-8">                
                {tipData.description && (
                  <div className="text-lg" dangerouslySetInnerHTML={{ __html: tipData.description }} />
                )}
              </ul>

              {/* Divider Line */}
              {tipData.tipUrl && tipData.downloadLinks && tipData.downloadLinks.length > 0 && (
                <>
                  <div className="border-t-2 border-gray-300 my-6"></div>

                  {/* View Detailed Report Button */}
                  <div className="flex justify-center">
                    {tipData.downloadLinks && tipData.downloadLinks.length > 0 && (
                      <button
                        onClick={() => window.open(tipData.downloadLinks[0].linkUrl || tipData.downloadLinks[0].url, "_blank")}
                        className="bg-green-600 hover:bg-green-700 text-[#FFFFF0] px-8 py-3 text-lg font-bold rounded-lg flex items-center"
                      >
                        View Detailed Report
                        <ExternalLink className="ml-2 h-5 w-5" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}