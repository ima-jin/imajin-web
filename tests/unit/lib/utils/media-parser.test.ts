import { describe, it, expect } from 'vitest';
import { parseMediaArray } from '@/lib/utils/media-parser';

describe('Media Parser', () => {
  describe('Valid Input Parsing', () => {
    it('should parse complete media item with all fields', () => {
      // Arrange
      const dbMedia = [{
        local_path: '/images/product.jpg',
        cloudinary_public_id: 'prod_123',
        type: 'image',
        mime_type: 'image/jpeg',
        alt: 'Product image',
        category: 'hero',
        order: 1,
        uploaded_at: '2025-01-15T10:00:00Z'
      }];

      // Act
      const result = parseMediaArray(dbMedia);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        localPath: '/images/product.jpg',
        cloudinaryPublicId: 'prod_123',
        type: 'image',
        mimeType: 'image/jpeg',
        alt: 'Product image',
        category: 'hero',
        order: 1,
        uploadedAt: new Date('2025-01-15T10:00:00Z')
      });
    });

    it('should parse media with camelCase field names', () => {
      // Arrange
      const dbMedia = [{
        localPath: '/images/product.jpg',
        cloudinaryPublicId: 'prod_123',
        type: 'image',
        mimeType: 'image/jpeg',
        alt: 'Product image',
        category: 'main',
        order: 0
      }];

      // Act
      const result = parseMediaArray(dbMedia);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].localPath).toBe('/images/product.jpg');
      expect(result[0].cloudinaryPublicId).toBe('prod_123');
    });

    it('should parse media with snake_case field names', () => {
      // Arrange
      const dbMedia = [{
        local_path: '/images/product.jpg',
        cloudinary_public_id: 'prod_123',
        type: 'image',
        mime_type: 'image/jpeg'
      }];

      // Act
      const result = parseMediaArray(dbMedia);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].localPath).toBe('/images/product.jpg');
      expect(result[0].cloudinaryPublicId).toBe('prod_123');
      expect(result[0].mimeType).toBe('image/jpeg');
    });

    it('should parse array of multiple media items', () => {
      // Arrange
      const dbMedia = [
        { local_path: '/img1.jpg', type: 'image', mime_type: 'image/jpeg', category: 'hero', order: 0 },
        { local_path: '/img2.jpg', type: 'image', mime_type: 'image/jpeg', category: 'main', order: 1 },
        { local_path: '/img3.jpg', type: 'image', mime_type: 'image/jpeg', category: 'main', order: 2 }
      ];

      // Act
      const result = parseMediaArray(dbMedia);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].category).toBe('hero');
      expect(result[1].category).toBe('main');
      expect(result[2].order).toBe(2);
    });

    it('should prefer camelCase over snake_case when both present', () => {
      // Arrange
      const dbMedia = [{
        localPath: '/camel/path.jpg',
        local_path: '/snake/path.jpg',
        cloudinaryPublicId: 'camel_id',
        cloudinary_public_id: 'snake_id',
        type: 'image',
        mimeType: 'image/jpeg'
      }];

      // Act
      const result = parseMediaArray(dbMedia);

      // Assert
      expect(result[0].localPath).toBe('/camel/path.jpg');
      expect(result[0].cloudinaryPublicId).toBe('camel_id');
    });
  });

  describe('Fallback Values', () => {
    it('should use default values for missing fields', () => {
      // Arrange
      const dbMedia = [{
        local_path: '/img.jpg'
        // All other fields missing
      }];

      // Act
      const result = parseMediaArray(dbMedia);

      // Assert
      expect(result[0]).toEqual({
        localPath: '/img.jpg',
        cloudinaryPublicId: undefined,
        type: 'image',
        mimeType: '',
        alt: '',
        category: 'main',
        order: 0,
        uploadedAt: undefined
      });
    });

    it('should default type to image when missing', () => {
      // Arrange
      const dbMedia = [{ local_path: '/img.jpg' }];

      // Act
      const result = parseMediaArray(dbMedia);

      // Assert
      expect(result[0].type).toBe('image');
    });

    it('should default category to main when missing', () => {
      // Arrange
      const dbMedia = [{ local_path: '/img.jpg', type: 'image' }];

      // Act
      const result = parseMediaArray(dbMedia);

      // Assert
      expect(result[0].category).toBe('main');
    });

    it('should default order to 0 when missing', () => {
      // Arrange
      const dbMedia = [{ local_path: '/img.jpg' }];

      // Act
      const result = parseMediaArray(dbMedia);

      // Assert
      expect(result[0].order).toBe(0);
    });

    it('should use empty string for missing alt and mimeType', () => {
      // Arrange
      const dbMedia = [{ local_path: '/img.jpg' }];

      // Act
      const result = parseMediaArray(dbMedia);

      // Assert
      expect(result[0].alt).toBe('');
      expect(result[0].mimeType).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should return empty array when input is null', () => {
      // Act
      const result = parseMediaArray(null);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when input is undefined', () => {
      // Act
      const result = parseMediaArray(undefined);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when input is empty array', () => {
      // Act
      const result = parseMediaArray([]);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when input is not an array', () => {
      // Act
      const result1 = parseMediaArray('invalid' as any);
      const result2 = parseMediaArray(123 as any);
      const result3 = parseMediaArray({ not: 'array' } as any);

      // Assert
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
    });

    it('should convert uploadedAt string to Date object', () => {
      // Arrange
      const dbMedia = [{
        local_path: '/img.jpg',
        uploaded_at: '2025-01-15T10:00:00Z'
      }];

      // Act
      const result = parseMediaArray(dbMedia);

      // Assert
      expect(result[0].uploadedAt).toBeInstanceOf(Date);
      expect(result[0].uploadedAt?.toISOString()).toBe('2025-01-15T10:00:00.000Z');
    });
  });
});
