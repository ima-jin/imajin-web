'use client';

import { useCart } from './CartProvider';
import { Badge } from '@/components/ui/Badge';

interface CartButtonProps {
  onClick: () => void;
}

export function CartButton({ onClick }: CartButtonProps) {
  const { itemCount } = useCart();

  // Display "99+" for counts over 99
  const displayCount = itemCount > 99 ? '99+' : itemCount.toString();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Shopping cart with ${itemCount} items`}
      className="relative p-2 text-gray-700 hover:text-gray-900"
    >
      {/* Shopping Cart Icon */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>

      {/* Item Count Badge */}
      {itemCount > 0 && (
        <Badge
          variant="danger"
          size="sm"
          rounded="full"
          className="absolute -top-1 -right-1 min-w-[1.25rem] h-5"
        >
          {displayCount}
        </Badge>
      )}
    </button>
  );
}
