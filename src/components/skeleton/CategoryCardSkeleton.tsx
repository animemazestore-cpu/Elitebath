import { Skeleton } from './Skeleton';

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer">
      {/* Image */}
      <Skeleton className="w-full aspect-[4/3]" />
      
      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <Skeleton className="h-6 w-3/4 rounded mx-auto" />
      </div>
    </div>
  );
}
