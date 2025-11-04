'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/ToastProvider';

interface DepositRefundButtonProps {
  productId: string;
  orderId: string;
}

/**
 * DepositRefundButton Component
 *
 * Displays a button to request a deposit refund.
 * Shown on product pages when user arrives via email link with orderId.
 *
 * Flow:
 * 1. User receives email: "Click here to view your deposit or request refund"
 * 2. Email link: /products/{productId}?orderId={orderId}
 * 3. This component appears if orderId is present
 * 4. User clicks "Request Refund"
 * 5. Component prompts for email verification
 * 6. Calls POST /api/orders/refund-deposit with { email, productId, orderId }
 * 7. Shows success/error toast
 */
export function DepositRefundButton({ productId, orderId }: DepositRefundButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const { showToast } = useToast();

  const handleRequestRefund = () => {
    setShowEmailInput(true);
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast('error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/orders/refund-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          productId,
          reason: `Refund requested via product page (Order ID: ${orderId})`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to process refund');
      }

      showToast(
        'success',
        data.data?.message || 'Refund processed successfully. You will receive your refund in 5-10 business days.'
      );

      // Hide the refund UI after successful refund
      setShowEmailInput(false);
      setEmail('');
    } catch (error) {
      showToast(
        'error',
        error instanceof Error ? error.message : 'Failed to process refund. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!showEmailInput) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">Deposit Refund Available</h3>
            <p className="mt-1 text-sm text-blue-700">
              You have a refundable deposit for this product. Click below to request a full refund.
            </p>
            <div className="mt-3">
              <Button
                onClick={handleRequestRefund}
                variant="secondary"
                size="sm"
              >
                Request Refund
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <form onSubmit={handleSubmitRefund} className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-blue-900 mb-2">Confirm Refund Request</h3>
          <p className="text-sm text-blue-700 mb-3">
            Please enter your email address to confirm this refund request.
          </p>
          <label htmlFor="refund-email" className="sr-only">
            Email address
          </label>
          <input
            type="email"
            id="refund-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="danger"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm Refund'}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setShowEmailInput(false);
              setEmail('');
            }}
            variant="secondary"
            size="sm"
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
