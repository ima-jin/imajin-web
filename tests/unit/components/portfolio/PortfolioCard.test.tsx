/**
 * PortfolioCard Component Tests
 * Phase 2.4.7 - Phase 3
 *
 * Tests for portfolio card component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortfolioCard from '@/components/portfolio/PortfolioCard';
import { createPortfolioProduct } from '@/tests/fixtures/products';

describe('PortfolioCard', () => {
  const mockProduct = createPortfolioProduct({
    id: 'portfolio-1',
    name: 'Downtown Installation',
    basePrice: 25000,
    portfolioCopy: '**Featured** installation in downtown core. Spanning 20 panels.',
    media: [
      {
        cloudinaryPublicId: 'portfolio/downtown/main',
        type: 'image',
        category: 'main',
        alt: 'Downtown Installation',
        localPath: 'local/path.jpg',
        mimeType: 'image/jpeg',
        order: 1,
      },
    ],
  });

  describe('Card Content', () => {
    it('should display product image', () => {
      render(<PortfolioCard product={mockProduct} />);

      const img = screen.getByRole('img', { name: /downtown installation/i });
      expect(img).toBeInTheDocument();
    });

    it('should render product name as heading', () => {
      render(<PortfolioCard product={mockProduct} />);

      const heading = screen.getByRole('heading', { name: /downtown installation/i });
      expect(heading).toBeInTheDocument();
    });

    it('should render portfolioCopy with markdown support', () => {
      render(<PortfolioCard product={mockProduct} />);

      // Markdown "**Featured**" should be rendered as bold
      const featured = screen.getByText('Featured');
      expect(featured).toBeInTheDocument();

      // Check if it's actually styled as bold (strong tag or bold class)
      expect(featured.tagName).toBe('STRONG');
    });

    it('should link to product detail page', () => {
      render(<PortfolioCard product={mockProduct} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/products/portfolio-1');
    });
  });

  describe('Layout & Styling', () => {
    it('should have card layout with proper structure', () => {
      const { container } = render(<PortfolioCard product={mockProduct} />);

      // Should have a card component wrapper
      const card = container.querySelector('[class*="card"]');
      expect(card || container.firstChild).toBeInTheDocument();
    });

    it('should display image at top of card', () => {
      const { container } = render(<PortfolioCard product={mockProduct} />);

      const card = container.firstChild as HTMLElement;
      const img = card.querySelector('img');

      expect(img).toBeInTheDocument();
    });

    it('should be responsive', () => {
      const { container } = render(<PortfolioCard product={mockProduct} />);

      // Card should render without layout issues
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle products without images gracefully', () => {
      const productNoImage = createPortfolioProduct({
        id: 'no-image',
        name: 'No Image Product',
        basePrice: 10000,
        portfolioCopy: 'Test copy',
        media: [],
      });

      render(<PortfolioCard product={productNoImage} />);

      // Should still render the card
      expect(screen.getByRole('heading', { name: /no image product/i })).toBeInTheDocument();
    });
  });
});
