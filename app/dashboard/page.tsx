"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout"
import Banner from "@/components/banner"
import { 
  MarketIndicesSection, 
  ExpertRecommendationsSection, 
  ModelPortfolioSection 
} from "@/components/dashboard-sections"
import { useToast } from "@/components/ui/use-toast"

export default function Dashboard() {
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
      
      // Clean up URL by removing query params
      router.replace('/dashboard', { scroll: false });
    } else if (paymentStatus === 'pending') {
      toast({
        title: "Payment Pending",
        description: "Your payment is being processed. You'll receive a confirmation shortly.",
      });
      
      router.replace('/dashboard', { scroll: false });
    } else if (paymentStatus === 'failed') {
      toast({
        title: "Payment Failed",
        description: errorMessage || "There was an issue with your payment. Please try again or contact support.",
        variant: "destructive",
      });
      
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, toast, router]);

  return (
    <DashboardLayout>
      <div className="flex flex-col w-full gap-4">
        <MarketIndicesSection />
        <Banner />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <ExpertRecommendationsSection />
          </div>
          <div className="lg:col-span-3">
            <ModelPortfolioSection />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
