"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink, Calendar, CreditCard, Users, MessageCircle, RefreshCw, Briefcase, Download, FileText } from "lucide-react"
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
  invoiceUrl?: string
  invoiceId?: string
  orderId?: string
  paymentId?: string
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
      const { subscriptions: subs, accessData: access, telegramLinks: links } = await subscriptionService.getUserSubscriptions(true)
      const transformedSubscriptions = subs.map(sub => {
        const user = typeof sub.user === 'string' ? sub.user : sub.user._id; 
        let portfolio = sub.portfolio;
        if (typeof portfolio === 'string') {
          portfolio = { _id: portfolio, name: 'Unknown Portfolio' };
        }
        
        let bundle = sub.bundle;
        if (typeof bundle === 'string') {
          bundle = { _id: bundle, name: 'Unknown Bundle' };
        }
        
        return {
          ...sub,
          user,
          productId: sub.productId,
          portfolio: portfolio || undefined,
          bundle: bundle || undefined
        };
      });
      
      setSubscriptions(transformedSubscriptions);
      setAccessData(access)
      
      // Use telegram links from service response
      const telegramLinks = links?.map((link: any) => ({
        productName: link.productName,
        inviteLink: link.invite_link,
        expiresAt: link.expires_at,
        status: link.telegram_status
      })) || []
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

    // Refresh subscription data when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSubscriptionData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
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
    // Check for productName field first
    if ((subscription as any).productName) {
      return (subscription as any).productName
    }
    
    // Check for bundleName if bundle exists
    if ((subscription as any).bundleName) {
      return (subscription as any).bundleName
    }
    
    // Fallback to existing logic
    if (typeof subscription.productId === 'object') {
      return subscription.productId?.name || "N/A"
    }
    return subscription.portfolio?.name || subscription.bundle?.name || 'Unknown Product'
  }

  const getPurchaseDate = (subscription: any) => {
    return subscription.subscriptionDate || subscription.createdAt
  }

  const getPaymentAmount = (subscription: any) => {
    return subscription.amount || subscription.monthlyAmount || subscription.totalAmount
  }

  const getPaymentType = (subscription: any) => {
    return subscription.type || 'Regular'
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

  const getInvoiceUrl = (subscription: any): string | null => {
    // Only use invoice URL from API response - don't generate URLs
    const url = subscription.invoiceUrl || 
           subscription.invoice_url || 
           subscription.invoiceLink || 
           subscription.invoice_link ||
           null
    
    // Convert HTTP to HTTPS to prevent mixed content errors
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://')
    }
    
    return url
  }

const handleInvoiceDownload = async (subscription: any) => {
  const invoiceUrl = getInvoiceUrl(subscription)
  if (!invoiceUrl) return

  try {
    // Show loading toast
    toast({
      title: "Downloading...",
      description: "Preparing your invoice for download.",
    })

    // Fetch the PDF
    const response = await fetch(invoiceUrl)
    
    if (!response.ok) {
      throw new Error('Failed to download invoice')
    }

    // Get the blob
    const blob = await response.blob()
    
    // Create a download link
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = 'invoice.pdf'
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }
    
    a.download = filename
    document.body.appendChild(a)
    a.click()
    
    // Cleanup
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast({
      title: "Success",
      description: "Invoice downloaded successfully!",
    })
  } catch (error) {
    console.error('Download failed:', error)
    toast({
      title: "Download Failed",
      description: "Failed to download invoice. Please try again.",
      variant: "destructive",
    })
  }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Your Subscriptions</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage your active subscriptions and access details.</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="w-fit self-end sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">Refresh</span>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Subscription Type</p>
                <Badge variant={accessData.subscriptionType === 'premium' ? 'default' : 'secondary'} className="text-xs">
                  {accessData.subscriptionType.toUpperCase()}
                </Badge>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Basic Access</p>
                <Badge variant={accessData.hasBasic ? 'default' : 'secondary'} className="text-xs">
                  {accessData.hasBasic ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Premium Access</p>
                <Badge variant={accessData.hasPremium ? 'default' : 'secondary'} className="text-xs">
                  {accessData.hasPremium ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Portfolio Access</p>
                <p className="text-sm sm:text-base font-semibold">{accessData.portfolioAccess.length}</p>
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
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-3">
              {telegramLinks.map((link, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white border border-blue-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{link.productName}</p>
                      <p className="text-xs sm:text-sm text-blue-600">
                        {link.expiresAt ? `Access expires: ${formatDate(link.expiresAt)}` : 'Exclusive community access'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {link.status && (
                      <Badge variant={link.status === 'active' ? 'default' : 'secondary'} className="bg-green-100 text-green-800 text-xs">
                        {link.status.toUpperCase()}
                      </Badge>
                    )}
                    {link.inviteLink ? (
                      <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs sm:text-sm" size="sm">
                        <a href={link.inviteLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline">Join Community</span>
                          <span className="xs:hidden">Join</span>
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Link Unavailable</Badge>
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
            <Card key={subscription._id} className="overflow-hidden border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">{getProductName(subscription)}</CardTitle>
                      <p className="text-sm text-gray-600">Subscription Details</p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(subscription)} className="px-3 py-1 text-sm font-semibold">
                    {subscription.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-xs text-green-700 font-medium mb-1">Amount Paid</p>
                    <p className="text-lg font-bold text-green-800">{formatAmount(getPaymentAmount(subscription))}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-blue-700 font-medium mb-1">Purchase Date</p>
                    <p className="text-sm font-semibold text-blue-800">{formatDate(getPurchaseDate(subscription))}</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-xs text-orange-700 font-medium mb-1">Expiry Date</p>
                    <p className="text-sm font-semibold text-orange-800">{formatDate(subscription.expiryDate || subscription.commitmentEndDate)}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-xs text-purple-700 font-medium mb-1">Payment Type</p>
                    <p className="text-sm font-semibold text-purple-800 capitalize">{getPaymentType(subscription).replace('_', ' ')}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Calendar className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-700 font-medium mb-1">Plan Type</p>
                    <p className="text-sm font-semibold text-gray-800">{subscription.planType || 'Standard'}</p>
                  </div>
                </div>

                {/* Invoice Download Section */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getInvoiceUrl(subscription) ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-300'}`}>
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Invoice & Receipt</p>
                      <p className="text-xs text-gray-600">
                        {getInvoiceUrl(subscription) ? 'Download your payment invoice' : 'No invoice available - Contact admin'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleInvoiceDownload(subscription)}
                    variant="outline"
                    size="sm"
                    disabled={!getInvoiceUrl(subscription)}
                    className={getInvoiceUrl(subscription) 
                      ? "bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-700 hover:text-indigo-800" 
                      : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {getInvoiceUrl(subscription) ? 'Download Invoice' : 'No Invoice'}
                  </Button>
                </div>

                {/* Additional Info */}
                {(subscription.eMandateId || subscription.subscriptionType === 'yearlyEmandate') && (
                  <>
                    <Separator />
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">eMandate Information</p>
                      {subscription.eMandateId && (
                        <p className="text-xs sm:text-sm text-blue-700 break-all">eMandate ID: {subscription.eMandateId}</p>
                      )}
                      <p className="text-xs sm:text-sm text-blue-700">Automatic renewal enabled</p>
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
