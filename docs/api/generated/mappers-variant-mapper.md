# Variant Mapper

**Transforms database variant records into application-ready format**

The variant mapper handles the conversion between raw database records (snake_case columns) and application types (camelCase properties). This module ensures consistent data formatting across the platform while providing type safety and error handling.

## Purpose

Database queries return raw records with snake_case column names and potentially null values. The application needs properly typed, camelCase objects with parsed JSON fields and proper type coercion. The variant mapper bridges this gap, converting `DbVariant` records from Drizzle ORM into clean `Variant` objects ready for use in React components and business logic.

This separation allows the database schema to evolve independently of application code while maintaining type safety throughout the data flow.

## Functions Reference

### mapDbVariantToVariant

**Converts a single database variant record to application format**

Transforms raw database output into a properly typed application object with parsed media arrays and normalized properties.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `dbVariant` | `DbVariant` | Raw variant record from database query |

#### Returns

`Variant` - Application-ready variant object with camelCase properties and parsed JSON fields

#### Example

```typescript
import { mapDbVariantToVariant } from '@/lib/mappers/variant-mapper';

// Raw database record from Drizzle query
const dbVariant = {
  id: 'var_123',
  productId: 'prod_456',
  stripeProductId: 'prod_stripe_789',
  variantType: 'color',
  variantValue: 'BLACK',
  priceModifier: 0,
  wholesalePriceModifier: -50,
  presaleDepositModifier: null,
  isLimitedEdition: true,
  maxQuantity: 500,
  soldQuantity: 127,
  availableQuantity: 373,
  isAvailable: true,
  media: JSON.stringify([
    { type: 'image', url: 'https://cdn.imajin.ca/variants/black-panel.jpg' }
  ]),
  metadata: JSON.stringify({ warranty: '10-year', includes_nft: true }),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15')
};

// Convert to application format
const variant = mapDbVariantToVariant(dbVariant);

// Now ready for use in components
console.log(variant.media); // Array of MediaItem objects
console.log(variant.availableQuantity); // 373
console.log(variant.isLimitedEdition); // true
```

#### Error Handling

The function validates required fields and throws descriptive errors for missing data:

- **Missing ID**: Throws error if variant ID is null or undefined
- **Invalid JSON**: Logs warning and returns empty array/object for malformed media/metadata
- **Type coercion**: Handles null database values gracefully with fallback defaults

```typescript
// Handle mapping errors
try {
  const variant = mapDbVariantToVariant(dbVariant);
  // Use variant safely
} catch (error) {
  console.error('Failed to map variant:', error.message);
  // Handle error appropriately
}
```

#### Implementation Notes

- **JSON parsing**: Media and metadata fields are parsed from JSON strings with fallback handling
- **Null handling**: Database nulls are preserved as application nulls (no arbitrary defaults)
- **Type safety**: Full TypeScript type checking ensures proper field mapping
- **Performance**: Direct property assignment avoids unnecessary object manipulation

### mapDbVariantsToVariants

**Converts an array of database variants to application format with error resilience**

Processes multiple variant records while gracefully handling individual mapping failures. Failed variants are logged and skipped rather than breaking the entire operation.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `dbVariants` | `DbVariant[]` | Array of raw variant records from database query |

#### Returns

`Variant[]` - Array of successfully mapped variants in application format

#### Example

```typescript
import { mapDbVariantsToVariants } from '@/lib/mappers/variant-mapper';

// Multiple database records from product query
const dbVariants = [
  { id: 'var_black', variantValue: 'BLACK', /* ...other fields */ },
  { id: 'var_white', variantValue: 'WHITE', /* ...other fields */ },
  { id: null, variantValue: 'RED', /* ...invalid record */ }
];

// Convert all valid variants
const variants = mapDbVariantsToVariants(dbVariants);

// Returns 2 valid variants (invalid one is skipped and logged)
console.log(variants.length); // 2
console.log(variants[0].variantValue); // 'BLACK'
console.log(variants[1].variantValue); // 'WHITE'
```

