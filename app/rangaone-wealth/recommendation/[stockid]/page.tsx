"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { InnerPageHeader } from "@/components/inner-page-header";
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

// Color scheme function from tips-carousel
const getTipColorScheme = (category: "basic" | "premium") => {
  if (category === "premium") {
    return {
      gradient: "linear-gradient(90deg, #FFD700 30%, #3333330A 90%)",
      textColor: "#92400E",
      bgGradient: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
      borderColor: "#F59E0B",
      badge: {
        bg: "#92400E",
        text: "#FEF3C7",
      },
    };
  } else {
    return {
      gradient: "linear-gradient(90deg, #595CFF 30%, #3333330A 90%)",
      textColor: "#1E40AF",
      bgGradient: "linear-gradient(135deg, #18657B 0%, #131859 100%)",
      borderColor: "#595CFF",
      badge: {
        bg: "#18657B",
        text: "#DBEAFE",
      },
    };
  }
};

// Helper function to extract exit-range from tip content
const getExitRange = (content: string | { key: string; value: string; _id?: string; }[] | undefined): string | null => {
  if (!content) return null;
  
  if (Array.isArray(content)) {
    const exitRangeItem = content.find(item => item.key === 'exit-range');
    return exitRangeItem?.value || null;
  }
  
  return null;
};

// Helper function to extract stop-loss from tip content
const getStopLoss = (content: string | { key: string; value: string; _id?: string; }[] | undefined): string | null => {
  if (!content) return null;
  
  if (Array.isArray(content)) {
    const stopLossItem = content.find(item => item.key === 'stop-loss');
    return stopLossItem?.value || null;
  }
  
  return null;
};

