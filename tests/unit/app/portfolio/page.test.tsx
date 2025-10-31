/**
 * Portfolio Page Tests
 * Phase 2.4.7 - Phase 3
 *
 * Tests for the portfolio page (app/portfolio/page.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PortfolioPage from '@/app/portfolio/page';
import { createPortfolioProduct } from '@/tests/fixtures/products';

// Mock fetch
global.fetch = vi.fn();

describe('PortfolioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render portfolio page', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      render(await PortfolioPage());

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should call portfolio API endpoint', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      render(await PortfolioPage());

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/portfolio'),
        expect.any(Object)
      );
    });

    it('should display only products with showOnPortfolioPage = true', async () => {
      const portfolioProducts = [
        createPortfolioProduct({
          id: 'portfolio-1',
          name: 'Portfolio Product',
          basePrice: 10000,
          portfolioCopy: 'Featured installation',
        }),
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => portfolioProducts,
      } as Response);

      render(await PortfolioPage());

      await waitFor(() => {
        expect(screen.getByText('Portfolio Product')).toBeInTheDocument();
      });
    });

    it('should have proper page heading', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      render(await PortfolioPage());

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toMatch(/portfolio|installations|work/i);
    });

    it('should use grid layout for portfolio items', async () => {
      const portfolioProducts = [
        createPortfolioProduct({
          id: 'portfolio-1',
          name: 'Product 1',
          basePrice: 10000,
          portfolioCopy: 'Copy 1',
        }),
        createPortfolioProduct({
          id: 'portfolio-2',
          name: 'Product 2',
          basePrice: 15000,
          portfolioCopy: 'Copy 2',
        }),
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => portfolioProducts,
      } as Response);

      const { container } = render(await PortfolioPage());

      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Empty State & Error Handling', () => {
    it('should show empty state when no portfolio products', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      render(await PortfolioPage());

      const emptyMessage = screen.getByText(/no.*portfolio|coming soon|check back/i);
      expect(emptyMessage).toBeInTheDocument();
    });

    it('should display helpful message in empty state', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      render(await PortfolioPage());

      // Should guide users to browse products instead
      const message = screen.getByText(/browse|products|explore/i);
      expect(message).toBeInTheDocument();
    });

    it('should show link to products page from empty state', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      render(await PortfolioPage());

      const link = screen.getByRole('link', { name: /browse products|view products/i });
      expect(link).toHaveAttribute('href', '/products');
    });

    it('should handle API error gracefully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response);

      render(await PortfolioPage());

      // Should show empty state when API fails (graceful degradation)
      const emptyState = screen.getByText(/no portfolio items/i);
      expect(emptyState).toBeInTheDocument();
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      render(await PortfolioPage());

      // Should show empty state when network fails (graceful degradation)
      const emptyState = screen.getByText(/no portfolio items/i);
      expect(emptyState).toBeInTheDocument();
    });
  });
});
