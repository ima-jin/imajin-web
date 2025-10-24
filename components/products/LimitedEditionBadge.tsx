interface LimitedEditionBadgeProps {
  availableQuantity: number | null;
  maxQuantity: number | null;
  isAvailable: boolean | null;
}

/**
 * LimitedEditionBadge Component
 *
 * Displays limited edition status and availability
 * - Shows remaining quantity when low stock
 * - Shows "Sold Out" when unavailable
 * - Only displays when product has quantity limits
 */
export function LimitedEditionBadge({
  availableQuantity,
  maxQuantity,
  isAvailable,
}: LimitedEditionBadgeProps) {
  // Don't show badge for unlimited quantities
  if (maxQuantity === null || availableQuantity === null) {
    return null;
  }

  // Sold out state
  if (isAvailable === false || availableQuantity === 0) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
        <span className="mr-1">🔴</span>
        Sold Out
      </div>
    );
  }

  // Low stock warning (less than 10% remaining)
  const isLowStock = maxQuantity > 0 && availableQuantity / maxQuantity < 0.1;

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isLowStock
          ? "bg-amber-100 text-amber-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      <span className="mr-1">⭐</span>
      Limited Edition • {availableQuantity} remaining
    </div>
  );
}
