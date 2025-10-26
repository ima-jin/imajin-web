# Phase 2.3 - Shopping Cart

**Assigned To:** Dr. LeanDev
**Status:** Pending
**Phase:** 2.3 E-commerce Core

---

## Objective

Implement shopping cart functionality with localStorage persistence, server validation, dependency checking (voltage compatibility), and cart UI. Follow TDD per TESTING_STRATEGY.md.

---

## Reference Documents

- IMPLEMENTATION_PLAN.md section 2.3
- COMPONENT_ARCHITECTURE.md (CartProvider pattern)
- API_ROUTES.md (cart validation endpoints)
- DATABASE_SCHEMA.md (product_dependencies table)
- PRODUCT_CATALOG.md (voltage system rules)
- TYPE_SAFETY_LAYER.md (mapper patterns)
- TESTING_STRATEGY.md

---

## Dr. Clean's Critical Reminders

⚠️ **Watch For:**
1. **Mapper pattern consistency** - Create cart-mapper.ts if cart operations touch DB
2. **localStorage + server sync** - Handle race conditions, stale data, hydration mismatches carefully
3. **Dependency validation** - Voltage matching rules (cannot mix 5v and 24v components)
4. **Test coverage ratio** - Maintain 1.5:1 (1.5 lines of test per line of implementation)

---

## Business Rules (Critical)

### Voltage Compatibility
**From PRODUCT_CATALOG.md:**
- **5v system:** Material-8x8-V + 5v connectors + Control-2-5v (max 8-10 panels)
- **24v system:** Material-8x8-V + 24v connectors + Control-8/16-24v (scalable to 64-80 panels)
- **RULE:** Cannot mix 5v and 24v components in same cart/order
- **Implementation:** Check `product_dependencies` table with `type = 'voltage_match'`

### Dependency Types
1. **requires** - Must have this product (e.g., panels require connectors)
2. **suggests** - Recommended but not required (e.g., panels suggest diffusion caps)
3. **incompatible** - Cannot be in same cart (e.g., 5v control + 24v connectors)
4. **voltage_match** - Voltage system must match across all components

### Limited Edition Handling
- Limited edition products (Founder Edition) have finite quantities
- **Don't reserve on add-to-cart** - Only decrement on successful payment (Phase 2.4 webhooks)
- Display "X remaining" in cart if limited edition
- Handle "sold out" state gracefully (show message, disable checkout)

---

## Part 1: Cart State Management

### A. Cart Context Provider

**File:** `components/cart/CartProvider.tsx`

**Requirements:**
- Client Component (`'use client'`)
- Use React Context API (not Zustand for now - keep it simple)
- Persist to localStorage on every change
- Load from localStorage on mount (handle SSR hydration)
- Provide cart operations (add, remove, update, clear)
- Calculate totals automatically

**Implementation:**

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem } from '@/types/cart';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  isHydrated: boolean; // Important for SSR
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount (client-only)
  useEffect(() => {
    const stored = localStorage.getItem('imajin_cart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        localStorage.removeItem('imajin_cart');
      }
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage on change (client-only)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('imajin_cart', JSON.stringify(items));
    }
  }, [items, isHydrated]);

  // Calculate totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Add item to cart
  const addItem = async (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantity = newItem.quantity || 1;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.variantId === newItem.variantId
      );

      if (existingIndex !== -1) {
        // Update existing item quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        // Add new item
        return [...prev, { ...newItem, quantity }];
      }
    });
  };

  // Remove item from cart
  const removeItem = (productId: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && item.variantId === variantId)
      )
    );
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook for accessing cart context
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
```

**Types:**

```typescript
// types/cart.ts
export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number; // In cents
  image: string;
  quantity: number;
  voltage?: '5v' | '24v'; // For dependency validation
  isLimitedEdition?: boolean;
  remainingQuantity?: number; // If limited edition
}

export interface CartValidationResult {
  valid: boolean;
  errors: CartValidationError[];
  warnings: CartWarning[];
}

export interface CartValidationError {
  productId: string;
  variantId?: string;
  type: 'out_of_stock' | 'voltage_mismatch' | 'incompatible' | 'unavailable';
  message: string;
}

