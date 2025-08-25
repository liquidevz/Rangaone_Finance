"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, ArrowUp, ArrowDown, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Mock data for open recommendations
const openRecommendations = [
  {
    symbol: "IDFCFIRSTB",
    name: "IDFC FIRST BANK",
    exchange: "BSE",
    price: 1108.2,
    change: 10.4,
    changePercent: 0.95,
    target: 18,
    timeHorizon: "Short Term",
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
    category: "Basic",
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
    category: "Premium",
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
    category: "Social Media",
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
    category: "Premium",
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
    category: "Premium",
  },
  {
    symbol: "TCS",
    name: "TATA CONSULTANCY SERVICES",
    exchange: "NSE",
    price: 3450.75,
    change: 45.25,
    changePercent: 1.33,
    target: 20,
    timeHorizon: "Long Term",
    category: "Premium",
  },
]

export default function OpenRecommendations() {
  const [selectedStock, setSelectedStock] = useState(openRecommendations[0])
  const [filter, setFilter] = useState("all")

  const filteredStocks = openRecommendations.filter((stock) => {
    if (filter === "all") return true
    if (filter === "short" && stock.timeHorizon === "Short Term") return true
    if (filter === "medium" && stock.timeHorizon === "Swing") return true
    if (filter === "long" && stock.timeHorizon === "Long Term") return true
    return false
  })

  return (
    <DashboardLayout>
      <div className="flex flex-col w-full gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Open Recommendations</h1>
            <div className="w-20 h-1 bg-primary rounded-full mt-2"></div>
            <p className="text-gray-600 mt-2">View all active stock recommendations</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              All
            </Button>
            <Button
              variant={filter === "short" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("short")}
              className={filter === "short" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Short Term
            </Button>
            <Button
              variant={filter === "medium" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("medium")}
              className={filter === "medium" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Swing
            </Button>
            <Button
              variant={filter === "long" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("long")}
              className={filter === "long" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Long Term
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStocks.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                  onClick={() => setSelectedStock(stock)}
                  isSelected={selectedStock?.symbol === stock.symbol}
                />
              ))}
            </div>
          </div>

          <div className="md:col-span-1">
            {selectedStock && selectedStock.buyRange && (
              <div className="space-y-6">
                <Card className="overflow-hidden border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-indigo-900 text-[#FFFFF0] p-4">
                    <CardTitle className="text-xl text-center">Recommendation Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 bg-gradient-to-b from-white to-gray-50">
                    <div className="grid grid-cols-2 gap-y-4">
                      <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                          <p className="text-gray-600 text-sm font-medium">Buy Range</p>
                        </div>
                        <p className="text-green-600 font-bold">
                          {selectedStock.buyRange.min} - {selectedStock.buyRange.max}
                        </p>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                          <p className="text-gray-600 text-sm font-medium">Target Price</p>
                        </div>
                        <p className="text-green-600 font-bold">
                          {selectedStock.targetPrice?.min} - {selectedStock.targetPrice?.max}
                        </p>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                          <p className="text-gray-600 text-sm font-medium">Add more at</p>
                        </div>
                        <p className="text-green-600 font-bold">
                          {selectedStock.addMoreAt?.min} - {selectedStock.addMoreAt?.max}
                        </p>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                          <p className="text-gray-600 text-sm font-medium">Recommended Date</p>
                        </div>
                        <p className="text-green-600 font-bold">{selectedStock.recommendedDate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-indigo-900 text-[#FFFFF0] p-4">
                    <CardTitle className="text-xl text-center">Why Buy This?</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 bg-gradient-to-b from-white to-gray-50">
                    <ul className="space-y-3">
                      {selectedStock.whyBuy?.map((reason, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5 mr-3">
                            <span className="text-indigo-700 text-xs font-bold">{index + 1}</span>
                          </div>
                          <p className="text-gray-800 leading-relaxed text-sm">{reason}</p>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-gray-200 mt-6 pt-6 flex justify-center">
                      <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-300 group">
                        <FileText className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                        View Detailed Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function StockCard({ stock, onClick, isSelected = false }) {
  const isPositive = stock.change >= 0

  const getCategoryColor = (category) => {
    switch (category) {
      case "Premium":
        return "bg-yellow-400 text-black font-semibold"
      case "Basic":
        return "bg-blue-500 text-[#FFFFF0] font-semibold"
      case "Social Media":
        return "bg-pink-500 text-[#FFFFF0] font-semibold"
      default:
        return "bg-gray-500 text-[#FFFFF0] font-semibold"
    }
  }

  const getHorizonColor = (horizon) => {
    switch (horizon) {
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

  const getCardBorderColor = (category) => {
    switch (category) {
      case "Premium":
        return "border-yellow-300"
      case "Basic":
        return "border-blue-300"
      case "Social Media":
        return "border-pink-300"
      default:
        return "border-gray-200"
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer w-full",
        isSelected && "ring-2 ring-primary ring-offset-2",
      )}
      onClick={onClick}
    >
      <div className={cn("border-2 rounded-lg overflow-hidden h-full", getCardBorderColor(stock.category))}>
        <div className="p-4 bg-white flex flex-col h-full">
          <div className="mb-3">
            <span className={cn("px-3 py-1 rounded-full text-sm inline-block", getCategoryColor(stock.category))}>
              {stock.category}
            </span>
          </div>

          <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">{stock.name}</h3>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-500">{stock.exchange}</span>
            <div className={cn("flex items-center px-3 py-1 rounded-full text-sm", getHorizonColor(stock.timeHorizon))}>
              <Clock className="h-3 w-3 mr-1" />
              {stock.timeHorizon}
            </div>
          </div>

          <div className="mt-auto flex justify-between items-end">
            <div>
              <div className="text-2xl font-bold text-gray-900">₹{stock.price.toFixed(2)}</div>
              <div className={cn("flex items-center text-sm", isPositive ? "text-green-600" : "text-red-600")}>
                {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                <span>
                  ₹{Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="border border-green-200 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-600 mb-1">Target</div>
              <div className="flex items-center justify-center text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="font-bold">{stock.target}%</span>
              </div>
              <div className="text-xs text-gray-500">upto</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
