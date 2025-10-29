"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, animate, useTransform, type PanInfo, type MotionValue } from "framer-motion";
import { format, differenceInDays, addDays, isSameDay } from "date-fns";

import { cn } from "@/lib/utils";
import { tipsService, type Tip } from "@/services/tip.service";
import {
  subscriptionService,
  type SubscriptionAccess,
} from "@/services/subscription.service";
import { stockPriceService } from "@/services/stock-price.service";
import { stockSymbolCacheService } from "@/services/stock-symbol-cache.service";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { portfolioService } from "@/services/portfolio.service";

// Helper function to extract exit-range from tip content
const getExitRange = (content: string | { key: string; value: string; _id?: string; }[] | undefined): string | null => {
  if (!content) return null;
  
  if (Array.isArray(content)) {
    // Look for exit-range, exit-price, or target-price
    const exitRangeItem = content.find(item => 
      item.key && (
        item.key.toLowerCase() === 'exit-range' ||
        item.key.toLowerCase() === 'exit-price' ||
        item.key.toLowerCase() === 'target-price' ||
        item.key.toLowerCase().includes('exit') ||
        item.key.toLowerCase().includes('target')
      )
    );
    return exitRangeItem?.value || null;
  }
  
  return null;
};

// MarqueeText component for scrolling long text
const MarqueeText = ({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) => {
  const [shouldScroll, setShouldScroll] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScroll = () => {
      if (textRef.current && containerRef.current) {
        const textWidth = textRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        setShouldScroll(textWidth > containerWidth + 10); // Add small buffer
      }
    };

    checkScroll();
    // Re-check on window resize
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [text]);

  // Always show marquee for long text to ensure it works
  const isLongText = text.length > 15; // Reduced threshold to trigger marquee more often

  // Debug log to see what text is being passed
  console.log("MarqueeText debug:", {
    text,
    textLength: text.length,
    isLongText,
    shouldScroll,
  });

  // Force marquee for any text longer than 15 characters or if it should scroll
  if (!shouldScroll && !isLongText) {
    return (
      <div ref={containerRef} className={cn("overflow-hidden", className)}>
        <div ref={textRef} className="whitespace-nowrap">
          {text}
        </div>
      </div>
    );
  }

  // Always show marquee with duplicated text
  return (
    <div ref={containerRef} className={cn("overflow-hidden", className)}>
      <div
        ref={textRef}
        className="whitespace-nowrap animate-marquee"
        style={{
          animationDuration: `${Math.max(8, text.length * 0.15)}s`,
        }}
      >
        {text}
        <span className="ml-8">{text}</span>
      </div>
    </div>
  );
};

interface TipCardData {
  id: string;
  portfolioId?: string;
  portfolioName?: string;
  date: string;
  stockName: string;
  exchange: string;
  weightage?: number;
  mpWeightage?: number;
  buyRange: string;
  exitRange?: string;
  action: "HOLD" | "Partial Profit Booked" | "BUY" | "SELL";
  category: "basic" | "premium";
  title: string;
  message?: string;
  status?: string;
  targetPercentage?: number;
  exitStatus?: string;
  exitStatusPercentage?: number;
}

const getTipColorScheme = (
  category: "basic" | "premium",
  isModelPortfolio: boolean = false
) => {
  if (isModelPortfolio) {
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
  } else if (category === "premium") {
    return {
      gradient: "linear-gradient(90deg, #FFD700 30%, #3333330A 90%)",
      textColor: "#92400E",
      bgGradient: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
      borderColor: "#F59E0B",
      badge: {
        bg: "#92400E",
        text: "linear-gradient(to right, #92400E, #FEF3C7)",
      },
    };
  } else {
    return {
      gradient: "linear-gradient(90deg, #595CFFCC 30%, #3333330A 90%)",
      textColor: "#1E40AF",
      bgGradient: "linear-gradient(135deg, #18657B 0%, #131859 100%)",
      borderColor: "#595CFFCC",
      badge: {
        bg: "#18657B",
        text: "#DBEAFE",
      },
    };
  }
};

// Tick component for the new slider
type TickProps = {
  index: number
  x: MotionValue<number>
  sliderWidth: number
  segmentWidth: number
}

// These values control the appearance of the ticks
const MAX_HEIGHT = 40 // Height of the center tick in pixels
const MIN_HEIGHT = 16 // Height of the furthest ticks
const FALLOFF_DISTANCE = 160 // How quickly the ticks shrink

