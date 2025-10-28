import { forwardRef, InputHTMLAttributes } from 'react';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Checkbox Component
 *
 * Checkbox input with label and error states.
 * Follows design system patterns for consistent form styling.
 *
 * @example
 * <Checkbox label="I accept the terms and conditions" name="accept" />
 *
 * <Checkbox
 *   label="Subscribe to newsletter"
 *   error="You must subscribe"
 *   required
 * />
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const id = props.id || props.name;
    const hasError = Boolean(error);

    return (
      <div className="space-y-1">
        <div className="flex items-start">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            className={`
              w-4 h-4 mt-0.5
              border-gray-300 rounded
              text-black
              focus:ring-2 focus:ring-black
              disabled:opacity-50 disabled:cursor-not-allowed
              ${hasError ? 'border-red-500' : ''}
              ${className}
            `.trim().replace(/\s+/g, ' ')}
            aria-invalid={hasError}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          />
          <label htmlFor={id} className="ml-2 text-sm text-gray-700">
            {label}
          </label>
        </div>

        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600 ml-6" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
