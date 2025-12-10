import { Skeleton } from "@/components/ui/skeleton";

export default function AboutUsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Skeleton className="h-64 w-full" />
      <div className="max-w-6xl mx-auto p-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