// Helper function to format percentage as whole number
const formatPercentage = (value: string | number | undefined): string => {
  if (!value) return '0%';
  const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;
  return `${Math.floor(numValue)}%`;
};

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
            // First try the stock symbols API for current price
            const symbolResponse = await fetch(`/api/stock-symbols/${tipResult.stockId}`);
            if (symbolResponse.ok) {
              const stockSymbolData = await symbolResponse.json();
              setStockData(stockSymbolData);
            } else {
              // Fallback to stockPriceService for symbol extraction
              const stockResponse = await stockPriceService.getStockPriceById(tipResult.stockId);
              if (stockResponse.success && stockResponse.data) {
                setStockData(stockResponse.data);
              }
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
            <Link href="/rangaone-wealth/all-recommendations">
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
              href="/rangaone-wealth/all-recommendations"
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
                  <Link href="/rangaone-wealth/all-recommendations">
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

  const recommendedDate = tipData.createdAt ? format(new Date(tipData.createdAt), 'dd MMM yyyy') : 'N/A';
  const colorScheme = getTipColorScheme(tipData.category as "basic" | "premium" || "basic");

  return (
    <DashboardLayout>
      <InnerPageHeader title="RANGAONE WEALTH" subtitle="" />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-1 py-6">
          
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>EXPERT RECOMMENDATIONS</h2>
          </div>

          {/* Box 1 - Stock Info */}
          <div 
            className="p-[3px] rounded-lg mb-6 mx-auto max-w-[15rem] md:max-w-[20rem]"
            style={{ 
              background: colorScheme.gradient,
              boxShadow: '0 0 9px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="bg-white rounded-lg p-2">
              <div className="flex justify-between items-start"> 
                <div>
                                                          <div className={`p-[2px] rounded inline-block ${
                      tipData.category === 'premium' 
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                        : 'bg-gradient-to-r from-[#A0A2FF] to-[#6E6E6E]'
                    }`}>
                      <div className={`text-xs font-semibold rounded px-2 py-0.5 ${
                        tipData.category === 'premium' 
                          ? 'bg-gray-800 text-yellow-400' 
                          : 'bg-gradient-to-r from-[#396C87] to-[#151D5C] text-white'
                      }`}>
                      {tipData.category === 'premium' ? 'Premium' : 'Basic'}
                    </div>
                  </div>
                  <h3 className="md:text-xl text-md font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{stockData?.symbol || tipData.stockId || 'STOCK'}
                    <p className="text-sm font-light text-gray-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{stockData?.exchange || 'NSE'}</p>
                  </h3>
                  
                </div>
                
                {(tipData.status?.toLowerCase() === 'closed' || tipData.exitStatus || tipData.exitStatusPercentage) ? (
                  (tipData.exitStatus || tipData.exitStatusPercentage) && (
                    <div className={`p-[4px] rounded-xl ${
                      (tipData.exitStatus?.toLowerCase().includes('loss') || (tipData.exitStatusPercentage && parseFloat(tipData.exitStatusPercentage.replace('%', '')) < 0))
                        ? 'bg-gradient-to-r from-[#627281] to-[#A6AFB6]' 
                        : 'bg-[#219612]'
                    }`}>
                      <div className={`rounded-lg text-center min-w-[80px] py-0.5 px-1 ${
                        (tipData.exitStatus?.toLowerCase().includes('loss') || (tipData.exitStatusPercentage && parseFloat(tipData.exitStatusPercentage.replace('%', '')) < 0))
                          ? 'bg-gradient-to-tr from-[#A6AFB6] to-[#627281]' 
                          : 'bg-gradient-to-r from-green-50 to-green-100'
                      }`}>
                        <p className={`text-sm font-bold text-center mb-0 ${
                          (tipData.exitStatus?.toLowerCase().includes('loss') || (tipData.exitStatusPercentage && parseFloat(tipData.exitStatusPercentage.replace('%', '')) < 0)) ? 'text-white' : 'text-black'
                        }`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{tipData.exitStatus || 'Exit Status'}</p>
                        <p className={`text-3xl font-bold -mt-1 mb-0 ${
                          (tipData.exitStatus?.toLowerCase().includes('loss') || (tipData.exitStatusPercentage && parseFloat(tipData.exitStatusPercentage.replace('%', '')) < 0)) ? 'text-white' : 'text-black'
                        }`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{formatPercentage(tipData.exitStatusPercentage)}</p>
                        <p className={`text-xs font-bold text-right px-1 -mt-1 ${
                          (tipData.exitStatus?.toLowerCase().includes('loss') || (tipData.exitStatusPercentage && parseFloat(tipData.exitStatusPercentage.replace('%', '')) < 0)) ? 'text-white' : 'text-black'
                        }`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}></p>
                      </div>
                    </div>
                  )
                ) : (
                  tipData.targetPercentage && (
                    <div className="bg-[#219612] p-[4px] rounded-xl ">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg text-center min-w-[80px] py-0.5 px-1">
                        <p className="text-sm text-black font-bold text-center mb-0" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Target</p>
                        <p className="text-3xl font-bold text-black -mt-1 mb-0" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{formatPercentage(tipData.targetPercentage)}</p>
                        <p className="text-xs text-black font-bold text-right px-1 -mt-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Upto</p>
                      </div>
                    </div>
                  )
                )}
              </div>
              
              {tipData.analysistConfidence && (
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Analyst Confidence</p>
                    <p className="text-xs mt-0.5" style={{ color: colorScheme.textColor, fontFamily: 'Helvetica, Arial, sans-serif' }}>
                      {tipData.analysistConfidence >= 8 ? 'Very High' : 
                       tipData.analysistConfidence >= 6 ? 'High' : 
                       tipData.analysistConfidence >= 4 ? 'Medium' : 
                       tipData.analysistConfidence >= 2 ? 'Low' : 'Very Low'}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${(tipData.analysistConfidence || 0) * 10}%`,
                        backgroundColor: colorScheme.textColor 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {tipData.title && (
            <div className="mb-6 text-center">
              <h2 className="text-lg" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}><b>Title:-</b> {tipData.title}</h2>
            </div>
          )}
        </div>
        
        {/* Box 2 - Recommendation Details */}
      <div className="max-w-4xl mx-auto px-6">
        <div 
            className="p-[3px] rounded-lg mb-6 mx-auto max-w-2xl"
            style={{ 
              background: colorScheme.gradient,
              boxShadow: '0 0 9px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="bg-white rounded-lg p-4">
              <div className="text-center mb-4">
                <div className="bg-[#131859] text-white rounded-2xl px-4 inline-block border-4 border-[#2C349A]">
                  <h3 className="md:text-2xl text-md font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Recommendation Details</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Closed tip fields */}
                {(tipData.status?.toLowerCase() === 'closed' || tipData.exitStatus) ? (
                  <>
                    {tipData.buyRange && (
                      <div className="text-center">
                        <p className="md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Buy Range</p>
                        <p className="md:text-xl text-md font-bold text-green-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{tipData.buyRange}</p>
                      </div>
                    )}
                    
                    {(tipData.exitPrice || getExitRange(tipData.content)) && (
                      <div className="text-center">
                        <p className="text-[0.9rem] md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Exit Range</p>
                        <p className="md:text-xl text-[0.9rem] font-bold text-green-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{getExitRange(tipData.content) || tipData.exitPrice}</p>
                      </div>
                    )}
                    
                    {tipData.createdAt && (
                      <div className="text-center">
                        <p className="text-[0.9rem] md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Created On</p>
                        <p className="md:text-xl text-[0.9rem] font-bold text-green-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{recommendedDate}</p>
                      </div>
                    )}
                    
                    {(tipData.exitStatus || tipData.exitStatusPercentage) && (
                      <div className="text-center">
                        <p className="text-[0.9rem] md:text-2xl lg:text-2xl text-black" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{tipData.exitStatus || 'Exit Status'}</p>
                        <p className="md:text-xl text-[0.9rem] font-bold text-green-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{formatPercentage(tipData.exitStatusPercentage)}</p>
                      </div>
                    )}
                    
                    {tipData.updatedAt && (
                      <div className="text-center">
                        <p className="text-[0.9rem] md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Exit Date</p>
                        <p className="md:text-xl text-[0.9rem] font-bold text-green-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{format(new Date(tipData.updatedAt), 'dd MMM yyyy')}</p>
                      </div>
                    )}

                    {tipData.horizon && (
                      <div className="text-center">
                        <p className="text-[0.9rem] md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Horizon</p>
                        <p className="md:text-xl text-[0.9rem] font-bold text-green-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{tipData.horizon}</p>
                      </div>
                    )}
                    

                  </>
                ) : (
                  /* Active tip fields */
                  <>
                    {tipData.buyRange && (
                      <div className="text-center">
                        <p className="text-[0.9rem] md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Buy Range</p>
                        <p className="md:text-xl text-[0.9rem] font-bold text-green-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{tipData.buyRange}</p>
                      </div>
                    )}
                    
                    {tipData.targetPrice && (
                      <div className="text-center">
                        <p className="text-[0.9rem] md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Target Price</p>
                        <p className="md:text-xl text-[0.9rem] font-bold text-green-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{tipData.targetPrice}</p>
                      </div>
                    )}
                    
                    {tipData.addMoreAt && (
                      <div className="text-center">
                        <p className="text-[0.9rem] md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Add More At</p>
                        <p className="md:text-xl text-[0.9rem] font-bold text-green-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{tipData.addMoreAt}</p>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <p className="text-[0.9rem] md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Stop Loss</p>
                      <p className="md:text-xl text-[0.9rem] font-bold text-red-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{getStopLoss(tipData.content) || 'N/A'}</p>
                    </div>
                    
                    {tipData.horizon && (
                      <div className="text-center">
                        <p className="text-[0.9rem] md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Horizon</p>
                        <p className="md:text-xl text-[0.9rem] font-bold text-green-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{tipData.horizon}</p>
                      </div>
                    )}
                    
                    {tipData.createdAt && (
                      <div className="text-center">
                        <p className="text-[0.9rem] md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Created On</p>
                        <p className="md:text-xl text-[0.9rem] font-bold text-green-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{recommendedDate}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          </div>          
          {/* Box 3 - Why Buy This */}
          <div 
            className="p-[3px] rounded-lg mx-auto max-w-5xl"
            style={{ 
              background: colorScheme.gradient,
              boxShadow: '0 0 9px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="bg-white rounded-lg p-4">
              <div className="mb-4">
                <div className="bg-[#131859] text-white rounded-2xl px-4 py-1 inline-block border-4 border-[#2C349A]">
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Why Buy This?</h3>
                </div>
              </div>
              
              {tipData.description && (
                <div className="mb-6">
                  <div 
                    className="text-lg leading-relaxed prose prose-lg max-w-none [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-2 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mb-2 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-gray-900 [&_h4]:mb-2 [&_h5]:text-base [&_h5]:font-bold [&_h5]:text-gray-900 [&_h5]:mb-2 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:text-gray-900 [&_h6]:mb-2"
                    style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                    dangerouslySetInnerHTML={{ __html: tipData.description }} 
                  />
                </div>
              )}

              {tipData.downloadLinks && tipData.downloadLinks.length > 0 && (
                <>
                  <hr className="my-6" />
                  <div className="text-center">
                    <button
                      onClick={() => window.open(tipData.downloadLinks[0].linkUrl || tipData.downloadLinks[0].url, "_blank")}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-bold rounded-lg inline-flex items-center"
                      style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                    >
                      View Detailed Report
                      <ExternalLink className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
      </div>
    </DashboardLayout>
  );
}