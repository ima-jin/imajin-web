import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  uploadMedia,
  checkMediaExists,
  deleteMedia,
  UploadResult,
} from '@/lib/services/cloudinary-service';

// Mock the cloudinary module
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(),
      destroy: vi.fn(),
    },
    api: {
      resource: vi.fn(),
    },
  },
}));

import { v2 as cloudinary } from 'cloudinary';

describe('cloudinary-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadMedia', () => {
    it('should upload media successfully', async () => {
      const mockResult = {
        public_id: 'media/products/test/sample',
        url: 'http://res.cloudinary.com/test/image/upload/v1234/media/products/test/sample.jpg',
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1234/media/products/test/sample.jpg',
        format: 'jpg',
        resource_type: 'image',
      };

      vi.mocked(cloudinary.uploader.upload).mockResolvedValue(mockResult as any);

      const result = await uploadMedia(
        '/path/to/test/sample.jpg',
        'media/products/test/sample'
      );

      expect(result).toEqual({
        publicId: 'media/products/test/sample',
        url: 'http://res.cloudinary.com/test/image/upload/v1234/media/products/test/sample.jpg',
        secureUrl: 'https://res.cloudinary.com/test/image/upload/v1234/media/products/test/sample.jpg',
        format: 'jpg',
        resourceType: 'image',
      });

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        '/path/to/test/sample.jpg',
        {
          public_id: 'media/products/test/sample',
          resource_type: 'image',
          overwrite: false,
        }
      );
    });

    it('should upload video with correct resource type', async () => {
      const mockResult = {
        public_id: 'media/products/test/video',
        url: 'http://res.cloudinary.com/test/video/upload/v1234/media/products/test/video.mp4',
        secure_url: 'https://res.cloudinary.com/test/video/upload/v1234/media/products/test/video.mp4',
        format: 'mp4',
        resource_type: 'video',
      };

      vi.mocked(cloudinary.uploader.upload).mockResolvedValue(mockResult as any);

      const result = await uploadMedia(
        '/path/to/test/video.mp4',
        'media/products/test/video',
        'video'
      );

      expect(result.resourceType).toBe('video');
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        '/path/to/test/video.mp4',
        {
          public_id: 'media/products/test/video',
          resource_type: 'video',
          overwrite: false,
        }
      );
    });

    it('should upload raw file (PDF) with correct resource type', async () => {
      const mockResult = {
        public_id: 'media/products/test/spec',
        url: 'http://res.cloudinary.com/test/raw/upload/v1234/media/products/test/spec.pdf',
        secure_url: 'https://res.cloudinary.com/test/raw/upload/v1234/media/products/test/spec.pdf',
        format: 'pdf',
        resource_type: 'raw',
      };

      vi.mocked(cloudinary.uploader.upload).mockResolvedValue(mockResult as any);

      const result = await uploadMedia(
        '/path/to/test/spec.pdf',
        'media/products/test/spec',
        'raw'
      );

      expect(result.resourceType).toBe('raw');
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        '/path/to/test/spec.pdf',
        {
          public_id: 'media/products/test/spec',
          resource_type: 'raw',
          overwrite: false,
        }
      );
    });

    it('should throw error when upload fails', async () => {
      vi.mocked(cloudinary.uploader.upload).mockRejectedValue(
        new Error('Upload failed: Invalid credentials')
      );

      await expect(
        uploadMedia('/path/to/test/sample.jpg', 'media/products/test/sample')
      ).rejects.toThrow('Upload failed: Invalid credentials');
    });

    it('should not overwrite existing files by default', async () => {
      const mockResult = {
        public_id: 'media/products/test/sample',
        url: 'http://res.cloudinary.com/test/image/upload/v1234/media/products/test/sample.jpg',
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1234/media/products/test/sample.jpg',
        format: 'jpg',
        resource_type: 'image',
      };

      vi.mocked(cloudinary.uploader.upload).mockResolvedValue(mockResult as any);

      await uploadMedia('/path/to/test/sample.jpg', 'media/products/test/sample');

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          overwrite: false,
        })
      );
    });
  });

  describe('checkMediaExists', () => {
    it('should return true when media exists', async () => {
      vi.mocked(cloudinary.api.resource).mockResolvedValue({
        public_id: 'media/products/test/sample',
        format: 'jpg',
        resource_type: 'image',
      } as any);

      const exists = await checkMediaExists('media/products/test/sample');

      expect(exists).toBe(true);
      expect(cloudinary.api.resource).toHaveBeenCalledWith('media/products/test/sample');
    });

    it('should return false when media does not exist', async () => {
      vi.mocked(cloudinary.api.resource).mockRejectedValue(
        new Error('Resource not found')
      );

      const exists = await checkMediaExists('media/products/test/missing');

      expect(exists).toBe(false);
      expect(cloudinary.api.resource).toHaveBeenCalledWith('media/products/test/missing');
    });

    it('should return false when API call fails', async () => {
      vi.mocked(cloudinary.api.resource).mockRejectedValue(
        new Error('Network error')
      );

      const exists = await checkMediaExists('media/products/test/sample');

      expect(exists).toBe(false);
    });
  });

  describe('deleteMedia', () => {
    it('should delete media successfully', async () => {
      vi.mocked(cloudinary.uploader.destroy).mockResolvedValue({
        result: 'ok',
      } as any);

      await deleteMedia('media/products/test/sample');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('media/products/test/sample');
    });

    it('should throw error when deletion fails', async () => {
      vi.mocked(cloudinary.uploader.destroy).mockRejectedValue(
        new Error('Deletion failed: Resource not found')
      );

      await expect(deleteMedia('media/products/test/missing')).rejects.toThrow(
        'Deletion failed: Resource not found'
      );
    });

    it('should handle deletion of non-existent media gracefully', async () => {
      vi.mocked(cloudinary.uploader.destroy).mockResolvedValue({
        result: 'not found',
      } as any);

      await expect(deleteMedia('media/products/test/missing')).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle upload with special characters in public ID', async () => {
      const mockResult = {
        public_id: 'media/products/test-product-123/main',
        url: 'http://res.cloudinary.com/test/image/upload/v1234/media/products/test-product-123/main.jpg',
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1234/media/products/test-product-123/main.jpg',
        format: 'jpg',
        resource_type: 'image',
      };

      vi.mocked(cloudinary.uploader.upload).mockResolvedValue(mockResult as any);

      const result = await uploadMedia(
        '/path/to/test-product-123/main.jpg',
        'media/products/test-product-123/main'
      );

      expect(result.publicId).toBe('media/products/test-product-123/main');
    });

    it('should handle check for media with nested folder structure', async () => {
      vi.mocked(cloudinary.api.resource).mockResolvedValue({
        public_id: 'media/products/Unit-8x8x8-Founder/BLACK/main',
        format: 'jpg',
        resource_type: 'image',
      } as any);

      const exists = await checkMediaExists('media/products/Unit-8x8x8-Founder/BLACK/main');

      expect(exists).toBe(true);
    });

    it('should handle concurrent upload requests', async () => {
      const mockResult = {
        public_id: 'media/products/test/sample',
        url: 'http://res.cloudinary.com/test/image/upload/v1234/sample.jpg',
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1234/sample.jpg',
        format: 'jpg',
        resource_type: 'image',
      };

      vi.mocked(cloudinary.uploader.upload).mockResolvedValue(mockResult as any);

      const uploads = await Promise.all([
        uploadMedia('/path/1.jpg', 'media/products/test/sample1'),
        uploadMedia('/path/2.jpg', 'media/products/test/sample2'),
        uploadMedia('/path/3.jpg', 'media/products/test/sample3'),
      ]);

      expect(uploads).toHaveLength(3);
      expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(3);
    });
  });
});
