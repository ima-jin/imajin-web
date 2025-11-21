# Type Safety Layer - DB to Application Mapping

**Purpose:** Ensure runtime type safety matches TypeScript expectations when data flows from database to application code.

**Created:** 2025-10-24
**Recommendation Source:** Dr. Clean code quality review
**Implementation Phase:** Phase 2.2 (Product Catalog Pages)

---

## Problem Statement

**TypeScript provides compile-time type safety, but the database is a runtime boundary.**

### Risks Without Type Mapping Layer:

1. **Null/Undefined Mismatches**
   ```typescript
   // TypeScript says: Product has `name: string`
   // Database returns: `name: null` (data integrity issue)
   // Runtime: TypeError when accessing product.name.toUpperCase()
   ```

2. **JSON Field Parsing**
   ```typescript
   // Database stores: `specs: '{"key":"value"}'` (string)
   // TypeScript expects: `specs: ProductSpec[]` (array of objects)
   // Runtime: Using string methods on array = crash
   ```

3. **Type Coercion Issues**
   ```typescript
   // Database returns: `price: "3500"` (string from JSONB)
   // TypeScript expects: `price: number`
   // Runtime: Math operations fail
   ```

4. **Missing Fields**
   ```typescript
   // TypeScript: `category: "material" | "connector" | ...`
   // Database: `category: "unknown_type"` (bad data)
   // Runtime: Switch statement falls through to default
   ```

---

## Solution: Type Mapper/Validator Layer

### Architecture

```
Database (Drizzle)
      ↓
   DB Types (raw from Drizzle schema)
      ↓
 [MAPPER LAYER] ← Runtime validation with Zod
      ↓
  App Types (validated, guaranteed safe)
      ↓
  Application Code (components, services)
```

---

## Implementation Pattern

### 1. Define Separate Type Spaces

**DB Types** (from Drizzle):
```typescript
// db/schema.ts
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  base_price_cents: integer('base_price_cents').notNull(),
  specs: jsonb('specs'), // Raw JSONB
  metadata: jsonb('metadata'),
});

export type DbProduct = typeof products.$inferSelect;
// { id: string; name: string; base_price_cents: number; specs: unknown; metadata: unknown }
```

**Application Types** (validated):
```typescript
// types/product.ts
export interface Product {
  id: string;
  name: string;
  basePrice: number; // Camel case
  specs: ProductSpec[]; // Parsed and typed
  metadata: ProductMetadata; // Structured
}

export interface ProductSpec {
  key: string;
  value: string;
  unit?: string;
  displayOrder: number;
}
```

### 2. Create Mapper Layer

**Location:** `lib/mappers/product-mapper.ts`

```typescript
import { z } from "zod";
import type { DbProduct } from "@/db/schema";
import type { Product, ProductSpec } from "@/types/product";

// Runtime validation schemas
const ProductSpecSchema = z.object({
  key: z.string(),
  value: z.string(),
  unit: z.string().optional(),
  display_order: z.number(),
});

const ProductMetadataSchema = z.record(z.string(), z.unknown());

/**
 * Maps database product to application product with runtime validation
 * @throws {Error} if data doesn't match expected types
 */
export function mapDbProductToProduct(dbProduct: DbProduct): Product {
  // Validate JSONB fields
  const specsRaw = dbProduct.specs;
  const metadataRaw = dbProduct.metadata;

  // Parse and validate specs
  let specs: ProductSpec[] = [];
  if (specsRaw) {
    const parsed = Array.isArray(specsRaw) ? specsRaw : [];
    specs = z.array(ProductSpecSchema).parse(parsed);
  }

  // Parse and validate metadata
  let metadata = {};
  if (metadataRaw) {
    metadata = ProductMetadataSchema.parse(metadataRaw);
  }

  // Map to application type
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    basePrice: dbProduct.base_price_cents, // Snake to camel case
    specs: specs.map((s) => ({
      key: s.key,
      value: s.value,
      unit: s.unit,
      displayOrder: s.display_order, // Snake to camel
    })),
    metadata,
  };
}

/**
 * Maps array of DB products with error handling
 */
export function mapDbProductsToProducts(
  dbProducts: DbProduct[]
): Product[] {
  const results: Product[] = [];
  const errors: Array<{ id: string; error: string }> = [];

  for (const dbProduct of dbProducts) {
    try {
      results.push(mapDbProductToProduct(dbProduct));
    } catch (error) {
      errors.push({
        id: dbProduct.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (errors.length > 0) {
    console.error("Product mapping errors:", errors);
    // Log to error tracking service (Sentry, etc.)
  }

  return results;
}
```

### 3. Use Mapper in Service Layer

**Before (Unsafe):**
```typescript
// lib/services/product-service.ts
export async function getAllProducts() {
  const dbProducts = await db.select().from(products);
  return dbProducts; // ❌ Returning raw DB types
}
```

**After (Safe):**
```typescript
// lib/services/product-service.ts
import { mapDbProductsToProducts } from "@/lib/mappers/product-mapper";

export async function getAllProducts(): Promise<Product[]> {
  const dbProducts = await db.select().from(products);
  return mapDbProductsToProducts(dbProducts); // ✅ Validated app types
}
```

---

## Benefits

### 1. **Runtime Safety**
- Catch type mismatches at the boundary (not in components)
- Validate JSON fields before they reach application code
- Handle null/undefined explicitly

### 2. **Clear Separation of Concerns**
```
DB Layer     → Snake case, nullable, JSONB strings
Mapper Layer → Validation, parsing, transformation
App Layer    → Camel case, non-null, typed objects
```

### 3. **Better Error Messages**
```typescript
// Without mapper:
TypeError: Cannot read property 'toUpperCase' of null
  at ProductCard.tsx:42

// With mapper:
ValidationError: Product "Material-8x8-V" has invalid specs field
  at product-mapper.ts:23
Expected: array, received: string
```

