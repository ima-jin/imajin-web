'use client';

import { useCart } from './CartProvider';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import type { UIStrings } from '@/config/schema/ui-strings-schema';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  uiStrings: UIStrings;
}

export function CartDrawer({ isOpen, onClose, uiStrings }: CartDrawerProps) {
  const { items, itemCount, updateQuantity, removeItem } = useCart();
  const cartStrings = uiStrings.cart;
  const itemCountLabel = itemCount === 1 ? cartStrings.item_count.singular : cartStrings.item_count.plural;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        data-testid="cart-drawer-overlay"
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        data-testid="cart-drawer-content"
        className="fixed right-0 top-0 h-full bg-white shadow-xl z-50 flex flex-col"
        style={{ width: '100%', maxWidth: '28rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Heading level={2} className="text-lg">
            {cartStrings.heading} {itemCount > 0 && `(${itemCount} ${itemCountLabel})`}
          </Heading>
          <button
            type="button"
            onClick={onClose}
            aria-label={uiStrings.aria.close_cart}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
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
              <Text size="lg" className="font-medium mb-2">
                {cartStrings.empty_state.heading}
              </Text>
              <Text size="sm" color="muted">
                {cartStrings.empty_state.message}
              </Text>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.map((item) => (
                <CartItem
                  key={`${item.productId}-${item.variantId || 'default'}`}
                  item={item}
                  uiStrings={uiStrings}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* Footer with Summary and Checkout */}
            <div className="border-t p-4 space-y-4">
              <CartSummary uiStrings={uiStrings} />
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => {
                  onClose(); // Close cart drawer
                  window.location.href = '/checkout'; // Navigate to checkout
                }}
              >
                {cartStrings.actions.checkout}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
