import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartValidation } from '@/components/cart/CartValidation';
import type { CartValidationError, CartWarning } from '@/types/cart';

describe('CartValidation', () => {
  it('renders nothing when no errors or warnings', () => {
    const { container } = render(
      <CartValidation errors={[]} warnings={[]} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('displays validation errors prominently', () => {
    const errors: CartValidationError[] = [
      {
        productId: 'product-1',
        type: 'unavailable',
        message: 'Product A is no longer available',
      },
      {
        productId: 'product-2',
        variantId: 'variant-1',
        type: 'out_of_stock',
        message: 'Product B variant is sold out',
      },
    ];

    render(<CartValidation errors={errors} warnings={[]} />);

    expect(screen.getByText(/Product A is no longer available/i)).toBeInTheDocument();
    expect(screen.getByText(/Product B variant is sold out/i)).toBeInTheDocument();
  });

  it('displays voltage mismatch error', () => {
    const errors: CartValidationError[] = [
      {
        productId: '',
        type: 'voltage_mismatch',
        message: 'Cannot mix 5v and 24v components in the same order',
      },
    ];

    render(<CartValidation errors={errors} warnings={[]} />);

    expect(screen.getByText(/Cannot mix 5v and 24v/i)).toBeInTheDocument();
  });

  it('displays warnings less prominently than errors', () => {
    const warnings: CartWarning[] = [
      {
        type: 'low_stock',
        message: 'Only 5 units remaining',
      },
      {
        type: 'missing_component',
        message: 'Panels require spine connectors',
        suggestedProductId: 'spine-connector',
      },
    ];

    render(<CartValidation errors={[]} warnings={warnings} />);

    expect(screen.getByText(/Only 5 units remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/Panels require spine connectors/i)).toBeInTheDocument();
  });

  it('displays suggested products in warnings', () => {
    const warnings: CartWarning[] = [
      {
        type: 'suggested_product',
        message: 'Consider adding diffusion caps for better light quality',
        suggestedProductId: 'diffusion-cap-round',
      },
    ];

    render(<CartValidation errors={[]} warnings={warnings} />);

    expect(screen.getByText(/Consider adding diffusion caps/i)).toBeInTheDocument();
  });

  it('displays both errors and warnings', () => {
    const errors: CartValidationError[] = [
      {
        productId: 'product-1',
        type: 'unavailable',
        message: 'Product is unavailable',
      },
    ];

    const warnings: CartWarning[] = [
      {
        type: 'low_stock',
        message: 'Low stock warning',
      },
    ];

    render(<CartValidation errors={errors} warnings={warnings} />);

    expect(screen.getByText(/Product is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Low stock warning/i)).toBeInTheDocument();
  });

  it('displays multiple errors of same type', () => {
    const errors: CartValidationError[] = [
      {
        productId: 'product-1',
        type: 'unavailable',
        message: 'Product A is unavailable',
      },
      {
        productId: 'product-2',
        type: 'unavailable',
        message: 'Product B is unavailable',
      },
      {
        productId: 'product-3',
        type: 'unavailable',
        message: 'Product C is unavailable',
      },
    ];

    render(<CartValidation errors={errors} warnings={[]} />);

    expect(screen.getByText(/Product A is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Product B is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Product C is unavailable/i)).toBeInTheDocument();
  });

  it('uses error styling for errors', () => {
    const errors: CartValidationError[] = [
      {
        productId: 'product-1',
        type: 'unavailable',
        message: 'Test error message',
      },
    ];

    const { container } = render(<CartValidation errors={errors} warnings={[]} />);

    // Should have red/error styling
    const errorElement = container.querySelector('[class*="red"], [class*="error"]');
    expect(errorElement).not.toBeNull();
  });

  it('uses warning styling for warnings', () => {
    const warnings: CartWarning[] = [
      {
        type: 'low_stock',
        message: 'Test warning message',
      },
    ];

    const { container } = render(<CartValidation errors={[]} warnings={warnings} />);

    // Should have yellow/warning styling
    const warningElement = container.querySelector('[class*="yellow"], [class*="warning"], [class*="amber"]');
    expect(warningElement).not.toBeNull();
  });
});
