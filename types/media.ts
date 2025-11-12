/**
 * Database representation of media items (JSONB field in PostgreSQL)
 *
 * Supports both camelCase and snake_case field names for flexibility
 * with different database access patterns.
 */
export interface DbMediaItem {
  localPath?: string;
  local_path?: string;
  cloudinaryPublicId?: string;
  cloudinary_public_id?: string;
  type?: string;
  mimeType?: string;
  mime_type?: string;
  alt?: string;
  category?: string;
  order?: number;
  uploadedAt?: string;
  uploaded_at?: string;
}
