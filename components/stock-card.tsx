import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, TrendingUp, CheckCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface StockCardProps {
  stock: {
    symbol: string
    name: string
    exchange: string
    price: number
    change: number
    changePercent: number
    target: number
    timeHorizon: string
    category: string
    status?: string
    returnPercentage?: number
    closed?: boolean
  }
  onClick?: () => void
  isSelected?: boolean
}

export function StockCard({ stock, onClick, isSelected = false }: StockCardProps) {
  const isPositive = stock.change >= 0

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Premium":
        return "bg-yellow-400 text-black font-semibold"
      case "Basic":
        return "bg-blue-500 text-[#FFFFF0] font-semibold"
      case "Social Media":
        return "bg-pink-500 text-[#FFFFF0] font-semibold"
      case "Closed":
        return "bg-green-500 text-[#FFFFF0] font-semibold"
      default:
        return "bg-gray-500 text-[#FFFFF0] font-semibold"
    }
  }

  const getCardBorderColor = (category: string) => {
    switch (category) {
      case "Premium":
        return "border-yellow-300"
      case "Basic":
        return "border-blue-300"
      case "Social Media":
        return "border-pink-300"
      case "Closed":
        return "border-green-300"
      default:
        return "border-gray-200"
    }
  }

  const getHorizonColor = (horizon: string) => {
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

  const getStatusBadge = (status?: string) => {
    if (!status) return null

    switch (status) {
      case "Target Reduced":
        return <Badge className="bg-gray-200 text-gray-800 absolute bottom-2 left-2">Target Reduced</Badge>
      case "Target Upgraded":
        return <Badge className="bg-green-100 text-green-800 absolute bottom-2 left-2">Target Upgraded</Badge>
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-2",
        getCardBorderColor(stock.category),
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onClick}
    >
      <div className="p-3 bg-white">
        <div className="mb-1.5">
          <span className={cn("px-3 py-0.5 rounded-full text-sm", getCategoryColor(stock.category))}>
            {stock.category}
          </span>
        </div>

        <h3 className="font-bold text-lg text-gray-900 truncate mb-0.5">{stock.name}</h3>

        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm font-medium text-gray-500">{stock.exchange}</span>
          <div className={cn("flex items-center px-2 py-0.5 rounded-full text-xs", getHorizonColor(stock.timeHorizon))}>
            <Clock className="h-3 w-3 mr-1" />
            <span>Horizon - {stock.timeHorizon}</span>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <div className="text-xl font-bold text-gray-900">₹{stock.price.toFixed(2)}</div>
            <div className={cn("flex items-center text-sm", isPositive ? "text-green-600" : "text-red-600")}>
              {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              <span>
                ₹{Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className={cn(
            "border rounded-lg p-1.5 text-center shadow-sm",
            stock.closed 
              ? "bg-green-100 border-green-300" 
              : "bg-white border-green-200"
          )}>
            <div className="text-xs text-gray-600 mb-0.5">
              {stock.closed ? "Return" : "Target"}
            </div>
            <div className="flex items-center justify-center text-green-600">
              {stock.closed ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 mr-1" />
              )}
              <span className="font-bold">
                {stock.closed ? `${stock.returnPercentage}%` : `${stock.target}%`}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {stock.closed ? "achieved" : "upto"}
            </div>
          </div>
        </div>

        {getStatusBadge(stock.status)}
      </div>
    </div>
  )
}