import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartButton } from '@/components/cart/CartButton';

// Mock useCart hook
const mockUseCart = vi.fn();
vi.mock('@/components/cart/CartProvider', async () => {
  const actual = await vi.importActual('@/components/cart/CartProvider');
  return {
    ...actual,
    useCart: () => mockUseCart(),
  };
});

describe('CartButton', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cart icon', () => {
    mockUseCart.mockReturnValue({
      itemCount: 0,
    });

    render(<CartButton onClick={mockOnClick} />);

    // Should have a button with aria-label for accessibility
    const button = screen.getByRole('button', { name: /cart/i });
    expect(button).toBeInTheDocument();
  });

  it('displays item count badge when cart has items', () => {
    mockUseCart.mockReturnValue({
      itemCount: 3,
    });

    render(<CartButton onClick={mockOnClick} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not display badge when cart is empty', () => {
    mockUseCart.mockReturnValue({
      itemCount: 0,
    });

    render(<CartButton onClick={mockOnClick} />);

    // Badge should not be rendered
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    mockUseCart.mockReturnValue({
      itemCount: 2,
    });

    render(<CartButton onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: /cart/i });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('displays correct count for 1 item', () => {
    mockUseCart.mockReturnValue({
      itemCount: 1,
    });

    render(<CartButton onClick={mockOnClick} />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays correct count for many items', () => {
    mockUseCart.mockReturnValue({
      itemCount: 99,
    });

    render(<CartButton onClick={mockOnClick} />);

    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('displays 99+ for counts over 99', () => {
    mockUseCart.mockReturnValue({
      itemCount: 150,
    });

    render(<CartButton onClick={mockOnClick} />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('has accessible button label', () => {
    mockUseCart.mockReturnValue({
      itemCount: 5,
    });

    render(<CartButton onClick={mockOnClick} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });

  it('renders as a button element', () => {
    mockUseCart.mockReturnValue({
      itemCount: 0,
    });

    render(<CartButton onClick={mockOnClick} />);

    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
  });
});
