import { Skeleton, SkeletonCard } from "@/components/ui";

export default function TemplatesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="space-y-3 p-0">
            <Skeleton className="h-44 w-full rounded-none rounded-t-card" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
