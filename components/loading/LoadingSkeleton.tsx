interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function LoadingSkeleton({
  width = 'w-full',
  height = 'h-4',
  className = '',
}: LoadingSkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}
      aria-label="Loading"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <LoadingSkeleton width="w-full" height="h-48" />
      <LoadingSkeleton width="w-3/4" height="h-6" />
      <LoadingSkeleton width="w-full" height="h-4" />
      <LoadingSkeleton width="w-1/2" height="h-8" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
