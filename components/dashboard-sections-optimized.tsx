"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Tip } from "@/services/tip.service"
import { SubscriptionAccess } from "@/services/subscription.service"
import { stockSymbolCacheService } from "@/services/stock-symbol-cache.service"
import { MarketIndexData } from "@/services/market-data.service"
import { Portfolio } from "@/lib/types"
import { useAuth } from "@/components/auth/auth-context"
import { useRouter } from "next/navigation"
import { GlobalSearch } from "@/components/global-search"

// Mobile Global Search Component
function MobileGlobalSearch() {
  return (
    <div className="relative flex-1 max-w-full">
      <GlobalSearch />
    </div>
  )
}

// Optimized Market Indices Section - receives data as props
export function MarketIndicesSectionOptimized({ 
  marketData, 
  lastUpdated, 
  loading 
}: { 
  marketData: MarketIndexData[]
  lastUpdated: string
  loading: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(true)

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
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 border border-gray-300 text-sm px-3 py-1 h-auto bg-transparent hover:bg-gray-50"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>

        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="max-h-80 md:max-h-none overflow-y-auto md:overflow-y-visible">
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
                          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">
                            {index.symbol === 'NIFTY' ? 'NIFTY 50' : 
                             index.symbol === 'NIFTYMIDCAP150' ? 'NIFTY MIDCAP 150' : 
                             index.symbol === 'NIFTYSMLCAP250' ? 'NIFTY SMALLCAP 250' : index.name}
                          </h3>
                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                            ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className={cn(
                            "flex items-center text-sm font-medium",
                            isNegative ? "text-red-500" : "text-green-500"
                          )}>
                            <span>{isNegative ? '▼' : '▲'}</span>
                            <span className="ml-1">
                              {Math.abs(priceChange).toFixed(2)} ({Math.abs(priceChangePercent).toFixed(2)}%)
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
                No market data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Optimized Expert Recommendations Section - receives data as props
export function ExpertRecommendationsSectionOptimized({ 
  generalTips, 
  portfolioTips, 
  subscriptionAccess, 
  loading 
}: { 
  generalTips: Tip[]
  portfolioTips: Tip[]
  subscriptionAccess: SubscriptionAccess | null
  loading: boolean
}) {
  const [activeTab, setActiveTab] = useState("RangaOneWealth")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Prepare alternating tips for RangaOne Wealth
  const rangaOneWealthTips = (() => {
    const basicTips = generalTips.filter(tip => tip.category === 'basic')
    const premiumTips = generalTips.filter(tip => tip.category === 'premium')
    const alternatingTips: Tip[] = []
    const maxLength = Math.max(basicTips.length, premiumTips.length)

    for (let i = 0; i < maxLength; i++) {
      if (i < basicTips.length) alternatingTips.push(basicTips[i])
      if (i < premiumTips.length) alternatingTips.push(premiumTips[i])
    }
    return alternatingTips
  })()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4" data-tour="recommendations">
      {/* Mobile search bar */}
      <div className="md:hidden px-2 pb-4">
        <MobileGlobalSearch />
      </div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Expert Recommendations</h2>
        <Link href="/rangaone-wealth">
          <Button className="text-blue-600 border border-blue-600 hover:bg-blue-50 text-sm px-3 py-1 h-auto bg-transparent">
            View All
          </Button>
        </Link>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button
          onClick={() => setActiveTab("RangaOneWealth")}
          className={activeTab === "RangaOneWealth" ? "bg-blue-600 text-[#FFFFF0] text-sm px-3 py-1 h-auto" : "border border-gray-300 text-sm px-3 py-1 h-auto bg-transparent hover:bg-gray-50"}
        >
          RangaOne Wealth
        </Button>
        <Button
          onClick={() => setActiveTab("modelPortfolio")}
          className={activeTab === "modelPortfolio" ? "bg-blue-600 text-[#FFFFF0] text-sm px-3 py-1 h-auto" : "border border-gray-300 text-sm px-3 py-1 h-auto bg-transparent hover:bg-gray-50"}
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
            <GeneralTipCardOptimized key={tip._id} tip={tip} subscriptionAccess={subscriptionAccess} />
          ))
        ) : (
          portfolioTips.slice(0, isMobile ? 2 : 4).map((tip) => (
            <ModelPortfolioTipCardOptimized key={tip._id} tip={tip} subscriptionAccess={subscriptionAccess} />
          ))
        )}
      </div>
    </div>
  )
}

