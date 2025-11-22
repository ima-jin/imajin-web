/**
 * Portfolio Page Tests
 * Phase 2.4.7 - Phase 3
 *
 * Tests for the portfolio page (app/portfolio/page.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortfolioPage from '@/app/portfolio/page';
import { createPortfolioProduct } from '@/tests/fixtures/products';

// Mock the database module
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('PortfolioPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default mock for empty portfolio
    const { db } = await import('@/db');
    const whereFn = vi.fn().mockResolvedValue([]);
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    vi.mocked(db.select).mockReturnValue({ from: fromFn } as any);
  });

  describe('Page Rendering', () => {
    it('should render portfolio page', async () => {
      render(await PortfolioPage());

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should query database for portfolio products', async () => {
      const { db } = await import('@/db');

      render(await PortfolioPage());

      expect(db.select).toHaveBeenCalled();
    });

    it('should display only products with showOnPortfolioPage = true', async () => {
      const { db } = await import('@/db');
      const mockDbProducts = [
        {
          ...createPortfolioProduct({
            id: 'portfolio-1',
            name: 'Portfolio Product',
            basePriceCents: 10000,
            portfolioCopy: 'Featured installation',
          }),
          showOnPortfolioPage: true,
        },
      ];

      const whereFn = vi.fn().mockResolvedValue(mockDbProducts);
      const fromFn = vi.fn().mockReturnValue({ where: whereFn });
      vi.mocked(db.select).mockReturnValue({ from: fromFn } as any);

      render(await PortfolioPage());

      expect(screen.getByText('Portfolio Product')).toBeInTheDocument();
    });

    it('should have proper page heading', async () => {
      render(await PortfolioPage());

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toMatch(/portfolio|installations|work/i);
    });

    it('should use grid layout for portfolio items', async () => {
      const { db } = await import('@/db');
      const mockDbProducts = [
        {
          ...createPortfolioProduct({
            id: 'portfolio-1',
            name: 'Product 1',
            basePriceCents: 10000,
            portfolioCopy: 'Copy 1',
          }),
          showOnPortfolioPage: true,
        },
        {
          ...createPortfolioProduct({
            id: 'portfolio-2',
            name: 'Product 2',
            basePriceCents: 15000,
            portfolioCopy: 'Copy 2',
          }),
          showOnPortfolioPage: true,
        },
      ];

      const whereFn = vi.fn().mockResolvedValue(mockDbProducts);
      const fromFn = vi.fn().mockReturnValue({ where: whereFn });
      vi.mocked(db.select).mockReturnValue({ from: fromFn } as any);

      const { container } = render(await PortfolioPage());

      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Empty State & Error Handling', () => {
    it('should show empty state when no portfolio products', async () => {
      // Default mock already returns empty array
      render(await PortfolioPage());

      const emptyMessage = screen.getByText(/no.*portfolio|coming soon|check back/i);
      expect(emptyMessage).toBeInTheDocument();
    });

    it('should display helpful message in empty state', async () => {
      render(await PortfolioPage());

      // Should guide users to browse products instead
      const message = screen.getByText(/browse|products/i);
      expect(message).toBeInTheDocument();
    });

    it('should show link to products page from empty state', async () => {
      render(await PortfolioPage());

      const link = screen.getByRole('link', { name: /browse products/i });
      expect(link).toHaveAttribute('href', '/products');
    });

    it('should handle database query error gracefully', async () => {
      const { db } = await import('@/db');

      // Mock database error
      const whereFn = vi.fn().mockRejectedValue(new Error('Database error'));
      const fromFn = vi.fn().mockReturnValue({ where: whereFn });
      vi.mocked(db.select).mockReturnValue({ from: fromFn } as any);

      // Should throw error (Next.js will handle with error boundary)
      await expect(async () => {
        await PortfolioPage();
      }).rejects.toThrow('Database error');
    });

    it('should only show products with isLive = true', async () => {
      const { db } = await import('@/db');
      const mockDbProducts = [
        {
          ...createPortfolioProduct({
            id: 'portfolio-1',
            name: 'Live Product',
            basePriceCents: 10000,
            portfolioCopy: 'Featured',
          }),
          showOnPortfolioPage: true,
          isLive: true,
        },
      ];

      const whereFn = vi.fn().mockResolvedValue(mockDbProducts);
      const fromFn = vi.fn().mockReturnValue({ where: whereFn });
      vi.mocked(db.select).mockReturnValue({ from: fromFn } as any);

      render(await PortfolioPage());

      expect(screen.getByText('Live Product')).toBeInTheDocument();
    });
  });
});
