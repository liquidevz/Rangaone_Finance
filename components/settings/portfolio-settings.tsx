"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { userService } from "@/services/user.service"

export default function PortfolioSettings() {
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPortfolios = async () => {
      setLoading(true)
      try {
        const data = await userService.getUserPortfolios()
        setPortfolios(data)
      } catch (error) {
        console.error("Failed to fetch portfolios:", error)
        toast({
          title: "Error",
          description: "Failed to load portfolio information. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolios()
  }, [toast])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">Loading portfolio information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Portfolio Management</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">View your available portfolios.</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {(() => {
          const subscribedPortfolios = portfolios.filter(p => !p.message)
          return subscribedPortfolios.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm sm:text-base text-gray-600">No subscribed portfolios found.</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-6">
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Subscribed to {subscribedPortfolios.length} portfolios</p>
              <ul className="space-y-2">
                {subscribedPortfolios.map((portfolio, index) => (
                  <li key={index} className="text-sm sm:text-base text-gray-800 p-2 bg-white rounded border">
                    <span className="font-medium">{portfolio.name || 'Unnamed Portfolio'}</span>
                    {portfolio.PortfolioCategory && (
                      <span className="text-xs sm:text-sm text-gray-500 block sm:inline sm:ml-2">
                        - {portfolio.PortfolioCategory}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
