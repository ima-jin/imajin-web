import type { LabelHTMLAttributes } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

/**
 * Label Component
 *
 * Form label with optional required indicator.
 * Follows design system patterns for consistent form styling.
 *
 * @example
 * <Label htmlFor="email">Email</Label>
 *
 * <Label htmlFor="name" required>Name</Label>
 */
export function Label({ required, className = '', children, ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-gray-700 ${className}`.trim()}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
    </label>
  );
}
