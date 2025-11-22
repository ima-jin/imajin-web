# Cloudinary Utils

Streamlined image management for Imajin LED Platform. Handles image URL generation with transformations, optimized for product images, hero sections, and responsive web delivery.

## Purpose

The Cloudinary integration eliminates the complexity of manual image optimization. Instead of wrestling with different image sizes, formats, and quality settings across devices, you define what you need—the module handles the technical details.

**Problem solved:** Product images need to look sharp on 4K monitors and load fast on mobile. Manual optimization doesn't scale when you're managing hundreds of LED fixture variants.

**When to use:** Any time you're displaying images from Cloudinary. Product cards, detail pages, hero sections, video thumbnails—this module has optimized functions for each use case.

## Functions Reference

### getCloudinaryUrl

**Generate a Cloudinary URL with custom transformations.**

Takes a public ID and transformation options, returns a fully-formed Cloudinary URL with your specifications applied.

**Parameters:**
- `publicId` (string) - Cloudinary public ID (e.g., "products/material-8x8-black")
- `options` (CloudinaryTransformOptions) - Transformation settings (width, height, crop, quality, etc.)

**Returns:** Full Cloudinary URL with transformations applied

**Example:**
```typescript
import { getCloudinaryUrl } from '@/lib/utils/cloudinary';

// Basic usage
const url = getCloudinaryUrl('products/material-8x8-black');

// With transformations
const thumbnailUrl = getCloudinaryUrl('products/material-8x8-black', {
  width: 400,
  height: 400,
  crop: 'fill',
  quality: 'auto',
  format: 'webp'
});

// For high-DPI displays
const retinaUrl = getCloudinaryUrl('hero/led-installation', {
  width: 1200,
  dpr: 'auto',
  quality: 'auto'
});
```

**Implementation Notes:**
The function builds transformation strings in Cloudinary's URL format. Quality defaults to 'auto' for bandwidth optimization, format defaults to 'auto' for browser compatibility. The base URL uses Imajin's configured cloud name.

### getThumbnailUrl

**Generate optimized thumbnail URLs for product cards.**

Preset transformations optimized for product grid displays. Handles aspect ratio and compression automatically.

**Parameters:**
- `publicId` (string) - Cloudinary public ID
- `size` (number) - Thumbnail size in pixels (default: 400)

**Returns:** Cloudinary URL optimized for thumbnails

**Example:**
```typescript
// Standard product card thumbnail
const cardImage = getThumbnailUrl('products/controller-hub-v2');

// Larger thumbnail for featured products
const featuredImage = getThumbnailUrl('products/founder-edition-black', 600);

// Usage in product grid
const products = await getProducts();
const productCards = products.map(product => ({
  ...product,
  thumbnailUrl: getThumbnailUrl(product.cloudinaryPublicId)
}));
```

**Implementation Notes:**
Uses `fill` crop mode to maintain consistent aspect ratios across product grids. Applies automatic quality and format selection. DPR set to 'auto' for retina display support.

### getProductImageUrl

**Generate full-size product images for detail pages.**

Optimized for product detail views where image quality matters more than loading speed. Maintains aspect ratios while constraining maximum dimensions.

**Parameters:**
- `publicId` (string) - Cloudinary public ID
- `maxWidth` (number) - Maximum width constraint (default: 1200)

**Returns:** Cloudinary URL for full-size product images

**Example:**
```typescript
// Standard product detail image
const detailImage = getProductImageUrl('products/material-16x16-white');

// Constrained for mobile layouts
const mobileImage = getProductImageUrl('products/diy-kit-starter', 800);

// Product gallery implementation
const ProductGallery = ({ product }) => {
  const mainImage = getProductImageUrl(product.cloudinaryPublicId);
  const variants = product.variants.map(variant => 
    getProductImageUrl(variant.cloudinaryPublicId)
  );
  
  return (
    <div>
      <img src={mainImage} alt={product.name} />
      {/* variant thumbnails */}
    </div>
  );
};
```

**Implementation Notes:**
Uses `fit` crop mode to preserve original aspect ratios. Quality and format auto-optimization reduces bandwidth without sacrificing visual quality. No height constraint allows for natural proportions.

### getHeroImageUrl

**Generate hero images for banners and full-width sections.**

Optimized for large viewport displays with optional height constraints for consistent layouts.

**Parameters:**
- `publicId` (string) - Cloudinary public ID
- `width` (number) - Image width (default: 1920)
- `height` (number, optional) - Image height for aspect ratio control

**Returns:** Cloudinary URL optimized for hero sections

**Example:**
```typescript
// Full-width hero without height constraint
const heroImage = getHeroImageUrl('marketing/led-installation-hero');

// Fixed aspect ratio hero
const bannerImage = getHeroImageUrl('marketing/founder-edition-launch', 1920, 800);

// Responsive hero implementation
const HeroSection = () => {
  const desktopHero = getHeroImageUrl('hero/workshop-shot', 1920, 1080);
  const mobileHero = getHeroImageUrl('hero/workshop-shot', 768, 1024);
  
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopHero} />
      <img src={mobileHero} alt="Imajin LED Workshop" />
    </picture>
  );
};
```

