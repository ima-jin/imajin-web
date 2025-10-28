import { forwardRef, InputHTMLAttributes } from 'react';
import { Label } from './Label';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Input Component
 *
 * Text input field with label, error states, and helper text.
 * Follows design system patterns for consistent form styling.
 *
 * @example
 * <Input label="Email" type="email" required />
 *
 * <Input
 *   label="Name"
 *   error="Name is required"
 *   name="name"
 * />
 *
 * <Input
 *   label="Password"
 *   type="password"
 *   helperText="Must be at least 8 characters"
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const id = props.id || props.name;
    const hasError = Boolean(error);

    return (
      <div className="space-y-1">
        {label && <Label htmlFor={id}>{label}</Label>}

        <input
          ref={ref}
          id={id}
          className={`
            w-full px-3 py-2
            border rounded-md
            bg-white
            text-gray-900
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${hasError ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${id}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
