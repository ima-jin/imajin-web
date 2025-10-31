/**
 * PortfolioFeaturedCard Component
 * Phase 2.4.7 - Phase 3
 *
 * Large hero-style card for featured portfolio product
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Product } from '@/types/product';
import { Heading } from '@/components/ui/Heading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getProductImageUrl } from '@/lib/utils/cloudinary';

interface PortfolioFeaturedCardProps {
  product: Product;
}

export default function PortfolioFeaturedCard({ product }: PortfolioFeaturedCardProps) {
  // Get all images, prioritizing hero category first, then sort by order
  const allImages = product.media || [];
  const sortedImages = allImages.sort((a, b) => {
    // Hero images come first
    if (a.category === 'hero' && b.category !== 'hero') return -1;
    if (a.category !== 'hero' && b.category === 'hero') return 1;
    // Then sort by order
    return a.order - b.order;
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  };

  const currentImage = sortedImages[currentImageIndex];

  return (
    <div className="relative overflow-hidden rounded-lg bg-white shadow-lg">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Left: Large Image with Carousel */}
        <div className="group/carousel relative h-[400px] md:h-auto md:min-h-[600px] overflow-hidden bg-gray-100 flex items-start md:pt-16">
          {currentImage && (
            <>
              <Image
                src={getProductImageUrl(currentImage.cloudinaryPublicId || '', 1200)}
                alt={currentImage.alt || product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />

              {/* Carousel Controls - Only show if multiple images */}
              {sortedImages.length > 1 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all opacity-0 group-hover/carousel:opacity-100"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all opacity-0 group-hover/carousel:opacity-100"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {sortedImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Right: Content */}
        <div className="flex flex-col justify-start p-8 md:p-12 lg:p-16">
          {/* Featured Badge */}
          <Badge variant="success" size="sm" className="w-fit mb-4">
            Featured
          </Badge>

          {/* Product Name */}
          <Heading level={2} className="text-4xl md:text-5xl mb-6">
            {product.name}
          </Heading>

          {/* Portfolio Copy with Markdown */}
          {product.portfolioCopy && (
            <div className="prose-editorial-lg text-gray-700 mb-8">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {product.portfolioCopy}
              </ReactMarkdown>
            </div>
          )}

          {/* Category Badge */}
          <div className="mb-6">
            <Badge variant="default" size="md">
              {product.category}
            </Badge>
          </div>

          {/* Shop Button - Only show if product is live */}
          {product.isLive && (
            <div>
              <Link href={`/products/${product.id}`}>
                <Button variant="primary" size="lg">
                  Shop {product.name}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
