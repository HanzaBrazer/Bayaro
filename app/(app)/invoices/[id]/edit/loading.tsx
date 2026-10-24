import { Skeleton, SkeletonCard } from "@/components/ui";

export default function EditInvoiceLoading() {
  return (
    <div className="space-y-4">
      <div className="lg:grid lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, c) => (
            <SkeletonCard key={c} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </SkeletonCard>
          ))}
        </div>
        <div className="mt-4 hidden lg:mt-0 lg:block">
          <Skeleton className="h-[600px] w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}
