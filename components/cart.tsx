// components/cart.tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, Minus, X, ShoppingCart as CartIcon, CreditCard, ArrowLeft, Package, Sparkles, Trash2, Tag, Heart, Shield, AlertCircle, RefreshCw } from "lucide-react"
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

export default function CartPage() {
  const [loading, setLoading] = useState(true)
  const [subscriptionType, setSubscriptionType] = useState<"monthly" | "quarterly" | "yearly">("monthly")
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState("")
  const [discount, setDiscount] = useState(0)
  const [processingCheckout, setProcessingCheckout] = useState(false)
  const [updatingQuantity, setUpdatingQuantity] = useState<string | null>(null)
  const [activatedPortfolioIds, setActivatedPortfolioIds] = useState<string[]>([])
  const [showProfileModal, setShowProfileModal] = useState(false)

  const [showAuthForm, setShowAuthForm] = useState(false)

  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { 
    cart, 
    cartItemCount, 
    addToCart, 
    removeFromCart, 
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
        if (isAuthenticated) {
          await refreshCart()
          // Fetch subscribed portfolios for the user (but don't auto-remove items)
          try {
            const portfolios = await userPortfolioService.getSubscribedPortfolios()
            const activatedIds = portfolios.map((p) => p._id)
            console.log("Subscribed portfolio IDs:", activatedIds)
            setActivatedPortfolioIds(activatedIds)
          } catch (portfolioError) {
            console.error("Failed to load subscribed portfolios:", portfolioError)
            // Don't block cart loading for this error
          }
          // Hide auth form if user becomes authenticated
          setShowAuthForm(false)
        } else {
          // For unauthenticated users, still load the cart from local storage
          await refreshCart()
        }
      } catch (error) {
        console.error("Failed to initialize cart:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeCart()
  }, [isAuthenticated, refreshCart, toast])

  const effectiveCart = getEffectiveCart()
  const effectiveItems = effectiveCart?.items || []

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
            price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "yearly")?.price || 0
            break
          case "quarterly":
            price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "quarterly")?.price || 0
            break
          default:
            price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "monthly")?.price || 0
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
        
        const currentQuantity = currentItem?.quantity || 0
        
        if (newQuantity > currentQuantity) {
          const quantityToAdd = newQuantity - currentQuantity
          await addToCart(portfolioId, quantityToAdd)
        } else if (newQuantity < currentQuantity) {
          await removeFromCart(portfolioId)
          if (newQuantity > 0) {
            await addToCart(portfolioId, newQuantity)
          }
        }
        
        toast({
          title: "Quantity Updated",
          description: `Updated quantity to ${newQuantity}`,
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

  const handleAuthSuccess = () => {
    setShowAuthForm(false);
    // After successful auth, proceed with checkout
    toast({
      title: "Authentication Successful",
      description: "Proceeding to checkout...",
    });
    // Automatically proceed with checkout after auth
    setTimeout(() => {
      handleDirectCheckout();
    }, 1000);
  }

  const getCheckoutDescription = (descriptions: any[]) => {
    if (!descriptions || !Array.isArray(descriptions)) {
      return null
    }
    
    try {
      const result = userPortfolioService.getDescriptionByKey(descriptions, "checkout card")
      return result || null
    } catch (error) {
      console.error("Failed to get checkout description:", error)
      return null
    }
  }

  const handleDirectCheckout = async () => {
    if (!isAuthenticated) {
      // Show auth form instead of modal
      setShowAuthForm(true);
      return;
    }

    // Check for already-purchased items before checkout
    const alreadyPurchasedItems = filteredItems.filter(item => 
      activatedPortfolioIds.includes(item.portfolio._id)
    )
    
    if (alreadyPurchasedItems.length > 0) {
      toast({
        title: "Cannot Checkout",
        description: "Please remove already-purchased items from your cart before proceeding.",
        variant: "destructive",
      })
      return
    }

    setProcessingCheckout(true);
    clearError();

    try {
      console.log("Starting direct checkout for subscription type:", subscriptionType);
      
      let orderResponse;
      
      // Use eMandate for yearly and quarterly subscriptions
      if (subscriptionType === "yearly" || subscriptionType === "quarterly") {
        console.log(`Creating cart eMandate for ${subscriptionType} subscription`);
        console.log("Cart items:", cart?.items);
        console.log("First cart item:", cart?.items?.[0]);
        
        // Check if cart has items
        if (!cart?.items || cart.items.length === 0) {
          throw new Error("Cart is empty. Please add items before checkout.");
        }
        
        // Prepare cart data for eMandate API with subscription type and pricing
        const cartData = {
          productType: "Portfolio", // Can be any product type
          productId: cart.items[0].portfolio._id, // Use first item's product ID
          planType: subscriptionType, // Add subscription type (yearly/quarterly)
          subscriptionType: "premium", // Add subscription category
          amount: total, // Add total amount to ensure correct pricing
          totalAmount: total, // Alternative field name
          // Add individual item pricing for the API to use correct pricing
          items: cart.items.map(item => ({
            portfolioId: item.portfolio._id,
            quantity: item.quantity,
            price: subscriptionType === "yearly" 
              ? item.portfolio.subscriptionFee.find(fee => fee.type === "yearly")?.price || 0
              : item.portfolio.subscriptionFee.find(fee => fee.type === "quarterly")?.price || 0
          }))
        };
        
        console.log("eMandate payload:", cartData);
        console.log("Total amount being sent:", total);
        console.log("Subscription type:", subscriptionType);
        orderResponse = await paymentService.cartCheckoutEmandate(cartData);
        console.log("Cart eMandate created:", orderResponse);
      } else {
        // Use regular checkout for monthly subscriptions
        orderResponse = await paymentService.cartCheckout({
          planType: subscriptionType,
          subscriptionType: "premium",
        });
        console.log("Cart checkout created:", orderResponse);
      }

      // Initialize payment with Razorpay
      await paymentService.openCheckout(
        orderResponse,
        {
          name: "User", // You might want to get this from auth context
          email: "user@example.com", // You might want to get this from auth context
        },
        async (response: any) => {
          console.log("Payment success response:", response);
          
          // Handle payment verification
          try {
            const isEmandate = (subscriptionType === "yearly" || subscriptionType === "quarterly") && 'subscriptionId' in orderResponse;
            
            if (isEmandate) {
              console.log("Processing eMandate verification");
              const verificationResponse = await paymentService.verifyEmandate(
                (orderResponse as any).subscriptionId,
                response
              );
              
              if (verificationResponse.success || verificationResponse.message.includes("not authenticated yet")) {
                const isNotAuthenticated = verificationResponse.message.includes("not authenticated yet");
                
                // Check profile completion after successful payment
                await checkProfileCompletionAfterPayment();
                
                toast({
                  title: `${subscriptionType === "yearly" ? "Yearly" : "Quarterly"} ${isNotAuthenticated ? "eMandate Created" : "Subscription Activated"}`,
                  description: isNotAuthenticated 
                    ? `Your ${subscriptionType} subscription has been created. Please complete the eMandate authentication to activate it.`
                    : `Your ${subscriptionType} subscription with eMandate has been activated successfully`,
                });
                // Clear cart after successful payment
                await refreshCart();
              } else {
                throw new Error(verificationResponse.message || "eMandate verification failed");
              }
            } else {
              // Regular payment verification
              const verificationResponse = await paymentService.verifyPayment({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              });
              
              if (verificationResponse.success) {
                // Check profile completion after successful payment
                await checkProfileCompletionAfterPayment();
                
                toast({
                  title: "Payment Successful",
                  description: "Your subscription has been activated",
                });
                // Clear cart after successful payment
                await refreshCart();
              } else {
                throw new Error(verificationResponse.message || "Payment verification failed");
              }
            }
          } catch (error: any) {
            console.error("Payment verification failed:", error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support if payment was deducted",
              variant: "destructive",
            });
          }
        },
        (error: any) => {
          console.error("Payment failed:", error);
          toast({
            title: "Payment Failed",
            description: error.message || "Payment was cancelled or failed",
            variant: "destructive",
          });
        }
      );
    } catch (error: any) {
      console.error("Checkout failed:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage = "Failed to initiate checkout";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Checkout Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingCheckout(false);
    }
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
            price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "yearly")?.price || 0
            break
          case "quarterly":
            price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "quarterly")?.price || 0
            break
          default:
            price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "monthly")?.price || 0
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
              {/* Left Side - Cart Items or Auth Form */}
              <div className="lg:col-span-2 space-y-6">
                {!isAuthenticated && showAuthForm ? (
                  // Show Auth Form
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
                  >
                    <div className="mb-6">
                      <button 
                        onClick={() => setShowAuthForm(false)}
                        className="flex items-center text-blue-600 hover:text-blue-700 transition-colors group mb-4"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Cart Items</span>
                      </button>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In to Continue</h2>
                      <p className="text-gray-600">Please sign in or create an account to complete your purchase</p>
                    </div>
                    <CartAuthForm 
                      onAuthSuccess={handleAuthSuccess}
                      cartTotal={total}
                      cartItemCount={cartItemCount}
                    />
                  </motion.div>
                ) : (
                  <>
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
                          const price = item.portfolio.subscriptionFee.find(fee => fee.type === "monthly")?.price || 0;
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
                          const price = item.portfolio.subscriptionFee.find(fee => fee.type === "quarterly")?.price || 0;
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
                          const price = item.portfolio.subscriptionFee.find(fee => fee.type === "yearly")?.price || 0;
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
                              price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "yearly")?.price || 0
                              period = "Yearly"
                              break
                            case "quarterly":
                              price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "quarterly")?.price || 0
                              period = "Quarterly"
                              break
                            default:
                              price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "monthly")?.price || 0
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
                      const checkoutDescription = getCheckoutDescription(item.portfolio.description)
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

                            {/* Portfolio Details/Features */}
                            {checkoutDescription && (
                              <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div 
                                  className="checkout-description text-gray-600 text-sm prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: checkoutDescription }}
                                />
                              </div>
                            )}

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
                                {/* Quantity controls for portfolios */}
                                {!isBundle && (
                                  <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => updateQuantity(item.portfolio._id, item.quantity - 1)}
                                      disabled={isUpdating}
                                      className="w-8 h-8 p-0 hover:bg-white"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="px-3 py-1 min-w-[40px] text-center text-sm font-medium bg-white rounded">
                                      {isUpdating ? (
                                        <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                      ) : (
                                        item.quantity
                                      )}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => updateQuantity(item.portfolio._id, item.quantity + 1)}
                                      disabled={isUpdating}
                                      className="w-8 h-8 p-0 hover:bg-white"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                                
                                {isBundle && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    Subscription Plan
                                  </span>
                                )}

                                <div className="text-sm font-medium text-gray-900">
                                  Total: ₹{(price * item.quantity).toLocaleString('en-IN')}
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
                  </>
                )}
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
                          // Assuming clearCart is available from useCart or needs to be imported
                          // For now, we'll just remove all items from the cart
                          if (cart) {
                            for (const item of cart.items) {
                              await removeFromCart(item.portfolio._id);
                            }
                          }
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
                                    price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "yearly")?.price || 0
                                    period = "Yearly"
                                    break
                                  case "quarterly":
                                    price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "quarterly")?.price || 0
                                    period = "Quarterly"
                                    break
                                  default:
                                    price = item.portfolio.subscriptionFee.find((fee: any) => fee.type === "monthly")?.price || 0
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
                                    {item.quantity} × ₹{price.toLocaleString('en-IN')} / {period}
                                  </div>
                                </div>
                                <div className="font-semibold text-gray-900 text-sm">₹{(price * item.quantity).toLocaleString('en-IN')}</div>
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
                        disabled={updatingQuantity !== null || syncing || !!error || processingCheckout}
                      >
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                        {updatingQuantity ? "Updating..." : 
                         syncing ? "Syncing..." :
                         processingCheckout ? "Processing..." :
                         error ? "Error - Please Refresh" :
                         !isAuthenticated ? "Sign In to Checkout" :
                         "Proceed to Checkout"}
                      </Button>
                      
                      {/* Test button for debugging */}
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => {
                          console.log("Test button clicked");
                          setShowProfileModal(true);
                        }}
                      >
                        Test Profile Modal
                      </Button>
                      
                      {!isAuthenticated && (
                        <p className="text-xs text-gray-500 text-center">
                          Sign in or create an account to complete your purchase
                        </p>
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
                          <span>Secure</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Heart className="w-3 h-3" />
                          <span>Trusted</span>
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

      <ProfileCompletionModal 
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        onProfileComplete={() => {
          setShowProfileModal(false);
          // Redirect to dashboard after profile completion
          router.push('/dashboard');
        }}
      />


    </>
  )
}