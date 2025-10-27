import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Section } from '@/components/ui/Section';

describe('Section', () => {
  describe('Rendering', () => {
    it('renders with children content', () => {
      render(<Section>Section content</Section>);
      expect(screen.getByText('Section content')).toBeInTheDocument();
    });

    it('renders as section element', () => {
      const { container } = render(<Section>Content</Section>);
      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('SECTION');
    });

    it('renders with light background by default', () => {
      const { container } = render(<Section>Content</Section>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('bg-white', 'text-gray-900');
    });
  });

  describe('Background Variants', () => {
    it('renders light background variant', () => {
      const { container } = render(
        <Section background="light">Light content</Section>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('bg-white', 'text-gray-900');
    });

    it('renders dark background variant', () => {
      const { container } = render(
        <Section background="dark">Dark content</Section>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('bg-black', 'text-white');
    });

    it('renders neutral background variant', () => {
      const { container } = render(
        <Section background="neutral">Neutral content</Section>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('bg-gray-50', 'text-gray-900');
    });
  });

  describe('Spacing', () => {
    it('applies responsive vertical padding', () => {
      const { container } = render(<Section>Content</Section>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('py-8', 'sm:py-12', 'lg:py-16');
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      const { container } = render(
        <Section className="custom-section">Content</Section>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('custom-section');
      expect(element).toHaveClass('bg-white'); // Still has default styles
    });

    it('handles multiple custom classes', () => {
      const { container } = render(
        <Section className="border-t-2 border-gray-200">Content</Section>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('border-t-2', 'border-gray-200');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies data attributes', () => {
      const { container } = render(
        <Section data-testid="hero-section">Content</Section>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('data-testid', 'hero-section');
    });

    it('accepts and applies id attribute', () => {
      const { container } = render(<Section id="features">Content</Section>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('id', 'features');
    });

    it('accepts and applies aria attributes', () => {
      const { container } = render(
        <Section aria-label="Featured products">Content</Section>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('aria-label', 'Featured products');
    });
  });

  describe('Composition', () => {
    it('works with nested components', () => {
      render(
        <Section>
          <h1>Section Title</h1>
          <p>Section description</p>
        </Section>
      );
      expect(screen.getByRole('heading', { name: 'Section Title' })).toBeInTheDocument();
      expect(screen.getByText('Section description')).toBeInTheDocument();
    });

    it('works with Container component', () => {
      render(
        <Section>
          <div className="max-w-7xl mx-auto">
            <p>Contained content</p>
          </div>
        </Section>
      );
      expect(screen.getByText('Contained content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic section element', () => {
      const { container } = render(<Section>Content</Section>);
      const section = container.firstChild as HTMLElement;
      expect(section.tagName).toBe('SECTION');
    });
  });
});
