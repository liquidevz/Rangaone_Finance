"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { InnerPageHeader } from "@/components/inner-page-header";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import { tipsService, type Tip } from "@/services/tip.service";
import { subscriptionService, type SubscriptionAccess } from "@/services/subscription.service";
import { stockPriceService, type StockPriceData } from "@/services/stock-price.service";
import { ArrowLeft, ExternalLink, Lock, ChevronLeft, ChevronRight, ImageIcon, X, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/components/auth/auth-context";
import { useEffect, useState, useRef, useMemo } from "react";
import { format } from "date-fns";

// Extend Tip locally to ensure images property exists
interface ExtendedTip extends Tip {
  images?: any[];
}

// Helper function to convert raw buffer objects to base64 strings
function processImages(rawImages: any[]): string[] {
  if (!Array.isArray(rawImages)) return [];

  return rawImages
    .map((imgSrc) => {
      // Already a valid base64 string
      if (typeof imgSrc === 'string') {
        return imgSrc;
      }

      // Handle raw Mongoose Buffer object
      // Format: { data: { type: 'Buffer', data: [137, 80, ...] }, contentType: 'image/png' }
      if (imgSrc && typeof imgSrc === 'object') {
        if (imgSrc.data?.type === 'Buffer' && Array.isArray(imgSrc.data.data)) {
          try {
            const bytes = imgSrc.data.data;
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = typeof window !== 'undefined' ? window.btoa(binary) : '';
            return `data:${imgSrc.contentType || 'image/png'};base64,${base64}`;
          } catch (e) {
            console.error('Error converting image buffer:', e);
            return null;
          }
        }
      }

      return null;
    })
    .filter((src): src is string => !!src && src !== 'data:image/png;base64,');
}

export default function PortfolioTipDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.id as string;
  const tipId = params.tipId as string;
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { isAuthenticated: isAuth, isLoading: isAuthLoading } = useAuth();
  const [tipData, setTipData] = useState<ExtendedTip | undefined>();
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | undefined>();
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<StockPriceData | null>(null);

  // Carousel State
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Process images once when tipData changes
  const images = useMemo(() => {
    return processImages(tipData?.images || []);
  }, [tipData?.images]);

  useEffect(() => {
    async function loadData() {
      // Wait for auth initialization
      if (isAuthLoading) {
        return;
      }

      if (!isAuth) {
        // Stop loading but don't auto-redirect to prevent loops
        setLoading(false);
        return;
      }

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
  }, [tipId, toast, router, isAuth, isAuthLoading]);

  // NO AUTO-SCROLL - removed for better UX

  // Carousel Navigation Helpers
  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: index * scrollWidth,
        behavior: 'smooth'
      });
      setCurrentImageIndex(index);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current && images.length > 0) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.clientWidth;
      const index = Math.round(scrollLeft / width);
      // Ensure index is within bounds
      const boundedIndex = Math.max(0, Math.min(index, images.length - 1));
      setCurrentImageIndex(boundedIndex);
    }
  };

  const nextImage = () => {
    if (images.length > 0) {
      const nextIndex = (currentImageIndex + 1) % images.length;
      scrollToIndex(nextIndex);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      const prevIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
      scrollToIndex(prevIndex);
    }
  };

  const hasAccess = () => {
    if (!subscriptionAccess || !tipData) return false;

    if (portfolioId && subscriptionAccess.portfolioAccess?.includes(portfolioId)) {
      return true;
    }

    if (tipData.category === "premium") return subscriptionAccess.hasPremium;
    if (tipData.category === "basic") return subscriptionAccess.hasBasic || subscriptionAccess.hasPremium;
    return true;
  };

  const canAccessTip = hasAccess();

  // Loading State
  if (loading || isAuthLoading) {
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

  // Not Authenticated State
  if (!isAuth) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view this recommendation.</p>
            <Link href={`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`}>
              <Button>Sign In</Button>
            </Link>


          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not Found State
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

  // Access Restricted State
  if (!canAccessTip) {
    const isPortfolioAccess = portfolioId && !subscriptionAccess?.portfolioAccess?.includes(portfolioId);

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
                <p className="text-gray-600">
                  {isPortfolioAccess
                    ? "This portfolio requires purchase to view its recommendations."
                    : `This ${tipData.category || "premium"} tip requires a subscription to view.`}
                </p>
              </div>

              <div className="space-y-3">
                {isPortfolioAccess ? (
                  <Button
                    onClick={async () => {
                      try {
                        const portfolioName = tipData.portfolio && typeof tipData.portfolio === 'object' && 'name' in tipData.portfolio
                          ? (tipData.portfolio as any).name
                          : 'Portfolio';
                        await addToCart(portfolioId, 1, { name: portfolioName });
                        toast({ title: "Added to cart", description: "Portfolio added successfully" });
                      } catch (error: any) {
                        toast({ title: "Error", description: error.message || "Failed to add to cart", variant: "destructive" });
                      }
                    }}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                  >
                    Add Portfolio to Cart
                  </Button>
                ) : (
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
                )}
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

  // Main Content
  const recommendedDate = tipData.createdAt ? format(new Date(tipData.createdAt), "dd MMM yyyy") : "N/A";
  const portfolioName = tipData.portfolio && typeof tipData.portfolio === "object" && "name" in tipData.portfolio
    ? (tipData.portfolio as any).name.replace(/\bportfolio\b/i, "").trim() || (tipData.portfolio as any).name
    : "Model Portfolio";

  return (
    <DashboardLayout>
      <InnerPageHeader title="MODEL PORTFOLIO" subtitle="" />
      <div className="bg-gray-50 -mb-6">
        <div className="max-w-4xl mx-auto px-1 pt-6 pb-0">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
              EXPERT RECOMMENDATIONS
            </h2>
          </div>

          {/* Stock Info Card */}
          <div
            className="p-[3px] rounded-lg mb-6 mx-auto max-w-[15rem] md:max-w-[20rem] relative"
            style={{ background: "linear-gradient(90deg, #00B7FF 0%, #85D437 100%)" }}
          >
            <div className="bg-white rounded-lg p-2 h-full">
              <div className="flex justify-between items-start">
                <div>
                  <div className="relative bg-gradient-to-r from-[#00B7FF] to-[#85D437] p-[3px] rounded-xl overflow-hidden">
                    <div className="bg-black text-xs sm:text-sm font-bold rounded-lg px-2 sm:px-3 py-0.5 sm:py-1 overflow-hidden">
                      <span className="bg-gradient-to-r from-[#00B7FF] to-[#85D437] bg-clip-text text-transparent font-bold">
                        {portfolioName}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">{stockData?.symbol || tipData.stockId || "STOCK"}</h3>
                  <p className="text-sm">{stockData?.exchange || "NSE"}</p>
                </div>

                <div className="flex-shrink-0">
                  <div className={`relative p-[4px] rounded-xl ${tipData.action === "SELL"
                    ? "bg-gradient-to-r from-[#DC2626] to-[#B91C1C]"
                    : tipData.action === "Partial Profit Booked" || tipData.action === "PARTIAL SELL" || tipData.action === "Partial Sell"
                      ? "bg-gradient-to-r from-[#F97316] to-[#EA580C]"
                      : "bg-gradient-to-r from-[#00B7FF] to-[#85D437]"
                    }`}>
                    <div className={`rounded-md px-2 py-1.5 text-center min-w-[60px] ${tipData.action === "SELL"
                      ? "bg-red-50"
                      : tipData.action === "Partial Profit Booked" || tipData.action === "PARTIAL SELL" || tipData.action === "Partial Sell"
                        ? "bg-orange-50"
                        : "bg-cyan-50"
                      }`}>
                      <p className={`text-xs mb-0 leading-tight font-medium ${tipData.action === "SELL"
                        ? "text-red-700"
                        : tipData.action === "Partial Profit Booked" || tipData.action === "PARTIAL SELL" || tipData.action === "Partial Sell"
                          ? "text-orange-700"
                          : "text-gray-700"
                        }`}>Weightage</p>
                      <p className={`text-right text-2xl font-bold leading-tight ${tipData.action === "SELL"
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

          {/* Title */}
          {tipData.title && (
            <div className="mb-6 text-center">
              <h2 className="text-lg" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                <b>Title:-</b> {tipData.title}
              </h2>
            </div>
          )}

          {/* Recommendation Details Card */}
          <div className="max-w-4xl mx-auto px-6 mb-6">
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

          {/* IMAGE CAROUSEL SECTION - Updated */}
          {images.length > 0 && (
            <div className="max-w-4xl mx-auto px-6 mb-8">
              <div className="bg-[#1e3a8a] text-[#FFFFF0] px-4 py-2 rounded-t-lg">
                <h4 className="font-semibold flex items-center text-sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Supporting Images ({currentImageIndex + 1}/{images.length})
                </h4>
              </div>

              <div className="bg-white border rounded-b-lg shadow-sm overflow-hidden" style={{ boxShadow: "0 0 9px rgba(0, 0, 0, 0.1)" }}>
                {/* Image Container with Dark Transparent Arrows */}
                <div className="relative">
                  {/* Left Arrow - Dark transparent overlay */}
                  {images.length > 1 && (
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  )}

                  {/* Scroll Container - Snap scroll, no inner scrolling */}
                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide overscroll-x-contain"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                  >
                    {images.map((imgSrc, index) => (
                      <div
                        key={index}
                        className="min-w-full flex-shrink-0 snap-center flex items-center justify-center bg-gray-50 h-[280px] md:h-[400px] cursor-pointer"
                        onClick={() => { setModalImageIndex(index); setModalOpen(true); }}
                      >
                        <img
                          src={imgSrc}
                          alt={`Analysis Chart ${index + 1}`}
                          className="max-w-full max-h-full object-contain pointer-events-none select-none"
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Right Arrow - Dark transparent overlay */}
                  {images.length > 1 && (
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  )}
                </div>

                {/* Instagram-style dots at bottom */}
                {images.length > 1 && (
                  <div className="flex justify-center items-center gap-1.5 py-3 bg-gray-100">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToIndex(idx)}
                        className={`rounded-full transition-all duration-200 ${idx === currentImageIndex
                          ? 'w-2 h-2 bg-blue-600'
                          : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                          }`}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Tap to zoom hint */}
                <div className="text-center py-2 text-xs text-gray-500 bg-gray-50 border-t">
                  Tap image to zoom
                </div>
              </div>
            </div>
          )}

          {/* Image Modal */}
          {modalOpen && images[modalImageIndex] && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 z-50 p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                {modalImageIndex + 1} / {images.length}
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-white/20 rounded-full text-white text-sm hover:bg-white/30">
                  Close
                </button>
              </div>

              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={images[modalImageIndex]}
                  alt={`Image ${modalImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  draggable={false}
                />
              </div>
            </div>
          )}

          {/* Why Buy/Sell This Section */}
          <div
            className="p-[3px] rounded-lg mx-auto max-w-5xl"
            style={{ background: "linear-gradient(90deg, #00B7FF 0%, #85D437 100%)", boxShadow: "0 0 9px rgba(0, 0, 0, 0.3)" }}
          >
            <div className="bg-white rounded-lg p-4 mb-0">
              <div className="mb-4">
                <div className="bg-[#131859] text-white rounded-2xl px-4 py-1 inline-block border-4 border-[#2C349A]">
                  <h3 className="text-2xl font-bold">{`Why ${tipData.action} This?`}</h3>
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