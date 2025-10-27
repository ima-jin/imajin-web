# Phase 2.2 - Product Catalog Pages

**Assigned To:** Dr. LeanDev
**Status:** Pending
**Phase:** 2.2 E-commerce Core

---

## Objective

Implement infrastructure improvements (test DB, type safety) then build product catalog pages. Follow TDD per TESTING_STRATEGY.md.

---

## Reference Documents

- IMPLEMENTATION_PLAN.md section 2.2
- COMPONENT_ARCHITECTURE.md
- API_ROUTES.md
- TYPE_SAFETY_LAYER.md (new)
- TESTING_STRATEGY.md
- DATABASE_SCHEMA.md

---

## Part 1: Pre-work - Infrastructure Improvements

### A. Test Database Setup (QA Recommendation)

**1. Create test database:**
```bash
# Connect to PostgreSQL container
docker exec -it imajin-db-local psql -U imajin -d postgres

# Create test database
CREATE DATABASE imajin_test;
\q
```

**2. Create `.env.test`:**
```env
# Test Environment
NODE_ENV=test
DATABASE_URL=postgresql://imajin:imajin_dev@localhost:5435/imajin_test
```

**3. Update `vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      // Use test database when running tests
      DATABASE_URL: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
    },
    setupFiles: ['./tests/setup/vitest.setup.ts'],
  },
});
```

**4. Update `playwright.config.ts`:**
```typescript
// Add to config
use: {
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
},
env: {
  DATABASE_URL: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
},
```

**5. Add test DB scripts to `package.json`:**
```json
{
  "scripts": {
    "db:seed": "tsx scripts/seed-db.ts",
    "db:sync": "tsx scripts/sync-products.ts",
    "test:db:create": "docker exec -it imajin-db-local psql -U imajin -d postgres -c 'CREATE DATABASE imajin_test;'",
    "test:db:reset": "tsx scripts/reset-test-db.ts",
    "test:db:seed": "DATABASE_URL=postgresql://imajin:imajin_dev@localhost:5435/imajin_test tsx scripts/sync-products.ts"
  }
}
```

**6. Create `scripts/reset-test-db.ts`:**
```typescript
// Drop all tables in test database and recreate schema
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function resetTestDatabase() {
  console.log('Resetting test database...');

  // Drop all tables
  await db.execute(sql`DROP SCHEMA public CASCADE;`);
  await db.execute(sql`CREATE SCHEMA public;`);

  // Run migrations
  // (add migration logic here)

  console.log('Test database reset complete');
}

resetTestDatabase();
```

**7. Update TESTING_STRATEGY.md:**
Add section on test database setup and usage.

---

### B. Type Safety Layer (Dr. Clean Recommendation)

**Reference:** `docs/TYPE_SAFETY_LAYER.md` for detailed patterns

**1. Create `lib/mappers/product-mapper.ts`:**

```typescript
import { z } from "zod";
import type { DbProduct } from "@/db/schema";
import type { Product } from "@/types/product";

// Runtime validation for JSONB fields
const ProductSpecSchema = z.object({
  key: z.string(),
  value: z.string(),
  unit: z.string().optional(),
  display_order: z.number(),
});

/**
 * Maps database product to application product with validation
 */
export function mapDbProductToProduct(dbProduct: DbProduct): Product {
  // Parse and validate specs (JSONB field)
  let specs = [];
  if (dbProduct.specs) {
    const parsed = Array.isArray(dbProduct.specs) ? dbProduct.specs : [];
    specs = z.array(ProductSpecSchema).parse(parsed);
  }

  // Parse metadata (JSONB field)
  let metadata = {};
  if (dbProduct.metadata) {
    metadata = z.record(z.string(), z.unknown()).parse(dbProduct.metadata);
  }

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    category: dbProduct.category,
    devStatus: dbProduct.dev_status, // Snake to camel
    basePrice: dbProduct.base_price, // Snake to camel
    stripeProductId: dbProduct.stripe_product_id, // Snake to camel
    hasVariants: dbProduct.has_variants,
    images: dbProduct.images,
    specs: specs.map(s => ({
      key: s.key,
      value: s.value,
      unit: s.unit,
      displayOrder: s.display_order, // Snake to camel
    })),
    metadata,
  };
}

/**
 * Maps array with error handling
 */
export function mapDbProductsToProducts(dbProducts: DbProduct[]): Product[] {
  const results = [];
  const errors = [];

  for (const dbProduct of dbProducts) {
    try {
      results.push(mapDbProductToProduct(dbProduct));
    } catch (error) {
      errors.push({ id: dbProduct.id, error });
      console.error(`Product mapping error [${dbProduct.id}]:`, error);
    }
  }

  return results;
}
```