export interface CartWarning {
  type: 'missing_component' | 'suggested_product' | 'low_stock';
  message: string;
  suggestedProductId?: string;
}
```

---

### B. Cart Validation Logic

**File:** `lib/services/cart-validator.ts`

**Purpose:** Validate cart contents against business rules (voltage matching, dependencies, availability)

```typescript
import { db } from '@/lib/db';
import { products, variants, productDependencies } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import type { CartItem, CartValidationResult, CartValidationError, CartWarning } from '@/types/cart';

export async function validateCart(items: CartItem[]): Promise<CartValidationResult> {
  const errors: CartValidationError[] = [];
  const warnings: CartWarning[] = [];

  if (items.length === 0) {
    return { valid: true, errors: [], warnings: [] };
  }

  // 1. Check product availability
  const productIds = items.map(item => item.productId);
  const dbProducts = await db.query.products.findMany({
    where: inArray(products.id, productIds),
  });

  const availableProductIds = new Set(
    dbProducts.filter(p => p.dev_status === 5).map(p => p.id)
  );

  for (const item of items) {
    if (!availableProductIds.has(item.productId)) {
      errors.push({
        productId: item.productId,
        variantId: item.variantId,
        type: 'unavailable',
        message: `${item.name} is no longer available`,
      });
    }
  }

  // 2. Check limited edition quantities
  const limitedEditionItems = items.filter(item => item.variantId);

  if (limitedEditionItems.length > 0) {
    const variantIds = limitedEditionItems.map(item => item.variantId!);
    const dbVariants = await db.query.variants.findMany({
      where: inArray(variants.id, variantIds),
    });

    for (const item of limitedEditionItems) {
      const variant = dbVariants.find(v => v.id === item.variantId);
      if (!variant) continue;

      const available = variant.max_quantity - variant.sold_quantity;

      if (available <= 0) {
        errors.push({
          productId: item.productId,
          variantId: item.variantId,
          type: 'out_of_stock',
          message: `${item.name} is sold out`,
        });
      } else if (item.quantity > available) {
        errors.push({
          productId: item.productId,
          variantId: item.variantId,
          type: 'out_of_stock',
          message: `Only ${available} units of ${item.name} remaining`,
        });
      } else if (available <= 10) {
        warnings.push({
          type: 'low_stock',
          message: `Only ${available} units of ${item.name} remaining`,
        });
      }
    }
  }

  // 3. Check voltage compatibility
  const voltageValidation = validateVoltageCompatibility(items);
  errors.push(...voltageValidation.errors);
  warnings.push(...voltageValidation.warnings);

  // 4. Check dependencies (requires/suggests)
  const dependencyValidation = await validateDependencies(items);
  warnings.push(...dependencyValidation);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateVoltageCompatibility(items: CartItem[]): { errors: CartValidationError[], warnings: CartWarning[] } {
  const errors: CartValidationError[] = [];
  const warnings: CartWarning[] = [];

  const voltages = items
    .map(item => item.voltage)
    .filter((v): v is '5v' | '24v' => v !== undefined);

  const uniqueVoltages = new Set(voltages);

  // If cart has both 5v and 24v components, that's an error
  if (uniqueVoltages.size > 1) {
    errors.push({
      productId: '',
      type: 'voltage_mismatch',
      message: 'Cannot mix 5v and 24v components in the same order. Please choose one voltage system.',
    });
  }

  return { errors, warnings };
}

async function validateDependencies(items: CartItem[]): Promise<CartWarning[]> {
  const warnings: CartWarning[] = [];
  const productIds = items.map(item => item.productId);

  // Get all dependencies for products in cart
  const dependencies = await db.query.productDependencies.findMany({
    where: inArray(productDependencies.product_id, productIds),
  });

  for (const dep of dependencies) {
    const hasDependent = productIds.includes(dep.dependent_product_id);

    if (dep.dependency_type === 'suggests' && !hasDependent) {
      warnings.push({
        type: 'suggested_product',
        message: dep.message || `Consider adding ${dep.dependent_product_id}`,
        suggestedProductId: dep.dependent_product_id,
      });
    }

    if (dep.dependency_type === 'requires' && !hasDependent) {
      warnings.push({
        type: 'missing_component',
        message: dep.message || `This product requires ${dep.dependent_product_id}`,
        suggestedProductId: dep.dependent_product_id,
      });
    }
  }

  return warnings;
}
```

---

### C. Cart Validation API Route

**File:** `app/api/cart/validate/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { validateCart } from '@/lib/services/cart-validator';
import type { CartItem } from '@/types/cart';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: CartItem[] = body.items || [];

    const validation = await validateCart(items);

    return Response.json(validation);
  } catch (error) {
    console.error('Cart validation error:', error);
    return Response.json(
      { error: 'Failed to validate cart' },
      { status: 500 }
    );
  }
}
```

---

## Part 2: Cart UI Components

### A. Cart Button (Header)

**File:** `components/cart/CartButton.tsx`

**Purpose:** Display cart icon with item count, open cart drawer on click

```tsx
'use client';

