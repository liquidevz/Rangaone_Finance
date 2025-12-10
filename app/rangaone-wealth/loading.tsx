import DashboardLayout from "@/components/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function RangaoneWealthLoading() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    </DashboardLayout>
  );
}
