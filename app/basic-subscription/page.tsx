"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Star, ShoppingCart, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useCart } from "@/components/cart/cart-context";
import { useToast } from "@/components/ui/use-toast";
import { bundleService, Bundle } from "@/services/bundle.service";
import { Navbar } from "@/components/navbar";
// import BasicStackedCardTestimonials from "@/components/basic-stacked-card-testimonials";
import PricingTable from "@/components/pricingComponents";
import { PaymentModal } from "@/components/payment-modal";
import { faqService, FAQ } from "@/services/faq.service";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
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

export default function BasicSubscriptionPage() {
  const [basicBundle, setBasicBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Mobile slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalFeatures = 4;

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
  const { addBundleToCart, hasBundle } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Ensure scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    loadBasicBundle();
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const basicFAQs = await faqService.getFAQsByCategory('Basic');
      setFaqs(basicFAQs);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setFaqLoading(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const loadBasicBundle = async () => {
    try {
      const bundles = await bundleService.getAll();
      const basic = bundles.find((bundle) => bundle.category === "basic");
      setBasicBundle(basic || null);
    } catch (error) {
      console.error("Failed to load basic bundle:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!basicBundle) return;
    setShowPaymentModal(true);
  };

  const isInCart = basicBundle ? hasBundle(basicBundle._id) : false;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      {/* Header - Fully Responsive */}
      <Navbar variant="default" />

      {/* Hero Section - Following the image color theme */}
      <section className="relative px-3 sm:px-4 md:px-6 lg:px-8 pt-32 py-12 sm:py-32 md:py-24 lg:py-32 bg-gradient-to-r from-[#898EFF] to-[#7DCEFF]">
        {/* Mobile & Tablet Layout */}
        <div className="lg:hidden">
          <div className="relative max-w-4xl mx-auto">
            {/* Main Headings - Responsive */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 sm:mb-6"
            >
              <h1 className="px-2 text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight bg-gradient-to-r from-[#021836] to-transparent rounded-xl">
                At RangaOne<br></br>
                ~Your Growth, Our Priority~
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
                    src="/basic-subscription/basicbull.png"
                    alt="Basic Bull"
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
                className="text-black"
              >
                <div className="space-y-2 sm:space-y-3 text-sm leading-relaxed">
                  <p>
                    <strong>
                      Rangaone Wealth isn’t just a plan—it’s your gateway to
                      smarter, stress-free investing.
                    </strong>
                     Designed for investors who want 
                    <strong>
                      expert guidance without the hassle of constant research,
                    </strong>
                    we bring you Quality stock recommendations, with precise
                    entry-exit alerts and a disciplined approach, we also help
                    you make{" "}
                    <strong>
                      informed moves, maximize profits, and stay ahead of the
                      market.
                    </strong>{" "}
                    <br></br>
                    <br></br>
                    Whether you're looking to build long-term wealth or
                    capitalize on short-term opportunities,
                    <strong>
                       Rangaone Wealth empowers you with the right tools,
                      strategies, and confidence to succeed.
                    </strong>
                     Ready to invest smarter? Let’s make every Investment count!
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Mobile Buttons - Responsive */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 clear-both"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="bg-white text-[#8193ff] font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all text-base border border-blue-300"
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
              className="col-span-8"
            >
              {/* Main Headings */}
              <div className="p-4 sm:p-6 rounded-3xl mb-4 sm:mb-6 bg-gradient-to-r from-[#021836] to-transparent relative overflow-hidden">
                {/* Dotted background pattern */}
                <div
                  className="absolute inset-0 opacity-20 "
                  style={{
                    backgroundImage: `radial-gradient(circle, #898EFF 3px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                  }}
                ></div>
                <h1 className="text-4xl sm:text-4xl md:text-5xl font-bold leading-tight text-white relative z-10">
                  At RangaOne
                  <span className="block">Your Growth, Our Priority</span>
                </h1>
              </div>

              {/* Content */}
              <div className="text-black space-y-4 text-base leading-relaxed">
                <p>
                  <strong className="">
                    Rangaone Wealth isn’t just a plan—it’s your gateway to
                    smarter, stress-free investing.
                  </strong>
                   Designed for investors who want 
                  <strong>
                    expert guidance without the hassle of constant research,
                  </strong>
                  we bring you Quality stock recommendations, with precise
                  entry-exit alerts and a disciplined approach, we also help you
                  make{" "}
                  <strong>
                    informed moves, maximize profits, and stay ahead of the
                    market.
                  </strong>{" "}
                  <br></br>
                  <br></br>
                  Whether you're looking to build long-term wealth or capitalize
                  on short-term opportunities,
                  <strong>
                     Rangaone Wealth empowers you with the right tools,
                    strategies, and confidence to succeed.
                  </strong>
                   Ready to invest smarter? Let’s make every Investment count!
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
                  className="bg-white text-[#8193ff] font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all text-base border border-blue-300"
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
              className="col-span-4"
            >
              <div className="relative">
                <div className="relative w-full h-48 sm:h-64 lg:h-80 xl:h-96 2xl:h-[28rem] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/basic-subscription/basicbull.png"
                    alt="Basic Bull Statue"
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
      <div className="w-full bg-[#001633] py-3 border-t border-b border-yellow-500/30 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee">
          <span className="inline-block mx-4 text-white font-semibold">
            Smart investing starts here
          </span>
          <span className="inline-block mx-4 text-white font-semibold">
            Affordable plans for every investor.
          </span>
          <span className="inline-block mx-4 text-white font-semibold">
            Smart investing starts here
          </span>
          <span className="inline-block mx-4 text-white font-semibold">
            Affordable plans for every investor.
          </span>
          <span className="inline-block mx-4 text-white font-semibold">
            Smart investing starts here
          </span>
          <span className="inline-block mx-4 text-white font-semibold">
            Affordable plans for every investor.
          </span>
        </div>
      </div>

      {/* Features Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6 text-black">
              Why Choose <span className="text-[#898EFF]">Basic</span>?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#8193ff] to-[#8193ff] mx-auto mb-6 rounded-full"></div>
            <p className="text-black max-w-5xl mx-auto text-base">
              Our Basic plan is designed for beginners who want to start their
              investment journey with quality guidance.
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
                      title: "Quality Stocks",
                      description: "10-15 carefully researched stocks with good potential",
                      icon: "📈",
                      id: "feature-1",
                    },
                    {
                      title: "Short-Term Trades",
                      description: "5 high-potential trade recommendations each month",
                      icon: "⚡",
                      id: "feature-2",
                    },
                    {
                      title: "Timely Alerts",
                      description: "Real-time notifications for market opportunities",
                      icon: "🔔",
                      id: "feature-3",
                    },
                    {
                      title: "Market Updates",
                      description: "Regular market analysis and insights",
                      icon: "📊",
                      id: "feature-4",
                    },
                  ].map((feature, index) => (
                    <div key={index} className="flex-shrink-0 w-full px-4">
                      <div
                        className="rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border bg-white group hover:border-purple-400 cursor-pointer h-full"
                        onClick={() => {
                          const element = document.getElementById(feature.id);
                          if (element) {
                            const offset = 120; // Account for fixed header
                            const elementPosition = element.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - offset;
                            
                            window.scrollTo({
                              top: offsetPosition,
                              behavior: "smooth"
                            });
                          }
                        }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#8193ff] mb-4 bg-[#8193ff]">
                          <span className="text-base font-bold text-white">
                            {index + 1}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-[#8193ff]">
                          {feature.title}
                        </h3>
                        <p className="text-black group-hover:text-gray-700 transition-colors">
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
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#8193ff] hover:bg-[#8193ff] text-white p-2 rounded-full shadow-lg transition-all z-10"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#8193ff] hover:bg-[#8193ff] text-white p-2 rounded-full shadow-lg transition-all z-10"
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
                        ? "bg-[#8193ff] scale-125"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Quality Stocks",
                description: "10-15 carefully researched stocks with good potential",
                icon: "📈",
                id: "feature-1",
              },
              {
                title: "Short-Term Trades",
                description: "5 high-potential trade recommendations each month",
                icon: "⚡",
                id: "feature-2",
              },
              {
                title: "Timely Alerts",
                description: "Real-time notifications for market opportunities",
                icon: "🔔",
                id: "feature-3",
              },
              {
                title: "Market Updates",
                description: "Regular market analysis and insights",
                icon: "📊",
                id: "feature-4",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-[#8193ff] group hover:border-purple-400 cursor-pointer"
                onClick={() => {
                  const element = document.getElementById(feature.id);
                  if (element) {
                    const offset = 120; // Account for fixed header
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: "smooth"
                    });
                  }
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#8193ff] mb-4 bg-[#8193ff]">
                  <span className="text-base font-bold text-white">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#8193ff]">
                  {feature.title}
                </h3>
                <p className="text-black group-hover:text-gray-700 transition-colors">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-0">
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
              className="md:grid md:grid-cols-2 gap-6 md:gap-12 items-center p-4 md:p-8 scroll-mt-32 bg-[#8193ff] md:bg-white"
            >
              <div className="md:order-2">
                <div className="w-fit bg-[#e6e9ff] rounded-full justify-center mb-2">
                  <div className="content-center inline-block px-4 py-2 text-[#8193ff] rounded-full text-sm font-semibold">
                    Feature 1
                  </div>
                </div>
                <h3 className="md:text-3xl text-[1.7rem] font-bold mb-6 md:text-transparent md:bg-clip-text md:bg-gradient-to-r from-[#8193ff] to-[#8193ff]">
                  Longterm 10-15 Quality Stocks
                </h3>
                <div className="relative md:hidden mb-6 max-w-[250px]">
                  <div className="absolute -inset-4  rounded-2xl blur-lg z-0"></div>
                  <div className="relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#8193ff] max-w-[250px]">
                    <Image
                      src="/basic-subscription/longtermstocks.png"
                      alt="Quality Stocks"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="absolute -bottom-6 md:-right-6 -right-5  md:w-24 md:h-24 w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#8193ff] font-bold md:text-2xl text-xl z-20">
                    10-15
                  </div>
                </div>
                <p className="text-black mb-3 text-sm leading-relaxed">
                  We handpick Quality stocks after rigorous research, ensuring
                  you invest in fundamentally strong companies with the
                  potential for long-term growth. These stocks are not just
                  names; they're opportunities—carefully selected to help you
                  build a solid, wealth-generating portfolio.
                </p>
                <ul className="space-y-1 px-2">
                  {[
                    "Rigorous Stock Research",
                    "Fundamentally Strong Companies",
                    "Long Term Growth",
                    "Risk-Reward favourable stocks",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#8193ff] rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </span>
                      <span className="text-black font-bold italic">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative hidden md:block md:order-1">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#e6e9ff] to-blue-100 rounded-2xl blur-lg z-0"></div>
                <div className="relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#8193ff]">
                  <Image
                    src="/basic-subscription/longtermstocks.png"
                    alt="Quality Stocks"
                    width={600}
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#8193ff] rounded-full flex items-center justify-center text-white font-bold text-2xl z-20">
                  10-15
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              id="feature-2"
              variants={fadeIn}
              className="md:grid md:grid-cols-2 gap-6 md:gap-12 items-center p-4 md:p-8 scroll-mt-32"
            >
              <div className="md:order-1">
                <div className="w-fit bg-[#e6e9ff] rounded-full justify-center mb-2">
                  <div className="content-center inline-block px-4 py-2 text-[#8193ff] rounded-full text-sm font-semibold">
                    Feature 2
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#8193ff] to-[#8193ff]">
                  5 Short-Term/Swing Trades
                </h3>
                <div className="relative md:hidden mb-6 max-w-[250px]">
                  <div className="left-20 relative z-10 overflow-hidden rounded-xl ">
                    <Image
                      src="/basic-subscription/5swingtrades.png"
                      alt="Swing Trades"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="absolute -bottom-6 left-12 md:w-24 md:h-24 w-16 h-16 bg-[#8193ff] rounded-full flex items-center justify-center text-white font-bold md:text-2xl text-xl z-20">
                    5
                  </div>
                </div>
                <p className="text-black mb-3 text-sm leading-relaxed">
                  Get real-time alerts with precise entry levels, clear targets,
                  and well-timed exit points to maximize your gains and minimize
                  risks. Our expert-driven alerts ensure that you enter at the
                  right time, stay informed throughout the trade, and exit
                  profitably—never too early, never too late. Our alerts are
                  crafted to help you make informed decisions with confidence,
                  ensuring that you never miss an opportunity or hold onto a
                  stock for too long. With us, you won’t just invest; you’ll
                  invest smartly and strategically.
                </p>
                <ul className="space-y-1 px-2">
                  {[
                    "5 High Potential Trade Recommendations",
                    "Precise Entry & Exit Levels",
                    "Strategic Stock Picks",
                    "Analysis-Backed Moves",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#8193ff] rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </span>
                      <span className="text-black font-bold italic text-sm">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative hidden md:block md:order-2">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#e6e9ff] to-blue-100 rounded-2xl blur-lg z-0"></div>
                <div className="relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#8193ff]">
                  <Image
                    src="/basic-subscription/5swingtrades.png"
                    alt="Swing Trades"
                    width={600}
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-6 -left-5 w-24 h-24 bg-[#8193ff] rounded-full flex items-center justify-center text-white font-bold text-2xl z-20">
                  5
                </div>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              id="feature-3"
              variants={fadeIn}
              className="w-full md:grid md:grid-cols-2 gap-6 md:gap-12 items-center p-4 md:p-8 scroll-mt-32 bg-[#8193ff] md:bg-white"
            >
              <div className="md:order-2">
                <div className="w-fit bg-[#e6e9ff] rounded-full justify-center mb-2">
                  <div className="content-center inline-block px-4 py-2 text-[#8193ff] rounded-full text-sm font-semibold">
                    Feature 3
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-6 text-black md:text-transparent md:bg-clip-text md:bg-gradient-to-r from-[#8193ff] to-[#8193ff]">
                  Timely Alerts for Entry & Exit
                </h3>
                <div className="relative md:hidden mb-6 max-w-[250px]">
                  <div className="absolute -inset-4 rounded-2xl blur-lg z-0"></div>
                  <div className="relative z-10 overflow-hidden rounded-xl">
                    <Image
                      src="/basic-subscription/entryexit.jpg"
                      alt="Timely Alerts"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <p className="text-black mb-3 text-sm leading-relaxed">
                  Get real-time alerts with precise entry levels, clear targets,
                  and well-timed exit points to maximize your gains and minimize
                  risks. Our expert-driven alerts ensure that you enter at the
                  right time, stay informed throughout the trade, and exit
                  profitably—never too early, never too late. Our alerts are
                  crafted to help you make informed decisions with confidence,
                  ensuring that you never miss an opportunity or hold onto a
                  stock for too long. With us, you won’t just invest; you’ll
                  invest smartly and strategically
                </p>
                <ul className="space-y-1 px-2">
                  {[
                    "Real Time Alerts",
                    "Precise Entry Levels with Clear Targets",
                    "Risk Minimizing Strategy",
                    "Informed Timely Decisions",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#8193ff] rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </span>
                      <span className="text-black font-bold italic text-sm">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative hidden md:block md:order-1">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#e6e9ff] to-blue-100 rounded-2xl blur-lg z-0"></div>
                <div className="relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#8193ff]">
                  <Image
                    src="/basic-subscription/entryexit.jpg"
                    alt="Timely Alerts"
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
              className="md:grid md:grid-cols-2 gap-6 md:gap-12 items-center p-4 md:p-8 scroll-mt-32"
            >
              <div className="md:order-1">
                <div className="w-fit bg-[#e6e9ff] rounded-full justify-center mb-2">
                  <div className="content-center inline-block px-4 py-2 text-[#8193ff] rounded-full text-sm font-semibold">
                    Feature 4
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#8193ff] to-[#8193ff]">
                  Real-Time Market Updates
                </h3>
                <div className="relative md:hidden mb-6">
                  <div className="left-20 relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#8193ff] max-w-[250px]">
                    <Image
                      src="/basic-subscription/realtimemarketupdates.jpg"
                      alt="Market Updates"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <p className="text-black mb-3 text-base leading-relaxed">
                  Maximise your profits with expert-curated short-term and swing
                  trades. Whether you’re looking to capitalise on quick market
                  movements or boost your portfolio with short-term
                  opportunities, our strategic picks are designed to deliver
                  results. Every trade is backed by thorough analysis, ensuring
                  a calculated and confident approach to the market
                </p>
                <ul className="space-y-1 px-2">
                  {[
                    "Live Market Updates",
                    "Economic Events Analysis",
                    "Timely Opportunities",
                    "Fact-Based, Informed actions.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#8193ff] rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </span>
                      <span className="text-black font-bold italic text-sm">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative hidden md:block md:order-2">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#e6e9ff] to-blue-100 rounded-2xl blur-lg z-0"></div>
                <div className="relative z-10 overflow-hidden rounded-xl shadow-xl border border-[#8193ff]">
                  <Image
                    src="/basic-subscription/realtimemarketupdates.jpg"
                    alt="Market Updates"
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

      {/* Testimonials
      <section className="bg-white">
        <div className="container mx-auto px-4">
          <BasicStackedCardTestimonials />
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-10 bg-[#5B79FF] text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Forget the Guesswork
            </h2>
            <p className="text-xl mb-8 text-gray-100 font-bold">
              Rangaone Wealth Basic gives you the essential tools,
              expert-curated stocks, and real-time insights to grow your wealth
              with clarity and confidence. This isn’t just a starter plan—it’s
              your gateway to smarter investing with quality recommendations,
              strategic alerts, and market updates that keep you ahead.
            </p>
            <p className="text-gray-200 mb-8 max-w-7xl">
              Serious about building wealth? Start here. Subscribe to Rangaone
              Wealth Basic NOW!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="bg-[#00197BC7] text-white hover: font-bold py-4 px-10 rounded-full transition-all inline-flex items-center shadow-lg text-[2rem]"
              >
                <span>Subscribe</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Frequently Asked Questions
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#8193ff] to-[#8193ff] mx-auto mb-6 rounded-full"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get answers to common questions about our Basic subscription plan.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {faqLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8193ff] mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading FAQs...</p>
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No FAQs found for Basic category.</p>
              </div>
            ) : (
              faqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="mb-6 border-b border-gray-200 pb-6 last:border-0"
                >
                  <button
                    className="flex justify-between items-center w-full text-left"
                    onClick={() => toggleFAQ(index)}
                  >
                    <h3 className="text-xl font-bold text-[#8193ff] pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`h-5 w-5 text-[#8193ff] transition-transform duration-200 flex-shrink-0 ${
                        openFaqIndex === index ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      openFaqIndex === index ? "max-h-96 mt-3" : "max-h-0"
                    }`}
                  >
                    <p className="text-black">{faq.answer}</p>
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
        bundle={basicBundle}
        isEmandateFlow={true}
      />
      <Footer />
    </main>
  );
}

