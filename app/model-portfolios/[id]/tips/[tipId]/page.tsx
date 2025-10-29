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

export default function PortfolioTipDetailsPage() {
  const params = useParams();
  const portfolioId = params.id as string;
  const tipId = params.tipId as string;
  const { toast } = useToast();
  const [tipData, setTipData] = useState<Tip | undefined>();
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | undefined>();
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<StockPriceData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [tipResult, accessResult] = await Promise.all([
          tipsService.getById(tipId),
          subscriptionService.getSubscriptionAccess(),
        ]);

        setTipData(tipResult);
        setSubscriptionAccess(accessResult);

        if (tipResult?.stockId) {
          try {
            const stockResponse = await stockPriceService.getStockPriceById(tipResult.stockId);
            if (stockResponse.success && stockResponse.data) {
              setStockData(stockResponse.data);
            }
          } catch (symbolError) {
            console.error("Failed to fetch stock data:", symbolError);
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
  }, [tipId, toast]);

  const hasAccess = () => {
    if (!subscriptionAccess || !tipData) return false;
    
    // For tips accessed through model portfolio route, check portfolio access first
    if (portfolioId && subscriptionAccess.portfolioAccess?.includes(portfolioId)) {
      return true;
    }
    
    // For regular tips, check subscription level
    if (tipData.category === "premium") return subscriptionAccess.hasPremium;
    if (tipData.category === "basic") return subscriptionAccess.hasBasic || subscriptionAccess.hasPremium;
    return true;
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
            <Link href={`/model-portfolios/${portfolioId}`}>
              <Button>Back to Portfolio</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canAccessTip) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-4">
          <div className="mb-6">
            <Link
              href={`/model-portfolios/${portfolioId}`}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Portfolio
            </Link>
          </div>

          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                <p className="text-gray-600">This {tipData.category || "premium"} tip requires a subscription to view.</p>
              </div>

              <div className="space-y-3">
                <Link href={tipData.category === "premium" ? "/premium-subscription" : "/basic-subscription"}>
                  <Button
                    className={
                      tipData.category === "premium"
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-[#FFFFF0]"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-[#FFFFF0]"
                    }
                  >
                    {tipData.category === "premium" ? "Upgrade to Premium" : "Get Basic Plan"}
                  </Button>
                </Link>
                <div>
                  <Link href={`/model-portfolios/${portfolioId}`}>
                    <Button variant="outline">Back to Portfolio</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const recommendedDate = tipData.createdAt ? format(new Date(tipData.createdAt), "dd MMM yyyy") : "N/A";

  return (
    <DashboardLayout>
      <InnerPageHeader title="MODEL PORTFOLIO" subtitle="" />
      <div className="bg-gray-50 -mb-6">
        <div className="max-w-4xl mx-auto px-1 pt-6 pb-0">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
              EXPERT RECOMMENDATIONS
            </h2>
          </div>

          <div
            className="p-[3px] rounded-lg mb-6 mx-auto max-w-[15rem] md:max-w-[20rem] relative"
            style={{ background: "linear-gradient(90deg, #00B7FF 0%, #85D437 100%)" }}
          >
            <div className="bg-white rounded-lg p-2 h-full">
              <div className="flex justify-between items-start">
                <div>
                  <div className="relative bg-gradient-to-r from-[#00B7FF] to-[#85D437] p-[3px] rounded-xl overflow-hidden">
                    <div className="bg-black text-xs sm:text-sm font-bold rounded-lg px-2 sm:px-3 py-0.5 sm:py-1 overflow-hidden">
                      {tipData.portfolio && typeof tipData.portfolio === "object" && "name" in tipData.portfolio ? (
                        <div className="overflow-hidden">
                          <div className="whitespace bg-gradient-to-r from-[#00B7FF] to-[#85D437] font-bold bg-clip-text text-transparent">
                            {(() => {
                              const cleaned = (tipData.portfolio as any).name.replace(/\bportfolio\b/i, "").trim();
                              return cleaned.length > 0 ? cleaned : (tipData.portfolio as any).name;
                            })()}
                          </div>
                        </div>
                      ) : (
                        <span className="bg-gradient-to-r from-[#00B7FF] to-[#85D437] bg-clip-text text-transparent font-bold">
                          Model Portfolio
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold">{stockData?.symbol || tipData.stockId || "STOCK"}</h3>
                  <p className="text-sm">{stockData?.exchange || "NSE"}</p>
                </div>

                <div className="flex-shrink-0">
                  <div className={`relative p-[4px] rounded-xl ${
                    tipData.action === "SELL" 
                      ? "bg-gradient-to-r from-[#DC2626] to-[#B91C1C]" 
                      : tipData.action === "Partial Profit Booked" || tipData.action === "PARTIAL SELL" || tipData.action === "Partial Sell"
                        ? "bg-gradient-to-r from-[#F97316] to-[#EA580C]"
                        : "bg-gradient-to-r from-[#00B7FF] to-[#85D437]"
                  }`}>
                    <div className={`rounded-md px-2 py-1.5 text-center min-w-[60px] ${
                      tipData.action === "SELL" 
                        ? "bg-red-50" 
                        : tipData.action === "Partial Profit Booked" || tipData.action === "PARTIAL SELL" || tipData.action === "Partial Sell"
                          ? "bg-orange-50"
                          : "bg-cyan-50"
                    }`}>
                      <p className={`text-xs mb-0 leading-tight font-medium ${
                        tipData.action === "SELL" 
                          ? "text-red-700" 
                          : tipData.action === "Partial Profit Booked" || tipData.action === "PARTIAL SELL" || tipData.action === "Partial Sell"
                            ? "text-orange-700"
                            : "text-gray-700"
                      }`}>Weightage</p>
                      <p className={`text-right text-2xl font-bold leading-tight ${
                        tipData.action === "SELL" 
                          ? "text-red-800" 
                          : tipData.action === "Partial Profit Booked" || tipData.action === "PARTIAL SELL" || tipData.action === "Partial Sell"
                            ? "text-orange-800"
                            : "text-black"
                      }`}>
                        {(() => {
                          const w = (tipData as any)?.mpWeightage;
                          if (w === undefined || w === null || Number.isNaN(Number(w))) return "—";
                          const val = typeof w === "string" ? parseFloat(w) : Number(w);
                          return `${val}%`;
                        })()}
                      </p>
                    </div>
                  </div>

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

          {tipData.title && (
            <div className="mb-6 text-center">
              <h2 className="text-lg" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                <b>Title:-</b> {tipData.title}
              </h2>
            </div>
          )}

          <div className="max-w-4xl mx-auto px-6">
            <div
              className="p-[3px] rounded-lg mb-6 mx-auto max-w-2xl"
              style={{ background: "linear-gradient(90deg, #00B7FF 0%, #85D437 100%)", boxShadow: "0 0 9px rgba(0, 0, 0, 0.3)" }}
            >
              <div className="bg-white rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="bg-[#131859] text-white rounded-2xl px-4 inline-block border-4 border-[#2C349A]">
                    <h3 className="md:text-2xl text-md font-bold">Recommendation Details</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {tipData.buyRange && (
                    <div className="md:text-center sm:text-center text-left mt-2">
                      <p className="text-[0.9rem] md:text-2xl lg:text-2xl">Buy Range</p>
                      <p className="md:text-xl text-[0.9rem] font-bold text-green-600">{tipData.buyRange}</p>
                    </div>
                  )}

                  {tipData.targetPrice && (
                    <div className="text-center">
                      <p className="text-[0.9rem] md:text-2xl lg:text-2xl">Target Price</p>
                      <p className="md:text-xl text-[0.9rem] font-bold text-green-600">{tipData.targetPrice}</p>
                    </div>
                  )}

                  {tipData.action && (
                    <div className="md:text-center sm:text-center text-left">
                      <p className="text-[0.9rem] md:text-2xl lg:text-2xl">Action</p>
                      <p className="md:text-xl text-[0.9rem] font-bold text-green-600">{tipData.action}</p>
                    </div>
                  )}

                  {(tipData.addMoreAt || tipData.action === "SELL" || (Array.isArray(tipData.content) && tipData.content.find(item => item.key && item.key.toLowerCase().includes('add')))) && (
                    <div className="md:text-center sm:text-center text-left mt-2">
                      <p className="text-[0.9rem] md:text-2xl lg:text-2xl">Add More At</p>
                      <p className="md:text-xl text-[0.9rem] font-bold text-green-600">
                        {tipData.addMoreAt || 
                         (Array.isArray(tipData.content) && 
                          tipData.content.find(item => item.key && item.key.toLowerCase().includes('add'))?.value) || 
                         (tipData.action === "SELL" ? "0" : "N/A")}
                      </p>
                    </div>
                  )}

                  {tipData.exitPrice && (
                    <div className="text-center">
                      <p className="text-[0.9rem] md:text-2xl lg:text-2xl">Exit Range</p>
                      <p className="md:text-xl text-[0.9rem] font-bold text-green-600">{tipData.exitPrice}</p>
                    </div>
                  )}

                  {tipData.createdAt && (
                    <div className="md:text-center sm:text-center text-left">
                      <p className="text-[0.9rem] md:text-2xl lg:text-2xl">Created On</p>
                      <p className="md:text-xl text-[0.9rem] font-bold text-green-600">{recommendedDate}</p>
                    </div>
                  )}

                  {tipData.exitStatus && (
                    <div className="text-center">
                      <p className="text-[0.9rem] md:text-2xl lg:text-2xl">Exit Date</p>
                      <p className="md:text-xl text-[0.9rem] font-bold text-green-600">{format(new Date(tipData.exitStatus), "dd MMM yyyy")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            className="p-[3px] rounded-lg mx-auto max-w-5xl"
            style={{ background: "linear-gradient(90deg, #00B7FF 0%, #85D437 100%)", boxShadow: "0 0 9px rgba(0, 0, 0, 0.3)" }}
          >
            <div className="bg-white rounded-lg p-4 mb-0">
              <div className="mb-4">
                <div className="bg-[#131859] text-white rounded-2xl px-4 py-1 inline-block border-4 border-[#2C349A]">
                  <h3 className="text-2xl font-bold">Why Buy This?</h3>
                </div>
              </div>

              {tipData.description && (
                <div className="mb-6">
                  <div
                    className="text-lg leading-relaxed prose prose-lg max-w-none [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-2"
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
      </div>
    </DashboardLayout>
  );
}