/**
 * ProductSkeleton Component
 *
 * Loading skeleton for product cards
 */

export default function ProductSkeleton() {
  return (
    <div
      className="border rounded-lg overflow-hidden animate-pulse"
      role="status"
      aria-label="Loading product"
    >
      {/* Image skeleton */}
      <div className="w-full h-64 bg-gray-200" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded w-3/4" />

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>

        {/* Price */}
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}
