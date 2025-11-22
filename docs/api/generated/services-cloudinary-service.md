# Cloudinary Service

Media upload and management service for the Imajin LED Platform. Handles product images, documentation PDFs, and media assets through Cloudinary's CDN infrastructure.

## Purpose

The Cloudinary service provides a clean interface for uploading, checking, and managing media files in the cloud. Built for product catalog management, it ensures consistent public ID naming and handles different resource types (images, videos, raw files like PDFs).

This service abstracts Cloudinary's complexity while maintaining full control over file organization and naming conventions. Essential for maintaining the product media pipeline without vendor lock-in—all media URLs remain accessible even if you migrate providers.

## Functions

### uploadMedia

**Uploads a local file to Cloudinary with specified public ID and resource type.**

#### Purpose

Handles the upload process for product images, documentation, and other media assets. Uses Cloudinary's upload API with automatic format optimization and secure delivery URLs. The function preserves your naming conventions by accepting custom public IDs rather than auto-generating them.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `localFilePath` | `string` | Full filesystem path to the file you're uploading |
| `publicId` | `string` | Desired public ID in Cloudinary (e.g., "media/products/Material-8x8-V/main") |
| `resourceType` | `'image' \| 'video' \| 'raw'` | Resource type - 'image' for photos, 'video' for clips, 'raw' for PDFs/docs |

#### Returns

`Promise<UploadResult>` - Upload result containing URLs and metadata

```typescript
interface UploadResult {
  publicId: string;     // Confirmed public ID in Cloudinary
  url: string;          // HTTP URL for the uploaded file
  secureUrl: string;    // HTTPS URL (use this one)
  format: string;       // File format (jpg, png, pdf, etc.)
  resourceType: string; // Confirmed resource type
}
```

#### Example

```typescript
import { uploadMedia } from '@/lib/services/cloudinary-service';

// Upload a product image
const result = await uploadMedia(
  '/local/path/to/material-8x8-main.jpg',
  'media/products/Material-8x8-V/main',
  'image'
);

console.log(`Uploaded: ${result.secureUrl}`);
// Result: "https://res.cloudinary.com/imajin/image/upload/v1234567890/media/products/Material-8x8-V/main.jpg"

// Upload a product manual PDF
const pdfResult = await uploadMedia(
  '/local/docs/installation-guide.pdf',
  'docs/products/Material-8x8-V/installation',
  'raw'
);
```

#### Error Handling

- **File not found**: Throws if `localFilePath` doesn't exist
- **Cloudinary API errors**: Network issues, authentication failures, or quota limits bubble up as exceptions
- **Invalid resource type**: Cloudinary rejects incompatible type/file combinations

Handle uploads in try-catch blocks and consider implementing retry logic for network failures.

#### Implementation Notes

The function configures Cloudinary with environment credentials and uploads using their Node.js SDK. Resource type determines optimization behavior—images get automatic format conversion, raw files preserve original format. Public IDs follow our convention: `media/products/{product-slug}/{purpose}` for discoverability.

---

### checkMediaExists

**Verifies if a media file exists in Cloudinary by public ID.**

#### Purpose

Prevents duplicate uploads and validates media references before using them. Useful in batch processing workflows where you need to skip existing files or verify that required media is available before building product pages.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `publicId` | `string` | Public ID to check (without file extension) |

#### Returns

`Promise<boolean>` - `true` if the media exists, `false` if not found

#### Example

```typescript
import { checkMediaExists, uploadMedia } from '@/lib/services/cloudinary-service';

// Check before uploading to avoid duplicates
const mediaId = 'media/products/Material-8x8-V/main';
const exists = await checkMediaExists(mediaId);

if (!exists) {
  console.log('Uploading new media...');
  await uploadMedia('/local/path/image.jpg', mediaId);
} else {
  console.log('Media already exists, skipping upload');
}

// Validate media references in product data
const requiredMedia = ['main', 'side', 'back'];
const missingMedia = [];

for (const purpose of requiredMedia) {
  const mediaExists = await checkMediaExists(`media/products/Material-8x8-V/${purpose}`);
  if (!mediaExists) {
    missingMedia.push(purpose);
  }
}

if (missingMedia.length > 0) {
  console.warn(`Missing media: ${missingMedia.join(', ')}`);
}
```

#### Error Handling

- **Cloudinary API errors**: Authentication or network issues throw exceptions
- **Invalid public ID**: Returns `false` (treated as "not found")

Wrap in try-catch if you need to distinguish between "not found" and "can't check due to API error."

#### Implementation Notes