### 4. **Single Source of Validation**
- All DB → App transformations go through mapper
- Consistent validation logic
- Easy to test in isolation

### 5. **Future-Proof**
- Add new fields without breaking existing code
- Change DB structure without touching components
- Migrate to different ORM easier

---

## Testing Strategy

### Unit Tests

**File:** `tests/unit/lib/mappers/product-mapper.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { mapDbProductToProduct } from "@/lib/mappers/product-mapper";

describe("mapDbProductToProduct", () => {
  it("maps valid DB product to application product", () => {
    const dbProduct = {
      id: "Material-8x8-V",
      name: "8x8 Void Panel",
      base_price_cents: 3500,
      specs: [
        { key: "voltage", value: "5", unit: "v", display_order: 1 },
      ],
      metadata: { year: 2024 },
    };

    const result = mapDbProductToProduct(dbProduct);

    expect(result.id).toBe("Material-8x8-V");
    expect(result.basePrice).toBe(3500); // Camel case
    expect(result.specs).toHaveLength(1);
    expect(result.specs[0].displayOrder).toBe(1); // Camel case
  });

  it("throws error on invalid specs field", () => {
    const dbProduct = {
      id: "test",
      name: "Test",
      base_price_cents: 100,
      specs: "invalid string", // Should be array
      metadata: {},
    };

    expect(() => mapDbProductToProduct(dbProduct)).toThrow();
  });

  it("handles null specs gracefully", () => {
    const dbProduct = {
      id: "test",
      name: "Test",
      base_price_cents: 100,
      specs: null,
      metadata: null,
    };

    const result = mapDbProductToProduct(dbProduct);

    expect(result.specs).toEqual([]);
    expect(result.metadata).toEqual({});
  });
});
```

### Integration Tests

Test that service layer correctly uses mappers:

```typescript
// tests/integration/services/product-service.test.ts
it("returns validated product types from database", async () => {
  const products = await getAllProducts();

  expect(products).toBeInstanceOf(Array);
  expect(products[0]).toHaveProperty("basePrice"); // Camel case
  expect(typeof products[0].basePrice).toBe("number");
  expect(Array.isArray(products[0].specs)).toBe(true);
});
```

---

## Common Mapper Patterns

### 1. Snake Case → Camel Case

```typescript
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
```

### 2. Parse JSONB Fields

```typescript
function parseJsonField<T>(
  field: unknown,
  schema: z.ZodSchema<T>,
  defaultValue: T
): T {
  if (!field) return defaultValue;
  try {
    return schema.parse(field);
  } catch (error) {
    console.error("JSON parse error:", error);
    return defaultValue;
  }
}
```

### 3. Handle Enums

```typescript
function mapCategory(dbCategory: string | null): ProductCategory {
  const validCategories = ["material", "connector", "control", "diffuser", "kit"];

  if (!dbCategory || !validCategories.includes(dbCategory)) {
    throw new Error(`Invalid category: ${dbCategory}`);
  }

  return dbCategory as ProductCategory;
}
```

### 4. Date Transformations

```typescript
function mapDates(dbProduct: DbProduct) {
  return {
    createdAt: new Date(dbProduct.created_at),
    updatedAt: dbProduct.updated_at ? new Date(dbProduct.updated_at) : null,
  };
}
```

---

## Implementation Checklist

**Phase 2.2 Pre-work:**

- [ ] Create `lib/mappers/` directory
- [ ] Create `lib/mappers/product-mapper.ts`
- [ ] Define validation schemas for JSONB fields (specs, metadata)
- [ ] Implement `mapDbProductToProduct()` function
- [ ] Implement `mapDbProductsToProducts()` with error handling
- [ ] Create mappers for variants, dependencies, specs tables
- [ ] Update product service to use mappers
- [ ] Write unit tests for all mapper functions
- [ ] Write integration tests verifying end-to-end type safety
- [ ] Document mapper patterns in this file

**For Each New Table:**
1. Create mapper in `lib/mappers/[table]-mapper.ts`
2. Add runtime validation schemas
3. Handle null/undefined cases
4. Test with valid and invalid data
5. Update service layer to use mapper

---

## When NOT to Use Mappers

**Skip mappers for:**
- Simple lookup tables (no JSONB, all fields non-null)
- Internal admin tools (less critical)
- Migration scripts (different validation needs)

**Always use mappers for:**
- Public-facing API responses
- Data used in React components
- Shopping cart / checkout flows
- Anything involving money or inventory

---

## Error Handling Strategy

### Development
```typescript
// Throw errors - fail fast
if (!isValid) {
  throw new Error(`Invalid product data: ${productId}`);
}
```

### Production
```typescript
// Log errors, return safe defaults or filter out bad data
try {
  return mapDbProductToProduct(dbProduct);
} catch (error) {
  logger.error("Product mapping failed", { productId, error });
  // Return null or skip this product
  return null;
}
```

---

## Maintenance

**When adding new fields:**
1. Add to DB schema
2. Add to application type
3. Update mapper function
4. Update mapper tests
5. Check all uses of the type

**When changing field types:**
1. Create database migration
2. Update mapper validation
3. Update tests
4. Deploy mapper changes before DB migration

---

## Future Enhancements

**Possible additions:**
- Auto-generate mappers from Drizzle schema (code generation)
- Performance optimization (batch validation)
- Mapper composition (reusable field mappers)
- Custom error types for better error handling
- Schema versioning for API backward compatibility

---

**This layer is critical for production reliability. Don't skip it!**

**Last Updated:** 2025-10-24
**Status:** To be implemented in Phase 2.2
**Owner:** Development Team + Dr. Clean (Quality Review)