#### Error Handling

Individual variant mapping errors are caught and logged without stopping the entire operation:

```typescript
// Robust batch processing
const variants = mapDbVariantsToVariants(potentiallyMixedData);

// Always returns an array (empty if all failed)
variants.forEach(variant => {
  // Only valid, properly mapped variants reach here
  console.log(`${variant.variantValue}: ${variant.availableQuantity} available`);
});
```

#### Implementation Notes

- **Fault tolerance**: One bad record doesn't break the entire batch
- **Logging**: Failed mappings are logged with variant ID for debugging
- **Empty results**: Returns empty array if all variants fail to map
- **Maintains order**: Successfully mapped variants preserve original array order

## Type Definitions

### DbVariant

Database variant type returned by Drizzle ORM with camelCase TypeScript properties mapped from snake_case database columns.

```typescript
interface DbVariant {
  id: string;
  productId: string;
  stripeProductId: string;
  variantType: string;           // 'color', 'voltage', 'assembly'
  variantValue: string;          // 'BLACK', '5v', 'diy-kit'
  priceModifier: number | null;
  wholesalePriceModifier: number | null;
  presaleDepositModifier: number | null;
  isLimitedEdition: boolean | null;
  maxQuantity: number | null;
  soldQuantity: number | null;
  availableQuantity: number | null;
  isAvailable: boolean | null;
  media: unknown;                // JSON string from database
  metadata: unknown;             // JSON string from database
  createdAt: Date | null;
  updatedAt: Date | null;
}
```

### Variant

Application variant type with parsed JSON fields and proper TypeScript types.

```typescript
interface Variant {
  id: string;
  productId: string;
  stripeProductId: string;
  variantType: string;
  variantValue: string;
  priceModifier: number | null;
  wholesalePriceModifier: number | null;
  presaleDepositModifier: number | null;
  isLimitedEdition: boolean | null;
  maxQuantity: number | null;
  soldQuantity: number | null;
  availableQuantity: number | null;
  isAvailable: boolean | null;
  media: MediaItem[];            // Parsed JSON array
  metadata: unknown;             // Parsed JSON object
  createdAt: Date | null;
  updatedAt: Date | null;
}
```

## Common Patterns

### Product Variant Loading

```typescript
// Typical usage in product loading
async function loadProductWithVariants(productId: string) {
  const dbVariants = await db
    .select()
    .from(variants)
    .where(eq(variants.productId, productId));
  
  return mapDbVariantsToVariants(dbVariants);
}
```

### Cart Integration

```typescript
// Safe variant data for cart operations
const variant = mapDbVariantToVariant(dbVariant);

const cartItem = {
  variantId: variant.id,
  productId: variant.productId,
  stripeProductId: variant.stripeProductId,
  quantity: requestedQuantity,
  maxQuantity: variant.maxQuantity,
  isLimitedEdition: variant.isLimitedEdition
};
```

### Error Boundaries

```typescript
// Component-level error handling
function VariantSelector({ dbVariants }: { dbVariants: DbVariant[] }) {
  const variants = useMemo(() => {
    try {
      return mapDbVariantsToVariants(dbVariants);
    } catch (error) {
      console.error('Variant mapping failed:', error);
      return [];
    }
  }, [dbVariants]);

  if (variants.length === 0) {
    return <div>No variants available</div>;
  }

  return <VariantOptions variants={variants} />;
}
```

## Best Practices

- **Always handle errors**: Mapping can fail with malformed database data
- **Validate before use**: Check for required properties after mapping
- **Batch when possible**: Use array mapper for multiple variants
- **Log failures**: Monitor mapping errors for data quality issues
- **Type safety**: Let TypeScript catch property mismatches

## Related Modules

- **Product Mapper** - Handles main product record transformation
- **Database Schema** - Defines the underlying variant table structure  
- **Cart System** - Consumes mapped variant data for checkout flows
- **Inventory Management** - Uses variant availability data for stock control