Uses Cloudinary's Admin API `resource()` method to check existence. This is a lightweight operation that doesn't transfer file data. The check works across all resource types—you don't need to specify whether it's an image, video, or raw file.

---

### deleteMedia

**Removes a media file from Cloudinary.**

#### Purpose

Cleans up obsolete media files and manages storage costs. Essential for maintaining a tidy media library when products are discontinued or media is replaced. Use carefully—deletions are permanent and will break existing URLs immediately.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `publicId` | `string` | Public ID of the file to delete |

#### Returns

`Promise<void>` - Resolves when deletion completes

#### Example

```typescript
import { deleteMedia, checkMediaExists } from '@/lib/services/cloudinary-service';

// Safe deletion with existence check
const mediaId = 'media/products/discontinued-product/main';

if (await checkMediaExists(mediaId)) {
  await deleteMedia(mediaId);
  console.log('Media deleted successfully');
} else {
  console.log('Media already gone or never existed');
}

// Bulk cleanup of old media
const obsoleteMedia = [
  'media/products/old-version/main',
  'media/products/old-version/side',
  'docs/products/old-version/manual'
];

for (const mediaId of obsoleteMedia) {
  try {
    await deleteMedia(mediaId);
    console.log(`Deleted: ${mediaId}`);
  } catch (error) {
    console.warn(`Failed to delete ${mediaId}:`, error.message);
  }
}
```

#### Error Handling

- **File not found**: Cloudinary returns success (idempotent operation)
- **API errors**: Authentication, network, or permission issues throw exceptions
- **Active URLs**: No protection against deleting files with active references

Always verify that URLs aren't actively used before deletion. Consider implementing a "mark for deletion" workflow for production systems.

#### Implementation Notes

Uses Cloudinary's Admin API `destroy()` method. The operation is immediate and irreversible. CDN caches may serve the file briefly after deletion, but new requests will fail. Resource type is auto-detected—you don't need to specify whether it's an image, video, or raw file.

## Common Patterns

### Product Media Pipeline

```typescript
// Complete product media upload workflow
async function uploadProductMedia(productSlug: string, mediaFiles: MediaFile[]) {
  const results = [];
  
  for (const file of mediaFiles) {
    const publicId = `media/products/${productSlug}/${file.purpose}`;
    
    // Skip if already exists
    if (await checkMediaExists(publicId)) {
      console.log(`Skipping existing: ${publicId}`);
      continue;
    }
    
    // Upload new media
    const result = await uploadMedia(
      file.localPath,
      publicId,
      file.type === 'pdf' ? 'raw' : 'image'
    );
    
    results.push({
      purpose: file.purpose,
      url: result.secureUrl,
      publicId: result.publicId
    });
  }
  
  return results;
}
```

### Media Validation

```typescript
// Validate all required media exists before going live
async function validateProductMedia(productSlug: string) {
  const requiredMedia = ['main', 'side', 'detail'];
  const validation = { valid: true, missing: [] };
  
  for (const purpose of requiredMedia) {
    const exists = await checkMediaExists(`media/products/${productSlug}/${purpose}`);
    if (!exists) {
      validation.valid = false;
      validation.missing.push(purpose);
    }
  }
  
  return validation;
}
```

## Best Practices

### Public ID Naming

Use consistent, hierarchical naming:
- **Products**: `media/products/{product-slug}/{purpose}`
- **Documentation**: `docs/products/{product-slug}/{type}`
- **General**: `media/{category}/{identifier}`

### Resource Types

- **image**: Photos, diagrams, illustrations (auto-optimized)
- **video**: Clips, demos, animations (transcoding available)
- **raw**: PDFs, manuals, spec sheets (no processing)

### Error Handling

Always wrap Cloudinary operations in try-catch blocks. Network issues and quota limits are common failure modes. Implement retry logic for transient failures, but respect rate limits.

### Performance

- Check existence before uploading to avoid unnecessary transfers
- Use batch operations for multiple files when possible
- Cache existence checks if validating the same media repeatedly

## Implementation Notes

This service requires Cloudinary environment variables (`CLOUDINARY_URL` or separate `CLOUD_NAME`, `API_KEY`, `API_SECRET`). The module initializes the Cloudinary SDK with these credentials and provides error handling around the core upload/admin operations.

File uploads preserve original quality by default. Cloudinary handles format optimization automatically for web delivery. Raw files (PDFs, etc.) are stored without modification and served with appropriate MIME types.

## Related Modules

- **Product Data Service**: Consumes media URLs from this service
- **Admin Tools**: Uses upload/delete functions for content management
- **Build Scripts**: Bulk media operations during deployment