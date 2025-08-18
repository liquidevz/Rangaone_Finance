"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, TrendingUp, Crown, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { tipsService, Tip } from "@/services/tip.service"
import { portfolioService } from "@/services/portfolio.service"
import { subscriptionService, SubscriptionAccess } from "@/services/subscription.service"
import { Portfolio } from "@/lib/types"
import { useAuth } from "@/components/auth/auth-context"
import { useRouter } from "next/navigation";

// Keep the RangaOneWealthRecommendations for the RangaOne Wealth tab
const RangaOneWealthRecommendations = [
  {
    id: 1,
    title: "Will Sona BLW's EV Strategy Pay Off Despite Global Challenges?",
    category: "Basic",
    stock: {
      name: "IDFC FIRST B",
      exchange: "BSE",
      horizon: "Short Term",
      price: "₹108.20",
      change: "₹10.40(0.95%)",
      target: "18%",
    },
    categoryColor: "bg-blue-500",
  },
  {
    id: 2,
    title: "Tata Motors: Riding the EV Wave in India's Auto Sector",
    category: "Social Media",
    stock: {
      name: "TATA MOTORS",
      exchange: "NSE",
      horizon: "Long Term",
      price: "₹1095.60",
      change: "₹15.80(1.46%)",
      target: "22%",
    },
    categoryColor: "bg-pink-500",
  },
  {
    id: 3,
    title: "ICICI Bank: Strong Growth Potential in Retail Banking",
    category: "Premium",
    stock: {
      name: "ICICI BANK",
      exchange: "NSE",
      horizon: "Swing",
      price: "₹978.35",
      change: "₹12.65(1.31%)",
      target: "27%",
    },
    categoryColor: "bg-yellow-400",
  },
]

