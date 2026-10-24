import { Skeleton, SkeletonCard } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-10 rounded-btn" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="space-y-3">
            <Skeleton className="h-8 w-8 rounded-btn" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
          </SkeletonCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-64 w-full rounded-card" />
        </SkeletonCard>
        <SkeletonCard className="space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mx-auto h-44 w-44 rounded-full" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </SkeletonCard>
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, c) => (
          <SkeletonCard key={c} className="space-y-4">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
