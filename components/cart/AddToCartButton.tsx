'use client';

import { useState } from 'react';
import { useCart } from './CartProvider';
import type { CartItem } from '@/types/cart';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = async () => {
    if (isLoading || showSuccess) return;

    setIsLoading(true);

    try {
      await addItem({ ...product, quantity });

      setIsLoading(false);
      setShowSuccess(true);

      // Reset success state after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading || showSuccess}
      className={`
        ${sizeClasses[size]}
        bg-blue-600 text-white font-medium rounded-lg
        hover:bg-blue-700 transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
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
      ) : isLoading ? (
        <span>Adding...</span>
      ) : (
        buttonText
      )}
    </button>
  );
}
