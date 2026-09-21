import { Skeleton } from '../skeleton/Skeleton';

interface ProductCardSkeletonProps {
  count?: number;
}

function SingleSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
      <Skeleton className="aspect-[4/5]" />
      <div className="p-4 sm:p-5 flex flex-col flex-grow space-y-3">
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded hidden sm:block" />
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ count = 6 }: ProductCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SingleSkeleton key={i} />
      ))}
    </>
  );
}
