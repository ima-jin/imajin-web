'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MediaItem } from '@/types/product';
import { getCloudinaryUrl, getVideoUrl, getVideoThumbnailUrl } from '@/lib/utils/cloudinary';

interface MediaCarouselProps {
  media: MediaItem[];
  productName: string;
}

/**
 * MediaCarousel Component
 *
 * Displays a carousel of media items (images and videos) for a product.
 * Features:
 * - Main display area showing current media
 * - Thumbnail navigation
 * - Support for images and videos
 * - Keyboard navigation
 */
export function MediaCarousel({ media, productName }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter out deleted media and sort by order
  const validMedia = media
    .filter(m => !m.deleted && m.cloudinaryPublicId)
    .sort((a, b) => a.order - b.order);

  if (validMedia.length === 0) {
    // Fallback placeholder
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No media available</span>
      </div>
    );
  }

  const currentMedia = validMedia[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validMedia.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validMedia.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Main Media Display */}
      <div className="aspect-square bg-gray-100 rounded-lg relative overflow-hidden group">
        {currentMedia.type === 'video' ? (
          <video
            src={getVideoUrl(currentMedia.cloudinaryPublicId!)}
            controls
            loop
            className="w-full h-full object-cover"
            preload="metadata"
          >
            <track kind="captions" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image
            src={getCloudinaryUrl(currentMedia.cloudinaryPublicId!, { width: 800, height: 800 })}
            alt={currentMedia.alt || productName}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={currentIndex === 0}
          />
        )}

        {/* Navigation Arrows - only show if more than one media item */}
        {validMedia.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Media Counter */}
        {validMedia.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {validMedia.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation - only show if more than one media item */}
      {validMedia.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {validMedia.map((item, index) => (
            <button
              key={item.localPath}
              onClick={() => goToIndex(index)}
              className={`aspect-square bg-gray-100 rounded-lg overflow-hidden relative ${
                index === currentIndex ? 'ring-2 ring-blue-500' : 'hover:opacity-75'
              }`}
              aria-label={`View ${item.type} ${index + 1}`}
            >
              {item.type === 'video' ? (
                <>
                  <Image
                    src={getVideoThumbnailUrl(item.cloudinaryPublicId!, 200, 200)}
                    alt={item.alt || `${productName} video thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 25vw, 12vw"
                  />
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <Image
                  src={getCloudinaryUrl(item.cloudinaryPublicId!, { width: 200, height: 200 })}
                  alt={item.alt || `${productName} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 25vw, 12vw"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
