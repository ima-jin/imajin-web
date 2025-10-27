import { Badge } from '@/components/ui/Badge';

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
      <Badge variant="error" rounded="full">
        <span className="mr-1">🔴</span>
        Sold Out
      </Badge>
    );
  }

  // Low stock warning (less than 10% remaining)
  const isLowStock = maxQuantity > 0 && availableQuantity / maxQuantity < 0.1;

  return (
    <Badge
      variant={isLowStock ? "warning" : "limited"}
      rounded="full"
    >
      <span className="mr-1">⭐</span>
      Limited Edition • {availableQuantity} remaining
    </Badge>
  );
}
