"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowUp, ArrowDown, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Mock data for closed recommendations
const closedRecommendations = [
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
    category: "Closed",
    closedDate: "15 February 2025",
    buyPrice: 402.45,
    sellPrice: 452.75,
    holdingPeriod: "45 days",
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
    category: "Closed",
    closedDate: "10 February 2025",
    buyPrice: 1052.75,
    sellPrice: 1245.6,
    holdingPeriod: "62 days",
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
    category: "Closed",
    closedDate: "5 February 2025",
    buyPrice: 804.25,
    sellPrice: 978.35,
    holdingPeriod: "95 days",
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
    category: "Closed",
    closedDate: "1 February 2025",
    buyPrice: 8250.45,
    sellPrice: 10542.8,
    holdingPeriod: "120 days",
  },
  {
    symbol: "INFY",
    name: "INFOSYS LIMITED",
    exchange: "NSE",
    price: 1875.4,
    change: 25.6,
    changePercent: 1.38,
    target: 20,
    timeHorizon: "Long Term",
    closed: true,
    returnPercentage: 15.2,
    category: "Closed",
    closedDate: "25 January 2025",
    buyPrice: 1628.75,
    sellPrice: 1875.4,
    holdingPeriod: "85 days",
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC BANK",
    exchange: "NSE",
    price: 1685.3,
    change: 32.5,
    changePercent: 1.97,
    target: 18,
    timeHorizon: "Swing",
    closed: true,
    returnPercentage: 14.8,
    category: "Closed",
    closedDate: "20 January 2025",
    buyPrice: 1468.25,
    sellPrice: 1685.3,
    holdingPeriod: "75 days",
  },
]

export default function ClosedRecommendations() {
  const [selectedStock, setSelectedStock] = useState(closedRecommendations[0])
  const [filter, setFilter] = useState("all")

  const filteredStocks = closedRecommendations.filter((stock) => {
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
            <h1 className="text-2xl font-bold">Closed Recommendations</h1>
            <div className="w-20 h-1 bg-primary rounded-full mt-2"></div>
            <p className="text-gray-600 mt-2">View all completed stock recommendations</p>
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
            {selectedStock && (
              <Card className="overflow-hidden border-2 border-green-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-green-700 text-[#FFFFF0] p-4">
                  <CardTitle className="text-xl text-center">Performance Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 bg-gradient-to-b from-white to-gray-50">
                  <div className="grid grid-cols-2 gap-y-4">
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <p className="text-gray-600 text-sm font-medium">Buy Price</p>
                      </div>
                      <p className="text-gray-900 font-bold">₹{selectedStock.buyPrice}</p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <p className="text-gray-600 text-sm font-medium">Sell Price</p>
                      </div>
                      <p className="text-gray-900 font-bold">₹{selectedStock.sellPrice}</p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <p className="text-gray-600 text-sm font-medium">Return</p>
                      </div>
                      <p className="text-green-600 font-bold">{selectedStock.returnPercentage}%</p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <p className="text-gray-600 text-sm font-medium">Closed Date</p>
                      </div>
                      <p className="text-gray-900 font-bold">{selectedStock.closedDate}</p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <p className="text-gray-600 text-sm font-medium">Holding Period</p>
                      </div>
                      <p className="text-gray-900 font-bold">{selectedStock.holdingPeriod}</p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <p className="text-gray-600 text-sm font-medium">Target</p>
                      </div>
                      <p className="text-gray-900 font-bold">{selectedStock.target}%</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="font-semibold text-green-800">Target Achieved</h3>
                      </div>
                      <p className="text-sm text-gray-700 text-center">
                        This recommendation was successfully closed after achieving the target return.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function StockCard({ stock, onClick, isSelected = false }) {
  const isPositive = stock.change >= 0

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

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer w-full",
        isSelected && "ring-2 ring-primary ring-offset-2",
      )}
      onClick={onClick}
    >
      <div className="border-2 border-green-300 rounded-lg overflow-hidden h-full">
        <div className="p-4 bg-white flex flex-col h-full">
          <div className="mb-3">
            <span className="px-3 py-1 rounded-full text-sm inline-block bg-green-500 text-[#FFFFF0] font-semibold">
              Closed
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

            <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-600 mb-1">Return</div>
              <div className="flex items-center justify-center text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span className="font-bold">{stock.returnPercentage}%</span>
              </div>
              <div className="text-xs text-gray-500">achieved</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
