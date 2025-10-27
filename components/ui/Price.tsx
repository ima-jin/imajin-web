import type { HTMLAttributes } from 'react';
import { formatCurrency } from '@/lib/utils/format';

export interface PriceProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Price in cents */
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Price Component
 *
 * Consistent price formatting across the application.
 * Accepts prices in cents and formats to currency display.
 *
 * @example
 * <Price amount={9999} size="lg" /> // Displays: $99.99
 * <Price amount={12500} size="md" /> // Displays: $125.00
 */
export function Price({
  amount,
  size = 'md',
  className = '',
  ...props
}: PriceProps) {
  // Size-based styles
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  // Base styles
  const baseClasses = 'font-bold text-gray-900';

  const combinedClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={combinedClasses} {...props}>
      {formatCurrency(amount)}
    </span>
  );
}
