import { forwardRef, SelectHTMLAttributes } from 'react';
import { Label } from './Label';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

/**
 * Select Component
 *
 * Dropdown select with label, error states, and helper text.
 * Follows design system patterns for consistent form styling.
 *
 * @example
 * <Select
 *   label="Country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'ca', label: 'Canada' }
 *   ]}
 *   placeholder="Select country"
 * />
 *
 * <Select
 *   label="State"
 *   error="State is required"
 *   options={stateOptions}
 * />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', ...props }, ref) => {
    const id = props.id || props.name;
    const hasError = Boolean(error);

    return (
      <div className="space-y-1">
        {label && <Label htmlFor={id}>{label}</Label>}

        <select
          ref={ref}
          id={id}
          className={`
            w-full px-3 py-2
            border rounded-md
            bg-white
            text-gray-900
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
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

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

Select.displayName = 'Select';
