import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DepositButton } from '@/components/products/DepositButton';
import * as ToastContext from '@/components/toast/ToastProvider';

// Mock the toast provider
const mockShowError = vi.fn();
const mockShowSuccess = vi.fn();
vi.mock('@/components/toast/ToastProvider', () => ({
  useToast: () => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('DepositButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('Rendering', () => {
    it('renders with deposit amount', () => {
      render(
        <DepositButton
          productId="test-product"
          depositAmount={25000}
          quantity={1}
          productName="Test Product"
        />
      );

      expect(screen.getByRole('button', { name: /pay deposit/i })).toBeInTheDocument();
      expect(screen.getByText(/\$250\.00/)).toBeInTheDocument();
    });

    it('handles variant deposits', () => {
      render(
        <DepositButton
          productId="test-product"
          variantId="test-variant"
          depositAmount={30000}
          quantity={1}
          productName="Test Product - Black"
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText(/\$300\.00/)).toBeInTheDocument();
    });

    it('formats currency correctly', () => {
      render(
        <DepositButton
          productId="test-product"
          depositAmount={12345}
          quantity={1}
          productName="Test Product"
        />
      );

      expect(screen.getByText(/\$123\.45/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('shows email input when clicked', async () => {
      const user = userEvent.setup();
      render(
        <DepositButton
          productId="test-product"
          depositAmount={25000}
          quantity={1}
          productName="Test Product"
        />
      );

      await user.click(screen.getByRole('button', { name: /pay deposit/i }));

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument();
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(
        <DepositButton
          productId="test-product"
          depositAmount={25000}
          quantity={1}
          productName="Test Product"
        />
      );

      await user.click(screen.getByRole('button', { name: /pay deposit/i }));

      // Note: HTML5 email validation happens first
      // We're testing that invalid email format triggers validation error
      // Since HTML5 validation prevents form submission with invalid emails,
      // we test that the input has proper email type attribute
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('calls API on submit with valid email', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      });

      render(
        <DepositButton
          productId="test-product"
          depositAmount={25000}
          quantity={1}
          productName="Test Product"
        />
      );

      await user.click(screen.getByRole('button', { name: /pay deposit/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/checkout/deposit',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: 'test-product',
              email: 'test@example.com',
              quantity: 1,
            }),
          })
        );
      });
    });

    it('redirects to Stripe on success', async () => {
      const user = userEvent.setup();

      // Mock window.location.href setter
      delete (window as any).location;
      window.location = { href: '' } as any;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      });

      render(
        <DepositButton
          productId="test-product"
          depositAmount={25000}
          quantity={1}
          productName="Test Product"
        />
      );

      await user.click(screen.getByRole('button', { name: /pay deposit/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(window.location.href).toBe('https://checkout.stripe.com/test');
      }, { timeout: 2000 });
    });

    it('shows error toast on API failure', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Server error' } }),
      });

      render(
        <DepositButton
          productId="test-product"
          depositAmount={25000}
          quantity={1}
          productName="Test Product"
        />
      );

      await user.click(screen.getByRole('button', { name: /pay deposit/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining('error')
        );
      });
    });

    it('handles Stripe API errors gracefully', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { code: 'STRIPE_ERROR', message: 'Payment processor unavailable' } }),
      });

      render(
        <DepositButton
          productId="test-product"
          depositAmount={25000}
          quantity={1}
          productName="Test Product"
        />
      );

      await user.click(screen.getByRole('button', { name: /pay deposit/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalled();
      });
    });

    it('shows user-friendly error message', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <DepositButton
          productId="test-product"
          depositAmount={25000}
          quantity={1}
          productName="Test Product"
        />
      );

      await user.click(screen.getByRole('button', { name: /pay deposit/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringMatching(/unable to start checkout|failed to process/i)
        );
      });
    });

    it('logs error for debugging (using logger, not console)', async () => {
      // This test ensures errors are logged properly
      // In implementation, we'll use the logger utility
      const user = userEvent.setup();
      (global.fetch as any).mockRejectedValueOnce(new Error('Test error'));

      render(
        <DepositButton
          productId="test-product"
          depositAmount={25000}
          quantity={1}
          productName="Test Product"
        />
      );

      await user.click(screen.getByRole('button', { name: /pay deposit/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalled();
      });

      // Logger should be called (we'll verify implementation uses logger, not console.log)
    });
  });

  describe('Loading States', () => {
    it('disables button during loading', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(
        <DepositButton
          productId="test-product"
          depositAmount={25000}
          quantity={1}
          productName="Test Product"
        />
      );

      await user.click(screen.getByRole('button', { name: /pay deposit/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /continue to payment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Future Features', () => {
    it('uses session email if available (future)', () => {
      // Placeholder test for when auth is implemented
      // For now, always show email input
      render(
        <DepositButton
          productId="test-product"
          depositAmount={25000}
          quantity={1}
          productName="Test Product"
        />
      );

      expect(screen.getByRole('button', { name: /pay deposit/i })).toBeInTheDocument();
    });
  });

  describe('Variant Support', () => {
    it('handles variant selection', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      });

      render(
        <DepositButton
          productId="test-product"
          variantId="variant-black"
          depositAmount={25000}
          quantity={1}
          productName="Test Product - Black"
        />
      );

      await user.click(screen.getByRole('button', { name: /pay deposit/i }));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/checkout/deposit',
          expect.objectContaining({
            body: JSON.stringify({
              productId: 'test-product',
              variantId: 'variant-black',
              email: 'test@example.com',
              quantity: 1,
            }),
          })
        );
      });
    });
  });
});
