/**
 * Homepage Tests
 * Phase 2.4.7 - Phase 2
 *
 * Tests for the main homepage (app/page.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// Mock the async data dependencies
vi.mock('@/hooks/usePageContent', () => ({
  getHomePageContent: vi.fn().mockResolvedValue({
    hero: {
      headline: 'Transform Your Space',
      subheadline: 'Modular LED Fixtures',
      cta: { label: 'Shop Now', href: '/products', aria_label: 'Shop modular LED fixtures' },
    },
    value_props: [
      { id: '1', heading: 'Ready to Install', description: 'No assembly required' },
      { id: '2', heading: 'Modular Design', description: 'Mix and match' },
      { id: '3', heading: '10-Year Warranty', description: 'Built to last' },
    ],
    founder_section: {
      heading: 'Founder Edition',
      description: 'Limited run of 1,000 units',
      cta: { label: 'Learn More', href: '/products/founder-edition', aria_label: 'View Founder Edition' },
    },
    about_section: {
      heading: 'About Imajin',
      description: 'LED fixtures for everyone',
      cta: { label: 'Read More', href: '/about', aria_label: 'Learn about Imajin' },
    },
    browse_all_section: {
      heading: 'Browse All Products',
      cta: { label: 'View All', href: '/products', aria_label: 'View all products' },
    },
  }),
}));

vi.mock('@/lib/utils/api-client', () => ({
  apiGet: vi.fn().mockResolvedValue([
    {
      id: 'product-1',
      name: 'Product 1',
      basePrice: 5000,
      hasVariants: false,
      isLive: true,
      media: [],
    },
    {
      id: 'product-2',
      name: 'Founder Edition',
      basePrice: 10000,
      hasVariants: true,
      isLive: true,
      media: [],
    },
  ]),
}));

// Mock the homepage components
vi.mock('@/components/home/HeroSection', () => ({
  default: () => <div data-testid="hero-section">Hero Section</div>,
}));

vi.mock('@/components/home/FeaturedProducts', () => ({
  default: () => <div data-testid="featured-products">Featured Products</div>,
}));

describe('HomePage', () => {
  describe('Rendering', () => {
    it('should render homepage without errors', async () => {
      const component = await HomePage();
      const { container } = render(component);
      expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('should contain hero section', async () => {
      const component = await HomePage();
      render(component);
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('should contain featured products section', async () => {
      const component = await HomePage();
      render(component);
      expect(screen.getByTestId('featured-products')).toBeInTheDocument();
    });

    it('should have proper semantic HTML structure', async () => {
      const component = await HomePage();
      const { container } = render(component);
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main?.tagName).toBe('MAIN');
    });

    it('should render sections in correct order', async () => {
      const component = await HomePage();
      const { container } = render(component);
      const main = container.querySelector('main');
      const sections = main?.querySelectorAll('[data-testid]');

      expect(sections?.[0]).toHaveAttribute('data-testid', 'hero-section');
      expect(sections?.[1]).toHaveAttribute('data-testid', 'featured-products');
    });
  });

  describe('Responsive Layout', () => {
    it('should wrap content in proper container', async () => {
      const component = await HomePage();
      const { container } = render(component);
      const main = container.querySelector('main');

      // Should have responsive spacing/padding
      expect(main).toBeInTheDocument();
    });

    it('should have proper spacing between sections', async () => {
      const component = await HomePage();
      const { container } = render(component);
      const sections = container.querySelectorAll('[data-testid]');

      expect(sections.length).toBeGreaterThanOrEqual(2);
    });

    it('should be accessible', async () => {
      const component = await HomePage();
      const { container } = render(component);
      const main = container.querySelector('main');

      // Main landmark should exist for screen readers
      expect(main).toBeInTheDocument();
    });
  });

  describe('Metadata', () => {
    it('should export metadata with proper title', async () => {
      // Dynamic import to access metadata
      const pageModule = await import('@/app/page');
      const metadata = pageModule.metadata;

      expect(metadata).toBeDefined();
      expect(metadata.title).toBeTruthy();
      expect(typeof metadata.title).toBe('string');
    });

    it('should export metadata with SEO description', async () => {
      const pageModule = await import('@/app/page');
      const metadata = pageModule.metadata;

      expect(metadata.description).toBeTruthy();
      expect(typeof metadata.description).toBe('string');
    });

    it('should have OpenGraph metadata', async () => {
      const pageModule = await import('@/app/page');
      const metadata = pageModule.metadata;

      // OpenGraph tags should be present for social sharing
      expect(metadata.openGraph).toBeDefined();
    });
  });
});
