import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Price } from '@/components/ui/Price';

describe('Price', () => {
  describe('Rendering', () => {
    it('renders price in correct currency format', () => {
      render(<Price amount={9999} />);
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('renders as span element', () => {
      const { container } = render(<Price amount={5000} />);
      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('SPAN');
    });

    it('formats zero correctly', () => {
      render(<Price amount={0} />);
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('formats large amounts correctly', () => {
      render(<Price amount={123456789} />);
      expect(screen.getByText('$1,234,567.89')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('converts cents to dollars with two decimal places', () => {
      render(<Price amount={1234} />);
      expect(screen.getByText('$12.34')).toBeInTheDocument();
    });

    it('adds comma separators for thousands', () => {
      render(<Price amount={100000} />);
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    });

    it('handles single digit cents', () => {
      render(<Price amount={1005} />);
      expect(screen.getByText('$10.05')).toBeInTheDocument();
    });

    it('handles round dollar amounts', () => {
      render(<Price amount={10000} />);
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { container } = render(<Price amount={5000} size="sm" />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-sm');
    });

    it('renders medium size by default', () => {
      const { container } = render(<Price amount={5000} />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-base');
    });

    it('renders large size', () => {
      const { container } = render(<Price amount={5000} size="lg" />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-xl');
    });

    it('renders extra large size', () => {
      const { container } = render(<Price amount={5000} size="xl" />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-2xl');
    });
  });

  describe('Default Styles', () => {
    it('applies bold font weight', () => {
      const { container } = render(<Price amount={5000} />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('font-bold');
    });

    it('applies dark gray color', () => {
      const { container } = render(<Price amount={5000} />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-gray-900');
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      const { container } = render(
        <Price amount={5000} className="text-red-600" />
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-red-600');
      expect(element).toHaveClass('font-bold'); // Still has default styles
    });

    it('handles multiple custom classes', () => {
      const { container } = render(
        <Price amount={5000} className="underline line-through" />
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('underline', 'line-through');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies data attributes', () => {
      const { container } = render(
        <Price amount={5000} data-testid="product-price" />
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('data-testid', 'product-price');
    });

    it('accepts and applies aria attributes', () => {
      const { container } = render(
        <Price amount={9999} aria-label="Product price: ninety-nine dollars and ninety-nine cents" />
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('aria-label');
    });
  });

  describe('Edge Cases', () => {
    it('handles very small amounts', () => {
      render(<Price amount={1} />);
      expect(screen.getByText('$0.01')).toBeInTheDocument();
    });

    it('handles 99 cents', () => {
      render(<Price amount={99} />);
      expect(screen.getByText('$0.99')).toBeInTheDocument();
    });

    it('handles exact dollar amounts', () => {
      render(<Price amount={25000} />);
      expect(screen.getByText('$250.00')).toBeInTheDocument();
    });

    it('handles negative amounts (returns/refunds)', () => {
      render(<Price amount={-5000} />);
      expect(screen.getByText('-$50.00')).toBeInTheDocument();
    });
  });

  describe('Common Use Cases', () => {
    it('renders typical product price', () => {
      render(<Price amount={12500} size="lg" />);
      expect(screen.getByText('$125.00')).toBeInTheDocument();
    });

    it('renders cart item price', () => {
      render(<Price amount={3500} size="sm" />);
      expect(screen.getByText('$35.00')).toBeInTheDocument();
    });

    it('renders cart total', () => {
      render(<Price amount={47999} size="xl" />);
      expect(screen.getByText('$479.99')).toBeInTheDocument();
    });
  });
});
