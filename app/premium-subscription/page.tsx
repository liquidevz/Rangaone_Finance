// app\premium-subscription\page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Star, ShoppingCart, X, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useCart } from "@/components/cart/cart-context";
import { useToast } from "@/components/ui/use-toast";
import { bundleService, Bundle } from "@/services/bundle.service";
import { faqService, FAQ } from "@/services/faq.service";
import { Navbar } from "@/components/navbar";
// import PremiumStackedCardTestimonials from "@/components/premium-stacked-card-testimonials";
import { PricingCompare } from "@/components/pricingComponents";
import { PaymentModal } from "@/components/payment-modal";
import { useRouter } from "next/navigation";
import Footer from "@/components/footer";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

// Scroll to top utility component
const ScrollToTop = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return null;
};

export default function PremiumSubscriptionPage() {
  const [premiumBundle, setPremiumBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Mobile slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalFeatures = 6;

  // Mobile slider navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev >= totalFeatures - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev <= 0 ? totalFeatures - 1 : prev - 1));
  };

  // Touch handling for mobile swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentSlide < totalFeatures - 1) {
      nextSlide();
    }
    if (isRightSwipe && currentSlide > 0) {
      prevSlide();
    }
  };

  const { isAuthenticated } = useAuth();
  const { addBundleToCart, hasBundle, cart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Ensure scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    loadPremiumBundle();
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const premiumFAQs = await faqService.getFAQsByCategory('Premium');
      setFaqs(premiumFAQs);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setFaqLoading(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const loadPremiumBundle = async () => {
    try {
      const bundles = await bundleService.getAll();
      const premium = bundles.find((bundle) => bundle.category === "premium");
      setPremiumBundle(premium || null);
    } catch (error) {
      console.error("Failed to load premium bundle:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!premiumBundle) return;
    setShowPaymentModal(true);
  };

  const isInCart = premiumBundle ? hasBundle(premiumBundle._id) : false;

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#333333] to-[#515151]">
      {/* Header - Fully Responsive */}
      <Navbar variant="premium" />

      {/* Hero Section - Fully Responsive */}
      <section className="relative px-3 sm:px-4 md:px-6 lg:px-8 pt-32 py-12 sm:py-32 md:py-24 lg:py-32 bg-gradient-to-r from-[#135058] to-[#FFCB50]">
        {/* Mobile & Tablet Layout */}
        <div className="lg:hidden">
          <div className="relative max-w-4xl mx-auto ">
            {/* Main Headings - Responsive */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 sm:mb-6"
            >
              <h1 className="px-2 text-2xl sm:text-3xl md:text-4xl font-bold text-[#f4d03f] leading-tight bg-gradient-to-r from-[#332407] via-[#33240796] to-[#00000000] rounded-xl">
                At RangaOne<br></br>
                Your Growth, Our Priority
              </h1>
            </motion.div>

            {/* Content with floating image - Responsive */}
            <div className="relative">
              {/* Floating Bull Image - Responsive sizing */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="float-right ml-3 sm:ml-4 mb-3 sm:mb-4 w-48 h-40 sm:w-60 sm:h-52 md:w-60 md:h-52 relative z-10"
                style={{ shapeOutside: "inset(0 round 12px)" }}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-xl">
                  <Image
                    src="/premium-subscription/premium_bull.jpg"
                    alt="RangaOne Wealth Premium"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, (max-width: 1024px) 224px, 384px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </motion.div>

              {/* Text Content - Responsive */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-white"
              >
                <div className="space-y-2 sm:space-y-3 text-sm leading-relaxed">
                  <p>
                    Rangaone Wealth Premium Elevate Your Investing Game! For
                    those who seek{" "}
                    <strong>more than just market returns</strong>, Rangaone
                    Wealth Premium is designed to give you{" "}
                    <strong>
                      exclusive, high-quality stock insights, advanced
                      strategies, and direct access to expert guidance.
                    </strong>
                  </p>

                  <p>
                    This isn't just an investment plan - it's your{" "}
                    <strong>personalized roadmap to wealth creation</strong>{" "}
                    with premium perks that set you apart from regular
                    investors.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Mobile Buttons - Responsive */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 clear-both max-w-[10rem]"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="bg-[#382404] text-[#f4d03f] font-bold py-4 rounded-full shadow-lg hover:shadow-xl transition-all text-base"
              >
                BUY NOW
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-8 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="col-span-7"
            >
              {/* Main Headings */}
              <div className="p-4 sm:p-6 rounded-lg mb-4 sm:mb-6 bg-gradient-to-r from-[#332407] via-[#33240796] to-[#00000000]">
                <h1 className="text-4xl sm:text-4xl md:text-5xl font-bold leading-tight text-[#FFD700]">
                  At RangaOne
                  <span className="block">Your Growth, Our Priority</span>
                </h1>
              </div>

              {/* Content */}
              <div className="text-white space-y-4 text-sm leading-relaxed">
                <p>
                  <strong className="text-white">
                    Rangaone Wealth PREMIUM – Elevate Your Investing Game!
                  </strong>{" "}
                  For those who seek{" "}
                  <strong>more than just market returns</strong>, Rangaone
                  Wealth Premium is designed to give you{" "}
                  <strong>
                    exclusive, high-quality stock insights, advanced strategies,
                    and direct access to expert guidance.
                  </strong>{" "}
                  This isn't just an investment plan - it's your{" "}
                  <strong>personalized roadmap to wealth creation</strong> with
                  premium perks that set you apart from regular investors.
                </p>
              </div>

              {/* Desktop Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex gap-6 mt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  className="bg-[#382404] text-[#f4d03f] font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-xl transition-all text-base"
                >
                  BUY NOW
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Right Column - Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="col-span-5"
            >
              <div className="relative">
                <div className="relative w-full h-48 sm:h-64 lg:h-80 xl:h-96 2xl:h-[28rem] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/premium-subscription/premium_bull.jpg"
                    alt="RangaOne Wealth Premium"
                    fill
                    className="object-cover object-center transform hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Banner */}
      <div className="w-full bg-[#fdba3c] py-3 border-t border-b border-[#7a8c3b]/30 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee">
          <span className="inline-block mx-4 text-[#000000] font-semibold">
            Get 2 Model Portfolios for Free in the Premium Subscription
          </span>
          <span className="inline-block mx-4 text-[#000000] font-semibold">
            Get 2 Model Portfolios for Free in the Premium Subscription
          </span>
          <span className="inline-block mx-4 text-[#000000] font-semibold">
            Get 2 Model Portfolios for Free in the Premium Subscription
          </span>
          <span className="inline-block mx-4 text-[#000000] font-semibold">
            Get 2 Model Portfolios for Free in the Premium Subscription
          </span>
        </div>
      </div>

      {/* Features Overview */}
      <section className="py-16">
        <div className="container mx-auto px-0">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6 text-[#FFFFF0]">
              Why become{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFC706]">
                Premium
              </span>
              ?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#FFD700] to-[#FFC706] mx-auto mb-6 rounded-full"></div>
            <p className="text-white max-w-5xl mx-auto text-base">
              Our Premium plan is designed for serious investors who want
              comprehensive tools and exclusive insights.
            </p>
          </motion.div>

          {/* Mobile Slider */}
          <div className="md:hidden">
            <div
              className="relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(${-currentSlide * 100}%)` }}
                >
                  {[
                    {
                      title: "Premium Quality Stocks",
                      description: "20-25 elite stocks with advanced research",
                      icon: "🏆",
                      id: "feature-1",
                    },
                    {
                      title: "Advanced Swing Trades",
                      description: "10 high-potential trade recommendations monthly",
                      icon: "⚡",
                      id: "feature-2",
                    },
                    {
                      title: "Model Portfolios",
                      description: "2 exclusive portfolios: SXG & Multibagger",
                      icon: "💼",
                      id: "feature-3",
                    },
                    {
                      title: "IPO Recommendations",
                      description: "Exclusive IPO analysis and recommendations",
                      icon: "🚀",
                      id: "feature-4",
                    },
                    {
                      title: "Call Support",
                      description: "Direct access to expert guidance",
                      icon: "📞",
                      id: "feature-5",
                    },
                    {
                      title: "Live Webinars",
                      description: "Interactive sessions with market experts",
                      icon: "🎥",
                      id: "feature-6",
                    },
                  ].map((feature, index) => (
                    <div key={index} className="flex-shrink-0 w-full px-4">
                      <div
                        className="bg-[#2a2a2a] rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-[#7a8c3b]/10 group hover:border-[#7a8c3b]/30 cursor-pointer h-full"
                        onClick={() => {
                          const element = document.getElementById(feature.id);
                          if (element) {
                            element.scrollIntoView({ 
                              behavior: "smooth",
                              block: "center",
                              inline: "center"
                            });
                          }
                        }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#FFD700] mb-4">
                          <span className="text-base font-bold text-[#FFD700]">
                            {index + 1}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-[#FFD700]">
                          {feature.title}
                        </h3>
                        <p className="text-white group-hover:text-white transition-colors">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons - Mobile Only */}
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#FFD700] hover:bg-[#FFC706] text-[#333333] p-2 rounded-full shadow-lg transition-all z-10"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#FFD700] hover:bg-[#FFC706] text-[#333333] p-2 rounded-full shadow-lg transition-all z-10"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Dots Indicator - Mobile Only */}
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: totalFeatures }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentSlide === index
                        ? "bg-[#FFD700] scale-125"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Premium Quality Stocks",
                description: "20-25 elite stocks with advanced research",
                icon: "🏆",
                id: "feature-1",
              },
              {
                title: "Advanced Swing Trades",
                description: "10 high-potential trade recommendations monthly",
                icon: "⚡",
                id: "feature-2",
              },
              {
                title: "Model Portfolios",
                description: "2 exclusive portfolios: SXG & Multibagger",
                icon: "💼",
                id: "feature-3",
              },
              {
                title: "IPO Recommendations",
                description: "Exclusive IPO analysis and recommendations",
                icon: "🚀",
                id: "feature-4",
              },
              {
                title: "Call Support",
                description: "Direct access to expert guidance",
                icon: "📞",
                id: "feature-5",
              },
              {
                title: "Live Webinars",
                description: "Interactive sessions with market experts",
                icon: "🎥",
                id: "feature-6",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#2a2a2a] rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-[#7a8c3b]/10 group hover:border-[#7a8c3b]/30 cursor-pointer"
                onClick={() => {
                  const element = document.getElementById(feature.id);
                  if (element) {
                    element.scrollIntoView({ 
                      behavior: "smooth",
                      block: "center",
                      inline: "center"
                    });
                  }
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#FFD700] mb-4">
                  <span className="text-base font-bold text-[#FFD700]">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#FFD700]">
                  {feature.title}
                </h3>
                <p className="text-white group-hover:text-white transition-colors">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-0">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#FFFFF0] p-5 md:p-6 text-left">
              Here's what makes {" "}
              <br></br>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFC706]">
                Rangaone Wealth Premium truly special?
              </span>
            </h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="space-y-4"
          >
            {/* Feature 1 */}
            <motion.div
              id="feature-1"
              variants={fadeIn}
              className="md:grid md:grid-cols-2 gap-6 md:gap-12 items-center p-4 md:p-8 scroll-mt-20 md:bg-transparent bg-[#FFC706]"
            >
              <div className="md:order-2">
                <div className="w-fit bg-[#f2be74] rounded-full justify-center mb-2">
                  <div className=" content-center inline-block px-4 py-2 text-transparent bg-clip-text bg-[#9c600c] rounded-full text-sm font-semibold ">
                    Feature 1
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-6 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-[#FFD700] md:to-[#FFC706] text-[#333333]">
                  Get 20-25 Premium Quality Stocks
                </h3>
                <div className="relative md:hidden mb-6 max-w-[250px]">
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#ffc107]/10 rounded-2xl blur-lg z-0"></div>
                  <div className="left-5 relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
                    <Image
                      src="/premium-subscription/qualityStocks.jpg"
                      alt="Premium Stocks"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="absolute -bottom-6 -right-6 md:w-24 md:h-24 w-16 h-16 bg-[#333333] rounded-full flex items-center justify-center text-[#FFC706] font-bold md:text-2xl text-md z-20">
                    20-25
                  </div>
                </div>
                <p className="md:text-white text-[#333333] mb-3 text-sm leading-relaxed">
                  Why settle for less when you can have the best? In the Basic
                  Plan, you receive Only 10-15 quality stocks, but with Premium,
                  you unlock 20-25 high-potential stocks, carefully handpicked
                  through deeper analysis and sharper insights. This means more
                  opportunities, higher accuracy, and better diversification,
                  giving you the ultimate edge in wealth creation
                </p>
                <ul className="space-y-1 px-2">
                  {[
                    "Advanced Stock Selection",
                    "Elite Level Research Edge",
                    "Superior Growth Potential Stocks",
                    "Legacy Wealth Creation",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 md:bg-[#FFC706] bg-[#333333] rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-[#FFC706]" />
                      </span>
                      <span className="md:text-white text-[#333333] font-bold italic">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative hidden md:block md:order-1">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#ffc107]/10 rounded-2xl blur-lg z-0"></div>
                <div className="relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
                  <Image
                    src="/premium-subscription/qualityStocks.jpg"
                    alt="Premium Stocks"
                    width={600}
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#FFC706] rounded-full flex items-center justify-center text-[#333333] font-bold text-md z-20">
                  20-25
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              id="feature-2"
              variants={fadeIn}
              className="md:grid md:grid-cols-2 gap-6 md:gap-12 items-center p-4 md:p-8 scroll-mt-20"
            >
              <div className="md:order-1">
                <div className="w-fit bg-[#f2be74] rounded-full justify-center mb-2">
                  <div className=" content-center inline-block px-4 py-2 text-transparent bg-clip-text bg-[#9c600c] rounded-full text-sm font-semibold ">
                    Feature 2
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFC706]">
                  Short-Term/Swing Trades
                </h3>
                <div className="relative md:hidden mb-6 max-w-[250px]">
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#7a8c3b]/10 rounded-2xl blur-lg z-0"></div>
                  <div className="left-20 relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
                    <Image 
                      src="/premium-subscription/10SwingTrades.jpg"
                      alt="Premium Swing Trades"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="absolute -bottom-6 md:-left-6 left-10 md:w-24 md:h-24 w-16 h-16 bg-[#333333] rounded-full flex items-center justify-center text-[#FFC706] font-bold md:text-2xl text-md z-20">
                    10
                  </div>
                </div>
                <p className="text-white mb-3 text-sm leading-relaxed">
                  Timing is everything in trading, and with Premium, we give
                  double the short-term opportunities compared to our basic
                  plan. Our expert technical analysts identify 10 high-potential
                  short-term trades each month, complete with precise entry and
                  exit points, stop-loss levels, and target prices.
                </p>
                <ul className="space-y-1 px-2">
                  {[
                    "10 high-potential trade recommendations",
                    "Precise entry and exit points",
                    "Sophisticated technical analysis",
                    "Strategic timing for market volatility",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#FFC706] rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-slate-700" />
                      </span>
                      <span className="text-white font-bold italic text-sm">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative hidden md:block md:order-2">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#7a8c3b]/10 rounded-2xl blur-lg z-0"></div>
                <div className="relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
                  <Image
                    src="/premium-subscription/10SwingTrades.jpg"
                    alt="Premium Swing Trades"
                    width={600}
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#FFC706] rounded-full flex items-center justify-center text-[#333333] font-bold text-2xl z-20">
                  10
                </div>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              id="feature-3"
              variants={fadeIn}
              className="w-full md:grid md:grid-cols-2 gap-6 md:gap-12 items-center p-4 md:p-8 md:bg-transparent bg-[#FFC706]"
            >
              <div className="md:order-2">
                <div className="w-fit bg-[#f2be74] rounded-full justify-center mb-2">
                  <div className=" content-center inline-block px-4 py-2 text-transparent bg-clip-text bg-[#9c600c] rounded-full text-sm font-semibold ">
                    Feature 3
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-6 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-[#FFD700] md:via-[#FFC107] md:to-[#D4AF37] text-[#333333]">
                  2 Exclusive Model Portfolios
                  <span className="block text-2xl mt-1 font-normal md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-[#FFD700] md:via-[#FFC107] md:to-[#D4AF37] text-[#333333]">
                    (SXG & Multibagger Portfolio)
                  </span>
                </h3>
                <div className="relative md:hidden mb-6 max-w-[250px]">
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#7a8c3b]/10 rounded-2xl blur-lg z-0"></div>
                  <div className="left-5 relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
                    <Image
                      src="/premium-subscription/goldbars.jpg"
                      alt="Model Portfolios"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <p className="md:text-white text-[#333333] mb-3 text-sm leading-relaxed">
                  Get access to 2 expert-designed investment portfolios tailored
                  for long-term wealth creation:<br></br> <br></br>{" "}
                  <b>•Stability X Growth Portfolio : </b>A portfolio built to be
                  strong in downturns and aggressive during rising markets. A
                  strategy designed to grow your wealth through every market
                  cycle. Crafted for discerning investors who value capital
                  protection but refuse to settle for average returns. Perfect
                  for those who want to compound wealth steadily while capturing
                  high-conviction opportunities.<br></br>
                  <br></br>
                  <b>•Multi-bagger Portfolio : </b>Want to invest in future
                  giants? This portfolio consists of highpotential stocks with
                  the capability to deliver massive returns over time. Perfect
                  for investors looking to multiply their wealth with
                  well-researched multi-bagger opportunities.
                </p>
              </div>
              <div className="relative hidden md:block md:order-1">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#7a8c3b]/10 rounded-2xl blur-lg z-0"></div>
                <div className="relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
                  <Image
                    src="/premium-subscription/goldbars.jpg"
                    alt="Model Portfolios"
                    width={600}
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              id="feature-4"
              variants={fadeIn}
              className="md:grid md:grid-cols-2 gap-6 md:gap-12 items-center p-4 md:p-8"
            >
              <div className="md:order-1">
                <div className="w-fit bg-[#f2be74] rounded-full justify-center mb-2">
                  <div className=" content-center inline-block px-4 py-2 text-transparent bg-clip-text bg-[#9c600c] rounded-full text-sm font-semibold ">
                    Feature 4
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#D4AF37]">
                  IPO Recommendations
                  <span className="block text-2xl mt-1 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#D4AF37]">
                    (Direct Access to Experts)
                  </span>
                </h3>
                <div className="relative md:hidden mb-6 max-w-[250px]">
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#7a8c3b]/10 rounded-2xl blur-lg z-0"></div>
                  <div className="left-20 relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
                    <Image
                      src="/premium-subscription/IPO.jpg"
                      alt="IPO Recommendations"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <p className="text-white mb-3 text-sm leading-relaxed">
                  Be among the first to invest in the next big opportunity! Our
                  premium subscribers get exclusive IPO recommendations with
                  insights on which ones are worth investing in and which ones
                  to avoid. Get detailed analysis, valuation breakdowns, and
                  subscription strategies so you never miss a high-potential
                  listing.
                </p>
                <ul className="space-y-1 px-2">
                  {[
                    "Exclusive IPO Recommendations",
                    "Allotment Maximisation Strategy",
                    "Apply-or-Avoid guidance",
                    "Expert Valuation Insights",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#FFC706] rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-slate-700" />
                      </span>
                      <span className="text-white font-bold italic text-sm">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative hidden md:block md:order-2">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#7a8c3b]/10 rounded-2xl blur-lg z-0"></div>
                <div className="relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
                  <Image
                    src="/premium-subscription/IPO.jpg"
                    alt="IPO Recommendations"
                    width={600}
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              id="feature-5"
              variants={fadeIn}
              className="md:grid md:grid-cols-2 gap-6 md:gap-12 items-center p-4 md:p-8 md:bg-transparent bg-[#FFC706]"
            >
              <div className="md:order-2">
                <div className="w-fit bg-[#f2be74] rounded-full justify-center mb-2">
                  <div className=" content-center inline-block px-4 py-2 text-transparent bg-clip-text bg-[#9c600c] rounded-full text-sm font-semibold ">
                    Feature 5
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-6 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-[#FFD700] md:to-[#FFC706] text-[#333333]">
                  Call Support{" "}
                  <span className="block text-2xl mt-1 font-bold md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-[#FFD700] md:via-[#FFC107] md:to-[#D4AF37]">
                    (Direct Access to Experts)
                  </span>
                </h3>
                <div className="relative md:hidden mb-6 max-w-[250px]">
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#7a8c3b]/10 rounded-2xl blur-lg z-0"></div>
                  <div className="left-5 relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
                    <Image
                      src="/premium-subscription/CallSupport.jpg"
                      alt="Call Support"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <p className="md:text-white text-[#333333] mb-3 text-sm leading-relaxed">
                  Your investing journey should never feel like a guessing game.
                  With Premium, you get priority call support where you can
                  discuss your queries, seek clarifications, and get direct
                  insights from our experts. You’re not just another
                  investor—you’re part of an exclusive group that gets expert
                  guidance on demand
                </p>
                <ul className="space-y-1 px-2">
                  {[
                    "Priority Call Support",
                    "Expert-Led Guidance",
                    "Query Resolution Access",
                    "Exclusive Member Benefits",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 md:bg-[#FFC706] bg-slate-800 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-[#FFC706]" />
                      </span>
                      <span className="md:text-white text-[#333333] font-bold italic">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative hidden md:block md:order-1">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#7a8c3b]/10 rounded-2xl blur-lg z-0"></div>
                <div className="relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
                  <Image
                    src="/premium-subscription/CallSupport.jpg"
                    alt="Call Support"
                    width={600}
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature 6 */}
      <motion.div
        id="feature-6"
        variants={fadeIn}
        className="md:grid md:grid-cols-2 gap-6 md:gap-12 items-center p-4 md:p-8"
      >
        <div className="md:order-1">
          <div className="w-fit bg-[#f2be74] rounded-full justify-center mb-2">
            <div className=" content-center inline-block px-4 py-2 text-transparent bg-clip-text bg-[#9c600c] rounded-full text-sm font-semibold ">
              Feature 6
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#D4AF37]">
            Free Live Webinars
            <span className="block text-2xl mt-1 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#D4AF37]">
              – Learn, Interact & Grow! (Extra bonus)
            </span>
          </h3>
          <div className="relative md:hidden mb-6 max-w-[250px]">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#7a8c3b]/10 rounded-2xl blur-lg z-0"></div>
            <div className="left-20 relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
              <Image
                src="/premium-subscription/IPO.jpg"
                alt="IPO Recommendations"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>
          <p className="text-white mb-3 text-sm leading-relaxed">
            Most influencers offer chat support and pre-recorded videos, but we
            go beyond that! With Rangaone Wealth Premium, you get exclusive live
            webinars where our experts break down market trends, stock
            strategies, and upcoming opportunities—in real-time.*(more features
            chart)* <br></br><br></br>We don’t just share information; we take responsibility for
            answering your doubts, explaining concepts, and ensuring you truly
            understand the market. This isn’t just another webinar—it’s a
            premium experience designed to make you feel valued and empowered.
          </p>
          <ul className="space-y-1 px-2">
            {[
              "Live Market Analysis",
              "Interactive Q&A Sessions",
              "Expert Market Insights",
              "Real-time Strategy Updates",
            ].map((item, i) => (
              <li key={i} className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-[#FFC706] rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-slate-700" />
                </span>
                <span className="text-white font-bold italic text-sm">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative hidden md:block md:order-2">
          <div className="absolute -inset-4 bg-gradient-to-r from-[#1e4e45]/10 to-[#7a8c3b]/10 rounded-2xl blur-lg z-0"></div>
          <div className="relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#7a8c3b]/20">
            <Image
              src="/premium-subscription/IPO.jpg"
              alt="IPO Recommendations"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
        </div>
      </motion.div>

      {/* Testimonials
      <section>
        <div className="container mx-auto px-0">
          <PremiumStackedCardTestimonials />
        </div>
      </section> */}

      {/* Pricing Section */}
      <PricingCompare />

      {/* CTA Section */}
      <section className="py-10 bg-gradient-to-r from-[#1e4e45] via-[#7a8c3b] to-[#ffc107] text-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Unlock Exclusive Access – Invest Like a Pro!
            </h2>
            <p className="text-xl mb-8 text-gray-800">
              Stop following the crowd—start making power moves in the market.
              With RangaOne Wealth Premium, you're not just subscribing, you're
              elevating your investment game with expert-backed stock picks,
              real-time insights, and hands-on guidance.
            </p>
            <p className="text-gray-700 mb-8 max-w-7xl ">
              This isn't just a service—it's a game-changer. Are you ready for
              elite guidance, confidence, and an unbeatable edge?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={handleAddToCart}
                  className="bg-[#1a1a1a] text-[#FFFFF0] hover:bg-gray-800 font-bold py-4 px-10 rounded-full transition-all inline-flex items-center shadow-lg"
                >
                  <span>Subscribe Now</span>
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#FFFFF0]">
              Frequently Asked Questions
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#1e4e45] to-[#ffc107] mx-auto mb-6 rounded-full"></div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Get answers to common questions about our Premium subscription
              plan.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {faqLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC706] mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading FAQs...</p>
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No FAQs found for Premium category.</p>
              </div>
            ) : (
              faqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="mb-6 border-b border-gray-700 pb-6 last:border-0"
                >
                  <button
                    className="flex justify-between items-center w-full text-left"
                    onClick={() => toggleFAQ(index)}
                  >
                    <h3 className="text-xl font-bold text-[#7a8c3b] pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`h-5 w-5 text-[#7a8c3b] transition-transform duration-200 flex-shrink-0 ${
                        openFaqIndex === index ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      openFaqIndex === index ? "max-h-96 mt-3" : "max-h-0"
                    }`}
                  >
                    <p className="text-white">{faq.answer}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bundle={premiumBundle}
        isEmandateFlow={true}
      />
      <Footer />
    </main>
  );
}