**2. Create mappers for variants and dependencies:**
- `lib/mappers/variant-mapper.ts`
- `lib/mappers/dependency-mapper.ts`

**3. Update product service to use mappers:**

```typescript
// lib/services/product-service.ts
import { mapDbProductsToProducts } from '@/lib/mappers/product-mapper';

export async function getAllProducts(): Promise<Product[]> {
  const dbProducts = await db.select().from(products).where(eq(products.dev_status, 5));
  return mapDbProductsToProducts(dbProducts); // ✅ Type-safe
}
```

**4. Write mapper tests:**

```typescript
// tests/unit/lib/mappers/product-mapper.test.ts
describe('mapDbProductToProduct', () => {
  it('maps valid DB product', () => {
    const dbProduct = {
      id: 'test',
      name: 'Test',
      base_price: 100,
      dev_status: 5,
      specs: [{ key: 'test', value: '1', display_order: 1 }],
      metadata: {},
    };

    const result = mapDbProductToProduct(dbProduct);

    expect(result.basePrice).toBe(100); // Camel case
    expect(result.specs[0].displayOrder).toBe(1); // Camel case
  });

  it('throws on invalid specs', () => {
    const dbProduct = {
      id: 'test',
      base_price: 100,
      specs: "invalid", // Should be array
    };

    expect(() => mapDbProductToProduct(dbProduct)).toThrow();
  });
});
```

---

### C. Terminology Fix

**Rename in `package.json`:**
```json
{
  "scripts": {
    "db:seed": "tsx scripts/seed-db.ts",
    "db:sync": "tsx scripts/sync-products.ts"
  }
}
```

---

## Part 2: Product Catalog Pages

### A. API Routes (Server-side)

**1. `app/api/products/route.ts`** - GET all products
```typescript
import { getAllProducts } from '@/lib/services/product-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const products = await getAllProducts({ category });

    return Response.json({ products });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
```

**2. `app/api/products/[id]/route.ts`** - GET single product
```typescript
import { getProductById } from '@/lib/services/product-service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getProductById(params.id);

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({ product });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
```

---

### B. Homepage (`app/page.tsx`)

**Server Component - Featured Products**

```typescript
import { getFeaturedProducts } from '@/lib/services/product-service';
import { ProductGrid } from '@/components/products/ProductGrid';
import { HeroSection } from '@/components/home/HeroSection';

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <main className="min-h-screen bg-white">
      <HeroSection product={featuredProducts[0]} /> {/* Founder Edition */}

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
        <ProductGrid products={featuredProducts} />
      </section>
    </main>
  );
}
```

---

### C. Product Listing Page (`app/products/page.tsx`)

**Server Component with Filtering**

```typescript
import { getAllProducts } from '@/lib/services/product-service';
import { ProductGrid } from '@/components/products/ProductGrid';
import { CategoryFilter } from '@/components/products/CategoryFilter';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const products = await getAllProducts({
    category: searchParams.category,
    devStatus: 5, // Only show ready products
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Products</h1>

        <CategoryFilter currentCategory={searchParams.category} />

        <ProductGrid products={products} />
      </div>
    </main>
  );
}
```

---

### D. Product Detail Page (`app/products/[slug]/page.tsx`)

**Server Component with Client Interactive Elements**

