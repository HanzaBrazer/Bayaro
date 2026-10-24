import { Skeleton, SkeletonCard } from "@/components/ui";

/** Fallback skeleton generik untuk rute (app) tanpa loading.tsx khusus. */
export default function AppLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
