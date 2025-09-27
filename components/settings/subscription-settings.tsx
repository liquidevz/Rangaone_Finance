"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink, Calendar, CreditCard, Users, MessageCircle, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { subscriptionService } from "@/services/subscription.service"
import { externalSubscribeService } from "@/services/external-subscribe.service"

interface SubscriptionData {
  _id: string
  user: string
  productType: 'Portfolio' | 'Bundle'
  productId: string | { _id: string; name: string; category?: string }
  portfolio?: { _id: string; name: string }
  bundle?: { _id: string; name: string; category?: string }
  planType?: "monthly" | "quarterly" | "yearly"
  subscriptionType?: "regular" | "yearlyEmandate"
  eMandateId?: string
  lastPaidAt?: string | null
  isActive: boolean
  expiryDate?: string
  commitmentEndDate?: string
  monthlyAmount?: number
  createdAt: string
  updatedAt: string
}

interface AccessData {
  hasBasic: boolean
  hasPremium: boolean
  portfolioAccess: string[]
  subscriptionType: 'none' | 'basic' | 'premium' | 'individual'
}

export default function SubscriptionSettings() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [accessData, setAccessData] = useState<AccessData | null>(null)
  const [telegramLinks, setTelegramLinks] = useState<Array<{ productName: string; inviteLink?: string; expiresAt?: string; status?: string }>>([]) 
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchSubscriptionData = async () => {
    try {
      const { subscriptions: subs, accessData: access } = await subscriptionService.getUserSubscriptions(true)
      setSubscriptions(subs)
      setAccessData(access)
      
      // Extract telegram links from subscription data
      const telegramLinks = subs
        .filter((sub: any) => sub.telegram_link?.invite_link || sub.invite_link_url)
        .map((sub: any) => ({
          productName: typeof sub.productId === 'object' ? sub.productId.name : 'Unknown Portfolio',
          inviteLink: sub.telegram_link?.invite_link || sub.invite_link_url,
          expiresAt: sub.telegram_link?.expires_at || sub.invite_link_expires_at,
          status: sub.telegram_link?.telegram_status || sub.telegram_status
        }))
      setTelegramLinks(telegramLinks)
    } catch (error) {
      console.error("Failed to fetch subscription data:", error)
      toast({
        title: "Error",
        description: "Failed to load subscription information. Please try again later.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchSubscriptionData()
      setLoading(false)
    }
    loadData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSubscriptionData()
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Subscription data has been updated.",
    })
  }

  const getStatusBadgeVariant = (subscription: SubscriptionData) => {
    if (subscription.isActive) return "default"
    return "secondary"
  }

  const getProductName = (subscription: SubscriptionData) => {
    if (typeof subscription.productId === 'object') {
      return subscription.productId.name
    }
    return subscription.portfolio?.name || subscription.bundle?.name || 'Unknown Product'
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not available'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getSubscriptionAmount = (subscription: any) => {
    const amount = subscription.amount || subscription.monthlyAmount
    const planType = subscription.planType
    if (!amount) return 'Not specified'
    
    const formattedAmount = formatAmount(amount)
    return planType ? `${formattedAmount} (${planType})` : formattedAmount
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Your Subscriptions</h2>
          <p className="text-gray-600">Manage your active subscriptions and access details.</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Access Summary */}
      {accessData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Access Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Subscription Type</p>
                <Badge variant={accessData.subscriptionType === 'premium' ? 'default' : 'secondary'}>
                  {accessData.subscriptionType.toUpperCase()}
                </Badge>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Basic Access</p>
                <Badge variant={accessData.hasBasic ? 'default' : 'secondary'}>
                  {accessData.hasBasic ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Premium Access</p>
                <Badge variant={accessData.hasPremium ? 'default' : 'secondary'}>
                  {accessData.hasPremium ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Portfolio Access</p>
                <p className="font-semibold">{accessData.portfolioAccess.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Telegram Links */}
      {telegramLinks.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Telegram Community Access
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {telegramLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white border border-blue-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{link.productName}</p>
                      <p className="text-sm text-blue-600">
                        {link.expiresAt ? `Access expires: ${formatDate(link.expiresAt)}` : 'Exclusive community access'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {link.status && (
                      <Badge variant={link.status === 'active' ? 'default' : 'secondary'} className="bg-green-100 text-green-800">
                        {link.status.toUpperCase()}
                      </Badge>
                    )}
                    {link.inviteLink ? (
                      <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white" size="sm">
                        <a href={link.inviteLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join Community
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="secondary">Link Unavailable</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Details */}
      <div className="space-y-4">
        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600">No subscriptions found.</p>
            </CardContent>
          </Card>
        ) : (
          subscriptions.map((subscription) => (
            <Card key={subscription._id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{getProductName(subscription)}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(subscription)}>
                    {subscription.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Product Type</p>
                    <p className="font-medium">{subscription.productType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Plan Type</p>
                    <p className="font-medium">{subscription.planType || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Subscription Type</p>
                    <p className="font-medium">{subscription.subscriptionType || 'Regular'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Subscription Amount</p>
                    <p className="font-medium">{getSubscriptionAmount(subscription)}</p>
                  </div>
                </div>

                <Separator />

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium text-sm">{formatDate(subscription.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Last Payment</p>
                      <p className="font-medium text-sm">{formatDate((subscription as any).lastPaymentAt || subscription.lastPaidAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Expires</p>
                      <p className="font-medium text-sm">{formatDate((subscription as any).expiresAt || subscription.expiryDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium text-sm">{(subscription as any).status || (subscription.isActive ? 'Active' : 'Inactive')}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {(subscription.eMandateId || subscription.subscriptionType === 'yearlyEmandate') && (
                  <>
                    <Separator />
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">eMandate Information</p>
                      {subscription.eMandateId && (
                        <p className="text-sm text-blue-700">eMandate ID: {subscription.eMandateId}</p>
                      )}
                      <p className="text-sm text-blue-700">Automatic renewal enabled</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