function Tick({ index, x, sliderWidth, segmentWidth, isSelected = false }: TickProps & { isSelected?: boolean }) {
  const halfSegment = segmentWidth / 2

  // useTransform is a powerful hook from Framer Motion.
  // It creates a new MotionValue that transforms the output of another.
  // Here, it's watching the main slider's `x` position.
  const height = useTransform(x, (latestX) => {
    // Calculate the absolute position of this specific tick on the screen
    const tickPosition = latestX + index * segmentWidth + halfSegment
    const centerOfSlider = sliderWidth / 2

    // Find the distance between this tick and the center of the slider
    const distanceFromCenter = Math.abs(tickPosition - centerOfSlider)

    // Map the distance to a height value using a smooth falloff
    const scale = Math.max(0, 1 - distanceFromCenter / FALLOFF_DISTANCE)
    const easedScale = scale * scale // A simple quadratic easing for a nice effect

    // Return the calculated height
    return MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * easedScale
  })

  return (
    <motion.div 
      className={`w-0.5 ${isSelected ? 'bg-blue-600' : 'bg-black'}`} 
      style={{ height }} 
    />
  )
}

interface DateTimelineSliderProps {
  dateRange: {
    min: Date;
    max: Date;
  };
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
  datesWithTips?: Date[];
}

