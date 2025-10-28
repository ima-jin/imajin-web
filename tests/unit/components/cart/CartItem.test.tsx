import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartItem as CartItemComponent } from '@/components/cart/CartItem';
import { mockUIStrings } from '@/tests/helpers/mock-content';
import type { CartItem } from '@/types/cart';

describe('CartItem', () => {
  const mockUpdateQuantity = vi.fn();
  const mockRemoveItem = vi.fn();

  const baseItem: CartItem = {
    productId: 'test-product',
    name: 'Test Product',
    price: 5000, // $50.00
    stripeProductId: 'price_test',
    image: '/test-image.jpg',
    quantity: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product information', () => {
    render(
      <CartItemComponent
        item={baseItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    // Image placeholder is shown until real images are available
    expect(screen.getByText('Image')).toBeInTheDocument();
  });

  it('displays unit price', () => {
    render(
      <CartItemComponent
        item={baseItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('displays line total', () => {
    render(
      <CartItemComponent
        item={baseItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    // 2 x $50.00 = $100.00
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('displays quantity controls', () => {
    render(
      <CartItemComponent
        item={baseItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    const quantityInput = screen.getByRole('spinbutton');
    expect(quantityInput).toHaveValue(2);
  });

  it('increments quantity when plus button clicked', () => {
    render(
      <CartItemComponent
        item={baseItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    const plusButton = screen.getByLabelText(/increase quantity/i);
    fireEvent.click(plusButton);

    expect(mockUpdateQuantity).toHaveBeenCalledWith(baseItem.productId, baseItem.variantId, 3);
  });

  it('decrements quantity when minus button clicked', () => {
    render(
      <CartItemComponent
        item={baseItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    const minusButton = screen.getByLabelText(/decrease quantity/i);
    fireEvent.click(minusButton);

    expect(mockUpdateQuantity).toHaveBeenCalledWith(baseItem.productId, baseItem.variantId, 1);
  });

  it('prevents decrementing below 1', () => {
    const singleItem = { ...baseItem, quantity: 1 };

    render(
      <CartItemComponent
        item={singleItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    const minusButton = screen.getByLabelText(/decrease quantity/i);
    expect(minusButton).toBeDisabled();
  });

  it('updates quantity when input changed', () => {
    render(
      <CartItemComponent
        item={baseItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    const quantityInput = screen.getByRole('spinbutton');
    fireEvent.change(quantityInput, { target: { value: '5' } });

    expect(mockUpdateQuantity).toHaveBeenCalledWith(baseItem.productId, baseItem.variantId, 5);
  });

  it('prevents setting quantity to 0 or negative', () => {
    render(
      <CartItemComponent
        item={baseItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    const quantityInput = screen.getByRole('spinbutton');
    fireEvent.change(quantityInput, { target: { value: '0' } });

    expect(mockUpdateQuantity).not.toHaveBeenCalled();
  });

  it('calls onRemove when remove button clicked', () => {
    render(
      <CartItemComponent
        item={baseItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    const removeButton = screen.getByLabelText(/remove/i);
    fireEvent.click(removeButton);

    expect(mockRemoveItem).toHaveBeenCalledWith(baseItem.productId, baseItem.variantId);
  });

  it('displays variant information when present', () => {
    const variantItem: CartItem = {
      ...baseItem,
      variantId: 'variant-black',
      name: 'Founder Edition - BLACK',
    };

    render(
      <CartItemComponent
        item={variantItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    expect(screen.getByText('Founder Edition - BLACK')).toBeInTheDocument();
  });

  it('displays limited edition badge', () => {
    const limitedItem: CartItem = {
      ...baseItem,
      isLimitedEdition: true,
    };

    render(
      <CartItemComponent
        item={limitedItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    expect(screen.getByText(/limited edition/i)).toBeInTheDocument();
  });

  it('displays voltage indicator when present', () => {
    const voltageItem: CartItem = {
      ...baseItem,
      voltage: '5v',
    };

    render(
      <CartItemComponent
        item={voltageItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    expect(screen.getByText('5v')).toBeInTheDocument();
  });

  it('displays remaining quantity warning for limited editions', () => {
    const limitedItem: CartItem = {
      ...baseItem,
      isLimitedEdition: true,
      remainingQuantity: 5,
    };

    render(
      <CartItemComponent
        item={limitedItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    expect(screen.getByText(/only 5 remaining/i)).toBeInTheDocument();
  });

  it('enforces max quantity for limited editions', () => {
    const limitedItem: CartItem = {
      ...baseItem,
      quantity: 5,
      isLimitedEdition: true,
      remainingQuantity: 5,
    };

    render(
      <CartItemComponent
        item={limitedItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    const plusButton = screen.getByLabelText(/increase quantity/i);
    expect(plusButton).toBeDisabled();
  });

  it('formats large prices correctly', () => {
    const expensiveItem: CartItem = {
      ...baseItem,
      price: 123456, // $1,234.56
      quantity: 1,
    };

    render(
      <CartItemComponent
        item={expensiveItem}
        uiStrings={mockUIStrings}
        onUpdateQuantity={mockUpdateQuantity}
        onRemove={mockRemoveItem}
      />
    );

    // Price appears twice (unit price and line total are same when quantity=1)
    const prices = screen.getAllByText('$1,234.56');
    expect(prices.length).toBeGreaterThanOrEqual(1);
  });
});
