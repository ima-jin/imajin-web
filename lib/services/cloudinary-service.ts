import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
}

/**
 * Upload media file to Cloudinary
 * @param localFilePath - Full path to local file
 * @param publicId - Desired public ID in Cloudinary (e.g., "media/products/Material-8x8-V/main")
 * @param resourceType - Type of resource: 'image', 'video', or 'raw' (for PDFs, etc.)
 * @returns Upload result with public ID and URLs
 */
export async function uploadMedia(
  localFilePath: string,
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(localFilePath, {
    public_id: publicId,
    resource_type: resourceType,
    overwrite: false, // Don't re-upload if exists
  });

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    format: result.format,
    resourceType: result.resource_type,
  };
}

/**
 * Check if media exists in Cloudinary
 * @param publicId - Public ID to check
 * @returns true if exists, false otherwise
 */
export async function checkMediaExists(publicId: string): Promise<boolean> {
  try {
    await cloudinary.api.resource(publicId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Delete media from Cloudinary
 * @param publicId - Public ID to delete
 */
export async function deleteMedia(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
