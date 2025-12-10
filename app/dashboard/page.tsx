import dynamic from "next/dynamic"
import DashboardLayout from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

// Enable SSR for critical components with loading states
const Banner = dynamic(() => import("@/components/banner"), { 
  ssr: true,
  loading: () => <Skeleton className="w-full h-32 rounded-lg" />
})

const MarketIndicesSection = dynamic(() => import("@/components/dashboard-sections").then(mod => ({ default: mod.MarketIndicesSection })), { 
  ssr: true,
  loading: () => <Skeleton className="w-full h-48 rounded-lg" />
})

const ExpertRecommendationsSection = dynamic(() => import("@/components/dashboard-sections").then(mod => ({ default: mod.ExpertRecommendationsSection })), { 
  ssr: true,
  loading: () => <Skeleton className="w-full h-96 rounded-lg" />
})

const ModelPortfolioSection = dynamic(() => import("@/components/dashboard-sections").then(mod => ({ default: mod.ModelPortfolioSection })), { 
  ssr: true,
  loading: () => <Skeleton className="w-full h-96 rounded-lg" />
})

export const revalidate = 300;

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
