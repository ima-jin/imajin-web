import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from '@/components/ui/Container';

describe('Container', () => {
  describe('Rendering', () => {
    it('renders with children content', () => {
      render(<Container>Container content</Container>);
      expect(screen.getByText('Container content')).toBeInTheDocument();
    });

    it('renders as div element', () => {
      const { container } = render(<Container>Content</Container>);
      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe('DIV');
    });
  });

  describe('Default Styles', () => {
    it('applies max-width constraint', () => {
      const { container } = render(<Container>Content</Container>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('max-w-7xl');
    });

    it('applies horizontal centering', () => {
      const { container } = render(<Container>Content</Container>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('mx-auto');
    });

    it('applies responsive horizontal padding', () => {
      const { container } = render(<Container>Content</Container>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      const { container } = render(
        <Container className="custom-class">Content</Container>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('custom-class');
      expect(element).toHaveClass('max-w-7xl'); // Still has default styles
    });

    it('handles multiple custom classes', () => {
      const { container } = render(
        <Container className="py-8 bg-gray-100">Content</Container>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('py-8', 'bg-gray-100');
    });
  });

  describe('HTML Attributes', () => {
    it('accepts and applies data attributes', () => {
      const { container } = render(
        <Container data-testid="custom-container">Content</Container>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('data-testid', 'custom-container');
    });

    it('accepts and applies id attribute', () => {
      const { container } = render(<Container id="main-container">Content</Container>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('id', 'main-container');
    });
  });

  describe('Composition', () => {
    it('works with nested components', () => {
      render(
        <Container>
          <h1>Title</h1>
          <p>Paragraph</p>
        </Container>
      );
      expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
    });

    it('works with multiple children', () => {
      render(
        <Container>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </Container>
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });
});
