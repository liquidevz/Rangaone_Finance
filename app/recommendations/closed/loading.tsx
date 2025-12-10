import DashboardLayout from "@/components/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClosedRecommendationsLoading() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </DashboardLayout>
  );
}
