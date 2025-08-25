"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { StockPriceData } from "@/services/stock-price.service"

interface MarketIndicesProps {
  indices: StockPriceData[]
}

export default function MarketIndices({ indices }: MarketIndicesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {indices.map((index) => {
        const isNegative = index.change < 0
        
        return (
          <Card key={index.symbol} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">{index.name || index.symbol}</h3>
                <div className="text-2xl font-bold text-gray-900">₹{index.currentPrice.toLocaleString()}</div>
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
                  <span>
                    {isNegative ? '' : '+'}{index.change.toFixed(2)} ({isNegative ? '' : '+'}{index.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
