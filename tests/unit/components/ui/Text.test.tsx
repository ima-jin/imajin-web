import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from '@/components/ui/Text';

describe('Text', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Text>Test Text</Text>);
      expect(screen.getByText('Test Text')).toBeInTheDocument();
    });

    it('renders as p element by default', () => {
      const { container } = render(<Text>Paragraph</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('P');
    });

    it('renders as body size by default', () => {
      const { container } = render(<Text>Body</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-base');
    });

    it('renders with primary color by default', () => {
      const { container } = render(<Text>Primary</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-gray-900');
    });
  });

  describe('Sizes', () => {
    it('renders large size', () => {
      const { container } = render(<Text size="lg">Large</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-lg');
    });

    it('renders body size', () => {
      const { container } = render(<Text size="body">Body</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-base');
    });

    it('renders small size', () => {
      const { container } = render(<Text size="sm">Small</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-sm');
    });

    it('renders caption size', () => {
      const { container } = render(<Text size="caption">Caption</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-xs');
    });
  });

  describe('Color variants', () => {
    it('renders with primary color', () => {
      const { container } = render(<Text color="primary">Primary</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-gray-900');
    });

    it('renders with secondary color', () => {
      const { container } = render(<Text color="secondary">Secondary</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-gray-600');
    });

    it('renders with muted color', () => {
      const { container } = render(<Text color="muted">Muted</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-gray-500');
    });

    it('renders with inverse color', () => {
      const { container } = render(<Text color="inverse">Inverse</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-white');
    });
  });

  describe('As prop', () => {
    it('renders as p by default', () => {
      const { container } = render(<Text>Paragraph</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('P');
    });

    it('renders as span when as="span"', () => {
      const { container } = render(<Text as="span">Span</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('SPAN');
    });

    it('renders as div when as="div"', () => {
      const { container } = render(<Text as="div">Div</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('DIV');
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      const { container } = render(<Text className="custom-class">Custom</Text>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('custom-class');
      expect(element).toHaveClass('text-gray-900'); // Still has default styles
    });
  });
});
