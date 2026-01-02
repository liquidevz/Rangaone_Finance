"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ImageTrailHero } from "@/components/image-trail-hero"
import { Navbar } from "@/components/navbar"
import { PricingSection, FeatureComparison, QuoteSection, ModelPortfolioSection, FAQContactSection, Footer } from "@/components/home-client-wrapper"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // Handle payment redirect from Cashfree/Razorpay callback
  useEffect(() => {
    const paymentStatus = searchParams?.get('payment');
    const gateway = searchParams?.get('gateway');
    const errorMessage = searchParams?.get('error');
    
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful! 🎉",
        description: `Your subscription has been activated${gateway ? ` via ${gateway}` : ''}. Enjoy premium features!`,
      });
      
      // Clean up URL and redirect to dashboard
      router.replace('/dashboard', { scroll: false });
    } else if (paymentStatus === 'pending') {
      toast({
        title: "Payment Pending",
        description: "Your payment is being processed. You'll receive a confirmation shortly.",
      });
      
      // Redirect to dashboard to check status
      router.replace('/dashboard', { scroll: false });
    } else if (paymentStatus === 'failed') {
      toast({
        title: "Payment Failed",
        description: errorMessage || "There was an issue with your payment. Please try again or contact support.",
        variant: "destructive",
      });
      
      router.replace('/', { scroll: false });
    }
  }, [searchParams, toast, router]);

  return (
    <main>
      <Navbar />
      <ImageTrailHero />
      <PricingSection />
      <FeatureComparison />
      <QuoteSection />
      <ModelPortfolioSection />
      <FAQContactSection />
      <Footer />
    </main>
  )
}