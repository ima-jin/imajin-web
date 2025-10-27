import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heading } from '@/components/ui/Heading';

describe('Heading', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Heading>Test Heading</Heading>);
      expect(screen.getByText('Test Heading')).toBeInTheDocument();
    });

    it('renders as h2 by default', () => {
      render(<Heading>Default</Heading>);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Levels', () => {
    it('renders h1 when level is 1', () => {
      render(<Heading level={1}>H1</Heading>);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-3xl', 'sm:text-4xl', 'font-bold');
    });

    it('renders h2 when level is 2', () => {
      render(<Heading level={2}>H2</Heading>);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-2xl', 'sm:text-3xl', 'font-bold');
    });

    it('renders h3 when level is 3', () => {
      render(<Heading level={3}>H3</Heading>);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-xl', 'font-semibold');
    });

    it('renders h4 when level is 4', () => {
      render(<Heading level={4}>H4</Heading>);
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-lg', 'font-semibold');
    });

    it('renders h5 when level is 5', () => {
      render(<Heading level={5}>H5</Heading>);
      const heading = screen.getByRole('heading', { level: 5 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-base', 'font-medium');
    });

    it('renders h6 when level is 6', () => {
      render(<Heading level={6}>H6</Heading>);
      const heading = screen.getByRole('heading', { level: 6 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-sm', 'font-medium');
    });
  });

  describe('Color variants', () => {
    it('renders with primary color by default', () => {
      const { container } = render(<Heading>Primary</Heading>);
      const heading = container.firstChild as HTMLElement;
      expect(heading).toHaveClass('text-gray-900');
    });

    it('renders with secondary color', () => {
      const { container } = render(<Heading color="secondary">Secondary</Heading>);
      const heading = container.firstChild as HTMLElement;
      expect(heading).toHaveClass('text-gray-600');
    });

    it('renders with muted color', () => {
      const { container } = render(<Heading color="muted">Muted</Heading>);
      const heading = container.firstChild as HTMLElement;
      expect(heading).toHaveClass('text-gray-500');
    });

    it('renders with inverse color', () => {
      const { container } = render(<Heading color="inverse">Inverse</Heading>);
      const heading = container.firstChild as HTMLElement;
      expect(heading).toHaveClass('text-white');
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      const { container } = render(<Heading className="custom-class">Custom</Heading>);
      const heading = container.firstChild as HTMLElement;
      expect(heading).toHaveClass('custom-class');
      expect(heading).toHaveClass('text-gray-900'); // Still has default styles
    });
  });

  describe('Accessibility', () => {
    it('has proper role', () => {
      render(<Heading>Heading</Heading>);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });
});
