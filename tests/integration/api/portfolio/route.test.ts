/**
 * Portfolio API Route Tests
 * Phase 2.4.7 - Phase 3
 *
 * Integration tests for GET /api/portfolio
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/portfolio/route';
import { db } from '@/db';
import { products } from '@/db/schema';
import { createMockDbProduct } from '@/tests/fixtures/products';

describe('GET /api/portfolio', () => {
  beforeEach(async () => {
    // Clear products table
    await db.delete(products);
  });

  afterEach(async () => {
    // Cleanup
    await db.delete(products);
  });

  describe('API Behavior', () => {
    it('should return only products with showOnPortfolioPage = true', async () => {
      // Insert test products
      await db.insert(products).values([
        createMockDbProduct({
          id: 'portfolio-product',
          name: 'Portfolio Product',
          basePrice: 10000,
          showOnPortfolioPage: true,
          portfolioCopy: 'Featured installation',
        }),
        createMockDbProduct({
          id: 'regular-product',
          name: 'Regular Product',
          basePrice: 15000,
          showOnPortfolioPage: false,
        }),
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('portfolio-product');
      expect(data[0].showOnPortfolioPage).toBe(true);
    });

    it('should include portfolioCopy field in response', async () => {
      await db.insert(products).values([
        createMockDbProduct({
          id: 'test-portfolio',
          name: 'Test Portfolio',
          basePrice: 10000,
          showOnPortfolioPage: true,
          portfolioCopy: '## Featured Installation\n\nThis was featured in downtown core.',
        }),
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data[0].portfolioCopy).toBe(
        '## Featured Installation\n\nThis was featured in downtown core.'
      );
    });

    it('should return empty array when no portfolio products', async () => {
      await db.insert(products).values([
        createMockDbProduct({
          id: 'regular-1',
          name: 'Regular Product',
          basePrice: 10000,
          showOnPortfolioPage: false,
        }),
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual([]);
    });

    it('should return products regardless of live status (portfolio showcases work)', async () => {
      await db.insert(products).values([
        createMockDbProduct({
          id: 'live-portfolio',
          name: 'Live Portfolio',
          basePrice: 10000,
          showOnPortfolioPage: true,
          isLive: true,
        }),
        createMockDbProduct({
          id: 'draft-portfolio',
          name: 'Draft Portfolio',
          basePrice: 15000,
          showOnPortfolioPage: true,
          isLive: false,
        }),
      ]);

      const response = await GET();
      const data = await response.json();

      // Portfolio shows work regardless of live status
      expect(data).toHaveLength(2);
      expect(data.map((p: any) => p.id)).toContain('live-portfolio');
      expect(data.map((p: any) => p.id)).toContain('draft-portfolio');
    });

    it('should include media field in response', async () => {
      await db.insert(products).values([
        createMockDbProduct({
          id: 'portfolio-with-media',
          name: 'Portfolio with Media',
          basePrice: 10000,
          showOnPortfolioPage: true,
          media: [
            {
              cloudinaryPublicId: 'portfolio/test/main',
              type: 'image',
              category: 'main',
              alt: 'Test Image',
              localPath: 'local/test.jpg',
              mimeType: 'image/jpeg',
              order: 1,
            },
          ],
        }),
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data[0].media).toBeDefined();
      expect(Array.isArray(data[0].media)).toBe(true);
      expect(data[0].media.length).toBeGreaterThan(0);
    });

    it('should return 200 status code', async () => {
      await db.insert(products).values([
        createMockDbProduct({
          id: 'portfolio-1',
          name: 'Portfolio 1',
          basePrice: 10000,
          showOnPortfolioPage: true,
        }),
      ]);

      const response = await GET();

      expect(response.status).toBe(200);
    });
  });
});
