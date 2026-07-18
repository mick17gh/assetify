import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 bg-purple-100" />
        <Skeleton className="h-4 w-96 max-w-full bg-purple-50" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-24 rounded-xl bg-purple-50" />
        <Skeleton className="h-24 rounded-xl bg-purple-50" />
        <Skeleton className="h-24 rounded-xl bg-purple-50" />
      </div>
      <div className="space-y-3 rounded-xl border border-purple-100 bg-white p-4">
        <Skeleton className="h-10 w-full bg-purple-50" />
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full bg-purple-50/80" />
        ))}
      </div>
    </div>
  );
}
