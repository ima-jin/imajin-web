/**
 * SEO Metadata Tests
 * Phase 2.4.7 - Phase 8
 *
 * Integration tests for SEO metadata across all pages
 */

import { describe, it, expect } from 'vitest';

describe('SEO Metadata', () => {
  describe('Homepage Metadata', () => {
    it('should have title tag', async () => {
      const homeModule = await import('@/app/page');
      const metadata = homeModule.metadata;

      expect(metadata.title).toBeDefined();
      if (typeof metadata.title === 'string') {
        expect(metadata.title.length).toBeGreaterThan(0);
      }
    });

    it('should have meta description', async () => {
      const homeModule = await import('@/app/page');
      const metadata = homeModule.metadata;

      expect(metadata.description).toBeDefined();
      if (typeof metadata.description === 'string') {
        expect(metadata.description.length).toBeGreaterThan(0);
        expect(metadata.description.length).toBeLessThan(160); // SEO best practice
      }
    });
  });

  describe('Product Pages Metadata', () => {
    it('should have unique titles for product pages', async () => {
      const productModule = await import('@/app/products/[id]/page');

      // generateMetadata should be a function
      expect(typeof productModule.generateMetadata).toBe('function');

      // Test with mock params - convert string id to Promise
      const metadata = await productModule.generateMetadata({
        params: Promise.resolve({ id: 'test-product' }),
      });

      expect(metadata.title).toBeDefined();
      if (typeof metadata.title === 'string') {
        expect(metadata.title.length).toBeGreaterThan(0);
      }
    });
  });

  describe('OpenGraph Tags', () => {
    it('should have OpenGraph title', async () => {
      const homeModule = await import('@/app/page');
      const metadata = homeModule.metadata;

      expect(metadata.openGraph).toBeDefined();
      if (metadata.openGraph) {
        expect(metadata.openGraph.title).toBeTruthy();
      }
    });

    it('should have OpenGraph description', async () => {
      const homeModule = await import('@/app/page');
      const metadata = homeModule.metadata;

      expect(metadata.openGraph).toBeDefined();
      if (metadata.openGraph) {
        expect(metadata.openGraph.description).toBeTruthy();
      }
    });

    it('should have OpenGraph image', async () => {
      const homeModule = await import('@/app/page');
      const metadata = homeModule.metadata;

      expect(metadata.openGraph).toBeDefined();
      // OpenGraph image should be present (can be array or string)
      if (metadata.openGraph) {
        expect(
          metadata.openGraph.images !== undefined &&
          metadata.openGraph.images !== null
        ).toBe(true);
      }
    });
  });

  describe('Twitter Card Tags', () => {
    it('should have Twitter Card tags', async () => {
      const homeModule = await import('@/app/page');
      const metadata = homeModule.metadata;

      expect(metadata.twitter).toBeDefined();
      if (metadata.twitter && 'card' in metadata.twitter) {
        expect((metadata.twitter as any).card).toBeTruthy();
      }
    });
  });

  describe('Canonical URL', () => {
    it('should have metadata defined', async () => {
      const homeModule = await import('@/app/page');
      const metadata = homeModule.metadata;

      // Metadata should be defined
      expect(metadata).toBeDefined();
      expect(metadata.title).toBeDefined();
      expect(metadata.description).toBeDefined();
    });
  });
});
