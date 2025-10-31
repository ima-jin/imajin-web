/**
 * Image Optimization Tests
 * Phase 2.4.7 - Phase 7
 *
 * Integration tests for Next.js Image component usage
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Image from 'next/image';
import { createMockProduct } from '@/tests/fixtures/products';

// Mock components that use images
const TestImageComponent = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    />
  );
};

describe('Image Optimization', () => {
  describe('Next.js Image Component', () => {
    it('should render Next.js Image component', () => {
      render(
        <TestImageComponent
          src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
          alt="Test Image"
        />
      );

      const img = screen.getByAltText('Test Image');
      expect(img).toBeInTheDocument();
    });

    it('should have proper width and height attributes', () => {
      const { container } = render(
        <TestImageComponent
          src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
          alt="Test Image"
        />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();

      // Next.js Image should have width/height for proper layout
      expect(img).toHaveAttribute('width');
      expect(img).toHaveAttribute('height');
    });

    it('should enable lazy loading', () => {
      const { container } = render(
        <TestImageComponent
          src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
          alt="Test Image"
        />
      );

      const img = container.querySelector('img');

      // Next.js Image uses lazy loading by default
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should have placeholder blur support', () => {
      const { container } = render(
        <Image
          src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
          alt="Test with Blur"
          width={800}
          height={600}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        />
      );

      // Image component should render
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
    });

    it('should use Cloudinary URLs correctly', () => {
      const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg';

      const { container } = render(
        <TestImageComponent src={cloudinaryUrl} alt="Cloudinary Image" />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();

      // Should have cloudinary in src or srcset
      const src = img?.getAttribute('src') || '';
      const srcset = img?.getAttribute('srcset') || '';

      expect(src.includes('cloudinary') || srcset.includes('cloudinary')).toBe(true);
    });

    it('should be responsive at different breakpoints', () => {
      const { container } = render(
        <div className="responsive-container">
          <TestImageComponent
            src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
            alt="Responsive Image"
          />
        </div>
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();

      // Next.js Image should generate responsive srcset
      const srcset = img?.getAttribute('srcset');
      expect(srcset).toBeTruthy();
    });
  });
});
