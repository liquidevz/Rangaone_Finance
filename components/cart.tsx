// components/cart.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Minus, X, ShoppingCart as CartIcon, CreditCard, ArrowLeft, Package, Sparkles, Trash2, Tag, Heart, Shield, AlertCircle, RefreshCw, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-context"
import { useCart } from "@/components/cart/cart-context"
import { paymentService } from "@/services/payment.service"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cartService } from "@/services/cart.service"
import { userPortfolioService } from "@/services/user-portfolio.service"
import { bundleService } from "@/services/bundle.service"
import { userService } from "@/services/user.service"
import { motion, AnimatePresence } from "framer-motion"
import { PageHeader } from "@/components/page-header";
import { ProfileCompletionModal } from "@/components/profile-completion-modal";
import CartAuthForm from "@/components/cart-auth-form";
import { CartPaymentModal } from "@/components/cart-payment-modal";

export default function CartPage() {
  const { isAuthenticated } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [subscriptionType, setSubscriptionType] = useState<"monthly" | "quarterly" | "yearly">("monthly")
  
  // Debug subscription type changes
  useEffect(() => {
    console.log("🔍 CART - subscriptionType changed to:", subscriptionType);
  }, [subscriptionType]);
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState("")
  const [discount, setDiscount] = useState(0)

  const [updatingQuantity, setUpdatingQuantity] = useState<string | null>(null)
  const [activatedPortfolioIds, setActivatedPortfolioIds] = useState<string[]>([])
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [bundleRecommendations, setBundleRecommendations] = useState<any[]>([])
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({})
  const [portfolioDescriptions, setPortfolioDescriptions] = useState<{[key: string]: string}>({})
  const router = useRouter()
  const { 
    cart, 
    cartItemCount, 
    addToCart, 
    removeFromCart, 
    clearCart,
    refreshCart, 
    getEffectiveCart, 
    syncing,
    error,
    clearError
  } = useCart()
  const { toast } = useToast()

  // Debug modal state
  useEffect(() => {
    console.log("showProfileModal state changed:", showProfileModal);
  }, [showProfileModal]);



  useEffect(() => {
    const initializeCart = async () => {
      try {
        // Fetch portfolio descriptions
        const response = await fetch('https://api.rangaone.finance/api/user/portfolios')
        const portfolios = await response.json()
        const descriptions: {[key: string]: string} = {}
        portfolios.forEach((p: any) => {
          const checkoutDesc = p.description?.find((d: any) => d.key === "checkout card")?.value
          if (checkoutDesc) descriptions[p._id] = checkoutDesc
        })
        setPortfolioDescriptions(descriptions)
        
        if (isAuthenticated) {
          // Fetch subscribed portfolios for the user (but don't auto-remove items)
          try {
            const subscribedPortfolios = await userPortfolioService.getSubscribedPortfolios()
            const activatedIds = subscribedPortfolios.map((p: any) => p._id)
            console.log("Subscribed portfolio IDs:", activatedIds)
            setActivatedPortfolioIds(activatedIds)
          } catch (portfolioError) {
            console.error("Failed to load subscribed portfolios:", portfolioError)
            // Don't block cart loading for this error
          }
        }
      } catch (error) {
        console.error("Failed to initialize cart:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeCart()
  }, [isAuthenticated])

  const effectiveCart = getEffectiveCart()
  const effectiveItems = useMemo(() => effectiveCart?.items || [], [effectiveCart])

  // Load bundles once on mount
  useEffect(() => {
    const loadBundles = async () => {
      try {
        const bundles = await bundleService.getAll()
        setBundleRecommendations(bundles)
      } catch (error) {
        console.error('Failed to load bundles:', error)
      }
    }
    loadBundles()
  }, [])



  // Filter out items with 0/null price for the selected period
  const filteredItems = effectiveItems.filter((item) => {
    // Skip invalid items
    if (!item || !item.portfolio) {
      return false
    }
    
    const isBundle = item.portfolio && bundleService.isBundle(item)
    let price = 0
    
    try {
      if (isBundle) {
        switch (subscriptionType) {
          case "yearly":
            price = bundleService.getBundlePrice(item.portfolio, "yearly")
            break
          case "quarterly":
            price = bundleService.getBundlePrice(item.portfolio, "quarterly")
            break
          default:
            price = bundleService.getBundlePrice(item.portfolio, "monthly")
            break
        }
      } else if (item.portfolio && item.portfolio.subscriptionFee) {
        switch (subscriptionType) {
          case "yearly":
            price = (item.portfolio as any).yearlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "yearly")?.price || 0
            break
          case "quarterly":
            price = (item.portfolio as any).quarterlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "quarterly")?.price || 0
            break
          default:
            price = (item.portfolio as any).monthlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "monthly")?.price || 0
            break
        }
      }
      return price > 0
    } catch (error) {
      console.error("Error filtering cart items:", error)
      return false
    }
  })

  const updateQuantity = async (portfolioId: string, newQuantity: number) => {
    if (updatingQuantity) return
    
    try {
      setUpdatingQuantity(portfolioId)
      clearError() // Clear any previous errors
      
      if (newQuantity <= 0) {
        await removeFromCart(portfolioId)
        toast({
          title: "Item Removed",
          description: "Item has been removed from your cart",
        })
      } else if (newQuantity > 1) {
        // Prevent quantity greater than 1
        toast({
          title: "Quantity Limit",
          description: "Each portfolio can only be purchased once. Quantity cannot exceed 1.",
          variant: "destructive",
        })
        return
      } else {
        const currentItem = effectiveItems.find(item => 
          item && item.portfolio && item.portfolio._id === portfolioId
        )
        
        if (!currentItem) {
          console.error(`Item with ID ${portfolioId} not found in cart`)
          toast({
            title: "Update Failed",
            description: "Item not found in cart. Please try again.",
            variant: "destructive",
          })
          return
        }
        
        // For portfolios, quantity should always be 1
        toast({
          title: "Portfolio Limit",
          description: "Each portfolio can only be purchased once.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Failed to update quantity:", error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingQuantity(null)
    }
  }

  const removeItem = async (portfolioId: string) => {
    try {
      clearError() // Clear any previous errors
      await removeFromCart(portfolioId)
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart",
      })
    } catch (error: any) {
      console.error("Failed to remove item:", error)
      toast({
        title: "Remove Failed",
        description: error.message || "Failed to remove item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRefreshCart = async () => {
    try {
      clearError()
      await refreshCart()
      toast({
        title: "Cart Refreshed",
        description: "Cart has been refreshed successfully",
      })
    } catch (error: any) {
      console.error("Failed to refresh cart:", error)
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh cart. Please try again.",
        variant: "destructive",
      })
    }
  }
  


  const applyCoupon = () => {
    toast({
      title: "Coupon System",
      description: "Coupon functionality will be available soon via backend integration.",
    })
  }

  const removeCoupon = () => {
    setAppliedCoupon("")
    setDiscount(0)
    setCouponCode("")
    toast({
      title: "Coupon Removed",
      description: "Discount has been removed from your order",
    })
  }

  const checkProfileCompletionAfterPayment = async () => {
    // Always redirect to thanks page first
    router.push('/thanks');
  }

  const handleAuthSuccess = async () => {
    setShowAuthForm(false);
    createCartBundleAndShowModal();
  };

  const createCartBundleAndShowModal = () => {
    console.log("🔍 CART - Opening payment modal with subscriptionType:", subscriptionType);
    setShowPaymentModal(true);
  };





  const handleDirectCheckout = async () => {
    if (!isAuthenticated) {
      setShowAuthForm(true);
      return;
    }
    
    // For authenticated users, show payment modal directly
    createCartBundleAndShowModal();
  };

  const subtotal = filteredItems.reduce((sum, item) => {
    let price = 0
    
    try {
      if (bundleService.isBundle(item)) {
        switch (subscriptionType) {
          case "yearly":
            price = bundleService.getBundlePrice(item.portfolio, "yearly")
            break
          case "quarterly":
            price = bundleService.getBundlePrice(item.portfolio, "quarterly")
            break
          default:
            price = bundleService.getBundlePrice(item.portfolio, "monthly")
            break
        }
      } else {
        switch (subscriptionType) {
          case "yearly":
            price = (item.portfolio as any).yearlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "yearly")?.price || 0
            break
          case "quarterly":
            price = (item.portfolio as any).quarterlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "quarterly")?.price || 0
            break
          default:
            price = (item.portfolio as any).monthlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "monthly")?.price || 0
            break
        }
      }
      return sum + (price * item.quantity)
    } catch (error) {
      console.error("Error calculating subtotal:", error)
      return sum
    }
  }, 0) || 0

  const discountAmount = subtotal * discount
  const total = subtotal - discountAmount
  const billingPeriod = subscriptionType === "yearly" ? "Yearly" : subscriptionType === "quarterly" ? "Quarterly" : "Monthly"

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading your cart...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we gather your items</p>
        </motion.div>
      </div>
    )
  }



  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between mb-4">
              <Link 
                href="/" 
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm sm:text-base font-medium">Continue Shopping</span>
              </Link>
              
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                  <CartIcon className="w-4 h-4" />
                  <span>{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Your Cart
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {cartItemCount > 0 
                  ? `Review your ${cartItemCount} selected item${cartItemCount > 1 ? 's' : ''}`
                  : "Your cart is empty"
                }
                      </p>
                    </div>
                      </div>
                    </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          

          
          {cartItemCount === 0 ? (
            // Enhanced Empty Cart State
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 sm:py-20"
            >
              <div className="max-w-md mx-auto px-4">
                <div className="relative mx-auto mb-8 w-24 h-24 sm:w-32 sm:h-32">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 sm:inset-3 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <CartIcon className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400" />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                <p className="text-gray-600 mb-8 text-base sm:text-lg leading-relaxed">
                  Discover our investment portfolios and subscription plans to start building your wealth.
                </p>
                
                {error && (
                  <div className="mb-6">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        There was an issue loading your cart. Please try refreshing the page.
                      </AlertDescription>
                    </Alert>
                    <div className="mt-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={handleRefreshCart}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Cart
                      </Button>
                    </div>
                  </div>
                )}
                
                <Link href="/#portfolios">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                    Browse Portfolios
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            // Enhanced Cart with Items
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Side - Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                {/* Modern Subscription Type Toggle */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-4 sm:p-6"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      Billing Cycle
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Dynamically generate subscription options based on available prices */}
                      {(() => {
                        const availableOptions = [];
                        
                        // Check monthly price
                        const monthlyPrice = cart?.items.reduce((total, item) => {
                          const price = (item.portfolio as any).monthlyemandateprice || item.portfolio.subscriptionFee.find(fee => fee.type === "monthly")?.price || 0;
                          return total + (price * item.quantity);
                        }, 0) || 0;
                        
                        if (monthlyPrice > 0) {
                          availableOptions.push({
                            key: "monthly",
                            label: "Monthly",
                            badge: "",
                            savings: ""
                          });
                        }
                        
                        // Check quarterly price
                        const quarterlyPrice = cart?.items.reduce((total, item) => {
                          const price = (item.portfolio as any).quarterlyemandateprice || item.portfolio.subscriptionFee.find(fee => fee.type === "quarterly")?.price || 0;
                          return total + (price * item.quantity);
                        }, 0) || 0;
                        
                        if (quarterlyPrice > 0) {
                          availableOptions.push({
                            key: "quarterly",
                            label: "Quarterly",
                            badge: "Save 11%",
                            savings: "Popular"
                          });
                        }
                        
                        // Check yearly price
                        const yearlyPrice = cart?.items.reduce((total, item) => {
                          const price = (item.portfolio as any).yearlyemandateprice || item.portfolio.subscriptionFee.find(fee => fee.type === "yearly")?.price || 0;
                          return total + (price * item.quantity);
                        }, 0) || 0;
                        
                        if (yearlyPrice > 0) {
                          availableOptions.push({
                            key: "yearly",
                            label: "Yearly",
                            badge: "Save 17%",
                            savings: "Best Value"
                          });
                        }
                        
                        // If no options available, default to monthly
                        if (availableOptions.length === 0) {
                          availableOptions.push({
                            key: "monthly",
                            label: "Monthly",
                            badge: "",
                            savings: ""
                          });
                        }
                        
                        // Update subscription type if current selection is not available
                        if (!availableOptions.find(opt => opt.key === subscriptionType)) {
                          setSubscriptionType(availableOptions[0].key as "monthly" | "quarterly" | "yearly");
                        }
                        
                        return availableOptions.map((option) => (
                        <button
                          key={option.key}
                            onClick={() => setSubscriptionType(option.key as "monthly" | "quarterly" | "yearly")}
                            className={`relative p-4 rounded-xl font-medium transition-all duration-200 text-center ${
                            subscriptionType === option.key 
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105 ring-2 ring-blue-600 ring-offset-2" 
                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-md"
                          }`}
                        >
                          <div className="text-sm sm:text-base font-semibold">{option.label}</div>
                          {option.badge && (
                            <div className={`text-xs mt-1 ${
                                subscriptionType === option.key ? "text-white/90" : "text-green-600"
                            }`}>
                              {option.badge}
                            </div>
                          )}
                          {option.savings && subscriptionType !== option.key && (
                            <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs bg-green-100 text-green-700 border-green-200">
                              {option.savings}
                            </Badge>
                          )}
                        </button>
                        ));
                      })()}
                    </div>
                  </div>
                </motion.div>

                {/* Enhanced Cart Items List */}
                <div className="space-y-4 sm:space-y-6">
                  <AnimatePresence>
                    {filteredItems.map((item, index) => {
                      let price = 0
                      let period = ""
                      const isBundle = bundleService.isBundle(item)
                      
                      try {
                        if (isBundle) {
                          switch (subscriptionType) {
                            case "yearly":
                              price = bundleService.getBundlePrice(item.portfolio, "yearly")
                              period = "Yearly"
                              break
                            case "quarterly":
                              price = bundleService.getBundlePrice(item.portfolio, "quarterly")
                              period = "Quarterly"
                              break
                            default:
                              price = bundleService.getBundlePrice(item.portfolio, "monthly")
                              period = "Monthly"
                              break
                          }
                        } else {
                          switch (subscriptionType) {
                            case "yearly":
                              price = (item.portfolio as any).yearlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "yearly")?.price || 0
                              period = "Yearly"
                              break
                            case "quarterly":
                              price = (item.portfolio as any).quarterlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "quarterly")?.price || 0
                              period = "Quarterly"
                              break
                            default:
                              price = (item.portfolio as any).monthlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "monthly")?.price || 0
                              period = "Monthly"
                              break
                          }
                        }
                      } catch (error) {
                        console.error("Error calculating price:", error)
                        price = 0
                        period = "Monthly"
                      }

                      const isUpdating = updatingQuantity === item.portfolio._id
                      const isAlreadyPurchased = activatedPortfolioIds.includes(item.portfolio._id)

                      return (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-md hover:border-gray-300/50 transition-all duration-200"
                        >
                          <div className="p-4 sm:p-6">
                            {/* Header with title and price */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{item.portfolio.name}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  {isBundle && (
                                    <Badge variant="secondary" className="text-xs">
                                      {(item.portfolio as any).category === "premium" ? "Premium" : "Basic"} Subscription
                                    </Badge>
                                  )}
                                  {isAlreadyPurchased && (
                                    <Badge variant="destructive" className="text-xs">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Already Purchased
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Secure
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xl sm:text-2xl font-bold text-gray-900">₹ {price.toLocaleString('en-IN')}</div>
                                <div className="text-xs sm:text-sm text-gray-500">/ {period}</div>
                              </div>
                            </div>

                            {/* Portfolio Details Drawer */}
                            <div className="mb-4">
                              <button
                                onClick={() => setExpandedItems(prev => ({
                                  ...prev,
                                  [item.portfolio._id]: !prev[item.portfolio._id]
                                }))}
                                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                              >
                                <span className="text-sm font-medium text-gray-700">Portfolio Details</span>
                                <motion.div
                                  animate={{ rotate: expandedItems[item.portfolio._id] ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                </motion.div>
                              </button>
                              
                              <AnimatePresence>
                                {expandedItems[item.portfolio._id] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-4 bg-white border border-gray-100 rounded-b-lg space-y-3">
                                      {portfolioDescriptions[item.portfolio._id] ? (
                                        <div 
                                          className="text-sm text-gray-700 prose prose-sm max-w-none [&>p]:m-0 [&>p]:leading-relaxed [&>strong]:font-semibold [&>em]:italic [&>ul]:list-disc [&>ol]:list-decimal [&>li]:ml-4"
                                          dangerouslySetInnerHTML={{ __html: portfolioDescriptions[item.portfolio._id] }}
                                        />
                                      ) : (
                                        <p className="text-sm text-gray-500 italic">No checkout card description available</p>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Bundle Recommendation Banner */}
                            {(() => {
                              console.log('Checking bundle for portfolio:', item.portfolio.name, item.portfolio._id)
                              console.log('Available bundles:', bundleRecommendations)
                              
                              const premiumBundle = bundleRecommendations.find(bundle => 
                                bundle.category === "premium" && bundle.portfolios.some((p: any) => p._id === item.portfolio._id)
                              )
                              
                              console.log('Found premium bundle:', premiumBundle)
                              
                              if (premiumBundle) {
                                return (
                                  <div className="mb-6 p-5 sm:p-6 bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-100 rounded-2xl border-2 border-yellow-300 shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                                       onClick={() => router.push('/premium-subscription')}>
                                    <div className="flex items-start gap-4">
                                      <div className="bg-yellow-400 p-2 rounded-full">
                                        <Sparkles className="w-6 h-6 text-yellow-800" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-2xl">💡</span>
                                          <h4 className="text-lg font-bold text-yellow-900">
                                            Save More with Premium Subscription!
                                          </h4>
                                        </div>
                                        <p className="text-base font-semibold text-yellow-800 mb-1">
                                          <span className="bg-yellow-300 px-2 py-1 rounded font-bold">{item.portfolio.name}</span> is available in {premiumBundle.name} at a cheaper price
                                        </p>
                                        <p className="text-sm text-yellow-700">
                                          Click here to explore premium subscription bundles and maximize your savings
                                        </p>
                                        <div className="mt-3 inline-flex items-center text-sm font-medium text-yellow-800 bg-yellow-200 px-3 py-1 rounded-full">
                                          View Premium Bundle →
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            })()}

                            {/* Already Purchased Warning */}
                            {isAlreadyPurchased && (
                              <div className="mb-4 p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-orange-600" />
                                  <div>
                                    <p className="text-sm font-medium text-orange-800">Already Purchased</p>
                                    <p className="text-xs text-orange-600">
                                      You already have access to this portfolio. This item will be removed from your cart automatically.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Bottom controls */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-3">
                                {/* No quantity controls - portfolios are single purchase only */}
                                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                  {isBundle ? "Subscription Plan" : "Single Purchase"}
                                </span>

                                <div className="text-sm font-medium text-gray-900">
                                  Price: ₹{price.toLocaleString('en-IN')}
                                </div>
                              </div>

                              {/* Remove button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.portfolio._id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                disabled={isUpdating}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="ml-1 text-xs">Remove</span>
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>



              </div>

              {/* Enhanced Right Side - Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="sticky top-24"
                >
                  {/* Cart Action Buttons */}
                  <div className="mb-4">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={async () => {
                        try {
                          clearError() // Clear any previous errors
                          await clearCart()
                          toast({
                            title: "Cart Cleared",
                            description: "All items have been removed from your cart",
                          })
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "Failed to clear cart",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Cart
                    </Button>
                  </div>
                  
                  <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      {/* Enhanced Discount Coupon */}
                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-gray-900 flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          DISCOUNT COUPON
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-1 rounded-lg border-gray-300 text-sm"
                          />
                          <Button onClick={applyCoupon} variant="outline" className="rounded-lg border-gray-300 text-sm px-3 sm:px-4">
                            Apply
                          </Button>
                        </div>
                        {appliedCoupon && (
                          <div className="flex items-center justify-between mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-sm text-green-700 font-medium">Coupon "{appliedCoupon}" applied</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={removeCoupon}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Coupon system coming soon via backend integration
                        </p>
                      </div>

                      <Separator />

                      {/* Enhanced Order Details */}
                      <div>
                        <h3 className="font-semibold mb-3 sm:mb-4 text-gray-900 text-sm sm:text-base">Order Details</h3>
                        <div className="space-y-3">
                          {filteredItems.map((item) => {
                            let price = 0
                            let period = ""
                            const isBundle = bundleService.isBundle(item)
                            
                            try {
                              if (isBundle) {
                                switch (subscriptionType) {
                                  case "yearly":
                                    price = bundleService.getBundlePrice(item.portfolio, "yearly")
                                    period = "Yearly"
                                    break
                                  case "quarterly":
                                    price = bundleService.getBundlePrice(item.portfolio, "quarterly")
                                    period = "Quarterly"
                                    break
                                  default:
                                    price = bundleService.getBundlePrice(item.portfolio, "monthly")
                                    period = "Monthly"
                                    break
                                }
                              } else {
                                switch (subscriptionType) {
                                  case "yearly":
                                    price = (item.portfolio as any).yearlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "yearly")?.price || 0
                                    period = "Yearly"
                                    break
                                  case "quarterly":
                                    price = (item.portfolio as any).quarterlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "quarterly")?.price || 0
                                    period = "Quarterly"
                                    break
                                  default:
                                    price = (item.portfolio as any).monthlyemandateprice || item.portfolio.subscriptionFee.find((fee: any) => fee.type === "monthly")?.price || 0
                                    period = "Monthly"
                                    break
                                }
                              }
                            } catch (error) {
                              console.error("Error calculating order detail price:", error)
                              price = 0
                              period = "Monthly"
                            }

                            return (
                              <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                                    <span className="truncate">{item.portfolio.name}</span>
                                    {isBundle && (
                                      <Badge variant="outline" className="text-xs shrink-0">
                                        {(item.portfolio as any).category === "premium" ? "Premium" : "Basic"}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-gray-600 text-xs">
                                    ₹{price.toLocaleString('en-IN')} / {period}
                                  </div>
                                </div>
                                <div className="font-semibold text-gray-900 text-sm">₹{price.toLocaleString('en-IN')}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <Separator />

                      {/* Enhanced Totals */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-700">Subtotal ({cartItemCount} Items)</span>
                          <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>

                        {discount > 0 && (
                          <div className="flex justify-between text-green-600 text-sm">
                            <span>Discount ({(discount * 100).toFixed(0)}%)</span>
                            <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}

                        <Separator />

                        <div className="flex justify-between font-bold text-lg sm:text-xl">
                          <span className="text-gray-900">Total Amount</span>
                          <span className="text-blue-600">₹{total.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="text-xs text-gray-500 text-center">Billed {billingPeriod.toLowerCase()}</div>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 sm:py-4 text-sm sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleDirectCheckout}
                        disabled={updatingQuantity !== null || syncing || !!error}
                      >
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                        {updatingQuantity ? "Updating Cart..." : 
                         syncing ? "Syncing Cart..." :
                         error ? "Error - Please Refresh" :
                         "Proceed to Checkout"}
                      </Button>
                      
                      {/* Test button for debugging
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => {
                          console.log("Test button clicked");
                          setShowProfileModal(true);
                        }}
                      >
                        Test Profile Modal
                      </Button> */}
                      
                      {!isAuthenticated && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-2">
                            Sign in or create an account to complete your purchase
                          </p>
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                            <Shield className="w-3 h-3" />
                            <span>Secure checkout with 256-bit SSL encryption</span>
                          </div>
                        </div>
                      )}
                      
                      {showProfileModal && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                          <p className="text-xs text-yellow-800 text-center">
                            ⚠️ Profile completion required before checkout
                          </p>
                        </div>
                      )}

                      {/* Trust indicators */}
                      <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Shield className="w-3 h-3" />
                          <span>Secure Payment</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Heart className="w-3 h-3" />
                          <span>Trusted Platform</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <RefreshCw className="w-3 h-3" />
                          <span>Auto-Sync</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Complete Your Purchase</h2>
                <button 
                  onClick={() => setShowAuthForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Cart Total:</span> ₹{total.toLocaleString('en-IN')} ({cartItemCount} item{cartItemCount !== 1 ? 's' : ''})
                </p>
              </div>
              <CartAuthForm 
                onAuthSuccess={handleAuthSuccess}
                onPaymentTrigger={() => {}}
                cartTotal={total}
                cartItemCount={cartItemCount}
              />
            </div>
          </motion.div>
        </div>
      )}

      <ProfileCompletionModal 
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        onProfileComplete={() => {
          setShowProfileModal(false);
          // Redirect to dashboard after profile completion
          router.push('/dashboard');
        }}
      />

      {/* Cart Payment Modal */}
      <CartPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cartItems={filteredItems}
        subscriptionType={subscriptionType}
        total={total}
        onPaymentSuccess={async () => {
          await refreshCart();
          router.push('/thanks');
        }}
      />


    </>
  )
}