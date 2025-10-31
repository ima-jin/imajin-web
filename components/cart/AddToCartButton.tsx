'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart } from './CartProvider';
import { useToast } from '@/components/toast/ToastProvider';
import { Button } from '@/components/ui/Button';
import type { CartItem } from '@/types/cart';
import { logger } from '@/lib/utils/logger';

interface AddToCartButtonProps {
  product: Omit<CartItem, 'quantity'>;
  quantity?: number;
  buttonText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AddToCartButton({
  product,
  quantity = 1,
  buttonText = 'Add to Cart',
  size = 'md',
  className = '',
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { showSuccess: showToastSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = async () => {
    if (isLoading || showSuccess) return;

    setIsLoading(true);

    try {
      await addItem({ ...product, quantity });

      setIsLoading(false);
      setShowSuccess(true);

      // Show success toast
      showToastSuccess(`${product.name} added to cart`);

      // Reset success state after 2 seconds
      timeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      logger.error('Failed to add item to cart', error as Error, { productId: product.productId, variantId: product.variantId });
      setIsLoading(false);

      // Show error toast
      showError('Failed to add item to cart. Please try again.');
    }
  };

  return (
    <Button
      variant="primary"
      size={size}
      onClick={handleClick}
      disabled={showSuccess}
      loading={isLoading}
      loadingText="Adding..."
      className={className}
    >
      {showSuccess ? (
        <span className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Added!
        </span>
      ) : (
        buttonText
      )}
    </Button>
  );
}
