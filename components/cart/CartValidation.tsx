'use client';

import type { CartValidationError, CartWarning } from '@/types/cart';

interface CartValidationProps {
  errors: CartValidationError[];
  warnings: CartWarning[];
}

export function CartValidation({ errors, warnings }: CartValidationProps) {
  // Don't render anything if no errors or warnings
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Errors - Red/Error styling */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div
              key={`error-${index}`}
              className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800"
            >
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-medium">{error.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings - Yellow/Warning styling */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <div
              key={`warning-${index}`}
              className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800"
            >
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <p>{warning.message}</p>
                  {warning.suggestedProductId && (
                    <p className="text-xs text-amber-600 mt-1">
                      Suggested: {warning.suggestedProductId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