**Implementation Notes:**
Defaults to desktop-first dimensions (1920px). When height is specified, uses `fill` crop with `center` gravity. Auto DPR handles high-density displays without manual intervention.

### getNextImageUrl

**Generate base URLs for Next.js Image component optimization.**

Returns Cloudinary URLs without size transformations, letting Next.js Image handle responsive sizing and format selection.

**Parameters:**
- `publicId` (string) - Cloudinary public ID

**Returns:** Base Cloudinary URL for Next.js Image

**Example:**
```typescript
import Image from 'next/image';
import { getNextImageUrl } from '@/lib/utils/cloudinary';

// Next.js Image with Cloudinary
const ProductImage = ({ product }) => {
  return (
    <Image
      src={getNextImageUrl(product.cloudinaryPublicId)}
      alt={product.name}
      width={400}
      height={400}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
};

// Gallery with multiple sizes
const ImageGallery = ({ images }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {images.map(img => (
        <Image
          key={img.id}
          src={getNextImageUrl(img.cloudinaryPublicId)}
          alt={img.alt}
          fill
          className="object-cover"
        />
      ))}
    </div>
  );
};
```

**Implementation Notes:**
Only applies quality and format auto-optimization. Next.js Image handles width, height, and responsive transformations based on your component props and sizes attribute.

### isValidCloudinaryId

**Validate Cloudinary public IDs before URL generation.**

Prevents broken image URLs by checking for empty strings, null values, and placeholder IDs.

**Parameters:**
- `publicId` (string, optional) - Public ID to validate

**Returns:** Boolean indicating if the ID is usable

**Example:**
```typescript
// Safe image URL generation
const getImageUrl = (publicId: string | undefined) => {
  if (!isValidCloudinaryId(publicId)) {
    return getPlaceholderImageUrl();
  }
  return getThumbnailUrl(publicId);
};

// Product card with fallback
const ProductCard = ({ product }) => {
  const imageUrl = isValidCloudinaryId(product.cloudinaryPublicId)
    ? getThumbnailUrl(product.cloudinaryPublicId)
    : getPlaceholderImageUrl(400, 400);
    
  return (
    <div>
      <img src={imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
    </div>
  );
};
```

**Implementation Notes:**
Checks for falsy values, empty strings, and common placeholder patterns. Use this before any URL generation function to avoid 404 errors in production.

### getVideoUrl

**Generate optimized video URLs from Cloudinary.**

Handles video transformations with quality and bandwidth optimization for web playback.

**Parameters:**
- `publicId` (string) - Cloudinary public ID for video
- `maxWidth` (number) - Maximum width constraint (default: 1200)

**Returns:** Cloudinary URL for video playback

**Example:**
```typescript
// Product demonstration video
const demoVideo = getVideoUrl('videos/material-8x8-assembly');

// Mobile-optimized video
const mobileVideo = getVideoUrl('videos/installation-guide', 800);

// Video component
const ProductVideo = ({ videoId }) => {
  return (
    <video controls width="100%">
      <source src={getVideoUrl(videoId)} type="video/mp4" />
      Your browser does not support video playback.
    </video>
  );
};
```

### getVideoThumbnailUrl

**Extract thumbnail images from videos.**

Generates static thumbnails from video frames, useful for video previews and lazy loading.

**Parameters:**
- `publicId` (string) - Cloudinary public ID for video
- `width` (number) - Thumbnail width (default: 200)
- `height` (number) - Thumbnail height (default: 200)

**Returns:** Cloudinary URL for video thumbnail

**Example:**
```typescript
// Video thumbnail for gallery
const thumbnail = getVideoThumbnailUrl('videos/led-demo', 300, 200);

// Video player with custom thumbnail
const VideoPlayer = ({ videoId }) => {
  const [playing, setPlaying] = useState(false);
  const thumbnail = getVideoThumbnailUrl(videoId, 800, 450);
  const video = getVideoUrl(videoId);
  
  if (!playing) {
    return (
      <div 
        className="relative cursor-pointer"
        onClick={() => setPlaying(true)}
      >
        <img src={thumbnail} alt="Video thumbnail" />
        <PlayButton />
      </div>
    );
  }
  
  return <video src={video} autoPlay controls />;
};
```

### getPlaceholderImageUrl

**Generate fallback placeholder images.**

Creates data URL placeholders when Cloudinary images aren't available. Prevents broken image icons in your UI.

**Parameters:**
- `width` (number) - Placeholder width (default: 400)
- `height` (number) - Placeholder height (default: 400)

**Returns:** Data URL for gray placeholder rectangle

**Example:**
```typescript
// Product card with guaranteed image
const ProductCard = ({ product }) => {
  const imageUrl = product.cloudinaryPublicId
    ? getThumbnailUrl(product.cloudinaryPublicId)
    : getPlaceholderImageUrl(400, 400);
    
  return <img src={imageUrl} alt={product.name} />;
};

// Loading states
const ImageWithFallback = ({ publicId, alt }) => {
  const [error, setError] = useState(false);
  
  if (error || !isValidCloudinaryId(publicId)) {
    return <img src={getPlaceholderImageUrl()} alt="No image available" />;
  }
  
  return (
    <img 
      src={getThumbnailUrl(publicId)}
      alt={alt}
      onError={() => setError(true)}
    />
  );
};
```

