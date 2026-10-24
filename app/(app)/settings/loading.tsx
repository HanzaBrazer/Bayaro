import { Skeleton, SkeletonCard } from "@/components/ui";

export default function SettingsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full max-w-md rounded-btn" />
      <SkeletonCard className="max-w-xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40" />
        </div>
      </SkeletonCard>
    </div>
  );
}
