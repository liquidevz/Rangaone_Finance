"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Lock, TrendingUp, Crown, Star, ArrowDown, ArrowUp, Search } from "lucide-react"
import { GlobalSearch } from "@/components/global-search"
import { cn } from "@/lib/utils"
import { tipsService, Tip } from "@/services/tip.service"
import { portfolioService } from "@/services/portfolio.service"
import { subscriptionService, SubscriptionAccess } from "@/services/subscription.service"
import { stockSymbolCacheService } from "@/services/stock-symbol-cache.service"
import { stockPriceService, StockPriceData } from "@/services/stock-price.service"
import { marketDataService, MarketIndexData } from "@/services/market-data.service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Portfolio } from "@/lib/types"
import { useAuth } from "@/components/auth/auth-context"
import { useRouter } from "next/navigation"
import { MethodologyModal } from "@/components/methodology-modal"
import { authService } from "@/services/auth.service"
import axiosApi from "@/lib/axios"
import { cache } from "@/lib/cache"
import MarketIndices from "@/components/market-indices"

// Helper: normalize API percent values and format for display
const normalizePercent = (value: any): number => {
  if (value === null || value === undefined) return 0;
  // Strip a trailing % if API ever returns strings like "12.3%"
  const numeric = typeof value === 'string' ? Number(value.replace(/%/g, '')) : Number(value);
  return isFinite(numeric) ? numeric : 0;
};


// Mobile Global Search Component
function MobileGlobalSearch() {
  return (
    <div className="relative flex-1 max-w-full">
      <GlobalSearch />
    </div>
  )
}

// Stock Symbol Display Component
function StockSymbolDisplay({ stockId, tipTitle }: { stockId?: string; tipTitle?: string }) {
  // Use stockId directly from API as it contains the stock symbol
  if (stockId && stockId !== "STOCK") {
    return <>{stockId}</>
  }
  
  // Fallback to extracting from title
  if (tipTitle) {
    const titleParts = tipTitle.split(/[:\-\s]/);
    const potentialSymbol = titleParts[0]?.trim().toUpperCase();
    if (potentialSymbol && potentialSymbol.length > 1 && /^[A-Z0-9&\-\.]+$/i.test(potentialSymbol)) {
      return <>{potentialSymbol}</>
    }
  }
  
  return <>STOCK</>
}

// Market Indices Component
export function MarketIndicesSection() {
  const [marketData, setMarketData] = useState<MarketIndexData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true)
        // Clear cache to ensure fresh data
        marketDataService.clearCache()
        const data = await marketDataService.getMarketIndices(true)
        if (data?.success && data.data) {
          setMarketData(data.data)
          setLastUpdated(new Date(data.timestamp).toLocaleTimeString())
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarketData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Auto-collapse after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setIsExpanded(false), 10000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden" data-tour="market-indices">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>Market Indices</h2>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">Last updated: {lastUpdated}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
        
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg p-6">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-8 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : marketData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {marketData.map((index) => {
                const currentPrice = parseFloat(index.currentPrice)
                const priceChange = parseFloat(index.priceChange)
                const priceChangePercent = parseFloat(index.priceChangePercent)
                const isNegative = priceChange < 0
                
                return (
                  <Card key={index.symbol} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">{index.symbol === 'NIFTY' ? 'NIFTY 50' : index.symbol === 'NIFTYMIDCAP150' ? 'NIFTY MIDCAP 150' : index.symbol === 'NIFTYSMLCAP250' ? 'NIFTY SMALLCAP 250' : index.name}</h3>
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div
                          className={cn(
                            "flex items-center text-sm font-medium",
                            isNegative ? "text-red-500" : "text-green-500",
                          )}
                        >
                          {isNegative ? (
                            <ArrowDown className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowUp className="h-4 w-4 mr-1" />
                          )}
                          <span className="truncate">
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Unable to load market data. Please try again later.
            </div>
          )}
        </div>
        
        

      </div>
    </div>
  )
}