// Optimized Model Portfolio Section - receives data as props
export function ModelPortfolioSectionOptimized({ 
  portfolios, 
  portfolioDetails, 
  subscriptionAccess, 
  loading 
}: { 
  portfolios: Portfolio[]
  portfolioDetails: { [key: string]: any }
  subscriptionAccess: SubscriptionAccess | null
  loading: boolean
}) {
  const { isAuthenticated } = useAuth()

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
          <Button className="text-blue-600 border border-blue-600 hover:bg-blue-50 text-sm px-3 py-1 h-auto bg-transparent">
            View All
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {portfolios.map((portfolio) => {
          const hasAccess = hasPortfolioAccessCheck(portfolio._id, subscriptionAccess, isAuthenticated)
          return (
            <PortfolioCardOptimized
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

// Helper function to determine portfolio access
function hasPortfolioAccessCheck(portfolioId: string, subscriptionAccess: SubscriptionAccess | null, isAuthenticated: boolean): boolean {
  if (!isAuthenticated || !subscriptionAccess) {
    return false
  }
  return subscriptionAccess.portfolioAccess.includes(portfolioId)
}

// Simplified General Tip Card
function GeneralTipCardOptimized({ tip, subscriptionAccess }: { tip: Tip; subscriptionAccess: SubscriptionAccess | null }) {
  const router = useRouter()
  const category = tip.category || "basic"

  const hasAccess = () => {
    if (!subscriptionAccess) return false
    if (subscriptionAccess.hasPremium) return true
    if (category === "premium") return false
    if (category === "basic") return subscriptionAccess.hasBasic
    return true
  }

  const canAccessTip = hasAccess()
  const shouldBlurContent = !canAccessTip

  const colorScheme = category === "premium"
    ? { gradient: "linear-gradient(90deg, #FFD700 30%, #3333330A 90%)", textColor: "#92400E" }
    : { gradient: "linear-gradient(90deg, #595CFF 30%, #3333330A 90%)", textColor: "#1E40AF" }

  const formatPercentage = (value: string | number | undefined): string => {
    if (!value) return '15%'
    const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value
    return `${Math.floor(numValue)}%`
  }

  const handleTipClick = () => {
    if (canAccessTip) {
      router.push(`/rangaone-wealth/recommendation/${tip._id}`)
    }
  }

  const stockSymbol = (() => {
    if (tip?.title) {
      const extracted = tip.title.split(/[:\-\s]/)[0]?.trim().toUpperCase()
      if (extracted && extracted.length > 0) return extracted
    }
    if (tip?.stockId) {
      return stockSymbolCacheService.getCachedSymbol(tip.stockId) || tip.stockId
    }
    return "STOCK"
  })()

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
        <b>Title:- </b>{tip.title}
      </h3>
      <div
        className={`relative p-[3px] rounded-lg mx-auto max-w-[18rem] md:max-w-[24rem] ${canAccessTip ? 'cursor-pointer' : ''}`}
        style={{ background: colorScheme.gradient, boxShadow: '0 0 9px rgba(0, 0, 0, 0.3)' }}
        onClick={handleTipClick}
      >
        <div className="bg-white rounded-lg p-3 relative overflow-hidden">
          <div className={cn("w-full h-full flex flex-col justify-between relative z-10", shouldBlurContent && "blur-md")}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className={`p-[2px] rounded inline-block mb-1.5 ${category === 'premium'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                    : 'bg-gradient-to-r from-[#A0A2FF] to-[#6E6E6E]'}`}>
                  <div className={`text-xs font-semibold rounded px-2 py-0.5 ${category === 'premium'
                      ? 'bg-gray-800 text-yellow-400'
                      : 'bg-gradient-to-r from-[#396C87] to-[#151D5C] text-white'}`}>
                    {category === 'premium' ? 'Premium' : 'Basic'}
                  </div>
                </div>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  {stockSymbol}
                </h3>
                <p className="text-sm font-light text-gray-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>NSE</p>
              </div>

              <div className={`p-[3px] rounded-xl ${
                tip.status?.toLowerCase() === "closed"
                  ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && parseFloat(tip.exitStatusPercentage.replace("%", "")) < 0))
                    ? "bg-gradient-to-r from-[#627281] to-[#A6AFB6]"
                    : "bg-[#219612]"
                  : "bg-[#219612]"
              }`}>
                <div className={`rounded-lg text-center min-w-[70px] py-0.5 px-1 ${
                  tip.status?.toLowerCase() === "closed"
                    ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && parseFloat(tip.exitStatusPercentage.replace("%", "")) < 0))
                      ? "bg-gradient-to-tr from-[#A6AFB6] to-[#627281]"
                      : "bg-gradient-to-r from-green-50 to-green-100"
                    : "bg-gradient-to-r from-green-50 to-green-100"
                }`}>
                  <p className={`text-xs font-bold text-center mb-0 ${
                    tip.status?.toLowerCase() === "closed"
                      ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && parseFloat(tip.exitStatusPercentage.replace("%", "")) < 0))
                        ? "text-white"
                        : "text-black"
                      : "text-black"
                  }`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {tip.status?.toLowerCase() === "closed" ? tip.exitStatus : "Target"}
                  </p>
                  <p className={`text-2xl font-bold -mt-1 mb-0 ${
                    tip.status?.toLowerCase() === "closed"
                      ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && parseFloat(tip.exitStatusPercentage.replace("%", "")) < 0))
                        ? "text-white"
                        : "text-black"
                      : "text-black"
                  }`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {tip.status?.toLowerCase() === "closed" ? formatPercentage(tip.exitStatusPercentage) : formatPercentage(tip.targetPercentage)}
                  </p>
                  <p className="text-xs text-black font-bold text-right px-1 -mt-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {tip.status?.toLowerCase() === "closed" ? "" : "Upto"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simplified Model Portfolio Tip Card
function ModelPortfolioTipCardOptimized({ tip, subscriptionAccess }: { tip: Tip; subscriptionAccess: SubscriptionAccess | null }) {
  const router = useRouter()

  const hasAccess = () => {
    if (!subscriptionAccess) return false
    if (!tip.portfolio) return false
    const portfolioId = typeof tip.portfolio === 'string' ? tip.portfolio : tip.portfolio._id
    return subscriptionAccess.portfolioAccess.includes(portfolioId)
  }

  const canAccessTip = hasAccess()
  const shouldBlurContent = !canAccessTip

  const formatPercentage = (value: string | number | undefined): string => {
    if (!value) return '15%'
    const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value
    return `${Math.floor(numValue)}%`
  }

  const handleTipClick = () => {
    if (canAccessTip && tip.portfolio) {
      router.push(`/model-portfolios/${tip.portfolio}`)
    }
  }

  const stockSymbol = (() => {
    if (tip?.title) {
      const extracted = tip.title.split(/[:\-\s]/)[0]?.trim().toUpperCase()
      if (extracted && extracted.length > 0) return extracted
    }
    if (tip?.stockId) {
      return stockSymbolCacheService.getCachedSymbol(tip.stockId) || tip.stockId
    }
    return "STOCK"
  })()

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
        <b>Title:- </b>{tip.title}
      </h3>
      <div
        className={`relative p-[3px] rounded-lg mx-auto max-w-[18rem] md:max-w-[24rem] ${canAccessTip ? 'cursor-pointer' : ''}`}
        style={{ background: "linear-gradient(90deg, #FFD700 30%, #3333330A 90%)", boxShadow: '0 0 9px rgba(0, 0, 0, 0.3)' }}
        onClick={handleTipClick}
      >
        <div className="bg-white rounded-lg p-3 relative overflow-hidden">
          <div className={cn("w-full h-full flex flex-col justify-between relative z-10", shouldBlurContent && "blur-md")}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="p-[2px] rounded inline-block mb-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500">
                  <div className="text-xs font-semibold rounded px-2 py-0.5 bg-gray-800 text-yellow-400">
                    Portfolio
                  </div>
                </div>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  {stockSymbol}
                </h3>
                <p className="text-sm font-light text-gray-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>NSE</p>
              </div>

              <div className={`p-[3px] rounded-xl ${
                tip.status?.toLowerCase() === "closed"
                  ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && parseFloat(tip.exitStatusPercentage.replace("%", "")) < 0))
                    ? "bg-gradient-to-r from-[#627281] to-[#A6AFB6]"
                    : "bg-[#219612]"
                  : "bg-[#219612]"
              }`}>
                <div className={`rounded-lg text-center min-w-[70px] py-0.5 px-1 ${
                  tip.status?.toLowerCase() === "closed"
                    ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && parseFloat(tip.exitStatusPercentage.replace("%", "")) < 0))
                      ? "bg-gradient-to-tr from-[#A6AFB6] to-[#627281]"
                      : "bg-gradient-to-r from-green-50 to-green-100"
                    : "bg-gradient-to-r from-green-50 to-green-100"
                }`}>
                  <p className={`text-xs font-bold text-center mb-0 ${
                    tip.status?.toLowerCase() === "closed"
                      ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && parseFloat(tip.exitStatusPercentage.replace("%", "")) < 0))
                        ? "text-white"
                        : "text-black"
                      : "text-black"
                  }`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {tip.status?.toLowerCase() === "closed" ? tip.exitStatus : "Target"}
                  </p>
                  <p className={`text-2xl font-bold -mt-1 mb-0 ${
                    tip.status?.toLowerCase() === "closed"
                      ? (tip.exitStatus?.toLowerCase().includes("loss") || (tip.exitStatusPercentage && parseFloat(tip.exitStatusPercentage.replace("%", "")) < 0))
                        ? "text-white"
                        : "text-black"
                      : "text-black"
                  }`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {tip.status?.toLowerCase() === "closed" ? formatPercentage(tip.exitStatusPercentage) : formatPercentage(tip.targetPercentage)}
                  </p>
                  <p className="text-xs text-black font-bold text-right px-1 -mt-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {tip.status?.toLowerCase() === "closed" ? "" : "Upto"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simplified Portfolio Card
function PortfolioCardOptimized({
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

  const handleClick = () => {
    if (hasAccess) {
      router.push(`/model-portfolios/${portfolio._id}`)
    } else if (!isAuthenticated) {
      router.push('/login')
    } else {
      router.push(`/model-portfolios/${portfolio._id}`)
    }
  }

  const normalizePercent = (value: any): number => {
    if (value === null || value === undefined) return 0
    const numeric = typeof value === 'string' ? Number(value.replace(/%/g, '')) : Number(value)
    return isFinite(numeric) ? numeric : 0
  }

  const cagr = portfolioDetails?.performance?.cagr || portfolio.cagr
  const cagrValue = normalizePercent(cagr)
  const isPositive = cagrValue >= 0

  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-1">{portfolio.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{portfolio.description}</p>
        </div>
        <div className="ml-4 text-right">
          <div className={cn(
            "text-lg font-bold",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? '+' : ''}{cagrValue.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">CAGR</div>
        </div>
      </div>
      {!hasAccess && (
        <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 inline-block">
          {isAuthenticated ? 'Subscribe to access' : 'Login to access'}
        </div>
      )}
    </div>
  )
}