**Implementation Notes:**
Generates SVG data URLs with gray background. Lightweight and renders immediately without network requests.

### getBestImageUrl

**Select the best available image from media arrays.**

Finds the first valid image matching your preferred category, with automatic fallback to any available image.

**Parameters:**
- `media` (Array) - Array of media objects with `cloudinaryPublicId`, `category`, and `deleted` fields
- `category` (string) - Preferred category (default: 'main')
- `transformOptions` (CloudinaryTransformOptions, optional) - Transformations to apply

**Returns:** Best available image URL or placeholder if none found

**Example:**
```typescript
// Product with multiple image categories
const product = {
  media: [
    { cloudinaryPublicId: 'products/item-main', category: 'main' },
    { cloudinaryPublicId: 'products/item-detail-1', category: 'detail' },
    { cloudinaryPublicId: 'products/item-lifestyle', category: 'lifestyle', deleted: true }
  ]
};

// Get main product image
const mainImage = getBestImageUrl(product.media, 'main');

// Get detail image with transformations
const detailImage = getBestImageUrl(product.media, 'detail', {
  width: 800,
  quality: 'auto'
});

// Fallback to any available image
const anyImage = getBestImageUrl(product.media, 'nonexistent'); // Returns first valid image
```

**Implementation Notes:**
Filters out deleted media items automatically. Prefers exact category matches but falls back to any valid image. Returns placeholder if no valid images exist.

## CloudinaryTransformOptions Interface

Configuration object for image transformations:

```typescript
interface CloudinaryTransformOptions {
  width?: number;           // Image width in pixels
  height?: number;          // Image height in pixels
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'pad';
  quality?: number | 'auto'; // 1-100 or 'auto'
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  gravity?: 'auto' | 'center' | 'face';
  dpr?: number | 'auto';    // Device pixel ratio
}
```

**Crop modes:**
- `fill` - Resize and crop to exact dimensions
- `fit` - Resize to fit within dimensions (maintains aspect ratio)
- `scale` - Resize ignoring aspect ratio
- `thumb` - Smart crop focusing on interesting areas
- `pad` - Resize and pad to exact dimensions

## Common Patterns

### Responsive Product Images

```typescript
// Component with multiple breakpoints
const ResponsiveProductImage = ({ publicId, alt }) => {
  return (
    <picture>
      <source 
        media="(min-width: 1200px)" 
        srcSet={getProductImageUrl(publicId, 1200)} 
      />
      <source 
        media="(min-width: 768px)" 
        srcSet={getProductImageUrl(publicId, 800)} 
      />
      <img 
        src={getThumbnailUrl(publicId, 400)} 
        alt={alt}
      />
    </picture>
  );
};
```

### Image Gallery with Lazy Loading

```typescript
const ProductGallery = ({ media }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {media.map((item, index) => (
        <div key={item.id} className="aspect-square">
          <Image
            src={getNextImageUrl(item.cloudinaryPublicId)}
            alt={`Product view ${index + 1}`}
            fill
            className="object-cover"
            loading={index > 3 ? "lazy" : "eager"}
          />
        </div>
      ))}
    </div>
  );
};
```

### Safe Image Loading

```typescript
const SafeImage = ({ publicId, alt, size = 400 }) => {
  if (!isValidCloudinaryId(publicId)) {
    return (
      <img 
        src={getPlaceholderImageUrl(size, size)} 
        alt="Image not available" 
      />
    );
  }
  
  return (
    <img 
      src={getThumbnailUrl(publicId, size)}
      alt={alt}
      onError={(e) => {
        e.currentTarget.src = getPlaceholderImageUrl(size, size);
      }}
    />
  );
};
```

## Error Handling

**Invalid Public IDs:** Functions return placeholder URLs or empty strings rather than throwing errors. Always use `isValidCloudinaryId()` when the source might be unreliable.

**Network Failures:** Implement `onError` handlers for `<img>` tags to fallback to placeholders when Cloudinary is unreachable.

**Missing Transformations:** Invalid transformation options are ignored by Cloudinary. The image loads without the unsupported transformation rather than failing entirely.

## Performance Considerations

**Auto-optimization:** Use `quality: 'auto'` and `format: 'auto'` for best bandwidth/quality balance. Cloudinary serves WebP to supporting browsers, JPEG elsewhere.

**DPR handling:** Set `dpr: 'auto'` for automatic high-DPI display optimization. Cloudinary detects device pixel ratio and serves appropriately sized images.

**Caching:** Cloudinary URLs are immutable when transformations don't change. Safe to cache aggressively in CDNs and browsers.

## Related Modules

- **Product Data Layer** - Uses these utilities for all product image rendering
- **Cart Components** - Thumbnail generation for cart items
- **Next.js Image Integration** - Configured to work with Cloudinary domain
- **Media Management** - Handles upload and organization of Cloudinary assets