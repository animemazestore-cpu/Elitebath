import { Skeleton } from '../skeleton/Skeleton';

interface CategoryCardSkeletonProps {
  count?: number;
}

export function CategoryCardSkeleton({ count = 6 }: CategoryCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200/80 overflow-hidden"
        >
          <Skeleton className="aspect-square" />
          <div className="p-3 sm:p-4">
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}