import { ShoppingCart } from 'lucide-react'; // or your icon library
import { useCart } from './CartProvider';

interface CartButtonProps {
  onOpen: () => void;
}

export function CartButton({ onOpen }: CartButtonProps) {
  const { itemCount, isHydrated } = useCart();

  return (
    <button
      onClick={onOpen}
      className="relative p-2 hover:bg-gray-100 rounded-full transition"
      aria-label="Shopping cart"
    >
      <ShoppingCart className="w-6 h-6" />
      {isHydrated && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}
```

---

### B. Cart Drawer (Slide-out)

**File:** `components/cart/CartDrawer.tsx`

**Purpose:** Slide-out panel showing cart contents, summary, and checkout button

```tsx
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCart } from './CartProvider';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { CartValidation } from './CartValidation';
import { validateCart } from '@/lib/services/cart-validator';
import type { CartValidationResult } from '@/types/cart';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, isHydrated } = useCart();
  const [validation, setValidation] = useState<CartValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Validate cart when it opens or items change
  useEffect(() => {
    if (isOpen && items.length > 0) {
      setIsValidating(true);
      fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
        .then(res => res.json())
        .then(setValidation)
        .catch(console.error)
        .finally(() => setIsValidating(false));
    }
  }, [isOpen, items]);

  if (!isHydrated) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold">Shopping Cart</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Validation Messages */}
          {validation && (
            <CartValidation
              errors={validation.errors}
              warnings={validation.warnings}
            />
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItem
                    key={`${item.productId}-${item.variantId || ''}`}
                    item={item}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Summary & Checkout */}
          {items.length > 0 && (
            <div className="border-t p-4">
              <CartSummary />
              <button
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                disabled={!validation?.valid || isValidating}
              >
                {isValidating ? 'Validating...' : 'Proceed to Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

---

### C. Cart Item Component

**File:** `components/cart/CartItem.tsx`

```tsx
'use client';

import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { useCart } from './CartProvider';
import type { CartItem as CartItemType } from '@/types/cart';
import { formatCurrency } from '@/lib/utils/format';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(item.productId, newQuantity, item.variantId);
  };

  const handleRemove = () => {
    removeItem(item.productId, item.variantId);
  };

  return (
    <div className="flex gap-4 pb-4 border-b">
      {/* Image */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover rounded"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{item.name}</h3>
        <p className="text-sm text-gray-600">{formatCurrency(item.price)}</p>

        {item.isLimitedEdition && item.remainingQuantity && (
          <p className="text-xs text-orange-600 mt-1">
            {item.remainingQuantity} remaining
          </p>
        )}

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="w-8 h-8 border rounded hover:bg-gray-100"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="w-8 h-8 border rounded hover:bg-gray-100"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Price & Remove */}
      <div className="flex flex-col items-end justify-between">
        <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
        <button
          onClick={handleRemove}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

---

### D. Cart Summary Component

**File:** `components/cart/CartSummary.tsx`

```tsx
'use client';

import { useCart } from './CartProvider';
import { formatCurrency } from '@/lib/utils/format';

export function CartSummary() {
  const { subtotal, itemCount } = useCart();

  // Tax/shipping calculated at checkout (Phase 2.4)

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>

      <div className="flex justify-between text-sm text-gray-600">
        <span>Shipping</span>
        <span>Calculated at checkout</span>
      </div>

      <div className="flex justify-between text-lg font-bold pt-2 border-t">
        <span>Total</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}
```

---

### E. Cart Validation Messages

**File:** `components/cart/CartValidation.tsx`

**Purpose:** Display validation errors and warnings

```tsx
'use client';

import { AlertCircle, Info } from 'lucide-react';
import type { CartValidationError, CartWarning } from '@/types/cart';

interface CartValidationProps {
  errors: CartValidationError[];
  warnings: CartWarning[];
}

export function CartValidation({ errors, warnings }: CartValidationProps) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="border-b p-4 space-y-2">
      {/* Errors */}
      {errors.map((error, index) => (
        <div
          key={`error-${index}`}
          className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error.message}</span>
        </div>
      ))}

      {/* Warnings */}
      {warnings.map((warning, index) => (
        <div
          key={`warning-${index}`}
          className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800"
        >
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{warning.message}</span>
        </div>
      ))}
    </div>
  );
}
```

---

### F. Add to Cart Button (Product Page)

**File:** `components/products/AddToCartButton.tsx`

**Purpose:** Button on product detail page to add item to cart

```tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import type { Product, Variant } from '@/types/product';

interface AddToCartButtonProps {
  product: Product;
  selectedVariant?: Variant;
}

export function AddToCartButton({ product, selectedVariant }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      await addItem({
        productId: product.id,
        variantId: selectedVariant?.id,
        name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
        price: selectedVariant?.price || product.basePrice,
        image: product.images[0],
        quantity,
        voltage: product.voltage,
        isLimitedEdition: selectedVariant?.isLimitedEdition,
        remainingQuantity: selectedVariant?.availableQuantity,
      });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const isOutOfStock = selectedVariant?.availableQuantity === 0;

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <label className="font-medium">Quantity:</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 border rounded hover:bg-gray-100"
            disabled={isAdding}
          >
            −
          </button>
          <span className="w-12 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 border rounded hover:bg-gray-100"
            disabled={isAdding}
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding || isOutOfStock}
        className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isOutOfStock ? 'Sold Out' : isAdding ? 'Adding...' : 'Add to Cart'}
      </button>

      {/* Success Message */}
      {showSuccess && (
        <div className="text-center text-green-600 font-medium">
          Added to cart!
        </div>
      )}
    </div>
  );
}
```

---

## Part 3: Integration with Existing Pages

### A. Update Root Layout (Add CartProvider)

**File:** `app/layout.tsx`

```typescript
import { CartProvider } from '@/components/cart/CartProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
```

---

### B. Update Header (Add Cart Button)

**File:** `components/layout/Header.tsx`

```tsx
'use client';

