/**
 * Cloudinary utility functions
 * Handles image URL generation with transformations
 */

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'pad';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  gravity?: 'center' | 'face' | 'auto';
  dpr?: 'auto' | number;
}

/**
 * Generate a Cloudinary URL for an image with optional transformations
 *
 * @param publicId - The Cloudinary public ID
 * @param options - Transformation options
 * @returns Full Cloudinary URL
 */
export function getCloudinaryUrl(
  publicId: string,
  options: CloudinaryTransformOptions = {}
): string {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity = 'center',
    dpr = 'auto',
  } = options;

  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push(`c_${crop}`);
  if (gravity && crop !== 'scale') transformations.push(`g_${gravity}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);
  transformations.push(`dpr_${dpr}`);

  const transformString = transformations.join(',');
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
}

/**
 * Get a thumbnail URL (optimized for product cards)
 *
 * @param publicId - The Cloudinary public ID
 * @param size - Thumbnail size (default 400px)
 * @returns Cloudinary URL for thumbnail
 */
export function getThumbnailUrl(publicId: string, size: number = 400): string {
  return getCloudinaryUrl(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Get a full-size product image URL (optimized for product detail pages)
 *
 * @param publicId - The Cloudinary public ID
 * @param maxWidth - Maximum width (default 1200px)
 * @returns Cloudinary URL for full-size image
 */
export function getProductImageUrl(publicId: string, maxWidth: number = 1200): string {
  return getCloudinaryUrl(publicId, {
    width: maxWidth,
    crop: 'fit',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Get a hero image URL (optimized for banners and hero sections)
 *
 * @param publicId - The Cloudinary public ID
 * @param width - Width (default 1920px)
 * @param height - Height (optional)
 * @returns Cloudinary URL for hero image
 */
export function getHeroImageUrl(
  publicId: string,
  width: number = 1920,
  height?: number
): string {
  return getCloudinaryUrl(publicId, {
    width,
    height,
    crop: height ? 'fill' : 'fit',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Get an optimized URL for Next.js Image component
 * This generates a base URL that Next.js Image will further optimize
 *
 * @param publicId - The Cloudinary public ID
 * @returns Base Cloudinary URL without size transformations
 */
export function getNextImageUrl(publicId: string): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${publicId}`;
}

/**
 * Check if a public ID is valid (not empty or placeholder)
 *
 * @param publicId - The Cloudinary public ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidCloudinaryId(publicId?: string): boolean {
  if (!publicId || publicId.trim() === '') return false;
  if (publicId.startsWith('placeholder')) return false;
  return true;
}

/**
 * Get a fallback placeholder image URL
 *
 * @param width - Width of placeholder
 * @param height - Height of placeholder
 * @returns Data URL for a gray placeholder
 */
export function getPlaceholderImageUrl(width: number = 400, height: number = 400): string {
  // Return a simple gray placeholder as a data URL
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect width='${width}' height='${height}' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='sans-serif' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E`;
}

/**
 * Get the best available image URL from a media array
 * Falls back to placeholder if no valid images found
 *
 * @param media - Array of media items
 * @param category - Preferred category (default 'main')
 * @param transformOptions - Cloudinary transformation options
 * @returns Best available image URL or placeholder
 */
export function getBestImageUrl(
  media: Array<{ cloudinaryPublicId?: string; category?: string; deleted?: boolean }>,
  category: string = 'main',
  transformOptions?: CloudinaryTransformOptions
): string {
  // Filter out deleted media items
  const activeMedia = media.filter((item) => !item.deleted);

  // Find first image matching category
  const preferredImage = activeMedia.find(
    (item) => item.category === category && isValidCloudinaryId(item.cloudinaryPublicId)
  );

  if (preferredImage?.cloudinaryPublicId) {
    return transformOptions
      ? getCloudinaryUrl(preferredImage.cloudinaryPublicId, transformOptions)
      : getProductImageUrl(preferredImage.cloudinaryPublicId);
  }

  // Fall back to any valid image
  const anyImage = activeMedia.find((item) => isValidCloudinaryId(item.cloudinaryPublicId));

  if (anyImage?.cloudinaryPublicId) {
    return transformOptions
      ? getCloudinaryUrl(anyImage.cloudinaryPublicId, transformOptions)
      : getProductImageUrl(anyImage.cloudinaryPublicId);
  }

  // No valid images, return placeholder
  const width = transformOptions?.width || 400;
  const height = transformOptions?.height || 400;
  return getPlaceholderImageUrl(width, height);
}
