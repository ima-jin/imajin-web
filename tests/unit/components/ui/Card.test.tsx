import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card', () => {
  describe('Card Component', () => {
    it('renders children correctly', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies default card styles', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border', 'border-gray-200', 'rounded-lg', 'bg-white');
    });

    it('applies hover effect when hover prop is true', () => {
      const { container } = render(<Card hover>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
    });

    it('does not apply hover effect by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('hover:shadow-lg');
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('border'); // Still has default styles
    });

    it('renders with padding by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4');
    });

    it('renders without padding when noPadding is true', () => {
      const { container } = render(<Card noPadding>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('p-4');
    });
  });

  describe('CardHeader Component', () => {
    it('renders children correctly', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('applies default header styles', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('px-4', 'py-3', 'border-b', 'border-gray-200');
    });

    it('applies custom className', () => {
      const { container } = render(<CardHeader className="custom-header">Header</CardHeader>);
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('border-b'); // Still has default styles
    });
  });

  describe('CardContent Component', () => {
    it('renders children correctly', () => {
      render(<CardContent>Content text</CardContent>);
      expect(screen.getByText('Content text')).toBeInTheDocument();
    });

    it('applies default content styles', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('px-4', 'py-4');
    });

    it('applies custom className', () => {
      const { container } = render(<CardContent className="custom-content">Content</CardContent>);
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('custom-content');
      expect(content).toHaveClass('px-4'); // Still has default styles
    });
  });

  describe('CardFooter Component', () => {
    it('renders children correctly', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('applies default footer styles', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('px-4', 'py-3', 'border-t', 'border-gray-200');
    });

    it('applies custom className', () => {
      const { container } = render(<CardFooter className="custom-footer">Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('custom-footer');
      expect(footer).toHaveClass('border-t'); // Still has default styles
    });
  });

  describe('Card Composition', () => {
    it('renders all sub-components together correctly', () => {
      render(
        <Card>
          <CardHeader>Title</CardHeader>
          <CardContent>Body text</CardContent>
          <CardFooter>Footer text</CardFooter>
        </Card>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Body text')).toBeInTheDocument();
      expect(screen.getByText('Footer text')).toBeInTheDocument();
    });

    it('works with only header and content', () => {
      render(
        <Card>
          <CardHeader>Title</CardHeader>
          <CardContent>Body text</CardContent>
        </Card>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Body text')).toBeInTheDocument();
    });

    it('works with noPadding and individual padding on sub-components', () => {
      const { container } = render(
        <Card noPadding>
          <CardHeader>Header</CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );

      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('p-4');

      // CardHeader should still have its own padding
      const headerElement = container.querySelector('.border-b') as HTMLElement;
      expect(headerElement).toHaveClass('px-4', 'py-3');
    });
  });
});