// Expert Recommendations Component
export function ExpertRecommendationsSection() {
  const [activeTab, setActiveTab] = useState("RangaOneWealth")
  const [rangaOneWealthTips, setRangaOneWealthTips] = useState<Tip[]>([])
  const [modelPortfolioTips, setModelPortfolioTips] = useState<Tip[]>([])
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | null>(null)
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const fetchSubscriptionAccess = async () => {
      if (isAuthenticated) {
        try {
          // Check cache first
          let accessData = cache.get<SubscriptionAccess>('subscription_access')
          if (!accessData) {
            console.log("🔄 Fetching fresh subscription access from API...")
            accessData = await subscriptionService.forceRefresh()
            cache.set('subscription_access', accessData, 5) // Cache for 5 minutes
          }
          setSubscriptionAccess(accessData)
          console.log("✅ Subscription access updated:", accessData)
        } catch (error) {
          console.error("Failed to fetch subscription access:", error)
        }
      }
    }

    fetchSubscriptionAccess()
  }, [isAuthenticated])

  // Debug function - call from browser console: window.debugSubscriptionAccess()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugSubscriptionAccess = async () => {
        console.log("🔧 Manual subscription access debug...")
        try {
          const accessData = await subscriptionService.getSubscriptionAccess(true) // Force refresh
          console.log("🔍 Fresh subscription access data:", accessData)
          
          // Get raw subscription data
          const { subscriptions: rawSubscriptions, accessData: rawAccessData } = await subscriptionService.getUserSubscriptions(true)
          console.log("📊 Raw subscription data:", rawSubscriptions)
          console.log("📊 Raw access data:", rawAccessData)
          
          return accessData
        } catch (error) {
          console.error("❌ Debug failed:", error)
          return null
        }
      }
    }
  }, [])

  useEffect(() => {
    const fetchTips = async () => {
      setLoading(true)
      try {
        const cacheKey = `tips_${activeTab}`
        let tips = cache.get<Tip[]>(cacheKey)
        
        if (!tips) {
          if (activeTab === "RangaOneWealth") {
            // Fetch general investment tips from /api/user/tips
            const generalTips = await tipsService.getAll()
            
            // Sort by creation date (latest first) and separate by category
            const sortedTips = generalTips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            const basicTips = sortedTips.filter(tip => tip.category === 'basic')
            const premiumTips = sortedTips.filter(tip => tip.category === 'premium')
            
            // Alternate between basic and premium tips
            const alternatingTips = []
            const maxLength = Math.max(basicTips.length, premiumTips.length)
            
            for (let i = 0; i < maxLength; i++) {
              if (i < basicTips.length) alternatingTips.push(basicTips[i])
              if (i < premiumTips.length) alternatingTips.push(premiumTips[i])
            }
            
            tips = alternatingTips
            setRangaOneWealthTips(tips)
          } else if (activeTab === "modelPortfolio") {
            // Fetch portfolio-specific tips from /api/user/tips-with-portfolio
            const portfolioTips = await tipsService.getPortfolioTips()
            tips = portfolioTips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            setModelPortfolioTips(tips)
          }
          
          // Cache for 10 minutes
          if (tips) cache.set(cacheKey, tips, 10)
        } else {
          if (activeTab === "RangaOneWealth") {
            setRangaOneWealthTips(tips)
          } else {
            setModelPortfolioTips(tips)
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${activeTab} tips:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchTips()
  }, [activeTab, subscriptionAccess])

  return (

    
    <div className="bg-white border border-gray-200 rounded-lg p-4" data-tour="recommendations">
   {/* Mobile search bar - outside drawer */}
      <div className="md:hidden px-2 pb-4">
        <MobileGlobalSearch />
      </div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Expert Recommendations</h2>
        <Link href="/rangaone-wealth">
          <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            View All
          </Button>
        </Link>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button
          variant={activeTab === "RangaOneWealth" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("RangaOneWealth")}
          className={activeTab === "RangaOneWealth" ? "bg-blue-600 text-[#FFFFF0]" : ""}
        >
          RangaOne Wealth
        </Button>
        <Button
          variant={activeTab === "modelPortfolio" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("modelPortfolio")}
          className={activeTab === "modelPortfolio" ? "bg-blue-600 text-[#FFFFF0]" : ""}
        >
          Model Portfolio
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : activeTab === "RangaOneWealth" ? (
          rangaOneWealthTips.slice(0, isMobile ? 2 : 4).map((tip) => (
            <GeneralTipCard key={tip._id} tip={tip} subscriptionAccess={subscriptionAccess} />
          ))
        ) : (
          modelPortfolioTips.slice(0, isMobile ? 2 : 4).map((tip) => (
            <ModelPortfolioTipCard key={tip._id} tip={tip} subscriptionAccess={subscriptionAccess} />
          ))
        )}
      </div>
    </div>
  )
}

// Model Portfolio Section Component
export function ModelPortfolioSection() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [portfolioDetails, setPortfolioDetails] = useState<{ [key: string]: any }>({})
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const fetchSubscriptionAccess = async () => {
      if (isAuthenticated) {
        try {
          // Check cache first
          let accessData = cache.get<SubscriptionAccess>('subscription_access')
          if (!accessData) {
            // Force refresh to ensure we get the latest subscription status after payment
            accessData = await subscriptionService.forceRefresh()
            cache.set('subscription_access', accessData, 5) // Cache for 5 minutes
          }
          setSubscriptionAccess(accessData)
          console.log("📊 Updated subscription access:", accessData)
          
        } catch (error) {
          console.error("Failed to fetch subscription access:", error)
        }
      }
    }

    fetchSubscriptionAccess()
  }, [isAuthenticated])

  // Debug function - call from browser console: window.debugPortfolioData()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugPortfolioData = async () => {
        console.log("🔧 Manual portfolio data debug...")
        try {
          const token = authService.getAccessToken()
          console.log("Auth token exists:", !!token)
          
          const allPortfolios = await portfolioService.getAll()
          console.log("📊 All portfolios:", allPortfolios)
          
          if (allPortfolios.length > 0) {
            const firstPortfolio = allPortfolios[0]
            console.log("Testing with first portfolio:", firstPortfolio._id)
            
            const details = await portfolioService.getById(firstPortfolio._id)
            console.log("📊 Portfolio details:", details)
            
            return { allPortfolios, firstPortfolio, details }
          }
        } catch (error) {
          console.error("❌ Debug failed:", error)
          return null
        }
      }
      
      // Debug subscription access
      (window as any).debugSubscriptionAccess = async () => {
        console.log("🔧 Manual subscription access debug...")
        try {
          const accessData = await subscriptionService.getSubscriptionAccess(true)
          console.log("📊 Current subscription access:", accessData)
          
          const allSubscriptions = await subscriptionService.getUserSubscriptions(true)
          console.log("🔍 All user subscriptions:", allSubscriptions)
          
          const activeSubscriptions = allSubscriptions.subscriptions.filter((sub: any) => sub.isActive)
          console.log("✅ Active subscriptions:", activeSubscriptions)
          
          return { accessData, allSubscriptions, activeSubscriptions }
        } catch (error) {
          console.error("❌ Subscription debug failed:", error)
          return null
        }
      }
    }
  }, [])

  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        setLoading(true)
        
        const cacheKey = isAuthenticated ? 'dashboard_user_portfolios' : 'dashboard_public_portfolios'
        let portfolioData = cache.get<Portfolio[]>(cacheKey)
        
        if (!portfolioData) {
          // Get user portfolios with access control from /api/user/portfolios
          if (isAuthenticated) {
            try {
              portfolioData = await portfolioService.getAll()
              console.log("📊 User portfolio data with access:", portfolioData)
            } catch (error) {
              console.error("Failed to fetch user portfolios:", error)
              portfolioData = await portfolioService.getPublic()
            }
          } else {
            portfolioData = await portfolioService.getPublic()
          }
          
          // Cache for 10 minutes
          cache.set(cacheKey, portfolioData, 10)
        }
        
        setPortfolios(portfolioData)
        
        // Fetch detailed data for each portfolio
        if (isAuthenticated && portfolioData.length > 0) {
          const detailsCacheKey = 'dashboard_portfolio_details'
          let detailsMap = cache.get<{ [key: string]: any }>(detailsCacheKey)
          
          if (!detailsMap) {
            console.log("🔍 Fetching detailed data for portfolios:", portfolioData.slice(0, 6).map(p => p._id))
            
            const detailsPromises = portfolioData.map(async (portfolio) => {
              try {
                console.log(`📡 Fetching details for portfolio ${portfolio._id}`)
                const details = await portfolioService.getById(portfolio._id)
                console.log(`📊 Portfolio ${portfolio._id} details:`, details)
                return { id: portfolio._id, data: details }
              } catch (error) {
                console.error(`Failed to fetch details for portfolio ${portfolio._id}:`, error)
                return { id: portfolio._id, data: null }
              }
            })
            
            const detailsResults = await Promise.all(detailsPromises)
            console.log("🎯 All portfolio details results:", detailsResults)
            
            detailsMap = detailsResults.reduce((acc, { id, data }) => {
              if (data) {
                acc[id] = data
              }
              return acc
            }, {} as { [key: string]: any })
            
            // Cache for 5 minutes
            cache.set(detailsCacheKey, detailsMap, 5)
          }
          
          console.log("🗂️ Final portfolio details map:", detailsMap)
          setPortfolioDetails(detailsMap)
        }
        
      } catch (error) {
        console.error("Failed to load portfolios:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPortfolios()
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-[500px] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Model Portfolio</h2>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 h-fit" data-tour="model-portfolios">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Model Portfolio</h2>
        <Link href="/model-portfolios">
          <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            View All
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {portfolios.map((portfolio) => {
          const hasAccess = hasPortfolioAccess(portfolio._id, subscriptionAccess, isAuthenticated)
          return (
            <PortfolioCard 
              key={portfolio._id} 
              portfolio={portfolio} 
              portfolioDetails={portfolioDetails[portfolio._id] || null}
              hasAccess={hasAccess}
              subscriptionAccess={subscriptionAccess}
              isAuthenticated={isAuthenticated}
            />
          )
        })}
      </div>
    </div>
  )
}

