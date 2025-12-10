import { Skeleton } from "@/components/ui/skeleton";

export default function PoliciesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