import { useState } from 'react';
import { CartButton } from '@/components/cart/CartButton';
import { CartDrawer } from '@/components/cart/CartDrawer';

export function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo, Nav, etc. */}

          <CartButton onOpen={() => setIsCartOpen(true)} />
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
```

---

### C. Update Product Detail Page (Add Button)

**File:** `app/products/[id]/page.tsx`

```typescript
import { AddToCartButton } from '@/components/products/AddToCartButton';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id);

  return (
    <div>
      {/* Product details */}

      <AddToCartButton product={product} selectedVariant={/* ... */} />
    </div>
  );
}
```

---

## Testing Requirements (TDD)

**Write tests BEFORE implementation:**

### Unit Tests

**1. Cart Context/Provider:**
- `tests/unit/components/cart/CartProvider.test.tsx`
  - Adds item to cart
  - Updates existing item quantity
  - Removes item from cart
  - Updates item quantity
  - Clears cart
  - Calculates subtotal correctly
  - Persists to localStorage
  - Loads from localStorage on mount
  - Handles hydration correctly

**2. Cart Validator:**
- `tests/unit/lib/services/cart-validator.test.ts`
  - Validates empty cart (passes)
  - Detects unavailable products
  - Detects sold out variants
  - Detects voltage mismatches (5v + 24v)
  - Detects missing dependencies
  - Returns warnings for suggestions
  - Returns warnings for low stock

**3. Cart Components:**
- `tests/unit/components/cart/CartItem.test.tsx`
  - Renders item details correctly
  - Updates quantity on button click
  - Removes item on delete click
  - Shows limited edition badge

- `tests/unit/components/cart/CartButton.test.tsx`
  - Shows item count badge
  - Hides badge when cart empty
  - Opens cart drawer on click

- `tests/unit/components/cart/CartSummary.test.tsx`
  - Calculates subtotal correctly
  - Shows item count

- `tests/unit/components/cart/CartValidation.test.tsx`
  - Displays error messages
  - Displays warning messages
  - Hides when no errors/warnings

### Integration Tests

**API Route:**
- `tests/integration/api/cart/validate.test.ts`
  - POST /api/cart/validate returns validation result
  - Detects voltage mismatches
  - Detects sold out products
  - Returns warnings for suggestions

**Cart Operations:**
- `tests/integration/cart/cart-operations.test.ts`
  - Add item → persists to localStorage
  - Update quantity → updates localStorage
  - Remove item → removes from localStorage
  - Clear cart → empties localStorage

### E2E Tests

- `tests/e2e/cart/add-to-cart.spec.ts`
  - Navigate to product page
  - Click "Add to Cart"
  - See cart count increase
  - Open cart drawer
  - See product in cart
  - Close drawer
  - Cart persists on page reload

- `tests/e2e/cart/cart-operations.spec.ts`
  - Add multiple products
  - Update quantities
  - Remove items
  - See totals update correctly
  - Validate voltage mismatch error shows

---

## Architecture Notes

### Client vs Server Components

**Client Components:**
- CartProvider (context, state)
- CartButton (interactive)
- CartDrawer (interactive, modal)
- CartItem (quantity controls)
- AddToCartButton (add action)

**Server Components:**
- None for cart (cart is inherently client-side)

### State Management

- **Context API** for cart state (simple, built-in)
- **localStorage** for persistence (client-side only)
- **Server validation** via API route (don't trust client)

### Data Flow

1. User clicks "Add to Cart" → `addItem()` in CartProvider
2. CartProvider updates state → persists to localStorage
3. Cart drawer opens → fetches validation from `/api/cart/validate`
4. Server validates → checks DB for availability, dependencies
5. Validation results displayed → errors prevent checkout

---

## Success Criteria

### Functionality:
- [ ] Cart context provider works
- [ ] Items persist to localStorage
- [ ] Items load from localStorage on page load
- [ ] Add to cart button works on product pages
- [ ] Cart button shows item count
- [ ] Cart drawer opens/closes
- [ ] Cart items display correctly
- [ ] Quantity controls work (increase/decrease/remove)
- [ ] Cart subtotal calculates correctly
- [ ] Validation API route works
- [ ] Voltage mismatch detected and displayed
- [ ] Out of stock errors displayed
- [ ] Dependency warnings displayed
- [ ] Checkout button disabled when cart invalid

### Code Quality:
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All tests passing (unit + integration + E2E)
- [ ] Mapper pattern used for DB queries (if applicable)
- [ ] Test coverage ratio maintained (1.5:1)
- [ ] Clean, legible code (Dr. Clean standards)

### Design:
- [ ] Cart drawer slides in smoothly
- [ ] Cart button integrated in header
- [ ] Validation messages clearly visible
- [ ] Mobile responsive
- [ ] Keyboard accessible

---

## Completion Report

**Report back with:**
1. Summary of implementation
2. Test results (`npm run test`, `npm run test:e2e`)
3. Screenshots of:
   - Product page with "Add to Cart" button
   - Cart button with count badge
   - Cart drawer open with items
   - Validation error (voltage mismatch)
   - Validation warning (suggested product)
4. Any deviations from plan (with rationale)
5. Any blockers or decisions needed
6. Confirmation ready for Phase 2.4

---

## Notes

**Priority Order:**
1. Cart context/provider - Foundation
2. Cart validator - Business logic
3. Add to cart button - User entry point
4. Cart drawer UI - View cart
5. Validation display - User feedback

**Work Incrementally:**
- Get cart state management working first
- Add localStorage persistence
- Build UI components
- Add validation logic
- Test voltage mismatch scenarios thoroughly

**Ask Questions:**
- If business rules unclear, check PRODUCT_CATALOG.md
- If architecture unclear, check COMPONENT_ARCHITECTURE.md
- If validation logic unclear, ask before implementing

---

**Good luck, Dr. LeanDev! This phase has complex state management and critical business logic. Test thoroughly, especially voltage validation.**

**Status:** Ready to begin
**Last Updated:** 2025-10-24
