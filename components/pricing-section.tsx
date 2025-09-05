// components/pricing-section.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ShoppingCart, ChevronRight, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { bundleService, Bundle } from "@/services/bundle.service";
import { PaymentModal } from "./payment-modal";
import FeatureComparison from "./feature-comparison";
import { useAuth } from "@/components/auth/auth-context";
import { useCart } from "@/components/cart/cart-context";
import { postLoginState } from "@/lib/post-login-state";
import Link from "next/link";

type SubscriptionType = "monthly" | "monthlyEmandate" | "quarterly" | "yearly";



export default function PricingSection() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<"M" | "A">("M");

  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    bundle?: Bundle;
    pricingType: SubscriptionType | "monthlyEmandate";
  }>({ isOpen: false, pricingType: "monthly" });

  const { isAuthenticated } = useAuth();
  const { addBundleToCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadBundles();
  }, []);

  useEffect(() => {
    if (isAuthenticated && bundles.length > 0) {
      postLoginState.execute((bundleId, pricingType) => {
        const bundle = bundles.find(b => b._id === bundleId);
        if (bundle) {
          // Only open modal if it's not already open to prevent duplicate selection
          if (!checkoutModal.isOpen) {
            setCheckoutModal({ isOpen: true, bundle, pricingType: pricingType as SubscriptionType | "monthlyEmandate" });
          }
        }
      });
    }
  }, [isAuthenticated, bundles]);



  const loadBundles = async () => {
    try {
      setLoading(true);
      const bundlesData = await bundleService.getAll();
      setBundles(bundlesData);
    } catch (error) {
      console.error("Failed to load bundles:", error);
      toast({
        title: "Error",
        description: "Failed to load bundles. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBundlePurchase = async (bundle: Bundle, pricingType: SubscriptionType | "monthlyEmandate") => {
    if (!isAuthenticated) {
      // Save state for post-login execution
      postLoginState.save({
        action: "purchase",
        bundleId: bundle._id,
        pricingType: pricingType
      });
      // Open modal to show auth step
      setCheckoutModal({ isOpen: true, bundle, pricingType });
    } else {
      // User is already authenticated, proceed directly
      setCheckoutModal({ isOpen: true, bundle, pricingType });
    }
  };

  const handleAddToCart = async (bundle: Bundle, pricingType: SubscriptionType | "monthlyEmandate") => {
    try {
      const cartPricingType = pricingType === "monthlyEmandate" ? "monthly" : pricingType;
      await addBundleToCart(bundle._id, cartPricingType as "monthly" | "quarterly" | "yearly");
      toast({
        title: "Added to Cart",
        description: `${bundle.name} (${pricingType}) has been added to your cart.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add bundle to cart.",
        variant: "destructive",
      });
    }
  };

  const BASIC_SELECTED_STYLES =
    "text-[#FFFFF0] font-bold rounded-lg py-3 w-28 relative z-10 bg-transparent bg-gradient-to-r from-[#131859] to-[#18657B]";
  const PREMIUM_SELECTED_STYLES =
    "text-slate-800 font-bold rounded-lg py-3 w-28 relative z-10 bg-transparent bg-gradient-to-r from-[#D4AF37] to-[#FFC107]";
  const DESELECTED_STYLES =
    "font-bold rounded-lg py-3 w-28 hover:bg-slate-100 transition-colors relative";

  return (
    <section className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 lg:px-8 py-16 lg:py-24 relative overflow-hidden" id="pricing">
      {/* Header */}
      <div className="text-center mb-12 lg:mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
           <div className="text-center mb-8 sm:mb-12">
             <h2 className="text-5xl lg:text-8xl sm:text-7xl font-bold font-serif text-gray-900 dark:text-[#FFFFF0]">RANGAONE's WEALThH</h2>
             <p className="px-1 mt-2 text-[1.1rem] font-medium text-gray-600 dark:text-gray-300">
             Your way to smarter investing and long-term wealth creation! Stay ahead and make every move impactful
            </p>
           </div>
          
          {/* Plan Selector - segmented control with persistent gradient border */}
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="p-[4px] rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#FFD700] inline-flex shadow-md">
                <div className="rounded-xl bg-white relative overflow-hidden">
                  <motion.span
                    layoutId="bg-shift"
                    className={`absolute top-1 bottom-1 rounded-lg shadow-sm ${selected === "M" ? "left-1 right-[calc(50%+0.5rem)] bg-[linear-gradient(295.3deg,_#131859_11.58%,_rgba(24,101,123,0.8)_108.02%)]" : "right-1 left-[calc(50%+0.5rem)] bg-[linear-gradient(270deg,_#D4AF37_0%,_#FFC107_50%,_#FFD700_100%)]"}`}
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                  />
                  <div className="relative z-10 flex items-center gap-1 px-1 py-1">
                    <button
                      onClick={() => setSelected("M")}
                      className={
                        selected === "M"
                          ? BASIC_SELECTED_STYLES
                          : "font-bold rounded-lg py-3 w-28 bg-transparent text-slate-800 hover:bg-slate-50"
                      }
                    >
                      Basic
                      {selected === "M" && <BackgroundShift />}
                    </button>
                    <button
                      onClick={() => setSelected("A")}
                      className={
                        selected === "A"
                          ? PREMIUM_SELECTED_STYLES
                          : "font-bold rounded-lg py-3 w-28 bg-transparent text-slate-800 hover:bg-slate-50"
                      }
                    >
                      Premium
                      {selected === "A" && <BackgroundShift />}
                    </button>
                  </div>
                </div>
              </div>
              <CTAArrow />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pricing Cards with Prices */}
      
      <div className="p-4 flex justify-between sm:gap-8 gap-8 md:gap-16 lg:gap-16  mx-auto relative z-10 container max-w-4xl mb-16">
        {bundles
          .filter((bundle) => bundle.category === (selected === "M" ? "basic" : "premium"))
          .map((bundle) => [
            // Monthly eMandate card
            <AnimatePresence mode="wait" key={`${bundle._id}-monthlyEmandate`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
                onClick={() => handleBundlePurchase(bundle, "monthlyEmandate")}
                className={`w-full p-3 sm:p-6 border-[3px] rounded-xl transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer ${
                  selected === "A"
                    ? "bg-[linear-gradient(270deg,_#D4AF37_0%,_#FFC107_50%,_#FFD700_100%)] text-[#333333] border-[#333333] shadow-[0px_4px_21.5px_8px_#AD9000]"
                    : "bg-[linear-gradient(295.3deg,_#131859_11.58%,_rgba(24,101,123,0.8)_108.02%)] text-[#FFFFF0] border-slate-300 shadow-[0px_4px_21.5px_8px_#00A6E8]"
                }`}
              >
                <p className="text-xm sm:text-2xl font-bold font-serif">
                  Yearly
                </p>
                <div className="overflow-hidden">
                  <motion.p
                    key={bundle._id + "monthlyEmandate"}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ ease: "linear", duration: 0.25 }}
                    className="text-2xl sm:text-6xl font-semibold"
                  >
                    <span>&#8377;{(bundle as any).monthlyemandateprice || 0}</span>
                    <span className="font-normal text-xs sm:text-xl">/month</span>
                  </motion.p>
                </div>

                <div className="flex items-center gap-2 mb-2">
                <span className="text-[0.6rem] sm:text-lg">
                    (Annual, but billed <br></br>monthly)
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBundlePurchase(bundle, "monthlyEmandate");
                  }}
                  className={`w-full py-2 sm:py-4 text-sm sm:text-base font-semibold rounded-2xl uppercase ${
                    selected === "A"
                      ? "bg-[#333333] text-[#D4AF37] hover:text-[#FFD700]"
                      : "bg-white text-[#131859]"
                  }`}
                >
                  Buy Now
                </motion.button>
              </motion.div>
            </AnimatePresence>,
            
            // Monthly Regular card
            <AnimatePresence mode="wait" key={`${bundle._id}-monthly`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
                onClick={() => handleBundlePurchase(bundle, "monthly")}
                className={`w-full p-3 sm:p-6 border-0 rounded-xl transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer ${
                  selected === "A"
                    ? "bg-[#333333]"
                    : "bg-[linear-gradient(295.3deg,_#131859_11.58%,_rgba(24,101,123,0.8)_108.02%)] text-[#FFFFF0]"
                }`}
              >
                <p className={`text-xm sm:text-2xl font-bold font-serif ${
                  selected === "A" ? "text-transparent bg-clip-text bg-[linear-gradient(270deg,_#D4AF37_0%,_#FFC107_50%,_#FFD700_100%)]" : ""
                }`}>
                  Monthly
                </p>
                <div className="overflow-hidden">
                  <motion.p
                    key={bundle._id + "monthly"}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ ease: "linear", duration: 0.25 }}
                    className={`text-2xl sm:text-6xl font-semibold ${
                      selected === "A" ? "text-transparent bg-clip-text bg-[linear-gradient(270deg,_#D4AF37_0%,_#FFC107_50%,_#FFD700_100%)]" : ""
                    }`}
                  >
                    <span>&#8377;{bundle.monthlyPrice || 0}</span>
                    <span className="font-normal text-xs sm:text-xl">/month</span>
                  </motion.p>
                </div>

                <div className={`flex items-center gap-2 mb-2 ${
                  selected === "A" ? "text-transparent bg-clip-text bg-[linear-gradient(270deg,_#D4AF37_0%,_#FFC107_50%,_#FFD700_100%)]" : ""
                }`}>
                  <span className="text-[0.6rem] sm:text-lg">
                    (Flexible, but higher <br></br>costing)
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBundlePurchase(bundle, "monthly");
                  }}
                  className={`w-full py-2 sm:py-4 text-sm sm:text-base font-semibold rounded-2xl uppercase ${
                    selected === "A"
                      ? "bg-[linear-gradient(270deg,_#D4AF37_0%,_#FFC107_50%,_#FFD700_100%)] text-[#333333]"
                      : "bg-white text-[#131859]"
                  }`}
                >
                  Buy Now
                </motion.button>
              </motion.div>
            </AnimatePresence>
          ])
        }
      </div>

      {/* Feature Comparison Cards */}
      <FeatureComparison />

      {/* Background Elements */}
      <TopLeftCircle />
      <BottomRightCircle />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={checkoutModal.isOpen}
        onClose={() => setCheckoutModal({ isOpen: false, pricingType: "monthly" })}
        bundle={checkoutModal.bundle || null}
        isEmandateFlow={checkoutModal.pricingType === "monthlyEmandate"}
      />
    </section>
  );
}

const BackgroundShift = () => (
  <motion.span
    layoutId="bg-shift"
    className="absolute inset-0 bg-transparent rounded-lg -z-10"
  />
);

const CTAArrow = () => (
  <div className="absolute -right-[85px] top-2 sm:top-0">
    <motion.svg
      width="95"
      height="62"
      viewBox="0 0 95 62"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="scale-50 sm:scale-75"
      initial={{ scale: 0.7, rotate: 5 }}
      animate={{ scale: 0.75, rotate: 0 }}
      transition={{
        repeat: Infinity,
        repeatType: "mirror",
        duration: 1,
        ease: "easeOut",
      }}
    >
      <path
        d="M14.7705 15.8619C33.2146 15.2843 72.0772 22.1597 79.9754 54.2825"
        stroke="#FFC000"
        strokeWidth="3"
      />
      <path
        d="M17.7987 7.81217C18.0393 11.5987 16.4421 15.8467 15.5055 19.282C15.2179 20.3369 14.9203 21.3791 14.5871 22.4078C14.4728 22.7608 14.074 22.8153 13.9187 23.136C13.5641 23.8683 12.0906 22.7958 11.7114 22.5416C8.63713 20.4812 5.49156 18.3863 2.58664 15.9321C1.05261 14.6361 2.32549 14.1125 3.42136 13.0646C4.37585 12.152 5.13317 11.3811 6.22467 10.7447C8.97946 9.13838 12.7454 8.32946 15.8379 8.01289"
        stroke="#FFC000"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </motion.svg>
    <span className="block text-xs w-fit bg-[#FFC000] text-slate-800 shadow px-1.5 py-0.5 rounded -mt-1 ml-4 -rotate-2 font-light italic">
      Save &#8377;&#8377;&#8377;
    </span>
  </div>
);

const TopLeftCircle = () => {
  return (
    <motion.div
      initial={{ rotate: "0deg" }}
      animate={{ rotate: "360deg" }}
      transition={{ duration: 100, ease: "linear", repeat: Infinity }}
      className="w-[400px] h-[400px] rounded-full border-2 border-blue-200/30 border-dotted absolute z-0 -left-[200px] -top-[150px]"
    />
  );
};

const BottomRightCircle = () => {
  return (
    <motion.div
      initial={{ rotate: "0deg" }}
      animate={{ rotate: "-360deg" }}
      transition={{ duration: 120, ease: "linear", repeat: Infinity }}
      className="w-[500px] h-[500px] rounded-full border-2 border-indigo-200/30 border-dotted absolute z-0 -right-[250px] -bottom-[200px]"
    />
  );
};