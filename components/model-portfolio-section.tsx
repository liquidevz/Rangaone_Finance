// components/model-portfolio-section.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { MotionConfig, motion } from "framer-motion";
import { FaYoutube } from "react-icons/fa";
import { FiBookOpen } from "react-icons/fi";
import { ShoppingCart, CreditCard, Check, Play, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/auth-context";
import { useCart } from "@/components/cart/cart-context";
import { useRouter } from "next/navigation";
import { userPortfolioService, UserPortfolio } from "@/services/user-portfolio.service";
import { CheckoutModal } from "@/components/checkout-modal";
import { SectionHeading } from "@/components/ui/section-heading";




type SubscriptionType = "monthly" | "quarterly" | "yearly";
// --- Constants ---
const portfolioColors = [
  "bg-[#F97C7C]",
  "bg-[#FFD400]",
  "bg-[#92DFF3]",
  "bg-[#96B766]",
  "bg-green-200",
  "bg-yellow-100",
  "bg-indigo-200",
  "bg-pink-200",
  "bg-teal-200",
  "bg-rose-200",
  "bg-cyan-200",
  "bg-amber-100",
]

const features = [
  {
    icon: "/icons/simplicity.png",
    title: "Simplicity",
    description:
      "Designed for busy professionals (salaried person, businessmen) our portfolios remove the hassle of stock analysis and simplify the investment process that fits your lifestyle.",
  },
  {
    icon: "/icons/rebalancing.png",
    title: "Rebalancing",
    description:
      "We don’t just give stock names and leave. Every quarter, we adjust based on market conditions—guiding you on exits, profit booking, upward averaging, and downward averaging.",
  },
  {
    icon: "/icons/diversification.png",
    title: "Diversification",
    description:
      "Your money won’t sit in one basket. We spread it smartly—across large, mid and small cap stocks, multiple sectors, and even assets like ETFs and gold—balancing risk and maximizing opportunity.",
  },
  {
    icon: "/icons/goalBasedInvesting.png",
    title: "Goal-Based Investing",
    description: "You choose the Goal, and the model portfolio provides an investment path that you can follow.",
  },
]

// --- Main Component ---
export default function ModelPortfolioSection() {
  const [portfolios, setPortfolios] = useState<UserPortfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        setLoading(true)
        console.log('Loading portfolios from API:', process.env.NEXT_PUBLIC_API_BASE_URL)
        const portfoliosData = await userPortfolioService.getAll()
        console.log('Loaded portfolios:', portfoliosData.length)
        if (portfoliosData && portfoliosData.length > 0) {
          setPortfolios(portfoliosData)
        } else {
          console.warn('No portfolios returned from API')
          setPortfolios([])
        }
      } catch (error: any) {
        console.error("Failed to load portfolios:", {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url
        })
        console.error('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL)
        setPortfolios([])
        
        // Show toast for actual errors
        if (typeof window !== 'undefined') {
          toast({
            title: "Connection Error",
            description: `Failed to load portfolios: ${error.message}`,
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
      }
    }
    loadPortfolios()
  }, [toast])

  // Carousel functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Auto-play functionality
  const startAutoPlay = () => {
    setIsAutoPlaying(true)
    autoPlayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length)
    }, 4000)
  }

  const stopAutoPlay = () => {
    setIsAutoPlaying(false)
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = null
    }
  }

  // Start auto-play on mount
  useEffect(() => {
    startAutoPlay()
    return () => stopAutoPlay()
  }, [])

  // Touch/swipe functionality
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  const minSwipeDistance = 30 // Reduced for more responsive swiping

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setDragOffset(0)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    
    const currentTouch = e.targetTouches[0].clientX
    const diff = touchStart - currentTouch
    setDragOffset(diff)
    setTouchEnd(currentTouch)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false)
      return
    }
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
    
    setIsDragging(false)
    setDragOffset(0)
  }

  // Mouse drag support for desktop touch devices
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setTouchEnd(null)
    setTouchStart(e.clientX)
    setDragOffset(0)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !touchStart) return
    
    const currentX = e.clientX
    const diff = touchStart - currentX
    setDragOffset(diff)
    setTouchEnd(currentX)
  }

  const onMouseUp = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false)
      return
    }
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
    
    setIsDragging(false)
    setDragOffset(0)
  }

  const onMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      setDragOffset(0)
    }
  }

  const handleBuyNow = async (portfolio: UserPortfolio) => {
    try {
      await addToCart(portfolio._id, 1, portfolio)
      toast({
        title: "Added to Cart",
        description: `${portfolio.name} has been added to your cart.`,
      })
      // Redirect to cart page
      router.push('/cart')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add portfolio to cart.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="bg-[#fefcea] dark:bg-gray-900">
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-5xl lg:text-8xl sm:text-7xl font-bold font-serif text-gray-900 dark:text-[#FFFFF0]">MODEL PORTFOLIO</h2>
              <p className="px-1 mt-2 text-[1.1rem] font-medium text-gray-600 dark:text-gray-300">
                Model portfolios make investing simple, smart, and stress-free.
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading portfolios...</p>
            </div>
          </div>
        </section>
      </div>
    )
  }



  return (
    <div className="bg-[#fefcea] dark:bg-gray-900">
      {/* --- Features Section --- */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-5xl lg:text-8xl sm:text-7xl font-bold font-serif text-gray-900 dark:text-[#FFFFF0]">MODEL PORTFOLIO</h2>
            <p className="px-1 mt-2 text-[1.1rem] font-medium text-gray-600 dark:text-gray-300">
              Model portfolios make investing simple, smart, and stress-free. Offering a cost-effective solution, diversified investment <br /> framework and a roadmap, where you choose the destination, and the model portfolio provides an investment path.
            </p>
          </div>
          {/* Desktop Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 relative border-t-4 border-blue-800 dark:border-blue-500 hover:shadow-xl transition-shadow duration-300 flex flex-col text-center"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 p-2 rounded-full border-2 border-blue-800 dark:border-blue-500 shadow-md">
                  <img
                    src={feature.icon || "/placeholder.svg"}
                    alt={feature.title}
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <h3 className="text-blue-900 dark:text-blue-300 font-bold text-lg mt-4 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Mobile Carousel */}
          <div className="sm:hidden relative overflow-hidden py-8">
            <div
              ref={carouselRef}
              className={`flex ${isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'}`}
              style={{
                transform: `translateX(calc(-${currentSlide * 100}% + ${dragOffset}px))`,
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseLeave}
            >
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="w-full flex-shrink-0 px-2"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 relative border-t-4 border-blue-800 dark:border-blue-500 hover:shadow-xl transition-shadow duration-300 flex flex-col text-center">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 p-2 rounded-full border-2 border-blue-800 dark:border-blue-500 shadow-md">
                      <img
                        src={feature.icon || "/placeholder.svg"}
                        alt={feature.title}
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                    <h3 className="text-blue-900 dark:text-blue-300 font-bold text-lg mt-4 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Dots Indicator */}
            <div className="flex justify-center mt-4 space-x-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    stopAutoPlay()
                    goToSlide(index)
                    startAutoPlay()
                  }}
                  onMouseEnter={stopAutoPlay}
                  onMouseLeave={startAutoPlay}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide
                      ? 'bg-blue-600 dark:bg-blue-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* --- Portfolio Cards Section --- */}
      <section className="bg-[#fefcea] dark:bg-gray-900 py-8 sm:py-12">
        <div className="mx-auto container px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {portfolios.map((portfolio, index) => {
            const isHovered = hoveredCard === portfolio._id
            const quarterlyFee = userPortfolioService.getPriceByType(portfolio.subscriptionFee, "quarterly")
            const monthlyFee = userPortfolioService.getPriceByType(portfolio.subscriptionFee, "monthly")
            const methodologyLink = userPortfolioService.getDescriptionByKey(
              portfolio.description,
              "methodology PDF link",
            )
            const homeDescription = userPortfolioService.getDescriptionByKey(portfolio.description, "home card")
            const colorClass = portfolioColors[index % portfolioColors.length]

            return (
              <motion.div
                key={portfolio._id}
                onHoverStart={() => setHoveredCard(portfolio._id)}
                onHoverEnd={() => setHoveredCard(null)}
                animate={isHovered ? "hovered" : "initial"}
                initial="initial"
                className="relative"
              >
                {/* Shadow Layers - these now have consistent borders and rounding */}
                <motion.div
                  variants={{
                    initial: { x: 0, y: 0, boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)" },
                    hovered: { x: 10, y: 10, boxShadow: "0 12px 32px 0 rgba(0,0,0,0.18)" },
                  }}
                  transition={{ type: "spring", stiffness: 180, damping: 18 }}
                  className={`absolute inset-0 ${colorClass} border-2 border-black dark:border-gray-700 rounded-xl pointer-events-none z-0`}
                />
                <motion.div
                  variants={{
                    initial: { x: 0, y: 0, boxShadow: "0 1px 4px 0 rgba(0,0,0,0.06)" },
                    hovered: { x: 5, y: 5, boxShadow: "0 8px 24px 0 rgba(0,0,0,0.12)" },
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={`absolute inset-0 ${colorClass} border-2 border-black dark:border-gray-700 rounded-xl pointer-events-none z-[1]`}
                />

                                                  {/* Main Card - with consistent borders and rounding */}
                 <motion.div
                   whileHover={{ scale: 1.02 }}
                   className={`relative ${colorClass} border-2 border-black dark:border-gray-700 rounded-xl p-4 sm:p-5 flex flex-col h-full font-sans z-[2]`}
                 >
                   {/* Header Section */}
                   <div className="mb-4">
                     <h2 className="font-serif text-2xl lg:text-3xl font-bold text-black dark:text-[#FFFFF0]">
                       {portfolio.name}
                     </h2>
                     <p className="text-base font-bold text-black dark:text-[#FFFFF0] mt-1">
                       ₹{(quarterlyFee || monthlyFee || 0).toLocaleString()} / Quarter
                     </p>
                     <p className="text-xs text-gray-700 dark:text-gray-400">Annual, Billed Quarterly</p>
                   </div>

                   {/* Description Section */}
                   <div className="mb-4 flex-grow">
                     <p className="text-gray-800 dark:text-gray-300 text-sm line-clamp-2">{homeDescription}</p>
                   </div>

                   {/* Methodology and Investment Section */}
                   <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col">
                       <h3 className="text-blue-600 dark:text-blue-400 font-bold text-sm mb-2">Methodology</h3>
                       <div className="flex items-center space-x-2">
                         {methodologyLink && (
                           <a
                             href={methodologyLink}
                             target="_blank"
                             rel="noopener noreferrer"
                             title="Read Methodology"
                           >
                             <div className="w-10 h-10 bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                               <FileText className="w-5 h-5 text-black dark:text-[#FFFFF0]" />
                             </div>
                           </a>
                         )}
                         <a href="#" target="_blank" rel="noopener noreferrer" title="Watch Video">
                           <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                             <Play className="w-5 h-5 text-[#FFFFF0] dark:text-black" fill="currentColor" />
                           </div>
                         </a>
                       </div>
                     </div>

                     <div className="flex flex-col">
                       <h3 className="font-bold text-sm text-black dark:text-[#FFFFF0] mb-2">Min. Investment</h3>
                       <div className="flex items-center">
                         <span className="text-lg font-bold text-black dark:text-[#FFFFF0]">
                           ₹{portfolio.minInvestment?.toLocaleString() || (monthlyFee * 12).toLocaleString()}
                         </span>
                       </div>
                     </div>
                   </div>

                                     {/* Button Section */}
                   <div className="mt-4 pt-2">
                     <button
                       onClick={() => handleBuyNow(portfolio)}
                       className="w-full border-2 border-black dark:border-gray-500 bg-black dark:bg-white px-3 py-2.5 text-center font-bold text-[#FFFFF0] dark:text-black transition-all duration-300 ease-in-out rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 text-sm flex items-center justify-center gap-2"
                     >
                       <ShoppingCart className="w-4 h-4" />
                       <span>Buy Now</span>
                     </button>
                   </div>
                </motion.div>
              </motion.div> 
            )
          })}
        </div>
      </section>
    </div>
  )
}
