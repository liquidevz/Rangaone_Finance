import dynamicImport from "next/dynamic"
import DashboardLayout from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

// Preload critical components for instant rendering
const Banner = dynamicImport(() => import("@/components/banner"), { 
  ssr: true
})

const MarketIndicesSection = dynamicImport(() => import("@/components/dashboard-sections").then(mod => ({ default: mod.MarketIndicesSection })), { 
  ssr: true
})

const ExpertRecommendationsSection = dynamicImport(() => import("@/components/dashboard-sections").then(mod => ({ default: mod.ExpertRecommendationsSection })), { 
  ssr: true
})

const ModelPortfolioSection = dynamicImport(() => import("@/components/dashboard-sections").then(mod => ({ default: mod.ModelPortfolioSection })), { 
  ssr: true
})

export const revalidate = 300;
export const dynamic = 'force-static';
export const fetchCache = 'force-cache';

export default function Dashboard() {
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
