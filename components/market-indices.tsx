"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { StockPriceData } from "@/services/stock-price.service"


interface MarketIndicesProps {
  indices?: StockPriceData[]
  marketData?: MarketIndexData[]
}

export default function MarketIndices({ indices, marketData }: MarketIndicesProps) {
  // Use marketData if available, otherwise fall back to indices
  const data = marketData || indices || []
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 max-h-96 md:max-h-none overflow-y-auto md:overflow-y-visible">
      {data.map((index) => {
        // Handle both data types
        const isMarketData = 'priceChange' in index
        const isNegative = isMarketData 
          ? parseFloat(index.priceChange) < 0 
          : (index as StockPriceData).change < 0
        
        const currentPrice = isMarketData 
          ? parseFloat(index.currentPrice)
          : (index as StockPriceData).currentPrice
        
        const change = isMarketData 
          ? parseFloat(index.priceChange)
          : (index as StockPriceData).change
        
        const changePercent = isMarketData 
          ? parseFloat(index.priceChangePercent)
          : (index as StockPriceData).changePercent
        
        const name = isMarketData 
          ? index.name
          : (index as StockPriceData).name || (index as StockPriceData).symbol
        
        return (
          <Card key={index.symbol} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                <div className="text-2xl font-bold text-gray-900">₹{currentPrice.toLocaleString()}</div>
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
                    {isNegative ? '' : '+'}{change.toFixed(2)} ({isNegative ? '' : '+'}{changePercent.toFixed(2)}%)
                  </span>
                </div>
                {isMarketData && (index as MarketIndexData).volume && (
                  <div className="text-xs text-gray-500">
                    Volume: {(index as MarketIndexData).volume.toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