// Helper function to determine portfolio access - same logic as /model-portfolios
function hasPortfolioAccess(portfolioId: string, subscriptionAccess: SubscriptionAccess | null, isAuthenticated: boolean): boolean {
  if (!isAuthenticated || !subscriptionAccess) {
    return false;
  }
  
  // Access is STRICTLY based on portfolioAccess array only
  // Even if hasPremium is true, only portfolios in the array are accessible
  return subscriptionAccess.portfolioAccess.includes(portfolioId);
}

// General Tip Card Component for RangaOne Wealth - Using full Box 1 styling
function GeneralTipCard({ tip, subscriptionAccess }: { tip: Tip; subscriptionAccess: SubscriptionAccess | null }) {
  const router = useRouter()
  
  // Extract stock symbol - prioritize stockId, then extract from title
  let stockSymbol = tip.stockId || undefined;
  
  if (!stockSymbol && tip.title) {
    const titleParts = tip.title.split(/[:\-\s]/);
    const potentialName = titleParts[0]?.trim().toUpperCase();
    if (potentialName && potentialName.length > 1 && /^[A-Z0-9&\-\.]+$/i.test(potentialName)) {
      stockSymbol = potentialName;
    }
  }
  
  stockSymbol = stockSymbol || "STOCK";
  
  const category = tip.category || "basic"
  
  // Check access based on subscription
  const hasAccess = () => {
    if (!subscriptionAccess) {
      return false;
    }
    if (subscriptionAccess.hasPremium) {
      return true;
    }
    if (category === "premium") {
      return false;
    } else if (category === "basic") {
      return subscriptionAccess.hasBasic;
    }
    return true;
  };
  
  const canAccessTip = hasAccess();
  const shouldBlurContent = !canAccessTip;
  
  const getTipColorScheme = (category: "basic" | "premium") => {
    if (category === "premium") {
      return {
        gradient: "linear-gradient(90deg, #FFD700 30%, #3333330A 90%)",
        textColor: "#92400E",
      };
    } else {
      return {
        gradient: "linear-gradient(90deg, #595CFF 30%, #3333330A 90%)",
        textColor: "#1E40AF",
      };
    }
  };
  
  const colorScheme = getTipColorScheme(category as "basic" | "premium")
  
  const formatPercentage = (value: string | number | undefined): string => {
    if (!value) return '15%';
    const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;
    return `${Math.floor(numValue)}%`;
  };
  
  const handleTipClick = () => {
    if (canAccessTip) {
      router.push(`/rangaone-wealth/recommendation/${tip._id}`)
    }
  }
  
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
        <b>Title:- </b>{tip.title}
      </h3>
      <div 
        className={`relative p-[3px] rounded-lg mx-auto max-w-[18rem] md:max-w-[24rem] ${canAccessTip ? 'cursor-pointer' : ''}`}
        style={{ 
          background: colorScheme.gradient,
          boxShadow: '0 0 9px rgba(0, 0, 0, 0.3)'
        }}
        onClick={handleTipClick}
      >
        <div className="bg-white rounded-lg p-3 relative overflow-hidden">
          <div className={cn(
            "w-full h-full flex flex-col justify-between relative z-10",
            shouldBlurContent && "blur-md"
          )}>
            <div className="flex justify-between items-start mb-3"> 
              <div>
                <div className={`p-[2px] rounded inline-block mb-1.5 ${
                  category === 'premium' 
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                    : 'bg-gradient-to-r from-[#A0A2FF] to-[#6E6E6E]'
                }`}>
                  <div className={`text-xs font-semibold rounded px-2 py-0.5 ${
                    category === 'premium' 
                      ? 'bg-gray-800 text-yellow-400' 
                      : 'bg-gradient-to-r from-[#396C87] to-[#151D5C] text-white'
                  }`}>
                    {category === 'premium' ? 'Premium' : 'Basic'}
                  </div>
                </div>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  {(() => {
                    try {
                      if (tip?.title) {
                        const extracted = tip.title.split(/[:\-\s]/)[0]?.trim().toUpperCase();
                        if (extracted && extracted.length > 0) {
                          return extracted;
                        }
                      }
                      if (tip?.stockId) {
                        const cachedSymbol = stockSymbolCacheService.getCachedSymbol(tip.stockId);
                        return cachedSymbol || tip.stockId;
                      }
                      return "STOCK";
                    } catch (error) {
                      return "STOCK";
                    }
                  })()}
                </h3>
                <p className="text-sm font-light text-gray-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>NSE</p>
              </div>
              
              <div className="bg-[#219612] p-[3px] rounded-xl">
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg text-center min-w-[70px] py-0.5 px-1">
                  <p className="text-xs text-black font-bold text-center mb-0" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Target</p>
                  <p className="text-2xl font-bold text-black -mt-1 mb-0" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{formatPercentage(tip.targetPercentage)}</p>
                  <p className="text-xs text-black font-bold text-right px-1 -mt-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Upto</p>
                </div>
              </div>
            </div>
            
            {tip.analysistConfidence && (
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Analyst Confidence</p>
                  <p className="text-xs mt-0.5" style={{ color: colorScheme.textColor, fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {tip.analysistConfidence >= 8 ? 'Very High' : 
                     tip.analysistConfidence >= 6 ? 'High' : 
                     tip.analysistConfidence >= 4 ? 'Medium' : 
                     tip.analysistConfidence >= 2 ? 'Low' : 'Very Low'}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${(tip.analysistConfidence || 0) * 10}%`,
                      backgroundColor: colorScheme.textColor 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          {shouldBlurContent && (
            <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg flex items-center justify-center z-20">
              <div className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-lg max-w-[140px] sm:max-w-[160px]">
                <p className="text-xs text-gray-600 mb-1.5 sm:mb-2">
                  {category === "premium"
                    ? "Premium subscription required"
                    : "Basic subscription required"}
                </p>
                <button
                  className={cn(
                    "px-2 sm:px-3 py-1 rounded text-xs font-medium text-[#FFFFF0] transition-all",
                    category === "premium"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                      : "bg-gradient-to-r from-[#18657B] to-[#131859] hover:from-blue-600 hover:to-blue-700"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href =
                      category === "premium"
                        ? "/premium-subscription"
                        : "/basic-subscription";
                  }}
                >
                  {category === "premium" ? "Get Premium" : "Get Basic"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Model Portfolio Tip Card Component - Using full Box 1 styling
function ModelPortfolioTipCard({ tip, subscriptionAccess }: { tip: Tip; subscriptionAccess: SubscriptionAccess | null }) {
  const router = useRouter()
  
  // Check access for model portfolio tips
  const hasAccess = () => {
    if (!subscriptionAccess) {
      return false;
    }
    
    const portfolioId = typeof tip.portfolio === 'string' ? tip.portfolio : tip.portfolio?._id;
    if (portfolioId) {
      return subscriptionAccess.portfolioAccess.includes(portfolioId);
    }
    
    return subscriptionAccess.hasPremium;
  };
  
  const canAccessTip = hasAccess();
  const shouldBlurContent = !canAccessTip;
  
  const colorScheme = {
    gradient: "linear-gradient(90deg, #00B7FF 0%, #85D437 100%)",
    textColor: "#047857",
  };
  
  const formatPercentage = (value: string | number | undefined): string => {
    if (!value) return '15%';
    const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;
    return `${Math.floor(numValue)}%`;
  };
  
  const handleTipClick = () => {
    if (canAccessTip) {
      const portfolioId = typeof tip.portfolio === 'string' ? tip.portfolio : tip.portfolio?._id
      if (portfolioId) {
        router.push(`/model-portfolios/${portfolioId}/tips/${tip._id}`)
      } else {
        router.push(`/rangaone-wealth/recommendation/${tip._id}`)
      }
    }
  }
  
  return (
    <div className="mb-4">
      <div 
        className={`relative p-[3px] rounded-lg mx-auto max-w-[18rem] md:max-w-[24rem] ${canAccessTip ? 'cursor-pointer' : ''}`}
        style={{ 
          background: colorScheme.gradient,
          boxShadow: '0 0 9px rgba(0, 0, 0, 0.3)'
        }}
        onClick={handleTipClick}
      >
        <div className="bg-white rounded-lg p-3 relative overflow-hidden">
          <div className={cn(
            "w-full h-full flex flex-col justify-between relative z-10",
            shouldBlurContent && "blur-md"
          )}>
            <div className="flex justify-between items-start mb-3"> 
              <div>
                <div className="relative bg-gradient-to-r from-[#00B7FF] to-[#85D437] p-[2px] rounded overflow-hidden mb-1.5">
                  <div className="bg-black text-xs font-bold rounded px-2 py-0.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#00B7FF] to-[#85D437] font-bold bg-clip-text text-transparent">
                      {(() => {
                        const portfolioName = typeof tip.portfolio === 'object' ? tip.portfolio?.name : undefined;
                        if (portfolioName) {
                          const cleaned = portfolioName.replace(/\bportfolio\b/i, "").trim();
                          return cleaned.length > 0 ? cleaned : portfolioName;
                        }
                        return "Model Portfolio";
                      })()}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  {(() => {
                    console.log('🔍 Tip data:', { stockId: tip.stockId, title: tip.title, _id: tip._id });
                    
                    // Use stockId if available and not an ObjectId
                    if (tip.stockId && !tip.stockId.match(/^[0-9a-fA-F]{24}$/)) {
                      return tip.stockId;
                    }
                    
                    // Extract from title
                    if (tip.title) {
                      const titleParts = tip.title.split(/[:\-\s]/);
                      const symbol = titleParts[0]?.trim().toUpperCase();
                      if (symbol && symbol.length > 1 && /^[A-Z0-9&\-\.]+$/i.test(symbol)) {
                        return symbol;
                      }
                    }
                    
                    return "STOCK";
                  })()} 
                </h3>
                <p className="text-sm font-light text-gray-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>NSE</p>
              </div>
              
              <div className="bg-gradient-to-r from-[#00B7FF] to-[#85D437] p-[3px] rounded-xl">
                <div className="bg-cyan-50 rounded-lg text-center min-w-[70px] py-0.5 px-1">
                  <p className="text-xs text-gray-700 font-bold text-center mb-0" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Target</p>
                  <p className="text-2xl font-bold text-black -mt-1 mb-0" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{formatPercentage(tip.targetPercentage)}</p>
                  <p className="text-xs text-black font-bold text-right px-1 -mt-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Upto</p>
                </div>
              </div>
            </div>
          </div>
          
          {shouldBlurContent && (
            <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg flex items-center justify-center z-20">
              <div className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-lg max-w-[140px] sm:max-w-[160px]">
                <p className="text-xs text-gray-600 mb-1.5 sm:mb-2">
                  Portfolio access required
                </p>
                <button
                  className={cn(
                    "px-2 sm:px-3 py-1 rounded text-xs font-medium text-[#FFFFF0] transition-all",
                    "bg-gradient-to-r from-[#00B7FF] to-[#85D437] hover:from-blue-600 hover:to-green-600"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = "/premium-subscription";
                  }}
                >
                  Get Access
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Portfolio Card Component
function PortfolioCard({ 
  portfolio, 
  portfolioDetails, 
  hasAccess, 
  subscriptionAccess, 
  isAuthenticated 
}: { 
  portfolio: Portfolio
  portfolioDetails: any
  hasAccess: boolean
  subscriptionAccess: SubscriptionAccess | null
  isAuthenticated: boolean
}) {
  const router = useRouter()
  
  const handleDetailsClick = () => {
    router.push(`/model-portfolios/${portfolio._id}`)
  }
  
  const handleSubscribeClick = () => {
    if (isAuthenticated) {
      router.push(`/model-portfolios/${portfolio._id}`)
    } else {
      router.push('/login')
    }
  }

  // Use the hasAccess prop directly - this is based on /api/user/portfolios response
  const isLocked = !hasAccess
  
  // Generate realistic fake data for blurred content
  const generateFakeData = () => ({
    monthlyGains: `+${Math.floor(Math.random() * 20) + 5}.${Math.floor(Math.random() * 99)}`,
    oneYearGains: `+${Math.floor(Math.random() * 15) + 2}.${Math.floor(Math.random() * 99)}`,
    cagr: `+${Math.floor(Math.random() * 25) + 10}.${Math.floor(Math.random() * 99)}`
  })

  const fakeData = generateFakeData()

  // Get real performance data from API or fallback values
  const getPerformanceData = () => {
    console.log(`🎯 Portfolio ${portfolio._id} - portfolioDetails:`, portfolioDetails)
    console.log(`🔒 Portfolio ${portfolio._id} - isLocked:`, isLocked)
    
    if (portfolioDetails && !isLocked) {
      console.log(`✅ Using API data for portfolio ${portfolio._id}:`, {
        monthlyGains: portfolioDetails.monthlyGains,
        oneYearGains: portfolioDetails.oneYearGains,
        CAGRSinceInception: portfolioDetails.CAGRSinceInception
      })
      
      const monthlyGainsValue = normalizePercent(portfolioDetails.monthlyGains);
      const oneYearGainsValue = normalizePercent(portfolioDetails.oneYearGains);
      const cagrSinceInceptionValue = normalizePercent(portfolioDetails.CAGRSinceInception);
      
      return {
        monthlyGains: monthlyGainsValue === 0 ? '-' : `${monthlyGainsValue > 0 ? '+' : ''}${monthlyGainsValue}%`,
        oneYearGains: oneYearGainsValue === 0 ? '-' : `${oneYearGainsValue > 0 ? '+' : ''}${oneYearGainsValue}%`,
        cagr: cagrSinceInceptionValue === 0 ? '-' : `${cagrSinceInceptionValue > 0 ? '+' : ''}${cagrSinceInceptionValue}%`
      }
    }
    
    console.log(`⚠️ Using fallback data for portfolio ${portfolio._id}`)
    
    // Fallback to original data or defaults with consistent formatting
    const monthlyGainsValue = normalizePercent(portfolio.monthlyGains);
    const oneYearGainsValue = normalizePercent(portfolio.oneYearGains);
    const cagrValue = normalizePercent(portfolio.cagr);
    
    return {
      monthlyGains: monthlyGainsValue === 0 ? '-' : `${monthlyGainsValue > 0 ? '+' : ''}${monthlyGainsValue}%`,
      oneYearGains: oneYearGainsValue === 0 ? '-' : `${oneYearGainsValue > 0 ? '+' : ''}${oneYearGainsValue}%`,
      cagr: cagrValue === 0 ? '-' : `${cagrValue > 0 ? '+' : ''}${cagrValue}%`
    }
  }

  const performanceData = getPerformanceData()
  console.log(`📊 Final performance data for ${portfolio._id}:`, performanceData)

  // Determine button styling based on access
  const getButtonStyling = () => {
    if (!isAuthenticated) {
      return {
        text: "Login to View",
        className: "bg-blue-600 hover:bg-blue-700 text-[#FFFFF0]"
      }
    }
    
    if (hasAccess) {
      return {
        text: "View Portfolio",
        className: "bg-green-600 hover:bg-green-700 text-[#FFFFF0]"
      }
    }
    
    if (subscriptionAccess?.hasPremium || subscriptionAccess?.hasBasic) {
      return {
        text: "Upgrade to Access",
        className: "bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-[#FFFFF0]"
      }
    }
    
    return {
      text: "Subscribe Now",
      className: "bg-blue-600 hover:bg-blue-700 text-[#FFFFF0]"
    }
  }

  const buttonConfig = getButtonStyling()
  
  return (
    <div className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white overflow-hidden">
      <div className="p-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
              {portfolio.name}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-xs sm:text-sm text-gray-600">
              <span>Min Investment: ₹{(() => {
                if (portfolioDetails?.minInvestment) {
                  return portfolioDetails.minInvestment.toLocaleString()
                }
                return typeof portfolio.minInvestment === 'number' ? portfolio.minInvestment.toLocaleString() : '10,000'
              })()}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDetailsClick}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            Details
          </Button>
        </div>

        {/* Performance Metrics - Responsive Layout */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Monthly Gains</div>
            <div className={`text-sm sm:text-lg font-bold ${isLocked ? 'blur-sm select-none' : ''} ${
              isLocked ? 'text-green-600' : 
              (() => {
                const monthlyGainsValue = normalizePercent(portfolioDetails?.monthlyGains || portfolio.monthlyGains);
                return monthlyGainsValue > 0 ? 'text-green-600' : monthlyGainsValue < 0 ? 'text-red-600' : 'text-gray-500';
              })()
            }`}>
              {isLocked ? `${fakeData.monthlyGains}%` : performanceData.monthlyGains}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">1 Year Gains</div>
            <div className={`text-sm sm:text-lg font-bold ${isLocked ? 'blur-sm select-none' : ''} ${
              isLocked ? 'text-green-600' : 
              (() => {
                const oneYearGainsValue = normalizePercent(portfolioDetails?.oneYearGains || portfolio.oneYearGains);
                return oneYearGainsValue > 0 ? 'text-green-600' : oneYearGainsValue < 0 ? 'text-red-600' : 'text-gray-500';
              })()
            }`}>
              {isLocked ? `${fakeData.oneYearGains}%` : performanceData.oneYearGains}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">CAGR Since Inception</div>
            <div className={`text-sm sm:text-lg font-bold ${isLocked ? 'blur-sm select-none' : ''} ${
              isLocked ? 'text-green-600' : 
              (() => {
                const cagrSinceInceptionValue = normalizePercent(portfolioDetails?.CAGRSinceInception || portfolio.cagr);
                return cagrSinceInceptionValue > 0 ? 'text-green-600' : cagrSinceInceptionValue < 0 ? 'text-red-600' : 'text-gray-500';
              })()
            }`}>
              {isLocked ? `${fakeData.cagr}%` : performanceData.cagr}
            </div>
          </div>
        </div>

        {/* Lock Message or Action Button */}
        {isLocked ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 bg-gradient-to-r from-yellow-50 to-amber-50 px-3 sm:px-4 py-2 rounded-full border border-yellow-200 animate-pulse flex-1">
              <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-1.5 sm:p-2 shadow-lg transition-transform hover:scale-110">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-[#FFFFF0] animate-[wiggle_1s_ease-in-out_infinite]" />
              </div>
              <span className="font-medium">
                {!isAuthenticated 
                  ? "Login to view details" 
                  : "Upgrade to access"
                }
              </span>
            </div>
            <Button
              onClick={handleSubscribeClick}
              className={`px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium ${buttonConfig.className} w-full sm:w-auto flex-shrink-0`}
            >
              {buttonConfig.text}
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              onClick={handleSubscribeClick}
              className={`px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium ${buttonConfig.className} w-full sm:w-auto`}
            >
              {buttonConfig.text}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 