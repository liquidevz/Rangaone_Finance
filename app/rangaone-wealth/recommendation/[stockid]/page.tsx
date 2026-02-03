"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { InnerPageHeader } from "@/components/inner-page-header";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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

// Extend Tip to include images
interface ExtendedTip extends Tip {
  images?: any[];
}

// Helper function to convert raw buffer objects to base64 strings
function processImages(rawImages: any[]): string[] {
  if (!Array.isArray(rawImages)) return [];

  return rawImages
    .map((imgSrc) => {
      if (typeof imgSrc === 'string') return imgSrc;

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

// Image Modal Component with Zoom
function ImageModal({
  isOpen,
  onClose,
  imageSrc,
  imageIndex,
  totalImages
}: {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageIndex: number;
  totalImages: number;
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchDistance = useRef<number | null>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

      if (lastTouchDistance.current !== null) {
        const delta = distance - lastTouchDistance.current;
        setScale(prev => Math.max(1, Math.min(4, prev + delta * 0.01)));
      }
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastPosition.current.x;
      const deltaY = touch.clientY - lastPosition.current.y;
      setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastPosition.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastTouchDistance.current = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    } else if (e.touches.length === 1) {
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
        {imageIndex + 1} / {totalImages}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        <button onClick={handleZoomOut} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30" disabled={scale <= 1}>
          <ZoomOut className="w-5 h-5" />
        </button>
        <button onClick={handleReset} className="px-3 py-2 bg-white/20 rounded-full text-white text-sm hover:bg-white/30">
          Reset
        </button>
        <button onClick={handleZoomIn} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30" disabled={scale >= 4}>
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={imageRef}
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={imageSrc}
          alt={`Image ${imageIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)` }}
          draggable={false}
        />
      </div>
    </div>
  );
}

// Color scheme function
const getTipColorScheme = (category: "basic" | "premium") => {
  if (category === "premium") {
    return {
      gradient: "linear-gradient(90deg, #FFD700 30%, #3333330A 90%)",
      textColor: "#92400E",
      bgGradient: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
      borderColor: "#F59E0B",
      badge: { bg: "#92400E", text: "#FEF3C7" },
    };
  } else {
    return {
      gradient: "linear-gradient(90deg, #595CFF 30%, #3333330A 90%)",
      textColor: "#1E40AF",
      bgGradient: "linear-gradient(135deg, #18657B 0%, #131859 100%)",
      borderColor: "#595CFF",
      badge: { bg: "#18657B", text: "#DBEAFE" },
    };
  }
};

const getExitRange = (content: string | { key: string; value: string; _id?: string; }[] | undefined): string | null => {
  if (!content) return null;
  if (Array.isArray(content)) {
    const exitRangeItem = content.find(item => item.key === 'exit-range');
    return exitRangeItem?.value || null;
  }
  return null;
};

const getStopLoss = (content: string | { key: string; value: string; _id?: string; }[] | undefined): string | null => {
  if (!content) return null;
  if (Array.isArray(content)) {
    const stopLossItem = content.find(item => item.key === 'stop-loss');
    return stopLossItem?.value || null;
  }
  return null;
};

const formatPercentage = (value: string | number | undefined): string => {
  if (!value) return '0%';
  const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;
  return `${Math.floor(numValue)}%`;
};

export default function StockRecommendationPage() {
  const params = useParams();
  const router = useRouter();
  const stockId = params?.stockid as string;
  const { toast } = useToast();
  const { isAuthenticated: isAuth, isLoading: isAuthLoading } = useAuth();
  const [tipData, setTipData] = useState<ExtendedTip | undefined>();
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | undefined>();
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<StockPriceData | null>(null);

  // Image Carousel State
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Process images
  const images = useMemo(() => {
    return processImages(tipData?.images || []);
  }, [tipData?.images]);

  useEffect(() => {
    async function loadData() {
      if (!stockId) return;

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
          tipsService.getById(stockId),
          subscriptionService.getSubscriptionAccess()
        ]);

        setTipData(tipResult);
        setSubscriptionAccess(accessResult);

        if (tipResult?.stockId) {
          try {
            const symbolResponse = await fetch(`/api/stock-symbols/${tipResult.stockId}`);
            if (symbolResponse.ok) {
              const stockSymbolData = await symbolResponse.json();
              setStockData(stockSymbolData);
            } else {
              const stockResponse = await stockPriceService.getStockPriceById(tipResult.stockId);
              if (stockResponse.success && stockResponse.data) {
                setStockData(stockResponse.data);
              }
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
  }, [stockId, toast, router, isAuth, isAuthLoading]);

  // Carousel Navigation
  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({ left: index * scrollWidth, behavior: 'smooth' });
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

  const openImageModal = (index: number) => {
    setModalImageIndex(index);
    setModalOpen(true);
  };

  const hasAccess = () => {
    if (!subscriptionAccess || !tipData) return false;
    if (tipData.category === 'premium') return subscriptionAccess.hasPremium;
    if (tipData.category === 'basic') return subscriptionAccess.hasBasic || subscriptionAccess.hasPremium;
    return true;
  };

  const canAccessTip = hasAccess();

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

  if (!canAccessTip) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-4">
          <div className="mb-6">
            <Link href="/rangaone-wealth/all-recommendations" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
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
            style={{ background: colorScheme.gradient, boxShadow: '0 0 9px rgba(0, 0, 0, 0.3)' }}
          >
            <div className="bg-white rounded-lg p-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className={`p-[2px] rounded inline-block ${tipData.category === 'premium'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                    : 'bg-gradient-to-r from-[#A0A2FF] to-[#6E6E6E]'
                    }`}>
                    <div className={`text-xs font-semibold rounded px-2 py-0.5 ${tipData.category === 'premium'
                      ? 'bg-gray-800 text-yellow-400'
                      : 'bg-gradient-to-r from-[#396C87] to-[#151D5C] text-white'
                      }`}>
                      {tipData.category === 'premium' ? 'Premium' : 'Basic'}
                    </div>
                  </div>
                  <h3 className="md:text-xl text-md font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {stockData?.symbol || tipData.stockId || 'STOCK'}
                    <p className="text-sm font-light text-gray-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                      {stockData?.exchange || 'NSE'}
                    </p>
                  </h3>
                </div>

                {(tipData.status?.toLowerCase() === 'closed' || tipData.exitStatus || tipData.exitStatusPercentage) ? (
                  (tipData.exitStatus || tipData.exitStatusPercentage) && (
                    <div className={`p-[4px] rounded-xl ${(tipData.exitStatus?.toLowerCase().includes('loss') || (tipData.exitStatusPercentage && parseFloat(tipData.exitStatusPercentage.replace('%', '')) < 0))
                      ? 'bg-gradient-to-r from-[#627281] to-[#A6AFB6]'
                      : 'bg-[#219612]'
                      }`}>
                      <div className={`rounded-lg text-center min-w-[80px] py-0.5 px-1 ${(tipData.exitStatus?.toLowerCase().includes('loss') || (tipData.exitStatusPercentage && parseFloat(tipData.exitStatusPercentage.replace('%', '')) < 0))
                        ? 'bg-gradient-to-tr from-[#A6AFB6] to-[#627281]'
                        : 'bg-gradient-to-r from-green-50 to-green-100'
                        }`}>
                        <p className={`text-sm font-bold text-center mb-0 ${(tipData.exitStatus?.toLowerCase().includes('loss') || (tipData.exitStatusPercentage && parseFloat(tipData.exitStatusPercentage.replace('%', '')) < 0)) ? 'text-white' : 'text-black'
                          }`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{tipData.exitStatus || 'Exit Status'}</p>
                        <p className={`text-3xl font-bold -mt-1 mb-0 ${(tipData.exitStatus?.toLowerCase().includes('loss') || (tipData.exitStatusPercentage && parseFloat(tipData.exitStatusPercentage.replace('%', '')) < 0)) ? 'text-white' : 'text-black'
                          }`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{formatPercentage(tipData.exitStatusPercentage)}</p>
                      </div>
                    </div>
                  )
                ) : (
                  tipData.targetPercentage && (
                    <div className="bg-[#219612] p-[4px] rounded-xl">
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
                      style={{ width: `${(tipData.analysistConfidence || 0) * 10}%`, backgroundColor: colorScheme.textColor }}
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
            style={{ background: colorScheme.gradient, boxShadow: '0 0 9px rgba(0, 0, 0, 0.3)' }}
          >
            <div className="bg-white rounded-lg p-4">
              <div className="text-center mb-4">
                <div className="bg-[#131859] text-white rounded-2xl px-4 inline-block border-4 border-[#2C349A]">
                  <h3 className="md:text-2xl text-md font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Recommendation Details</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(tipData.status?.toLowerCase() === 'closed' || tipData.exitStatus) ? (
                  <>
                    {tipData.buyRange && (
                      <div className="text-center">
                        <p className="text-[0.9rem] md:text-2xl lg:text-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Buy Range</p>
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

        {/* IMAGE CAROUSEL SECTION - Updated */}
        {images.length > 0 && (
          <div className="max-w-4xl mx-auto px-6 mb-6">
            <div className="bg-[#1e3a8a] text-[#FFFFF0] px-4 py-2 rounded-t-lg">
              <h4 className="font-semibold flex items-center text-sm">
                <ImageIcon className="w-4 h-4 mr-2" />
                Supporting Images
              </h4>
            </div>

            <div className="bg-white border border-t-0 rounded-b-lg shadow-sm overflow-hidden">
              {/* Image Container with Dark Arrows */}
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

                {/* Scroll Container - Snap scroll */}
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
                      onClick={() => openImageModal(index)}
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
        <ImageModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          imageSrc={images[modalImageIndex] || ''}
          imageIndex={modalImageIndex}
          totalImages={images.length}
        />

        {/* Box 3 - Why Buy This */}
        <div className="max-w-4xl mx-auto px-6 pb-6">
          <div
            className="p-[3px] rounded-lg mx-auto max-w-5xl"
            style={{ background: colorScheme.gradient, boxShadow: '0 0 9px rgba(0, 0, 0, 0.3)' }}
          >
            <div className="bg-white rounded-lg p-4">
              <div className="mb-4">
                <div className="bg-[#131859] text-white rounded-2xl px-4 py-1 inline-block border-4 border-[#2C349A]">
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{`Why ${tipData.action} This?`}</h3>
                </div>
              </div>

              {tipData.description && (
                <div className="mb-6">
                  <div
                    className="text-lg leading-relaxed prose prose-lg max-w-none [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-2"
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
      </div>
    </DashboardLayout>
  );
}