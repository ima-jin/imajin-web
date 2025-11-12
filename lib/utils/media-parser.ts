/**
 * Media parser utility for parsing JSONB media fields from PostgreSQL
 *
 * Handles conversion from database format (snake_case or camelCase)
 * to application format with proper type safety and fallback values.
 */

import { MediaItem } from '@/types/product';
import { DbMediaItem } from '@/types/media';

/**
 * Parse media array from database JSONB field
 *
 * Handles both camelCase and snake_case field names,
 * with sensible fallbacks for missing fields.
 *
 * @param media - Raw media data from database (JSONB field)
 * @returns Typed MediaItem array with proper fallback values
 *
 * @example
 * ```typescript
 * const media = parseMediaArray(dbProduct.media);
 * // Returns MediaItem[] with all required fields populated
 * ```
 */
export function parseMediaArray(media: unknown): MediaItem[] {
  // Handle null, undefined, or non-array inputs
  if (!media || !Array.isArray(media)) {
    return [];
  }

  // Handle empty array
  if (media.length === 0) {
    return [];
  }

  // Parse each media item with proper type conversion
  return media.map((item: DbMediaItem) => {
    // Prefer camelCase over snake_case when both present
    const localPath = item.localPath || item.local_path || '';
    const cloudinaryPublicId = item.cloudinaryPublicId || item.cloudinary_public_id;
    const type = (item.type as MediaItem['type']) || 'image';
    const mimeType = item.mimeType || item.mime_type || '';
    const alt = item.alt || '';
    const category = (item.category as MediaItem['category']) || 'main';
    const order = item.order ?? 0;

    // Parse uploadedAt string to Date if present
    const uploadedAtString = item.uploadedAt || item.uploaded_at;
    const uploadedAt = uploadedAtString ? new Date(uploadedAtString) : undefined;

    return {
      localPath,
      cloudinaryPublicId,
      type,
      mimeType,
      alt,
      category,
      order,
      uploadedAt,
    };
  });
}