```typescript
import { getProductBySlug } from '@/lib/services/product-service';
import { ProductImages } from '@/components/products/ProductImages';
import { ProductSpecs } from '@/components/products/ProductSpecs';
import { AddToCartSection } from '@/components/products/AddToCartSection'; // Client Component
import { VariantSelector } from '@/components/products/VariantSelector'; // Client Component
import { LimitedEditionBadge } from '@/components/products/LimitedEditionBadge';
import { DependencyWarning } from '@/components/products/DependencyWarning';

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left: Images */}
          <ProductImages images={product.images} name={product.name} />

          {/* Right: Details */}
          <div>
            {product.isLimitedEdition && (
              <LimitedEditionBadge remainingQuantity={product.remainingQuantity} />
            )}

            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <p className="text-xl mb-6">{product.description}</p>
            <p className="text-3xl font-bold mb-8">${(product.basePrice / 100).toFixed(2)}</p>

            {product.hasVariants && (
              <VariantSelector
                productId={product.id}
                variants={product.variants}
              />
            )}

            <AddToCartSection product={product} />

            {product.dependencies?.length > 0 && (
              <DependencyWarning dependencies={product.dependencies} />
            )}

            <ProductSpecs specs={product.specs} />
          </div>
        </div>
      </div>
    </main>
  );
}
```

---

### E. Shared Components

**Required Components:**

1. **`components/products/ProductCard.tsx`** (Server Component)
```typescript
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types/product';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
        <div className="relative h-64">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition"
          />
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2">{product.name}</h3>
          <p className="text-gray-600 text-sm mb-4">{product.description}</p>
          <p className="text-xl font-bold">${(product.basePrice / 100).toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}
```

2. **`components/products/ProductGrid.tsx`** (Server Component)
   - Grid layout for product cards
   - Responsive (1 col mobile, 2 col tablet, 3-4 col desktop)

3. **`components/products/ProductSpecs.tsx`** (Server Component)
   - Display technical specifications table
   - Format with units

4. **`components/products/VariantSelector.tsx`** (Client Component - interactive)
   - Dropdown or button group for color selection
   - Update selected variant in state
   - Show variant-specific images

5. **`components/products/AddToCartSection.tsx`** (Client Component - interactive)
   - Quantity input
   - Add to cart button
   - Handle cart state update (Phase 2.3 will implement cart)
   - For now: just console.log or show alert

6. **`components/products/LimitedEditionBadge.tsx`** (Server Component)
   - Show "Limited Edition" badge
   - Display "X remaining" or "Sold Out"
   - Styling: prominent, eye-catching

7. **`components/products/DependencyWarning.tsx`** (Client Component - conditional display)
   - Show voltage compatibility warnings
   - Display "requires" and "suggests" messages
   - Alert styling for incompatibilities

8. **`components/products/CategoryFilter.tsx`** (Client Component)
   - Filter buttons/links for categories
   - Highlight active category
   - Update URL search params

9. **`components/home/HeroSection.tsx`** (Server Component)
   - Hero banner for Founder Edition
   - Large image, prominent CTA

10. **`components/products/ProductImages.tsx`** (Client Component)
    - Image gallery with thumbnails
    - Click to enlarge
    - Swipe on mobile

---

## Testing Requirements (TDD)

**Write tests BEFORE implementation:**

### Unit Tests

**Mappers:**
- `tests/unit/lib/mappers/product-mapper.test.ts`
  - Maps valid DB product to app product
  - Handles null specs/metadata
  - Throws on invalid JSONB fields
  - Converts snake_case to camelCase

**Services:**
- `tests/unit/lib/services/product-service.test.ts`
  - getAllProducts returns filtered, mapped products
  - getProductById returns single mapped product
  - getFeaturedProducts returns correct products

### Integration Tests

**API Routes:**
- `tests/integration/api/products/route.test.ts`
  - GET /api/products returns array of products
  - GET /api/products?category=material filters correctly
  - GET /api/products/[id] returns single product
  - Returns 404 for non-existent product

**Database Queries:**
- `tests/integration/db/product-queries.test.ts`
  - Query products with mapper returns valid types
  - JSONB fields parsed correctly
  - Relations (variants, dependencies) loaded

### Component Tests

- `tests/unit/components/products/ProductCard.test.tsx`
  - Renders product info correctly
  - Formats price properly
  - Links to correct product detail page

