import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders as default variant by default', () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700');
    });

    it('renders as medium size by default', () => {
      const { container } = render(<Badge>Medium</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-2', 'py-1', 'text-sm');
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700');
    });

    it('renders warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-amber-100', 'text-amber-700');
    });

    it('renders error variant', () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-red-100', 'text-red-700');
    });

    it('renders success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('renders limited variant', () => {
      const { container } = render(<Badge variant="limited">Limited</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('renders voltage variant', () => {
      const { container } = render(<Badge variant="voltage">Voltage</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('renders danger variant (for cart count)', () => {
      const { container } = render(<Badge variant="danger">9</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-red-600', 'text-white');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('renders medium size', () => {
      const { container } = render(<Badge size="md">Medium</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-2', 'py-1', 'text-sm');
    });

    it('renders large size', () => {
      const { container } = render(<Badge size="lg">Large</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-3', 'py-1', 'text-base');
    });
  });

  describe('Rounded variants', () => {
    it('renders with default border radius', () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('rounded');
    });

    it('renders with full border radius when rounded="full"', () => {
      const { container } = render(<Badge rounded="full">Full</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('rounded-full');
    });

    it('renders with default border radius when rounded="default"', () => {
      const { container } = render(<Badge rounded="default">Default</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('rounded');
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      const { container } = render(<Badge className="custom-class">Custom</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('bg-gray-100'); // Still has default styles
    });
  });

  describe('Accessibility', () => {
    it('renders as span element by default', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.tagName).toBe('SPAN');
    });

    it('applies aria-label when provided', () => {
      render(<Badge aria-label="Category badge">Cat</Badge>);
      expect(screen.getByLabelText('Category badge')).toBeInTheDocument();
    });
  });
});
