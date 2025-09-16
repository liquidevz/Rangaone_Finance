"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { bundleService, type Bundle } from "@/services/bundle.service"
import { useRouter } from "next/navigation"
import { PaymentModal } from "@/components/payment-modal"

const wealthPlans = [
  {
    id: 1,
    planName: "Basic",
    isPremium: false,
    href: "/basic-subscription",
    image: "/landing-page/Basiccard.png",
  },
  {
    id: 2,
    planName: "Premium",
    isPremium: true,
    href: "/premium-subscription",
    image: "/landing-page/premiumcard.png",
  },
]

export default function FeatureComparison() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await bundleService.getAll()
        setBundles(data)
      } catch (e) {
        // Silent fail; buttons will fallback to plan pages
      }
    }
    load()
  }, [])

  const handleBuyNow = async (plan: { isPremium: boolean }) => {
    const category = plan.isPremium ? "premium" : "basic"
    const bundle = bundles.find(b => (b.category || "").toLowerCase() === category)

    // Fallback: go to plan page if bundle not loaded yet
    if (!bundle) {
      router.push(plan.isPremium ? "/premium-subscription" : "/basic-subscription")
      return
    }

    // Open payment modal with 5-step process
    setSelectedBundle(bundle)
    setShowPaymentModal(true)
  }

  return (
    <div className="w-full" id="feature-compare">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-4">
            Which One to Choose?
          </h2>
          {/* <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full mb-4"></div> */}
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Compare Basic and Premium plans to find the perfect fit for your investment journey.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {wealthPlans.map((plan, index) => (
            <div key={plan.id} className="relative rounded-2xl" style={{ boxShadow: '0 8px 32px #00000026' }}>
              <Image
                src={plan.image}
                alt={`${plan.planName} Plan`}
                width={400}
                height={500}
                className="w-full h-auto rounded-2xl"
                priority
              />
              
              <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 space-y-2 sm:space-y-3">
                <Link href={plan.href}>
                  <Button 
                    variant="outline" 
                    className={`w-full text-[1.2rem] py-2 sm:py-3 bg-transparent backdrop-blur-sm border-2 ${
                      plan.isPremium 
                        ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black" 
                        : "border-[#131859] text-[#131859] hover:bg-[#131859] hover:text-white"
                    }`}
                  >
                    View Detailed Description
                  </Button>
                </Link>
                
                <Button 
                  className={`w-full h-[3.5rem] md:text-[1.5rem] text-[1.5rem] py-2 sm:py-3 font-extrabold ${
                    plan.isPremium ? "text-slate-800" : "text-white"
                  }`}
                  style={{ 
                    background: plan.isPremium 
                      ? 'linear-gradient(to right, #fbbf24, #f59e0b)' 
                      : 'linear-gradient(to right, #131859, #18657BCC)' 
                  }}
                  onClick={() => handleBuyNow(plan)}
                >
                  BUY NOW
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8 sm:mt-12 lg:mt-16"
        >
          <p className="text-sm sm:text-base text-gray-600">
            Still have questions? We're here to help you choose the right plan.
          </p>
          <Link href="/contact-us">
            <Button 
              variant="outline" 
              className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
            >
              Contact Support
            </Button>
          </Link>
        </motion.div>
      </div>
      
      {/* Payment Modal with 5-step process and quarterly/yearly toggle */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bundle={selectedBundle}
        isEmandateFlow={true}
      />
    </div>
  )
}