- `tests/unit/components/products/VariantSelector.test.tsx`
  - Displays all variants
  - Updates selection on click
  - Shows selected variant

### E2E Tests

- `tests/e2e/products/product-listing.spec.ts`
  - Navigate to /products
  - See list of products
  - Filter by category
  - Click product to view detail

- `tests/e2e/products/product-detail.spec.ts`
  - Navigate to product detail page
  - See product name, price, specs
  - Select variant (Founder Edition)
  - See limited edition badge
  - See dependency warnings

---

## Architecture Notes

**Server vs Client Components:**
- **Server by default** - Use for static content, data fetching
- **Client only when needed** - Interactivity, state, browser APIs

**Server Components:**
- Page components (page.tsx files)
- ProductCard, ProductGrid, ProductSpecs
- LimitedEditionBadge, HeroSection
- Data fetching happens here

**Client Components:**
- VariantSelector (interactive dropdown)
- AddToCartSection (button with state)
- DependencyWarning (conditional display)
- CategoryFilter (updates URL)
- ProductImages (gallery interactions)

**Type Safety:**
- All DB queries go through mappers
- Mappers validate JSONB fields with Zod
- Application code receives validated, typed data
- No raw DB types in components

---

## Design Direction

**Per project requirements:**
- **Product pages:** White backgrounds (clean, modern)
- **Layout:** Grid-based, responsive
- **Typography:** Clear hierarchy, readable
- **Images:** Next.js Image component (optimization)
- **Interactions:** Subtle hover effects, smooth transitions
- **Badges:** Prominent for limited edition
- **Warnings:** Alert-style for dependencies

**Keep it simple:** No complex animations or effects. Focus on product.

---

## Success Criteria

### Pre-work Complete:
- [ ] Test database `imajin_test` created
- [ ] `.env.test` configured
- [ ] Test configs updated (vitest, playwright)
- [ ] `test:db:reset` script working
- [ ] Mapper layer implemented
- [ ] Mapper tests passing
- [x] Scripts reorganized (`db:seed`, `db:sync`)

### Catalog Pages Complete:
- [ ] Homepage displays featured products
- [ ] Product listing page shows all products (dev_status=5)
- [ ] Category filtering works
- [ ] Product detail page fully functional
- [ ] Variant selector works (Founder Edition colors)
- [ ] Limited edition badges show correctly
- [ ] Dependency warnings display
- [ ] All pages responsive (mobile/tablet/desktop)
- [ ] All components follow Server/Client pattern

### Code Quality:
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All tests passing (unit + integration + E2E)
- [ ] Mapper layer used for all DB queries
- [ ] Proper error handling in API routes
- [ ] Lean, legible, intuitive code (Dr. Clean standards)

### Testing:
- [ ] All mapper tests passing
- [ ] All service tests passing
- [ ] All component tests passing
- [ ] All API route tests passing
- [ ] All E2E tests passing
- [ ] Tests run against `imajin_test` database

---

## Completion Report

**Report back with:**
1. Summary of implementation
2. Test results (`npm run test`, `npm run test:e2e`)
3. Screenshots of:
   - Homepage
   - Product listing page
   - Product detail page (with variants)
   - Limited edition badge
   - Dependency warning
4. Any deviations from plan (with rationale)
5. Any blockers or decisions needed
6. Confirmation ready for Phase 2.3

---

## Notes

**Priority Order:**
1. Pre-work (test DB + mappers) - Foundation for everything
2. API routes - Data layer
3. Homepage - First user touchpoint
4. Product listing - Browse experience
5. Product detail - Deep dive into product

**Work Incrementally:**
- Get one page working end-to-end before moving to next
- Test each component as you build it
- Commit frequently with clear messages (via Dr. Git)

**Ask Questions:**
- If design decisions needed, ask before assuming
- If business rules unclear, check PRODUCT_CATALOG.md
- If architecture unclear, check COMPONENT_ARCHITECTURE.md

---

**Good luck, Dr. LeanDev! This is a significant phase. Take your time, test thoroughly, and build it right.**

**Status:** Ready to begin
**Last Updated:** 2025-10-24
