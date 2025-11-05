'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/toast/ToastProvider';
import { formatCurrency } from '@/lib/utils/format';
import { logger } from '@/lib/utils/logger';
import { DepositCheckoutSchema } from '@/lib/validation/deposit-schemas';

interface DepositButtonProps {
  productId: string;
  variantId?: string;
  depositAmount: number; // Amount in cents (per unit)
  quantity: number; // Number of units
  productName: string;
}

/**
 * Button to initiate pre-sale deposit payment
 *
 * Flow:
 * 1. User clicks "Pay Deposit" button
 * 2. Email input form appears (or use session email if logged in)
 * 3. POST /api/checkout/deposit with { productId, variantId?, email }
 * 4. API returns Stripe Checkout URL
 * 5. Redirect to Stripe Checkout
 */
export function DepositButton({
  productId,
  variantId,
  depositAmount,
  quantity,
  productName,
}: DepositButtonProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useToast();

  // Calculate total deposit amount
  const totalDepositAmount = depositAmount * quantity;

  const handleInitialClick = () => {
    setShowEmailForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = DepositCheckoutSchema.safeParse({
      productId,
      variantId,
      email,
      quantity,
    });

    if (!validation.success) {
      const emailError = validation.error.issues.find((err) =>
        err.path.some((p) => p === 'email')
      );
      showError(emailError?.message || 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/checkout/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Failed to process deposit checkout';

        logger.error('Deposit checkout failed', undefined, {
          productId,
          variantId,
          status: response.status,
          error: errorMessage,
        });

        showError(`Unable to start checkout: ${errorMessage}`);
        return;
      }

      const result = await response.json();
      const data = result.data || result; // Handle both wrapped and unwrapped responses

      if (!data.url) {
        logger.error('Invalid checkout response', undefined, {
          productId,
          variantId,
          response: result,
        });
        showError('Unable to start checkout. Please try again.');
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      logger.error('Deposit checkout exception', error as Error, {
        productId,
        variantId,
        email: email.replace(/^(.{3}).*(@.*)$/, '$1***$2'), // Mask email in logs
      });

      showError('Failed to process your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showEmailForm) {
    return (
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Secure your spot with a deposit</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalDepositAmount)}
          </p>
          {quantity > 1 && (
            <p className="text-xs text-gray-500">
              {formatCurrency(depositAmount)} × {quantity} {quantity === 1 ? 'unit' : 'units'}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">{productName}</p>
        </div>
        <Button
          onClick={handleInitialClick}
          variant="primary"
          size="lg"
          fullWidth
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          Pay Deposit
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-1">Deposit Amount</p>
        <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalDepositAmount)}</p>
        {quantity > 1 && (
          <p className="text-xs text-blue-700">
            {formatCurrency(depositAmount)} × {quantity} {quantity === 1 ? 'unit' : 'units'}
          </p>
        )}
        <p className="text-xs text-blue-700 mt-1">{productName}</p>
      </div>

      <div>
        <Label htmlFor="deposit-email">
          Email Address
        </Label>
        <Input
          id="deposit-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={isLoading}
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          We&apos;ll send your receipt and deposit confirmation to this email
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => setShowEmailForm(false)}
          variant="secondary"
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          loadingText="Processing..."
          disabled={isLoading || !email}
          className="flex-1"
        >
          Continue to Payment
        </Button>
      </div>
    </form>
  );
}
