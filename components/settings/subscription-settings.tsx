"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { userService, UserSubscription } from "@/services/user.service"

export default function SubscriptionSettings() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true)
      try {
        const data = await userService.getSubscriptions()
        setSubscriptions(data)
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error)
        toast({
          title: "Error",
          description: "Failed to load subscription information. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [toast])



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">Loading subscription information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Subscriptions</h2>
        <p className="text-gray-600 mb-6">View your active subscriptions.</p>
      </div>

      <div className="space-y-4">
        {subscriptions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">No subscriptions found.</p>
          </div>
        ) : (
          subscriptions.map((subscription) => (
            <Card key={subscription._id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">{subscription.portfolio?.name || 'Unknown Portfolio'}</h3>
                  <Badge variant={subscription.isActive ? "default" : "secondary"}>
                    {subscription.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Product Type</p>
                    <p className="font-medium">{subscription.productType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Created</p>
                    <p className="font-medium">{new Date(subscription.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Last Paid</p>
                    <p className="font-medium">
                      {subscription.lastPaidAt ? new Date(subscription.lastPaidAt).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
                {subscription.missedCycles > 0 && (
                  <p className="text-sm text-orange-600 mt-2">Missed cycles: {subscription.missedCycles}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
