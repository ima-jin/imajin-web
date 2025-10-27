import type { HTMLAttributes, ReactNode } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'default' | 'warning' | 'error' | 'success' | 'limited' | 'voltage' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'default' | 'full';
}

/**
 * Badge Component
 *
 * Display labels, tags, or status indicators with consistent styling.
 * Uses design tokens from globals.css.
 *
 * @example
 * <Badge variant="limited">Limited Edition</Badge>
 * <Badge variant="warning" size="sm">Requires Assembly</Badge>
 * <Badge variant="voltage">24v</Badge>
 * <Badge variant="danger" rounded="full" size="sm">9</Badge>
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  rounded = 'default',
  className = '',
  ...props
}: BadgeProps) {
  // Variant styles
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    success: 'bg-green-100 text-green-700',
    limited: 'bg-purple-100 text-purple-800',
    voltage: 'bg-blue-100 text-blue-800',
    danger: 'bg-red-600 text-white font-bold', // For cart count badge
  };

  // Size styles
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  // Rounded styles
  const roundedClasses = {
    default: 'rounded',
    full: 'rounded-full',
  };

  // Base styles
  const baseClasses = 'inline-flex items-center font-medium';

  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${roundedClasses[rounded]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={combinedClasses} {...props}>
      {children}
    </span>
  );
}
