# utils/media-parser

**Handles media data normalization from database JSONB fields with field name compatibility and sensible fallbacks.**

## Overview

The media-parser module solves the problem of inconsistent media data structures stored in PostgreSQL JSONB fields. Database records might use snake_case field names while TypeScript expects camelCase, or they might have missing optional fields that break type safety.

This module provides a single function that normalizes any media array structure into properly typed `MediaItem[]` objects with guaranteed field presence and correct naming conventions.

## Purpose

Database JSONB fields are flexible but unpredictable. Media arrays might come from:
- Legacy data with snake_case field names
- Incomplete records missing optional fields
- External API responses with different structures
- Manual database inserts with inconsistent formatting

The parser ensures your TypeScript code always receives clean, typed media data regardless of the source format.

## Functions Reference

### parseMediaArray

**Normalizes raw database media arrays into typed MediaItem structures with proper fallbacks.**

#### Purpose

Takes unknown media data from database JSONB fields and returns a properly typed array with all required fields populated. Handles both camelCase and snake_case field names, providing sensible defaults for missing optional fields.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `media` | `unknown` | Raw media data from database JSONB field |

#### Returns

`MediaItem[]` - Typed array with normalized field names and guaranteed field presence

#### Example

```typescript
import { parseMediaArray } from '@/lib/utils/media-parser';

// Raw database data (could be snake_case, missing fields, etc.)
const dbProduct = {
  id: 'product-123',
  media: [
    {
      type: 'image',
      url: '/images/product-hero.jpg',
      alt_text: 'LED Panel Front View', // snake_case from DB
      width: 1920,
      height: 1080
      // missing title, description fields
    }
  ]
};

// Parse into clean MediaItem array
const media = parseMediaArray(dbProduct.media);

// Now you have properly typed data with all fields
console.log(media[0].altText); // "LED Panel Front View" (camelCase)
console.log(media[0].title);   // "" (empty string fallback)
console.log(media[0].description); // "" (empty string fallback)
```

#### Error Handling

The function is defensive by design:
- **Invalid input**: Returns empty array `[]` for null, undefined, or non-array input
- **Invalid items**: Skips array items that aren't objects
- **Missing fields**: Provides sensible defaults (empty strings, zero dimensions)
- **Wrong types**: Coerces values to expected types where possible

```typescript
// These all return empty arrays safely
parseMediaArray(null);
parseMediaArray(undefined);
parseMediaArray("not an array");
parseMediaArray([null, "invalid", { incomplete: true }]);
```

#### Implementation Notes

**Field Mapping Strategy**: The parser checks for both camelCase and snake_case versions of each field, preferring camelCase when both exist. This maintains backward compatibility with legacy data while supporting modern API conventions.

**Type Coercion**: Dimensions (`width`, `height`) are coerced to numbers using `Number()` with fallback to 0. String fields get empty string fallbacks rather than undefined to maintain type safety.

**Memory Efficiency**: Creates new objects only when normalization is needed. If input is already properly formatted, minimal object creation occurs.

## Common Patterns

### Product Media Loading

```typescript
// In your product data layer
function getProductWithMedia(productId: string) {
  const dbProduct = await db.select().from(products).where(eq(products.id, productId));
  
  return {
    ...dbProduct,
    media: parseMediaArray(dbProduct.media)
  };
}
```

### Component Props

```typescript
interface ProductGalleryProps {
  media: MediaItem[]; // Always use parsed media in components
}

function ProductGallery({ media }: ProductGalleryProps) {
  return (
    <div className="gallery">
      {media.map((item, index) => (
        <img 
          key={index}
          src={item.url}
          alt={item.altText || item.title} // Safe to access - always strings
          width={item.width || undefined}
          height={item.height || undefined}
        />
      ))}
    </div>
  );
}
```

### Best Practices

**Always Parse at Boundaries**: Parse media arrays as soon as data crosses from database layer to application layer. Don't pass raw database objects to React components.

**Cache Parsed Results**: If the same media array is used multiple times, parse once and reuse the result rather than parsing on every access.

**Type Your Database Schemas**: While this parser handles legacy data, design new database schemas with consistent field naming to minimize normalization overhead.

## Related Modules

- **types/product.ts** - Defines the `MediaItem` interface this parser targets
- **lib/database/products** - Product queries that use this parser for media fields
- **components/ui/ProductGallery** - UI components that expect parsed media arrays

This parser is part of the broader data normalization strategy that ensures clean boundaries between database storage and TypeScript application logic.