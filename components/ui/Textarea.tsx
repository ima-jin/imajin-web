import { forwardRef, TextareaHTMLAttributes, useState } from 'react';
import { Label } from './Label';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharacterCount?: boolean;
}

/**
 * Textarea Component
 *
 * Multi-line text input with label, error states, helper text, and character count.
 * Follows design system patterns for consistent form styling.
 *
 * @example
 * <Textarea
 *   label="Message"
 *   placeholder="Enter your message"
 *   rows={4}
 * />
 *
 * <Textarea
 *   label="Bio"
 *   maxLength={500}
 *   showCharacterCount
 *   helperText="Tell us about yourself"
 * />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCharacterCount,
      maxLength,
      className = '',
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(0);
    const id = props.id || props.name;
    const hasError = Boolean(error);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="space-y-1">
        {label && <Label htmlFor={id}>{label}</Label>}

        <textarea
          ref={ref}
          id={id}
          maxLength={maxLength}
          className={`
            w-full px-3 py-2
            border rounded-md
            bg-white
            text-gray-900
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            resize-y
            ${hasError ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          onChange={handleChange}
          {...props}
        />

        <div className="flex justify-between items-start">
          <div className="flex-1">
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

          {showCharacterCount && maxLength && (
            <p className="text-sm text-gray-500">
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