export default function ExpertRecommendations() {
  const [activeTab, setActiveTab] = useState("RangaOneWealth")
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [modelPortfolioTips, setModelPortfolioTips] = useState<Tip[]>([])
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  // Fetch portfolios and subscription access on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        let portfoliosData: Portfolio[] = []
        
        // Try to get portfolios with fallback handling
        try {
          portfoliosData = await portfolioService.getAll()
          
          // If no data due to permissions, try public endpoint
          if (!portfoliosData || portfoliosData.length === 0) {
            console.log("No authenticated portfolios, trying public endpoint")
            portfoliosData = await portfolioService.getPublic()
          }
        } catch (portfolioError) {
          console.error("Failed to fetch portfolios:", portfolioError)
          // Continue with empty portfolios rather than failing completely
          portfoliosData = []
        }
        
        const accessData = isAuthenticated 
          ? await subscriptionService.getSubscriptionAccess() 
          : null
        
        setPortfolios(portfoliosData || [])
        setSubscriptionAccess(accessData)
        console.log("Fetched portfolios:", portfoliosData)
        console.log("Subscription access:", accessData)
      } catch (error) {
        console.error("Failed to fetch initial data:", error)
        setError("Failed to load data")
        setPortfolios([]) // Ensure we have an empty array
      }
    }

    fetchInitialData()
  }, [isAuthenticated])

  // Fetch model portfolio tips when Model Portfolio tab is selected
  useEffect(() => {
    const fetchModelPortfolioTips = async () => {
      if (activeTab !== "modelPortfolio" || portfolios.length === 0 || !isAuthenticated) {
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Get all tips first, then filter based on subscription
        let allTips: Tip[] = []
        
        // Try to get tips from all portfolios
        for (const portfolio of portfolios) {
          try {
            const portfolioTips = await tipsService.getByPortfolioId(portfolio._id)
            allTips = [...allTips, ...portfolioTips]
          } catch (tipError) {
            console.log(`Could not fetch tips for portfolio ${portfolio.name}:`, tipError)
            // Continue with other portfolios
          }
        }
        
        // Filter tips based on subscription access
        let filteredTips: Tip[] = []
        
        if (subscriptionAccess?.hasPremium) {
          // Premium users see all tips (basic and premium)
          filteredTips = allTips
          console.log("Premium user - showing all tips")
        } else if (subscriptionAccess?.hasBasic) {
          // Basic users see only basic category tips
          filteredTips = allTips.filter(tip => tip.category === 'basic' || !tip.category)
          console.log("Basic user - showing basic tips only")
        } else if (subscriptionAccess?.portfolioAccess && subscriptionAccess.portfolioAccess.length > 0) {
          // Individual portfolio subscribers see tips from their portfolios only
          filteredTips = allTips.filter(tip => {
            const portfolioId = typeof tip.portfolio === 'string' ? tip.portfolio : tip.portfolio?._id
            return subscriptionAccess.portfolioAccess.includes(portfolioId)
          })
          console.log("Individual portfolio user - showing specific portfolio tips")
        } else {
          // No subscription - show only basic tips
          filteredTips = allTips.filter(tip => tip.category === 'basic' || !tip.category)
          console.log("No subscription - showing basic tips only")
        }
        
        console.log("All tips fetched:", allTips.length)
        console.log("Filtered tips for user:", filteredTips.length)
        setModelPortfolioTips(filteredTips)
        
        if (filteredTips.length === 0) {
          setError("No tips available for your subscription level")
        }
      } catch (error) {
        console.error("Failed to fetch model portfolio tips:", error)
        setError("Failed to load portfolio tips. Please try again.")
        setModelPortfolioTips([])
      } finally {
        setLoading(false)
      }
    }

    fetchModelPortfolioTips()
  }, [activeTab, portfolios, subscriptionAccess, isAuthenticated])

  // Filter RangaOne wealth recommendations based on subscription
  const getFilteredRangaOneRecommendations = () => {
    if (!isAuthenticated || !subscriptionAccess) {
      // Show only basic recommendations for non-authenticated users
      return RangaOneWealthRecommendations.filter(rec => rec.category === "Basic")
    }

    if (subscriptionAccess.hasPremium) {
      // Premium users see all recommendations
      return RangaOneWealthRecommendations
    } else if (subscriptionAccess.hasBasic) {
      // Basic users see basic and social media recommendations
      return RangaOneWealthRecommendations.filter(rec => 
        rec.category === "Basic" || rec.category === "Social Media"
      )
    } else {
      // Individual portfolio users see basic recommendations
      return RangaOneWealthRecommendations.filter(rec => rec.category === "Basic")
    }
  }

  const recommendations = activeTab === "modelPortfolio" ? [] : getFilteredRangaOneRecommendations()

  const renderSubscriptionPrompt = () => {
    if (!isAuthenticated) {
      return (
        <div className="text-center py-8 bg-blue-50 rounded-lg border border-blue-200">
          <Lock className="h-8 w-8 mx-auto mb-3 text-blue-600" />
          <h3 className="font-semibold text-lg mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-4">Please log in to view model portfolio recommendations</p>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
          </Link>
        </div>
      )
    }

    if (!subscriptionAccess || subscriptionAccess.subscriptionType === 'none') {
      return (
        <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <Crown className="h-8 w-8 mx-auto mb-3 text-purple-600" />
          <h3 className="font-semibold text-lg mb-2">Subscribe to Access Model Portfolios</h3>
          <p className="text-gray-600 mb-4">
            Choose a subscription plan to access our expert model portfolio recommendations
          </p>
          <div className="space-y-2">
            <Link href="/basic-subscription">
              <Button variant="outline" className="mr-2">
                Basic Plan - ₹300/month
              </Button>
            </Link>
            <Link href="/premium-subscription">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Premium Plan - Full Access
              </Button>
            </Link>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h2 className="font-semibold text-lg">Expert Recommendations</h2>
        <div className="flex items-center gap-2">
          {/* Subscription Status Indicator */}
          {isAuthenticated && subscriptionAccess && (
            <div className="flex items-center gap-1">
              {subscriptionAccess.subscriptionType === 'premium' && (
                <div className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  <Crown className="h-3 w-3" />
                  Premium
                </div>
              )}
              {subscriptionAccess.subscriptionType === 'basic' && (
                <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  <Star className="h-3 w-3" />
                  Basic
                </div>
              )}
              {subscriptionAccess.subscriptionType === 'individual' && (
                <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  Portfolio
                </div>
              )}
            </div>
          )}
          
          <Button asChild variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            <Link href={activeTab === "RangaOneWealth" ? "/rangaone-wealth" : "/model-portfolios"}>
              View All
            </Link>
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              activeTab === "RangaOneWealth"
                ? "bg-blue-600 text-[#FFFFF0] hover:bg-blue-700 hover:text-[#FFFFF0]"
                : "border-blue-600 text-blue-600 hover:bg-blue-50",
            )}
            onClick={() => setActiveTab("RangaOneWealth")}
          >
            RangaOne Wealth
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              activeTab === "modelPortfolio"
                ? "bg-blue-600 text-[#FFFFF0] hover:bg-blue-700 hover:text-[#FFFFF0]"
                : "border-blue-600 text-blue-600 hover:bg-blue-50",
            )}
            onClick={() => setActiveTab("modelPortfolio")}
          >
            Model Portfolio
          </Button>
        </div>

        {activeTab === "modelPortfolio" ? (
          // Model Portfolio Section with Real API Data and Access Control
          <div>
            {renderSubscriptionPrompt() || (
              <>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">{error}</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("modelPortfolio")}
                      className="text-sm"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : modelPortfolioTips.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-lg mb-2">No Tips Available</h3>
                    <p className="text-gray-600 mb-4">
                      No model portfolio tips are currently available for your subscription level.
                    </p>
                    <Link href="/model-portfolios">
                      <Button variant="outline">Browse Model Portfolios</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modelPortfolioTips.slice(0, 2).map((tip, index) => (
                      <ModelPortfolioTipCard key={tip._id} tip={tip} />
                    ))}
                    {modelPortfolioTips.length > 2 && (
                      <div className="text-center pt-2">
                        <Link href="/model-portfolios" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View {modelPortfolioTips.length - 2} more tips →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // RangaOne Wealth Section (filtered by subscription)
          <div>
            {recommendations.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <Lock className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                <h3 className="font-semibold text-lg mb-2">No Recommendations Available</h3>
                <p className="text-gray-600 mb-4">
                  {!isAuthenticated 
                    ? "Please log in to view recommendations." 
                    : "Upgrade your subscription to access more recommendations."
                  }
                </p>
                {!isAuthenticated ? (
                  <Link href="/login">
                    <Button>Sign In</Button>
                  </Link>
                ) : (
                  <Link href="/premium-subscription">
                    <Button>Upgrade Plan</Button>
                  </Link>
                )}
              </div>
            ) : (
              recommendations.map((rec) => (
                <div key={rec.id} className="space-y-2">
                  <h3 className="font-medium">{rec.title}</h3>
                  <StockCard 
                    category={rec.category} 
                    stock={rec.stock} 
                    categoryColor={rec.categoryColor}
                  />
                  {rec.id < recommendations.length && <div className="border-t border-gray-200 my-4"></div>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// New component for Model Portfolio Tip Cards matching the design
function ModelPortfolioTipCard({ tip }: { tip: Tip }) {
  const router = useRouter();
  
  // Extract stock symbol from title (e.g., "AXISBANK: Analysis" -> "AXISBANK")
  const stockSymbol = tip.title.split(':')[0]?.trim().toUpperCase() || 
                     tip.title.split(' ')[0]?.trim().toUpperCase() || 
                     "STOCK"
  
  // Parse buy range (e.g., "2234-2278" or "₹2234-2278")
  const buyRange = tip.buyRange || "N/A"
  const formattedBuyRange = buyRange.includes('₹') ? buyRange : `₹ ${buyRange}`
  
  // Get action from tip status or content
  const action = tip.status === "Active" ? "HOLD" : tip.status?.toUpperCase() || "HOLD"
  
  // Extract weightage if available (placeholder for now)
  const weightage = "4%" // This should come from tip data
  
  // Handle tip click with conditional navigation
  const handleTipClick = () => {
    const portfolioId = typeof tip.portfolio === 'string' ? tip.portfolio : tip.portfolio?._id;
    if (portfolioId) {
      router.push(`/model-portfolios/${portfolioId}/tips/${tip._id}`);
    } else {
      router.push(`/rangaone-wealth/recommendation/${tip._id}`);
    }
  };
  
  return (
    <div className="border-2 border-[#00B7FF] rounded-lg overflow-hidden bg-gradient-to-r from-[#E6F7FF] to-[#F0FFEA]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00B7FF] to-[#85D437] p-4">
        <div className="flex items-center justify-between">
          <div className="bg-gray-800 text-[#FFFFF0] px-4 py-1.5 rounded text-sm font-medium">
            Model Portfolio
          </div>
          <div className="bg-white text-gray-800 px-4 py-1.5 rounded text-sm font-bold">
            Weightage {weightage}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stockSymbol}</h3>
            <p className="text-sm text-gray-600">NSE</p>
          </div>
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Buy Range</p>
            <p className="text-xl font-bold text-gray-900">{formattedBuyRange}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700 mb-2">Action</p>
            <p className="text-2xl font-bold text-gray-900">{action}</p>
          </div>
        </div>
        
        {/* Additional Details Link */}
        <div className="mt-5 pt-3 border-t border-gray-200">
          <Link 
            href={`/rangaone-wealth/recommendation/${tip._id}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            View Full Analysis →
          </Link>
        </div>
      </div>
    </div>
  )
}

// Existing StockCard component for RangaOne Wealth
interface StockCardProps {
  category: string;
  stock: {
    name: string;
    exchange: string;
    horizon: string;
    price: string;
    change: string;
    target: string;
  };
  categoryColor: string;
}

function StockCard({ category, stock, categoryColor }: StockCardProps) {
  const isLocked = category === "Premium";

  return (
    <Card className="border-2 border-yellow-400">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={cn("px-2 py-1 rounded text-xs font-medium text-[#FFFFF0]", categoryColor)}>
                {category}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isLocked && <Lock className="h-4 w-4 text-gray-400" />}
                <div>
                  <h4 className="font-semibold text-lg">{stock.name}</h4>
                  <p className="text-sm text-gray-600">{stock.exchange}</p>
                  <p className="text-sm text-gray-600">{stock.horizon}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right space-y-2">
            <div>
              <div className="text-lg font-semibold">{stock.price}</div>
              <div className="text-sm text-green-600">{stock.change}</div>
            </div>
            
            <div className="bg-green-100 rounded-lg p-2 min-w-[80px]">
              <div className="text-xs text-gray-600">Target</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="font-semibold text-green-600">{stock.target}</span>
              </div>
              <div className="text-xs text-gray-500">upto</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
