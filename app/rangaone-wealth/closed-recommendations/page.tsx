"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StockCard } from "@/components/stock-card"
import Link from "next/link"

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
    <DashboardLayout userId="1">
      <div className="flex flex-col w-full gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex gap-2 mb-3">
              <Button asChild variant="ghost">
                <Link href="/rangaone-wealth" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button asChild className="bg-indigo-900 hover:bg-indigo-800">
                <Link href="/rangaone-wealth/all-recommendations">
                  All Recommendations
                </Link>
              </Button>
              <Button asChild className="bg-green-700 hover:bg-green-800">
                <Link href="/rangaone-wealth/open-recommendations">
                  Open Only
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-bold">Closed Recommendations</h1>
            <div className="w-20 h-1 bg-primary rounded-full mt-1.5"></div>
            <p className="text-gray-600 mt-1.5">View all completed stock recommendations</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                <CardHeader className="bg-green-700 text-[#FFFFF0] p-3">
                  <CardTitle className="text-lg text-center">Performance Details</CardTitle>
                </CardHeader>
                <CardContent className="p-3 bg-gradient-to-b from-white to-gray-50">
                  <div className="grid grid-cols-2 gap-y-3">
                    <div className="flex flex-col">
                      <div className="flex items-center mb-0.5">
                        <p className="text-gray-600 text-sm font-medium">Buy Price</p>
                      </div>
                      <p className="text-gray-900 font-bold">₹{selectedStock.buyPrice}</p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center mb-0.5">
                        <p className="text-gray-600 text-sm font-medium">Sell Price</p>
                      </div>
                      <p className="text-gray-900 font-bold">₹{selectedStock.sellPrice}</p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center mb-0.5">
                        <p className="text-gray-600 text-sm font-medium">Return</p>
                      </div>
                      <p className="text-green-600 font-bold">{selectedStock.returnPercentage}%</p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center mb-0.5">
                        <p className="text-gray-600 text-sm font-medium">Closed Date</p>
                      </div>
                      <p className="text-gray-900 font-bold">{selectedStock.closedDate}</p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center mb-0.5">
                        <p className="text-gray-600 text-sm font-medium">Holding Period</p>
                      </div>
                      <p className="text-gray-900 font-bold">{selectedStock.holdingPeriod}</p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center mb-0.5">
                        <p className="text-gray-600 text-sm font-medium">Target</p>
                      </div>
                      <p className="text-gray-900 font-bold">{selectedStock.target}%</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-center mb-1.5">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
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


