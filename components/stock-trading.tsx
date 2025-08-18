"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Clock,
  ChevronRight,
  CheckCircle,
  CircleDot,
  FileText,
  Calendar,
  DollarSign,
  PlusCircle,
  Target,
  BarChart4,
  Award,
  TrendingDown,
  Sparkles,
} from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { fetchStockData, fetchClosedRecommendations } from "@/lib/zerodha-api"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface StockData {
  symbol: string
  name: string
  exchange: string
  price: number
  change: number
  changePercent: number
  target: number
  timeHorizon: string
  closed?: boolean
  returnPercentage?: number
  buyRange?: { min: number; max: number }
  targetPrice?: { min: number; max: number }
  addMoreAt?: { min: number; max: number }
  recommendedDate?: string
  ltp?: { price: number; change: number; changePercent: number }
  whyBuy?: string[]
}

export default function StockTrading() {
  const [openActiveTab, setOpenActiveTab] = useState("all")
  const [closedActiveTab, setClosedActiveTab] = useState("all")
  const [openStocks, setOpenStocks] = useState<StockData[]>([])
  const [closedStocks, setClosedStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [closedLoading, setClosedLoading] = useState(true)
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null)

  useEffect(() => {
    const getStocks = async () => {
      try {
        setLoading(true)
        const data = await fetchStockData()
        setOpenStocks(data)
        // Set the first stock as selected by default
        if (data.length > 0 && !selectedStock) {
          setSelectedStock(data[0])
        }
      } catch (error) {
        console.error("Failed to fetch stock data:", error)
        // Fallback data in case API fails
        const fallbackData = [
          {
            symbol: "IDFCFIRSTB",
            name: "IDFC FIRST BANK",
            exchange: "BSE",
            price: 1108.2,
            change: 10.4,
            changePercent: 0.95,
            target: 18,
            timeHorizon: "Long Term",
            buyRange: { min: 101, max: 103 },
            targetPrice: { min: 113, max: 126 },
            addMoreAt: { min: 90, max: 92 },
            recommendedDate: "19 March 2025",
            ltp: { price: 105.41, change: -2.22, changePercent: 2.06 },
            whyBuy: [
              "Technically trading at a Discounted price (39%).",
              "Low Price to Equity ratio of 15.9 (Very Attractive).",
              "Showing Good Sales & Profit growth of 48% & 27% respectively.",
              "DIIs have increased their stake from 9% to 14%.",
              "The company is expanding their assisted business through different channels and products and entering into wealth management.",
            ],
          },
          {
            symbol: "AXISBANK",
            name: "AXIS BANK",
            exchange: "NSE",
            price: 1108.2,
            change: 10.4,
            changePercent: 0.95,
            target: 39,
            timeHorizon: "Long Term",
            buyRange: { min: 980, max: 1010 },
            targetPrice: { min: 1200, max: 1250 },
            addMoreAt: { min: 950, max: 970 },
            recommendedDate: "15 March 2025",
            ltp: { price: 1050.75, change: 12.35, changePercent: 1.19 },
            whyBuy: [
              "Strong digital banking initiatives driving growth.",
              "Improving asset quality with reducing NPAs.",
              "Expanding retail loan book with focus on high-yield segments.",
              "Consistent dividend payouts with potential for increase.",
              "Strategic partnerships in fintech space enhancing market reach.",
            ],
          },
          {
            symbol: "TATAMOTORS",
            name: "TATA MOTORS LIMITED",
            exchange: "BSE",
            price: 1108.2,
            change: 10.4,
            changePercent: 0.95,
            target: 18,
            timeHorizon: "Short Term",
            buyRange: { min: 1050, max: 1080 },
            targetPrice: { min: 1200, max: 1250 },
            addMoreAt: { min: 1000, max: 1030 },
            recommendedDate: "10 March 2025",
            ltp: { price: 1095.6, change: 15.8, changePercent: 1.46 },
            whyBuy: [
              "Strong recovery in JLR sales globally.",
              "EV transition strategy showing positive results.",
              "Market share gains in domestic commercial vehicle segment.",
              "Debt reduction plan on track with improving cash flows.",
              "New product launches receiving positive market response.",
            ],
          },
          {
            symbol: "HDFCBANK",
            name: "HDFC BANK",
            exchange: "NSE",
            price: 1567.8,
            change: 23.5,
            changePercent: 1.52,
            target: 25,
            timeHorizon: "Swing",
          },
          {
            symbol: "RELIANCE",
            name: "RELIANCE INDUSTRIES",
            exchange: "BSE",
            price: 2890.45,
            change: -15.3,
            changePercent: -0.53,
            target: 32,
            timeHorizon: "Long Term",
          },
        ]
        setOpenStocks(fallbackData)
        if (fallbackData.length > 0 && !selectedStock) {
          setSelectedStock(fallbackData[0])
        }
      } finally {
        setLoading(false)
      }
    }

    const getClosedStocks = async () => {
      try {
        setClosedLoading(true)
        const data = await fetchClosedRecommendations()
        setClosedStocks(data)
      } catch (error) {
        console.error("Failed to fetch closed recommendations:", error)
        // Fallback data for closed recommendations
        setClosedStocks([
          {
            symbol: "WIPRO",
            name: "WIPRO LIMITED",
            exchange: "NSE",
            price: 452.75,
            change: 5.25,
            changePercent: 1.17,
            target: 15,
            timeHorizon: "Short Term",
            closed: true,
            returnPercentage: 12.5,
          },
          {
            symbol: "SUNPHARMA",
            name: "SUN PHARMACEUTICAL",
            exchange: "BSE",
            price: 1245.6,
            change: -8.4,
            changePercent: -0.67,
            target: 22,
            timeHorizon: "Swing",
            closed: true,
            returnPercentage: 18.3,
          },
          {
            symbol: "ICICIBANK",
            name: "ICICI BANK",
            exchange: "NSE",
            price: 978.35,
            change: 12.65,
            changePercent: 1.31,
            target: 25,
            timeHorizon: "Long Term",
            closed: true,
            returnPercentage: 21.7,
          },
          {
            symbol: "MARUTI",
            name: "MARUTI SUZUKI INDIA",
            exchange: "BSE",
            price: 10542.8,
            change: 156.2,
            changePercent: 1.5,
            target: 30,
            timeHorizon: "Swing",
            closed: true,
            returnPercentage: 27.8,
          },
        ])
      } finally {
        setClosedLoading(false)
      }
    }

    getStocks()
    getClosedStocks()
  }, [selectedStock])

  const filteredOpenStocks = openStocks.filter((stock) => {
    if (openActiveTab === "all") return true
    if (openActiveTab === "basic" && stock.timeHorizon === "Short Term") return true
    if (openActiveTab === "premium" && stock.timeHorizon === "Long Term") return true
    return false
  })

  const filteredClosedStocks = closedStocks.filter((stock) => {
    if (closedActiveTab === "all") return true
    if (closedActiveTab === "basic" && stock.timeHorizon === "Short Term") return true
    if (closedActiveTab === "premium" && stock.timeHorizon === "Long Term") return true
    return false
  })

  const getCardColor = (category: string, closed = false) => {
    if (closed) {
      switch (category) {
        case "Short Term":
          return "from-blue-50/70 to-blue-100/70 border-blue-200/70"
        case "Long Term":
          return "from-amber-50/70 to-amber-100/70 border-amber-200/70"
        case "Swing":
          return "from-purple-50/70 to-purple-100/70 border-purple-200/70"
        default:
          return "from-gray-50/70 to-gray-100/70 border-gray-200/70"
      }
    }

    switch (category) {
      case "Short Term":
        return "from-blue-50 to-blue-100 border-blue-200"
      case "Long Term":
        return "from-amber-50 to-amber-100 border-amber-200"
      case "Swing":
        return "from-purple-50 to-purple-100 border-purple-200"
      default:
        return "from-gray-50 to-gray-100 border-gray-200"
    }
  }

  const getBadgeColor = (category: string) => {
    switch (category) {
      case "Short Term":
        return "bg-blue-100 text-blue-800"
      case "Long Term":
        return "bg-amber-100 text-amber-800"
      case "Swing":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleStockSelect = (stock: StockData) => {
    setSelectedStock(stock)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-12">
      {/* Open Recommendations Section */}
      <section className="mb-12">
        <SectionHeading
          title="Open Recommendations"
          icon={<CircleDot className="h-5 w-5 text-primary mr-2" />}
          count={filteredOpenStocks.length}
        />

        <TabFilter activeTab={openActiveTab} setActiveTab={setOpenActiveTab} />

        <div className="mt-6">
          <StockCarousel
            stocks={filteredOpenStocks}
            getCardColor={getCardColor}
            getBadgeColor={getBadgeColor}
            loading={loading}
            onSelectStock={handleStockSelect}
            selectedStock={selectedStock}
          />
        </div>

        <div className="flex justify-center mt-6">
          <Button asChild variant="outline" className="group">
            <Link href="/recommendations/open">
              View All Open Recommendations
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Closed Recommendations Section */}
      <section>
        <SectionHeading
          title="Closed Recommendations"
          icon={<CheckCircle className="h-5 w-5 text-green-600 mr-2" />}
          count={filteredClosedStocks.length}
        />

        <TabFilter activeTab={closedActiveTab} setActiveTab={setClosedActiveTab} />

        <div className="mt-6">
          <StockCarousel
            stocks={filteredClosedStocks}
            getCardColor={(category) => getCardColor(category, true)}
            getBadgeColor={getBadgeColor}
            loading={closedLoading}
            closed={true}
            onSelectStock={handleStockSelect}
            selectedStock={selectedStock}
          />
        </div>

        <div className="flex justify-center mt-6">
          <Button asChild variant="outline" className="group">
            <Link href="/recommendations/closed">
              View All Closed Recommendations
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Recommendation Details Section */}
      {selectedStock && selectedStock.buyRange && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Recommendation Details Card */}
          <Card className="overflow-hidden border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-[#FFFFF0] py-3 px-4 font-semibold rounded-t-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5 mr-2 text-yellow-300" />
                <span className="text-lg">Recommendation Details</span>
              </div>
              <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                <div className="grid grid-cols-2 gap-y-8">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <DollarSign className="h-4 w-4 text-indigo-600 mr-1" />
                      <p className="text-gray-600 text-sm font-medium">Buy Range</p>
                    </div>
                    <p className="text-green-600 font-bold text-lg">
                      {selectedStock.buyRange.min} - {selectedStock.buyRange.max}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <Target className="h-4 w-4 text-indigo-600 mr-1" />
                      <p className="text-gray-600 text-sm font-medium">Target Price</p>
                    </div>
                    <p className="text-green-600 font-bold text-lg">
                      {selectedStock.targetPrice?.min} - {selectedStock.targetPrice?.max}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <PlusCircle className="h-4 w-4 text-indigo-600 mr-1" />
                      <p className="text-gray-600 text-sm font-medium">Add more at</p>
                    </div>
                    <p className="text-green-600 font-bold text-lg">
                      {selectedStock.addMoreAt?.min} - {selectedStock.addMoreAt?.max}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-4 w-4 text-indigo-600 mr-1" />
                      <p className="text-gray-600 text-sm font-medium">Recommended Date</p>
                    </div>
                    <p className="text-green-600 font-bold text-lg">{selectedStock.recommendedDate}</p>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 text-indigo-600 mr-1" />
                      <p className="text-gray-600 text-sm font-medium">Horizon</p>
                    </div>
                    <p className="text-green-600 font-bold text-lg">{selectedStock.timeHorizon}</p>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <BarChart4 className="h-4 w-4 text-indigo-600 mr-1" />
                      <p className="text-gray-600 text-sm font-medium">LTP</p>
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold text-lg text-gray-900 mr-2">{selectedStock.ltp?.price}</span>
                      <span
                        className={cn(
                          "flex items-center text-sm font-medium",
                          selectedStock.ltp?.change && selectedStock.ltp.change < 0 ? "text-red-600" : "text-green-600",
                        )}
                      >
                        {selectedStock.ltp?.change && selectedStock.ltp.change < 0 ? (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        )}
                        {selectedStock.ltp?.change}({selectedStock.ltp?.changePercent}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Buy This Card */}
          <Card className="overflow-hidden border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-[#FFFFF0] py-3 px-4 font-semibold rounded-t-sm flex items-center justify-center">
                <Award className="h-5 w-5 mr-2 text-yellow-300" />
                <span className="text-lg">Why Buy This?</span>
              </div>
              <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                <ul className="space-y-3">
                  {selectedStock.whyBuy?.map((reason, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5 mr-3">
                        <span className="text-indigo-700 text-xs font-bold">{index + 1}</span>
                      </div>
                      <p className="text-gray-800 leading-relaxed">{reason}</p>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-gray-200 mt-6 pt-6 flex justify-center">
                  <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-300 group">
                    <FileText className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                    View Detailed Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

interface TabFilterProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

function TabFilter({ activeTab, setActiveTab }: TabFilterProps) {
  return (
    <div className="flex justify-center">
      <div className="relative bg-gray-100 p-1 rounded-full w-auto">
        <div className="grid grid-cols-3 relative z-10">
          <button
            onClick={() => setActiveTab("all")}
            className={`relative rounded-full px-6 py-2 transition-colors duration-200 ${
              activeTab === "all" ? "text-[#FFFFF0]" : "text-gray-700 hover:text-gray-900"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("basic")}
            className={`relative rounded-full px-6 py-2 transition-colors duration-200 ${
              activeTab === "basic" ? "text-[#FFFFF0]" : "text-gray-700 hover:text-gray-900"
            }`}
          >
            Basic
          </button>
          <button
            onClick={() => setActiveTab("premium")}
            className={`relative rounded-full px-6 py-2 transition-colors duration-200 ${
              activeTab === "premium" ? "text-[#FFFFF0]" : "text-gray-700 hover:text-gray-900"
            }`}
          >
            Premium
          </button>
        </div>
        <div
          className="absolute inset-y-1 rounded-full bg-primary transition-all duration-300 ease-out"
          style={{
            left: activeTab === "all" ? "0.25rem" : activeTab === "basic" ? "33.33%" : "66.66%",
            width: "calc(33.33% - 0.5rem)",
            transform:
              activeTab === "all" ? "translateX(0)" : activeTab === "basic" ? "translateX(0)" : "translateX(0)",
          }}
        />
      </div>
    </div>
  )
}

interface SectionHeadingProps {
  title: string
  icon: React.ReactNode
  count: number
}

function SectionHeading({ title, icon, count }: SectionHeadingProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        {icon}
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <Badge variant="secondary" className="ml-3 px-2 py-0.5 text-xs">
          {count}
        </Badge>
      </div>
      <div className="w-20 h-1 bg-primary rounded-full mb-4"></div>
      <p className="text-gray-600 text-sm">
        {title === "Open Recommendations"
          ? "Current stock recommendations that are still active and being monitored."
          : "Past recommendations that have reached their target or been closed."}
      </p>
    </div>
  )
}

interface StockCarouselProps {
  stocks: StockData[]
  getCardColor: (category: string) => string
  getBadgeColor: (category: string) => string
  loading: boolean
  closed?: boolean
  onSelectStock?: (stock: StockData) => void
  selectedStock?: StockData | null
}

function StockCarousel({
  stocks,
  getCardColor,
  getBadgeColor,
  loading,
  closed = false,
  onSelectStock,
  selectedStock,
}: StockCarouselProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-b-primary animate-ping opacity-20"></div>
        </div>
      </div>
    )
  }

  if (stocks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No recommendations available</p>
      </div>
    )
  }

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full overflow-visible"
    >
      <CarouselContent>
        {stocks.map((stock, index) => (
          <CarouselItem key={index} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pt-1 pb-3 px-1">
            <StockCard
              stock={stock}
              cardColor={getCardColor(stock.timeHorizon)}
              badgeColor={getBadgeColor(stock.timeHorizon)}
              closed={closed}
              onClick={() => onSelectStock && onSelectStock(stock)}
              isSelected={selectedStock?.symbol === stock.symbol}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex justify-center mt-4 gap-2">
        <CarouselPrevious className="static transform-none transition-all duration-200 hover:bg-primary hover:text-[#FFFFF0]" />
        <CarouselNext className="static transform-none transition-all duration-200 hover:bg-primary hover:text-[#FFFFF0]" />
      </div>
    </Carousel>
  )
}

interface StockCardProps {
  stock: StockData
  cardColor: string
  badgeColor: string
  closed?: boolean
  onClick?: () => void
  isSelected?: boolean
}

function StockCard({ stock, cardColor, badgeColor, closed = false, onClick, isSelected = false }: StockCardProps) {
  const isPositive = stock.change >= 0
  const [isHovering, setIsHovering] = useState(false)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const [shouldSlide, setShouldSlide] = useState(false)

  useEffect(() => {
    if (nameRef.current) {
      // Check if text is overflowing
      setShouldSlide(nameRef.current.scrollWidth > nameRef.current.clientWidth)
    }
  }, [stock.name])

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 bg-gradient-to-br transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:z-10 cursor-pointer",
        cardColor,
        closed && "opacity-90",
        isSelected && "ring-2 ring-primary ring-offset-2",
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{ height: "180px" }} // Fixed height for all cards
      onClick={onClick}
    >
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3 h-16">
          <div className="w-full">
            <div className="overflow-hidden" style={{ height: "24px" }}>
              <h3
                ref={nameRef}
                className={cn(
                  "font-bold text-lg text-gray-900 whitespace-nowrap overflow-hidden",
                  shouldSlide && isHovering ? "animate-marquee" : "text-ellipsis",
                )}
                style={{
                  maxWidth: "100%",
                  display: "inline-block",
                  paddingRight: shouldSlide ? "50px" : "0", // Add padding for marquee effect
                }}
              >
                {stock.name}
                {shouldSlide && isHovering && <span className="ml-8">{stock.name}</span>}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-gray-500">{stock.exchange}</span>
              <Badge variant="outline" className={cn("text-xs font-medium", badgeColor)}>
                <Clock className="h-3 w-3 mr-1" />
                {stock.timeHorizon}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mt-auto">
          <div>
            <div className="text-2xl font-bold text-gray-900">₹{stock.price.toFixed(2)}</div>
            <div className={cn("flex items-center text-sm", isPositive ? "text-green-600" : "text-red-600")}>
              {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              <span>
                ₹{Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%)
              </span>
            </div>
          </div>

          <div
            className={cn(
              "border rounded-lg p-3 text-center",
              closed ? "bg-green-50 border-green-200" : "bg-white border-green-200",
            )}
          >
            {closed ? (
              <>
                <div className="text-xs text-gray-600 mb-1">Return</div>
                <div className="flex items-center justify-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span className="font-bold">{stock.returnPercentage}%</span>
                </div>
                <div className="text-xs text-gray-500">achieved</div>
              </>
            ) : (
              <>
                <div className="text-xs text-gray-600 mb-1">Target</div>
                <div className="flex items-center justify-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span className="font-bold">{stock.target}%</span>
                </div>
                <div className="text-xs text-gray-500">upto</div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
