import DashboardLayout from "@/components/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ModelPortfoliosLoading() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </DashboardLayout>
  );
}
