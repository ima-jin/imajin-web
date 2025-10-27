import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'link' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

/**
 * Button Component
 *
 * Reusable button with multiple variants, sizes, and states.
 * Uses design tokens from globals.css for consistent styling.
 *
 * @example
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Submit
 * </Button>
 *
 * <Button variant="secondary" size="sm" disabled>
 *   Cancel
 * </Button>
 *
 * <Button variant="danger" loading loadingText="Deleting...">
 *   Delete
 * </Button>
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  fullWidth = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Variant styles
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border-2 border-transparent',
    secondary: 'bg-white text-black border-2 border-black hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border-2 border-transparent',
    link: 'bg-transparent text-blue-600 hover:text-blue-700 hover:underline border-2 border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-2 border-transparent',
  };

  // Size styles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-3 text-xl',
  };

  // Base styles
  const baseClasses =
    'font-medium rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';

  // Disabled/loading styles
  const disabledClasses = isDisabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  // Full width
  const widthClass = fullWidth ? 'w-full' : '';

  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${widthClass}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={combinedClasses}
      {...props}
    >
      {loading ? loadingText : children}
    </button>
  );
}