export function DateTimelineSlider({
  dateRange,
  selectedDate,
  onDateChange,
  className,
  datesWithTips = [],
}: DateTimelineSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [sliderWidth, setSliderWidth] = useState(0)
  const x = useMotionValue(0)

  const segmentWidth = 32
  const halfSegment = segmentWidth / 2

  // Get unique dates with tip counts
  const dateData = useMemo(() => {
    const dateMap = new Map<string, { date: Date; count: number }>();
    
    datesWithTips.forEach(date => {
      if (!date || isNaN(date.getTime())) return;
      
      const dateKey = format(date, 'yyyy-MM-dd');
      if (dateMap.has(dateKey)) {
        dateMap.get(dateKey)!.count++;
      } else {
        dateMap.set(dateKey, { date, count: 1 });
      }
    });
    
    return Array.from(dateMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [datesWithTips]);

  const dates = useMemo(() => {
    return dateData.map(item => item.date);
  }, [dateData]);

  // Find the current selected index
  const selectedIndex = useMemo(() => {
    return dates.findIndex(date => isSameDay(date, selectedDate));
  }, [dates, selectedDate]);

  useEffect(() => {
    if (sliderRef.current) {
      setSliderWidth(sliderRef.current.offsetWidth)
    }
  }, [])

  const formatDisplayDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) return "Invalid Date";
    const weekday = format(date, "EEEE");
    const dateStr = format(date, "dd MMM yyyy");
    return `${weekday}, ${dateStr}`;
  };

  useEffect(() => {
    const unsubscribeX = x.on("change", (latestX) => {
      if (sliderWidth === 0 || !dates.length) return
      const centerOffset = sliderWidth / 2
      const rawIndex = (centerOffset - latestX - halfSegment) / segmentWidth
      const newIndex = Math.max(0, Math.min(dates.length - 1, Math.round(rawIndex)))

      if (newIndex !== selectedIndex && dates[newIndex]) {
        onDateChange(dates[newIndex])
      }
    })
    return () => unsubscribeX()
  }, [x, dates, selectedIndex, onDateChange, segmentWidth, sliderWidth, halfSegment])

  const handleDragEnd = () => {
    if (sliderWidth === 0 || !dates.length) return
    const centerOffset = sliderWidth / 2
    const targetX = centerOffset - halfSegment - selectedIndex * segmentWidth

    animate(x, targetX, {
      type: "spring",
      stiffness: 500,
      damping: 50,
      mass: 1,
    })
  }

  useEffect(() => {
    if (sliderWidth > 0 && selectedIndex >= 0) {
      const centerOffset = sliderWidth / 2
      const initialX = centerOffset - halfSegment - selectedIndex * segmentWidth
      animate(x, initialX, { type: "spring", stiffness: 500, damping: 50 })
    }
  }, [selectedIndex, segmentWidth, x, sliderWidth, dates, halfSegment])

  const totalRulerWidth = Math.max(0, (dates.length - 1) * segmentWidth)

  if (!dates.length) {
    return (
      <div className="w-full py-6 select-none">
        <div className="text-center h-14 flex flex-col justify-center">
          <p className="text-lg font-semibold tracking-tight text-gray-900">
            No tips available
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full py-6 select-none ${className || ""}`}>
      <div className="text-center h-14 flex flex-col justify-center">
        {dates[selectedIndex] && (
          <>
            <p className="text-lg font-semibold tracking-tight text-gray-900">
              {formatDisplayDate(dates[selectedIndex])}
            </p>
            <p className="text-sm text-gray-500">
              {dateData[selectedIndex]?.count > 1 
                ? `${dateData[selectedIndex].count} tips for this date`
                : "Tip for this date"
              }
            </p>
          </>
        )}
      </div>
      <div
        ref={sliderRef}
        className="relative w-full h-14 flex items-end overflow-hidden cursor-grab active:cursor-grabbing"
      >
        {sliderWidth > 0 && (
          <>
            <motion.div
              className="flex items-end"
              style={{ x }}
              drag="x"
              onDragEnd={handleDragEnd}
              dragConstraints={{
                left: sliderWidth / 2 - halfSegment - totalRulerWidth,
                right: sliderWidth / 2 - halfSegment,
              }}
              dragTransition={{ bounceStiffness: 400, bounceDamping: 50 }}
            >
              {dates.map((_, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center" style={{ width: segmentWidth }}>
                  <Tick 
                    index={i} 
                    x={x} 
                    sliderWidth={sliderWidth} 
                    segmentWidth={segmentWidth}
                    isSelected={i === selectedIndex}
                  />
                </div>
              ))}
            </motion.div>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 pointer-events-none z-10">
              <div className="w-full h-full bg-black rounded-full shadow-lg flex items-start justify-center pt-0.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"/>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const TipCard = ({
  tip,
  isActive,
  onClick,
  isModelPortfolio,
  subscriptionAccess,
}: {
  tip: TipCardData;
  isActive: boolean;
  onClick?: () => void;
  isModelPortfolio?: boolean;
  subscriptionAccess?: SubscriptionAccess;
}) => {
  const colorScheme = getTipColorScheme(tip.category, isModelPortfolio);

  const hasAccess = () => {
    if (!subscriptionAccess) {
      return false;
    }

    // For model portfolio tips, check portfolio access first
    if (tip.portfolioId && subscriptionAccess.portfolioAccess?.includes(tip.portfolioId)) {
      return true;
    }

    // Fallback to regular subscription check
    if (subscriptionAccess.hasPremium) {
      return true;
    }

    if (tip.category === "premium") {
      return false;
    } else if (tip.category === "basic") {
      return subscriptionAccess.hasBasic;
    }

    return true;
  };

  const canAccessTip = hasAccess();
  const shouldBlurContent = !canAccessTip;

  return (
    <div
      className={cn(
        "relative w-full h-full",
        "rounded-xl transition-all duration-500 cursor-pointer flex-shrink-0",
        isActive
          ? "scale-105 sm:scale-110 lg:scale-105 shadow-xl z-20"
          : "scale-95 sm:scale-90 lg:scale-95 opacity-100 shadow-md",
        onClick &&
          "hover:scale-100 sm:hover:scale-105 lg:hover:scale-100 hover:shadow-md"
      )}
      style={{
        background: colorScheme.gradient,
        padding: isActive ? "4px" : "3px",
      }}
      onClick={canAccessTip ? onClick : undefined}
    >
      <div className="w-full h-full bg-white rounded-[10px] p-3 sm:p-3.5 md:p-4 lg:p-4.5 flex flex-col justify-between relative overflow-hidden">
        <div
          className={cn(
            "w-full h-full flex flex-col justify-between relative z-10",
            shouldBlurContent && "blur-md"
          )}
        >
          <div className="flex justify-between items-start gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                {isModelPortfolio ? (
                  <div className="relative bg-gradient-to-r from-[#00B7FF] to-[#85D437] p-[3px] rounded-xl overflow-hidden">
                    <div className="bg-black text-xs sm:text-sm font-bold rounded-lg px-2 sm:px-3 py-0.5 sm:py-1 overflow-hidden">
                      {tip.portfolioName ? (
                        <div className="overflow-hidden">
                          <div className="whitespace bg-gradient-to-r from-[#00B7FF] to-[#85D437] font-bold bg-clip-text text-transparent">
                            {(() => {
                              const cleaned = tip.portfolioName.replace(/\bportfolio\b/i, "").trim();
                              return cleaned.length > 0 ? cleaned : tip.portfolioName;
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
                ) : (
                  <div className={`p-[4px] rounded-xl inline-block shadow-sm whitespace-nowrap ${
                    tip.category === 'premium' 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                      : 'bg-gradient-to-r from-[#A0A2FF] to-[#6E6E6E]'
                  }`}>
                    <div className={`text-xs sm:text-sm font-semibold rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 ${
                      tip.category === 'premium' 
                        ? 'bg-gray-800 text-yellow-400' 
                        : 'bg-gradient-to-r from-[#396C87] to-[#151D5C] text-white'
                    }`}>
                      {tip.category.charAt(0).toUpperCase() +
                        tip.category.slice(1)}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-lg sm:text-base md:text-lg lg:text-xl font-bold text-black truncate">
                {tip.stockName}
              </div>
              <p className="text-xs text-gray-500">{tip.exchange}</p>
            </div>
            <div className={`relative p-[4px] rounded-xl flex-shrink-0 ${
              isModelPortfolio 
                ? (tip.action === "SELL" ? "bg-gradient-to-r from-[#DC2626] to-[#B91C1C]" : "bg-gradient-to-r from-[#00B7FF] to-[#85D437]") 
                : tip.status === "closed"
                  ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && tip.exitStatusPercentage < 0))
                    ? "bg-gradient-to-r from-[#627281] to-[#A6AFB6]" 
                    : "bg-[#219612]"
                  : "bg-[#219612]"
            }`}>
              <div className={`rounded-lg px-1.5 sm:px-2 md:px-2.5 py-1 sm:py-1.5 text-center min-w-[40px] sm:min-w-[44px] md:min-w-[50px] ${
                isModelPortfolio 
                  ? (tip.action === "SELL" ? "bg-red-50" : "bg-cyan-50") 
                  : tip.status === "closed"
                    ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && tip.exitStatusPercentage < 0))
                      ? "bg-gradient-to-tr from-[#A6AFB6] to-[#627281]" 
                      : "bg-gradient-to-r from-green-50 to-green-100"
                    : "bg-gradient-to-r from-green-50 to-green-100"
              }`}>
                <p className={`text-[15px] sm:text-[15px] md:text-[15px] mb-0 leading-tight font-bold ${
                  isModelPortfolio 
                    ? (tip.action === "SELL" ? "text-red-700" : "text-gray-700") 
                    : tip.status === "closed"
                      ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && tip.exitStatusPercentage < 0))
                        ? "text-white" 
                        : "text-black"
                      : "text-black"
                }`}>
                  {isModelPortfolio ? "Weightage" : (tip.status === "closed" ? tip.exitStatus : "Target")}
                </p>
                <p className={`text-right text-[25px] sm:text-[30px] md:text-[30px] font-bold leading-tight ${
                  isModelPortfolio 
                    ? (tip.action === "SELL" ? "text-red-800" : "text-black") 
                    : tip.status === "closed"
                      ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && tip.exitStatusPercentage < 0))
                        ? "text-white" 
                        : "text-black"
                      : "text-black"
                }`}>
                  {isModelPortfolio ? `${tip.mpWeightage || tip.weightage}%` : (tip.status === "closed" ? `${tip.exitStatusPercentage}%` : `${tip.targetPercentage}%`)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-end mt-2 sm:mt-2.5 md:mt-3 gap-2 sm:gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-black-500 mb-0.5 sm:mb-1 leading-tight font-medium">
                {tip.action === "SELL" || tip.status === "closed" ? "Exit Range" : "Buy Range"}
              </p>
              <div className="text-base sm:text-sm md:text-xl font-bold text-black truncate">
                {tip.action === "SELL" || tip.status === "closed" ? (tip.exitRange || tip.buyRange) : tip.buyRange}
              </div>
            </div>
            <div className="flex-shrink-0">
              <p className="text-xs text-black mb-0.5 leading-tight font-medium text-right">
                Action
              </p>
              <div className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium bg-gray-700 text-[#FFFFF0] inline-block whitespace-nowrap">
                {tip.action.toUpperCase()}
              </div>
            </div>
          </div>
          {tip.message && (
            <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 bg-gray-100 rounded">
              <div className="text-xs sm:text-sm text-gray-600 leading-tight line-clamp-2">
                {tip.message}
              </div>
            </div>
          )}
        </div>
      </div>

      {shouldBlurContent && (
        <div className="absolute inset-0 bg-black bg-opacity-10 rounded-[10px] flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-lg max-w-[140px] sm:max-w-[160px]">
            <p className="text-xs text-gray-600 mb-1.5 sm:mb-2">
              {tip.category === "premium"
                ? "Premium subscription required"
                : "Basic subscription required"}
            </p>
            <button
              className={cn(
                "px-2 sm:px-3 py-1 rounded text-xs font-medium text-[#FFFFF0] transition-all",
                tip.category === "premium"
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                  : "bg-gradient-to-r from-[#18657B] to-[#131859] hover:from-blue-600 hover:to-blue-700"
              )}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href =
                  tip.category === "premium"
                    ? "/premium-subscription"
                    : "/basic-subscription";
              }}
            >
              {tip.category === "premium" ? "Get Premium" : "Get Basic"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface TipsCarouselProps {
  portfolioId?: string;
  tips?: Tip[];
  loading?: boolean;
  onTipClick?: (tipId: string) => void;
  categoryFilter?: "basic" | "premium" | "all";
  isModelPortfolio?: boolean;
  sliderSize?: "default" | "large";
  userSubscriptionAccess?: SubscriptionAccess;
}

export default function TipsCarousel({
  portfolioId,
  tips: propTips,
  loading: propLoading,
  onTipClick,
  categoryFilter = "all",
  isModelPortfolio = false,
  sliderSize = "default",
  userSubscriptionAccess,
}: TipsCarouselProps) {
  const [tips, setTips] = useState<TipCardData[]>([]);
  const [loading, setLoading] = useState(propLoading || false);
  const [subscriptionAccess, setSubscriptionAccess] = useState<
    SubscriptionAccess | undefined
  >(userSubscriptionAccess);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stockSymbols, setStockSymbols] = useState<Map<string, string>>(
    new Map()
  );
  const [portfolioHoldingsMap, setPortfolioHoldingsMap] = useState<
    Map<string, number>
  >(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const router = useRouter();

  // Responsive configuration
  const [dimensions, setDimensions] = useState({
    cardWidth: 280,
    cardHeight: 160,
    gap: 16,
    visibleCards: 1.2,
    containerPadding: 16,
  });

  useEffect(() => {
    setSubscriptionAccess(userSubscriptionAccess);
  }, [userSubscriptionAccess]);

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;

      let config = {
        cardWidth: 280,
        cardHeight: 160,
        gap: 16,
        visibleCards: 1.2,
        containerPadding: 16,
      };

      if (width < 400) {
        // Very small mobile
        config = {
          cardWidth: Math.min(260, width - 60),
          cardHeight: 160,
          gap: 12,
          visibleCards: 1.0,
          containerPadding: 12,
        };
      } else if (width < 480) {
        // Small mobile
        config = {
          cardWidth: Math.min(280, width - 60),
          cardHeight: 170,
          gap: 14,
          visibleCards: 1.0,
          containerPadding: 14,
        };
      } else if (width < 640) {
        // Large mobile
        config = {
          cardWidth: 300,
          cardHeight: 180,
          gap: 16,
          visibleCards: 1.0,
          containerPadding: 16,
        };
      } else if (width < 768) {
        // Small tablet
        config = {
          cardWidth: Math.min(320, width - 80),
          cardHeight: 200,
          gap: 18,
          visibleCards: 1.2,
          containerPadding: 18,
        };
      } else if (width < 1024) {
        // Large tablet
        config = {
          cardWidth: Math.min(340, width - 100),
          cardHeight: 200,
          gap: 20,
          visibleCards: 1.5,
          containerPadding: 20,
        };
      } else if (width < 1280) {
        // Small desktop
        config = {
          cardWidth: Math.min(360, width - 120),
          cardHeight: 200,
          gap: 24,
          visibleCards: 1.8,
          containerPadding: 24,
        };
      } else if (width < 1536) {
        // Large desktop
        config = {
          cardWidth: Math.min(380, width - 140),
          cardHeight: 220,
          gap: 28,
          visibleCards: 2.0,
          containerPadding: 28,
        };
      } else {
        // Extra large desktop
        config = {
          cardWidth: Math.min(400, width - 160),
          cardHeight: 220,
          gap: 32,
          visibleCards: 2.2,
          containerPadding: 32,
        };
      }

      setDimensions(config);
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const currentTipDate = useMemo(() => {
    if (tips.length === 0 || currentIndex >= tips.length) return new Date();
    const date = new Date(tips[currentIndex].date);
    return isNaN(date.getTime()) ? new Date() : date;
  }, [tips, currentIndex]);

  // Calculate date range for the timeline slider
  const dateRange = useMemo(() => {
    if (tips.length === 0) return { min: new Date(), max: new Date() };

    const dates = tips
      .filter((tip) => tip.date) // Filter out null/undefined dates first
      .map((tip) => new Date(tip.date))
      .filter((date) => date instanceof Date && !isNaN(date.getTime()) && date.getTime() > 0)
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length === 0) return { min: new Date(), max: new Date() };
    
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    // Validate dates before using them
    if (!minDate || !maxDate || isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
      return { min: new Date(), max: new Date() };
    }

    // Add some padding to the date range for better UX
    const paddingDays = 0;
    const paddedMinDate = addDays(minDate, -paddingDays);
    const paddedMaxDate = addDays(maxDate, paddingDays);

    console.log("📅 Timeline Date Range:", {
      tipsCount: tips.length,
      validDates: dates.length,
      minDate: format(minDate, "dd MMM yyyy"),
      maxDate: format(maxDate, "dd MMM yyyy"),
      paddedMin: format(paddedMinDate, "dd MMM yyyy"),
      paddedMax: format(paddedMaxDate, "dd MMM yyyy"),
    });

    return { min: paddedMinDate, max: paddedMaxDate };
  }, [tips]);



  // Fetch stock symbols for tips that have stockId using global cache (non-blocking)
  const fetchStockSymbols = async (apiTips: Tip[]) => {
    const tipsWithStockId = apiTips.filter((tip) => tip.stockId);
    if (tipsWithStockId.length === 0) {
      return;
    }

    try {
      console.log(
        `🔍 Fetching stock symbols for ${tipsWithStockId.length} tips using cache service (non-blocking)`
      );
      
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
        console.log(`📋 Set ${initialSymbols.size} cached symbols immediately`);
      }

      // Then fetch the remaining symbols in the background
      const uncachedIds = stockIds.filter(id => !stockSymbolCacheService.isSymbolCached(id));
      
      if (uncachedIds.length > 0) {
        console.log(`🔄 Fetching ${uncachedIds.length} uncached symbols in background`);
        
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
        
        console.log(`✅ Added ${symbolResults.size} new symbols from background fetch`);
      }
      
    } catch (error) {
      console.error("❌ Failed to fetch stock symbols:", error);
    }
  };

  const convertTipsToCarouselFormat = (apiTips: Tip[]): TipCardData[] => {
    return apiTips.map((tip, index) => {
      // Priority order for stock name:
      // 1. Cached symbol from state
      // 2. Cached symbol from cache service
      // 3. Parsed from title
      // 4. Stock ID (as last resort)
      // 5. Generic fallback
      
      let stockName = stockSymbols.get(tip.stockId || "");
      
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
        stockName = `Stock ${index + 1}`;
      }
      // Debug: Log the mapping and lookup
      if (isModelPortfolio) {
        console.log(
          "[TipsCarousel] Looking up weight for symbol:",
          stockName,
          "in map:",
          Array.from(portfolioHoldingsMap.entries())
        );
      }
      // Get weightage from portfolio holdings if available
      let weightage: number | undefined = undefined;
      if (
        isModelPortfolio &&
        stockName &&
        portfolioHoldingsMap.has(stockName)
      ) {
        weightage = portfolioHoldingsMap.get(stockName);
        console.log(
          `[TipsCarousel] Found weightage for ${stockName}:`,
          weightage
        );
      }
      if (weightage === undefined && isModelPortfolio) {
        weightage = 5.0;
      }

      // Extract portfolio name
      let portfolioName: string | undefined;
      if (typeof tip.portfolio === "string") {
        // If portfolio is just an ID, we'll need to fetch the name separately
        portfolioName = undefined;
      } else if (tip.portfolio && typeof tip.portfolio === "object") {
        portfolioName = tip.portfolio.name;
      }

      return {
        id: tip._id,
        portfolioId:
          typeof tip.portfolio === "string"
            ? tip.portfolio
            : tip.portfolio?._id,
        portfolioName,
        date: tip.status?.toLowerCase() === 'closed' ? tip.updatedAt : tip.createdAt,
        stockName,
        exchange: "NSE",
        weightage,
        mpWeightage: (tip as any).mpWeightage,
        buyRange: tip.buyRange || "₹ 1000 - 1050",
        exitRange: getExitRange(tip.content) || tip.exitPrice,
        action:
          (tip.action as "HOLD" | "Partial Profit Booked" | "BUY" | "SELL") ||
          "BUY",
        category: tip.category || "basic",
        title: tip.title,
        message: tip.message,
        status: tip.status?.toLowerCase(),
        targetPercentage: tip.targetPercentage ? parseFloat(tip.targetPercentage.replace("%", "")) : undefined,
        exitStatus: tip.exitStatus,
        exitStatusPercentage: tip.exitStatusPercentage ? parseFloat(tip.exitStatusPercentage.replace("%", "")) : undefined,
      };
    });
  };

  const handleTipClick = (tip: TipCardData) => {
    if (onTipClick) {
      onTipClick(tip.id);
    } else {
      if (tip.portfolioId) {
        router.push(`/model-portfolios/${tip.portfolioId}/tips/${tip.id}`);
      } else {
        router.push(`/rangaone-wealth/recommendation/${tip.id}`);
      }
    }
  };

  // Calculate container width and positioning - RESPONSIVE
  const containerWidth = Math.min(
    typeof window !== "undefined"
      ? window.innerWidth - dimensions.containerPadding * 2
      : 800,
    dimensions.cardWidth * Math.floor(dimensions.visibleCards) +
      dimensions.gap * (Math.floor(dimensions.visibleCards) - 1)
  );

  const updateCurrentIndex = (xValue: number) => {
    const centerPosition = containerWidth / 2;
    const cardCenter = dimensions.cardWidth / 2;
    const adjustedPosition = -xValue + centerPosition - cardCenter;
    const cardStep = dimensions.cardWidth + dimensions.gap;
    const newIndex = Math.max(
      0,
      Math.min(tips.length - 1, Math.round(adjustedPosition / cardStep))
    );

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const onDragEnd = (
    e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const centerPosition = containerWidth / 2;
    const cardCenter = dimensions.cardWidth / 2;
    const cardStep = dimensions.cardWidth + dimensions.gap;

    const tipPosition = -x.get() + centerPosition - cardCenter;
    const nearestIndex = Math.max(
      0,
      Math.min(tips.length - 1, Math.round(tipPosition / cardStep))
    );

    const targetX = -(nearestIndex * cardStep) + centerPosition - cardCenter;

    animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.5,
    });

    setCurrentIndex(nearestIndex);
  };

  const goToTip = (index: number) => {
    const centerPosition = containerWidth / 2;
    const cardCenter = dimensions.cardWidth / 2;
    const cardStep = dimensions.cardWidth + dimensions.gap;
    const targetX = -(index * cardStep) + centerPosition - cardCenter;

    animate(x, targetX, {
      type: "spring",
      stiffness: 400,
      damping: 35,
      mass: 0.8,
    });

    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      goToTip(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < tips.length - 1) {
      goToTip(currentIndex + 1);
    }
  };

  // Calculate drag constraints - FIXED
  const centerPosition = containerWidth / 2;
  const cardCenter = dimensions.cardWidth / 2;
  const cardStep = dimensions.cardWidth + dimensions.gap;

  const maxX = centerPosition - cardCenter;
  const minX = -(tips.length - 1) * cardStep + centerPosition - cardCenter;

  useEffect(() => {
    const fetchTips = async () => {
      // Wait for cache service to initialize
      await stockSymbolCacheService.waitForInitialization();
      
      if (propTips) {
        let filteredTips = propTips;

        if (categoryFilter !== "all") {
          filteredTips = propTips.filter(
            (tip) => tip.category === categoryFilter
          );
        }

        // Convert tips and sort ascending by createdAt
        const carouselTips = convertTipsToCarouselFormat(filteredTips).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setTips(carouselTips);
        setLoading(false);

        // Fetch stock symbols in the background (non-blocking)
        fetchStockSymbols(filteredTips);
        return;
      }

      setLoading(true);
      try {
        let apiTips: Tip[] = [];

        if (portfolioId) {
          apiTips = await tipsService.getPortfolioTips({
            portfolioId,
            category: categoryFilter !== "all" ? categoryFilter : undefined,
          });
        } else {
          apiTips = await tipsService.getAll({
            category: categoryFilter !== "all" ? categoryFilter : undefined,
          });
        }

        // Convert tips and sort ascending by createdAt
        const carouselTips = convertTipsToCarouselFormat(apiTips).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setTips(carouselTips);
        setLoading(false);

        // Fetch stock symbols in the background (non-blocking)
        fetchStockSymbols(apiTips);
      } catch (error) {
        console.error("Failed to fetch tips:", error);
        const sampleTips: TipCardData[] = [
          {
            id: "1",
            date: "2025-04-14T00:00:00.000Z",
            stockName: "ZAGGLE",
            exchange: "NSE",
            weightage: 5.0,
            buyRange: "₹ 1000 - 1050",
            action: "SELL",
            category: "basic",
            title: "ZAGGLE Analysis",
            portfolioName: isModelPortfolio ? "Growth Portfolio" : undefined,
          },
          {
            id: "2",
            date: "2025-04-15T00:00:00.000Z",
            stockName: "BLUESTARCO",
            exchange: "NSE",
            weightage: 5.0,
            buyRange: "₹ 1000 - 1050",
            action: "HOLD",
            category: "premium",
            title: "BLUESTARCO Premium Analysis",
            portfolioName: isModelPortfolio ? "Premium Portfolio" : undefined,
          },
        ];
        setTips(sampleTips);
        setLoading(false);
      }
    };

    fetchTips();
  }, [portfolioId, propTips, categoryFilter]);

  // Re-convert tips when stock symbols are updated (progressive updates)
  useEffect(() => {
    if (propTips && !loading && stockSymbols.size > 0) {
      let filteredTips = propTips;
      if (categoryFilter !== "all") {
        filteredTips = propTips.filter(
          (tip) => tip.category === categoryFilter
        );
      }
      const carouselTips = convertTipsToCarouselFormat(filteredTips).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setTips(carouselTips);
    }
  }, [stockSymbols, propTips, categoryFilter, loading]);

  useEffect(() => {
    const fetchSubscriptionAccess = async () => {
      try {
        subscriptionService.clearCache();
        const access = await subscriptionService.getSubscriptionAccess(true);
        setSubscriptionAccess(access);
      } catch (error) {
        console.error("Failed to fetch subscription access:", error);
        setSubscriptionAccess({
          hasBasic: false,
          hasPremium: false,
          portfolioAccess: [],
          subscriptionType: "none",
        });
      }
    };

    fetchSubscriptionAccess();
  }, []);

  // Fetch portfolio holdings for model portfolios
  useEffect(() => {
    const fetchPortfolioHoldings = async () => {
      if (isModelPortfolio && portfolioId) {
        try {
          const portfolio = await portfolioService.getById(portfolioId);
          if (portfolio && Array.isArray(portfolio.holdings)) {
            const map = new Map<string, number>();
            portfolio.holdings.forEach((h: any) => {
              if (h.symbol && typeof h.weight === "number") {
                map.set(h.symbol, h.weight);
              }
            });
            setPortfolioHoldingsMap(map);
          }
        } catch (err) {
          console.error(
            "Failed to fetch portfolio holdings for weightage:",
            err
          );
        }
      }
    };
    fetchPortfolioHoldings();
  }, [isModelPortfolio, portfolioId]);

  // Center the first tip on initial load
  useEffect(() => {
    if (tips.length > 0 && containerWidth > 0) {
      const centerPosition = containerWidth / 2;
      const cardCenter = dimensions.cardWidth / 2;
      const targetX = centerPosition - cardCenter;
      x.set(targetX);
      setCurrentIndex(0);
    }
  }, [tips.length, containerWidth, dimensions.cardWidth, x]);

  if (loading) {
    return (
      <div className="relative w-full flex flex-col items-center justify-center overflow-hidden py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading tips...</p>
        </div>
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div className="relative w-full flex flex-col items-center justify-center overflow-hidden py-6">
        <div className="text-center">
          <div className="text-gray-400 mb-3 text-3xl">📊</div>
          <p className="text-gray-600">
            No tips available for the selected category.
          </p>
        </div>
      </div>
    );
  }

  const tipDates = tips
    .map((tip) => new Date(tip.date))
    .filter((date) => !isNaN(date.getTime()));

  return (
    <div className="relative w-full flex flex-col items-center justify-center">
      {/* Carousel Container */}
      <div
        className="relative w-full overflow-hidden"
        style={{ padding: `16px ${dimensions.containerPadding}px` }}
      >
        <div
          ref={containerRef}
          className="relative mx-auto flex items-center justify-center"
          style={{
            width: `${containerWidth}px`,
            height: `${dimensions.cardHeight + 10}px`,
          }}
        >
          <motion.div
            className="absolute left-0 top-0 flex items-center h-full"
            style={{ x }}
            drag="x"
            dragConstraints={{
              left: minX,
              right: maxX,
            }}
            onDrag={(e, info) => updateCurrentIndex(x.get())}
            onDragEnd={onDragEnd}
            dragElastic={0.1}
            dragMomentum={false}
          >
            {tips.map((tip, index) => {
              const isActive = index === currentIndex;
              return (
                <motion.div
                  key={tip.id}
                  className="flex-shrink-0"
                  style={{
                    width: dimensions.cardWidth,
                    height: dimensions.cardHeight,
                    marginRight: index === tips.length - 1 ? 0 : dimensions.gap,
                  }}
                  animate={{
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <TipCard
                    tip={tip}
                    isActive={isActive}
                    onClick={() => handleTipClick(tip)}
                    isModelPortfolio={isModelPortfolio}
                    subscriptionAccess={subscriptionAccess}
                  />
                </motion.div>
              );
            })}
          </motion.div>
          
        </div>
     {/* Date Timeline Slider */}
      {tips.length > 1 && (
        <div className="w-full max-w-2xl mx-auto px-2">
          <DateTimelineSlider
            dateRange={dateRange}
            selectedDate={currentTipDate}
            onDateChange={(date) => {
              if (!date || isNaN(date.getTime())) return;
              
              console.log(
                "📅 Timeline Date Selected:",
                format(date, "dd MMM yyyy")
              );

              // Find the tip with the closest date to the selected date
              let closestTipIndex = 0;
              let minDiff = Infinity;

              tips.forEach((tip, index) => {
                const tipDate = new Date(tip.date);
                if (isNaN(tipDate.getTime())) return;
                
                const diff = Math.abs(tipDate.getTime() - date.getTime());

                if (diff < minDiff) {
                  minDiff = diff;
                  closestTipIndex = index;
                }
              });

              // Only navigate if we found a significantly close tip (within 1 day)
              const closestTipDate = new Date(tips[closestTipIndex].date);
              if (isNaN(closestTipDate.getTime())) return;
              
              const dayDiff = Math.abs(differenceInDays(date, closestTipDate));

              console.log("🎯 Timeline Navigation:", {
                selectedDate: format(date, "dd MMM yyyy"),
                closestTipDate: format(closestTipDate, "dd MMM yyyy"),
                closestTipIndex,
                dayDiff,
                willNavigate: dayDiff <= 1,
              });

              if (dayDiff <= 1) {
                goToTip(closestTipIndex);
              }
            }}
            className=""
            datesWithTips={tipDates}
          />
        </div>
      )}

        {/* Navigation Arrows */}
        {containerWidth > 640 && tips.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={cn(
                "absolute left-2 top-1/3 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 z-10",
                currentIndex === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50 hover:shadow-xl"
              )}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={goToNext}
              disabled={currentIndex === tips.length - 1}
              className={cn(
                "absolute right-2 top-1/3 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 z-10",
                currentIndex === tips.length - 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50 hover:shadow-xl"
              )}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
