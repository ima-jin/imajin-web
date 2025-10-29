import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCloudinaryUrl,
  getThumbnailUrl,
  getProductImageUrl,
  getHeroImageUrl,
  getNextImageUrl,
  isValidCloudinaryId,
  getPlaceholderImageUrl,
  getBestImageUrl,
  CloudinaryTransformOptions,
} from '@/lib/utils/cloudinary';

// Mock the cloudinary service
vi.mock('@/lib/services/cloudinary-service', () => ({
  cloudinaryService: {
    getCloudName: vi.fn(() => 'imajin-ai'),
  },
}));

describe('Cloudinary Utility', () => {
  describe('getCloudinaryUrl()', () => {
    it('should generate basic URL with publicId', () => {
      const url = getCloudinaryUrl('media/products/test/main');

      expect(url).toBe(
        'https://res.cloudinary.com/imajin-ai/image/upload/g_center,q_auto,f_auto,dpr_auto/media/products/test/main'
      );
    });

    it('should apply width transformation', () => {
      const url = getCloudinaryUrl('media/products/test/main', { width: 400 });

      expect(url).toContain('w_400');
      expect(url).toContain('c_fill'); // Default crop when width is set
    });

    it('should apply height transformation', () => {
      const url = getCloudinaryUrl('media/products/test/main', { height: 300 });

      expect(url).toContain('h_300');
      expect(url).toContain('c_fill'); // Default crop when height is set
    });

    it('should apply crop mode "fill"', () => {
      const url = getCloudinaryUrl('media/products/test/main', {
        width: 400,
        height: 400,
        crop: 'fill',
      });

      expect(url).toContain('c_fill');
    });

    it('should apply crop mode "fit"', () => {
      const url = getCloudinaryUrl('media/products/test/main', {
        width: 400,
        height: 400,
        crop: 'fit',
      });

      expect(url).toContain('c_fit');
    });

    it('should apply crop mode "scale"', () => {
      const url = getCloudinaryUrl('media/products/test/main', {
        width: 400,
        height: 400,
        crop: 'scale',
      });

      expect(url).toContain('c_scale');
      expect(url).not.toContain('g_center'); // Scale mode doesn't use gravity
    });

    it('should apply quality setting', () => {
      const url = getCloudinaryUrl('media/products/test/main', { quality: 80 });

      expect(url).toContain('q_80');
    });

    it('should apply format setting (webp)', () => {
      const url = getCloudinaryUrl('media/products/test/main', { format: 'webp' });

      expect(url).toContain('f_webp');
    });

    it('should combine multiple transformations correctly', () => {
      const url = getCloudinaryUrl('media/products/test/main', {
        width: 800,
        height: 600,
        crop: 'fill',
        quality: 90,
        format: 'webp',
        gravity: 'face',
      });

      expect(url).toContain('w_800');
      expect(url).toContain('h_600');
      expect(url).toContain('c_fill');
      expect(url).toContain('q_90');
      expect(url).toContain('f_webp');
      expect(url).toContain('g_face');
    });

    it('should use default quality and format when not specified', () => {
      const url = getCloudinaryUrl('media/products/test/main');

      expect(url).toContain('q_auto');
      expect(url).toContain('f_auto');
    });
  });

  describe('getThumbnailUrl()', () => {
    it('should generate thumbnail with default 400px size', () => {
      const url = getThumbnailUrl('media/products/test/main');

      expect(url).toContain('w_400');
      expect(url).toContain('h_400');
      expect(url).toContain('c_fill');
      expect(url).toContain('q_auto');
    });

    it('should generate thumbnail with custom size', () => {
      const url = getThumbnailUrl('media/products/test/main', 300);

      expect(url).toContain('w_300');
      expect(url).toContain('h_300');
    });
  });

  describe('getProductImageUrl()', () => {
    it('should generate product image with default 1200px width', () => {
      const url = getProductImageUrl('media/products/test/main');

      expect(url).toContain('w_1200');
      expect(url).toContain('c_fit');
      expect(url).toContain('q_auto');
    });

    it('should generate product image with custom max width', () => {
      const url = getProductImageUrl('media/products/test/main', 800);

      expect(url).toContain('w_800');
    });
  });

  describe('getHeroImageUrl()', () => {
    it('should generate hero image with default 1920px width', () => {
      const url = getHeroImageUrl('media/products/test/hero');

      expect(url).toContain('w_1920');
      expect(url).toContain('c_fit'); // No height, so fit
    });

    it('should generate hero image with custom dimensions', () => {
      const url = getHeroImageUrl('media/products/test/hero', 1600, 900);

      expect(url).toContain('w_1600');
      expect(url).toContain('h_900');
      expect(url).toContain('c_fill'); // Height specified, so fill
    });
  });

  describe('getNextImageUrl()', () => {
    it('should generate base URL without size transformations', () => {
      const url = getNextImageUrl('media/products/test/main');

      expect(url).toBe(
        'https://res.cloudinary.com/imajin-ai/image/upload/q_auto,f_auto/media/products/test/main'
      );
      expect(url).not.toContain('w_');
      expect(url).not.toContain('h_');
    });
  });

  describe('isValidCloudinaryId()', () => {
    it('should return true for valid public ID', () => {
      expect(isValidCloudinaryId('media/products/test/main')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidCloudinaryId('')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidCloudinaryId(undefined)).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(isValidCloudinaryId('   ')).toBe(false);
    });

    it('should return false for placeholder IDs', () => {
      expect(isValidCloudinaryId('placeholder-image')).toBe(false);
      expect(isValidCloudinaryId('placeholder/test')).toBe(false);
    });
  });

  describe('getPlaceholderImageUrl()', () => {
    it('should generate placeholder with default 400x400 size', () => {
      const url = getPlaceholderImageUrl();

      expect(url).toContain("data:image/svg+xml");
      expect(url).toContain("width='400'");
      expect(url).toContain("height='400'");
      expect(url).toContain('No Image');
    });

    it('should generate placeholder with custom size', () => {
      const url = getPlaceholderImageUrl(600, 800);

      expect(url).toContain("width='600'");
      expect(url).toContain("height='800'");
    });
  });

  describe('getBestImageUrl()', () => {
    it('should return main category image when available', () => {
      const media = [
        { cloudinaryPublicId: 'media/test/detail', category: 'detail' },
        { cloudinaryPublicId: 'media/test/main', category: 'main' },
      ];

      const url = getBestImageUrl(media, 'main');

      expect(url).toContain('media/test/main');
    });

    it('should fall back to any valid image when preferred category not found', () => {
      const media = [
        { cloudinaryPublicId: 'media/test/detail', category: 'detail' },
        { cloudinaryPublicId: 'media/test/lifestyle', category: 'lifestyle' },
      ];

      const url = getBestImageUrl(media, 'main');

      // Should return first valid image
      expect(url).toContain('media/test/detail');
    });

    it('should return placeholder when no valid images', () => {
      const media = [
        { cloudinaryPublicId: '', category: 'main' },
        { cloudinaryPublicId: undefined, category: 'detail' },
      ];

      const url = getBestImageUrl(media);

      expect(url).toContain('data:image/svg+xml');
      expect(url).toContain('No Image');
    });

    it('should apply transform options to selected image', () => {
      const media = [
        { cloudinaryPublicId: 'media/test/main', category: 'main' },
      ];

      const url = getBestImageUrl(media, 'main', {
        width: 500,
        quality: 80,
      });

      expect(url).toContain('w_500');
      expect(url).toContain('q_80');
    });

    it('should skip invalid cloudinary IDs', () => {
      const media = [
        { cloudinaryPublicId: 'placeholder-invalid', category: 'main' },
        { cloudinaryPublicId: 'media/test/valid', category: 'detail' },
      ];

      const url = getBestImageUrl(media, 'main');

      // Should skip placeholder and use valid image
      expect(url).toContain('media/test/valid');
      expect(url).not.toContain('placeholder');
    });
  });
});
