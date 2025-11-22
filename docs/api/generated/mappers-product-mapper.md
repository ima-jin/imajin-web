# Product Mapper

Maps database product records to application format, handling type conversions and data validation for the Imajin LED Platform.

## Purpose

The product mapper bridges the gap between database storage and application logic. Database columns use snake_case naming while Drizzle ORM returns camelCase properties. This module ensures consistent data structure throughout the application layer while providing type safety and error handling.

**Key responsibilities:**
- Transform database product records to application types
- Parse and validate media JSON fields
- Handle null values and provide sensible defaults
- Maintain type safety across the data layer boundary

## Types

### DbProduct

Database product type returned by Drizzle ORM queries. Properties are camelCase even though database columns are snake_case.

```typescript
interface DbProduct {
  id: string
  name: string
  description: string | null
  category: string
  devStatus: number
  basePriceCents: number
  isActive: boolean | null
  requiresAssembly: boolean | null
  hasVariants: boolean | null
  maxQuantity: number | null
  maxQuantityPerOrder: number | null
  soldQuantity: number
  availableQuantity: number | null
  isAvailable: boolean | null
  isLive: boolean
  // ... pricing and metadata fields
  media: unknown  // Raw JSON from database
}
```

### Product

Application product type with validated fields and parsed media.

```typescript
interface Product {
  id: string
  name: string
  description: string | null
  category: string
  devStatus: number
  basePriceCents: number
  isActive: boolean | null
  // ... core product fields
  sellStatus: SellStatus
  media: MediaItem[]  // Parsed and validated
  // ... display and metadata fields
}
```

## Functions

### mapDbProductToProduct

**Transforms a single database product record to application format**

Maps database product data to the application's Product type, parsing JSON fields and handling type conversions. This is the core transformation function used throughout the product data layer.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `dbProduct` | `DbProduct` | Product record from database query |

#### Returns

`Product` - Transformed product with parsed media array and validated fields

#### Example

```typescript
import { mapDbProductToProduct } from '@/lib/mappers/product-mapper'

// From a database query
const dbProduct = await db.select().from(products).where(eq(products.id, productId)).get()

// Transform for application use
const product = mapDbProductToProduct(dbProduct)

// Now you have typed, validated data
console.log(product.media[0].url)  // Type-safe media access
console.log(product.sellStatus)   // Validated SellStatus enum
```

#### Error Handling

The function throws an error if:
- Required fields are missing or invalid
- Media JSON cannot be parsed
- Core product data is corrupted

Wrap calls in try-catch blocks when processing potentially invalid data:

```typescript
try {
  const product = mapDbProductToProduct(dbProduct)
  return product
} catch (error) {
  console.error('Failed to map product:', dbProduct.id, error)
  // Handle gracefully - skip product or return fallback
}
```

#### Implementation Notes

- Media field is parsed from JSON string to MediaItem array
- SellStatus is cast from string to proper enum type
- Optional pricing fields (cost, wholesale) are only included if not null
- Boolean fields retain null values to distinguish "not set" from false

### mapDbProductsToProducts

**Transforms an array of database products, handling errors gracefully**

Processes multiple database product records with built-in error handling. If individual products fail to map (due to data corruption or validation errors), they're skipped rather than breaking the entire operation.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `dbProducts` | `DbProduct[]` | Array of product records from database query |

#### Returns

`Product[]` - Array of successfully mapped products (may be shorter than input if some failed)

#### Example

```typescript
import { mapDbProductsToProducts } from '@/lib/mappers/product-mapper'

// Get all live products from database
const dbProducts = await db
  .select()
  .from(products)
  .where(eq(products.isLive, true))

// Transform all records, skipping any that fail
const liveProducts = mapDbProductsToProducts(dbProducts)

// Use in component or API response
return Response.json({ products: liveProducts })
```

#### Error Handling

Individual mapping errors are logged but don't throw. The function continues processing remaining products:

```typescript
// If you need to know about failures:
const originalCount = dbProducts.length
const mappedProducts = mapDbProductsToProducts(dbProducts)

if (mappedProducts.length < originalCount) {
  console.warn(`Mapped ${mappedProducts.length}/${originalCount} products`)
  // Some products had data issues
}
```

#### Implementation Notes

- Uses `mapDbProductToProduct` internally for each record
- Catches and logs mapping errors without rethrowing
- Maintains order of successfully mapped products
- Suitable for bulk operations where partial success is acceptable

## Common Patterns

### Product Listing Pages

Transform database results for display components:

```typescript
// In your data fetching function
export async function getPublicProducts(): Promise<Product[]> {
  const dbProducts = await db
    .select()
    .from(products)
    .where(and(
      eq(products.isLive, true),
      eq(products.devStatus, 5)
    ))

  return mapDbProductsToProducts(dbProducts)
}
```

### Single Product Pages

Handle individual product queries with error boundaries:

```typescript
export async function getProduct(id: string): Promise<Product | null> {
  const dbProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .get()

  if (!dbProduct) return null

  try {
    return mapDbProductToProduct(dbProduct)
  } catch (error) {
    // Product data is corrupted
    console.error('Product mapping failed:', id, error)
    return null
  }
}
```

### API Route Responses

Transform data at the API boundary:

```typescript
// In app/api/products/route.ts
export async function GET() {
  const dbProducts = await fetchProductsFromDatabase()
  const products = mapDbProductsToProducts(dbProducts)
  
  return Response.json({ products })
}
```

## Best Practices

**Always use the mapper functions** - Don't pass raw database records to components or API responses. The mapper ensures consistent data structure and type safety.

**Handle mapping errors appropriately** - For bulk operations, use `mapDbProductsToProducts` to skip invalid records. For critical single-product flows, use try-catch with `mapDbProductToProduct`.

**Trust the type system** - Once mapped, Product objects are fully typed and validated. You can safely access nested properties like `product.media[0].url` without additional null checks on the media array structure.

## Data Validation

The mapper validates several critical fields:

- **Media parsing** - Ensures media JSON is valid MediaItem array
- **SellStatus casting** - Validates sell_status string matches SellStatus enum
- **Required fields** - Throws if core product data is missing
- **Pricing consistency** - Handles optional pricing fields correctly

Invalid data results in mapping errors rather than corrupted application state.

## Related Modules

- **Product Schema** (`lib/db/schema/products.ts`) - Database table definition
- **Product Types** (`types/product.ts`) - Application type definitions  
- **Product Services** (`lib/services/product-service.ts`) - Business logic layer
- **Product Components** (`components/product/`) - UI components expecting mapped data

The mapper sits between the database layer and all application logic, ensuring clean separation of concerns and consistent data flow.