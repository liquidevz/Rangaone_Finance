import DashboardLayout from "@/components/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function PremiumSubscriptionLoading() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    </DashboardLayout>
  );
}
