import { Skeleton } from "@/components/ui/skeleton";

/** Instant feedback skeleton for detail routes (asset, staff, etc.). */
export function DetailPageLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading details">
      <Skeleton className="h-8 w-36 bg-purple-50" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-purple-100" />
        <Skeleton className="h-4 w-80 max-w-full bg-purple-50" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-5">
          <div className="grid gap-5 rounded-xl border border-purple-100 bg-white p-6 md:grid-cols-[260px_1fr]">
            <Skeleton className="h-[220px] rounded-xl bg-purple-50" />
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full bg-purple-50" />
                <Skeleton className="h-6 w-20 rounded-full bg-purple-50" />
              </div>
              <Skeleton className="h-4 w-full bg-purple-50" />
              <Skeleton className="h-4 w-3/4 bg-purple-50" />
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 rounded-lg bg-purple-50/80" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-purple-100 bg-white p-4">
            <Skeleton className="h-10 w-full max-w-md bg-purple-50" />
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full bg-purple-50/80" />
            ))}
          </div>
        </div>
        <div className="h-fit space-y-3 rounded-xl border border-purple-100 bg-white p-4">
          <Skeleton className="h-5 w-32 bg-purple-100" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full bg-purple-50/80" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetailTabsLoading() {
  return (
    <div className="space-y-3 rounded-xl border border-purple-100 bg-white p-4" aria-busy="true" aria-label="Loading details tabs">
      <Skeleton className="h-10 w-full max-w-md bg-purple-50" />
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full bg-purple-50/80" />
      ))}
    </div>
  );
}
