# Component Architecture

## Overview

Next.js 14 App Router uses Server Components (default) + Client Components (`'use client'`) for optimal performance.

**Key Principles:**
- Server Components by default (better performance, smaller bundles)
- Client Components only when needed (interactivity, browser APIs, state)
- Shared components are framework-agnostic
- Composition over prop drilling
- Co-locate related components

---

## Directory Structure

```
/app
├── (marketing)/              # Route group - marketing pages
│   ├── layout.tsx
│   ├── page.tsx             # Homepage
│   ├── about/page.tsx
│   └── contact/page.tsx
├── (shop)/                  # Route group - e-commerce
│   ├── products/
│   │   ├── page.tsx         # Product listing
│   │   └── [id]/page.tsx    # Product detail
│   ├── cart/page.tsx
│   └── checkout/
│       ├── page.tsx
│       └── success/page.tsx
├── portfolio/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── orders/
│   ├── lookup/page.tsx
│   └── [id]/page.tsx
├── admin/
│   ├── layout.tsx           # Admin layout (auth required)
│   ├── orders/page.tsx
│   └── inventory/page.tsx
├── api/                     # API routes
├── layout.tsx               # Root layout
├── error.tsx
├── not-found.tsx
└── globals.css

/components
├── layout/                  # Layout components
│   ├── Header.tsx           # (client)
│   ├── Footer.tsx           # (server)
│   ├── Navigation.tsx       # (client)
│   └── MobileMenu.tsx       # (client)
├── ui/                      # Primitive UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx            # (client)
│   ├── Toast.tsx            # (client)
│   └── Spinner.tsx
├── products/
│   ├── ProductCard.tsx      # (server)
│   ├── ProductGrid.tsx      # (server)
│   ├── ProductDetail.tsx    # (server)
│   ├── ProductImages.tsx    # (client)
│   ├── VariantSelector.tsx  # (client)
│   └── AddToCartButton.tsx  # (client)
├── cart/
│   ├── CartProvider.tsx     # (client - context)
│   ├── CartButton.tsx       # (client)
│   ├── CartDrawer.tsx       # (client)
│   └── CartSummary.tsx      # (client)
├── checkout/
│   ├── CheckoutForm.tsx     # (client)
│   ├── ShippingForm.tsx     # (client)
│   ├── OrderSummary.tsx     # (server)
│   └── StripeCheckout.tsx   # (client)
├── portfolio/
│   ├── PortfolioCard.tsx    # (server)
│   └── PortfolioGallery.tsx # (client)
├── admin/
│   ├── AuthGuard.tsx        # (client)
│   ├── OrdersList.tsx       # (server)
│   └── FulfillmentForm.tsx  # (client)
└── shared/
    ├── Image.tsx
    ├── Link.tsx
    └── ErrorBoundary.tsx    # (client)

/lib
├── components/
│   ├── cn.ts               # Tailwind class merger
│   └── format.ts           # Currency, date formatting
```

---

## Component Patterns

### Server Components (Default)

**When to use:** Static content, data fetching from DB, SEO-critical content, no interactivity

```tsx
// components/products/ProductCard.tsx
import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/components/format";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="group">
        <Image
          src={product.images[0]}
          alt={product.name}
          width={400}
          height={400}
          className="transition group-hover:scale-105"
        />
        <h3>{product.name}</h3>
        <p>{formatCurrency(product.base_price)}</p>
      </div>
    </Link>
  );
}
```

---

### Client Components

**When to use:** useState, useEffect, event handlers, browser APIs, third-party libraries requiring window

```tsx
// components/products/AddToCartButton.tsx
"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  quantity: number;
}

export function AddToCartButton({ productId, variantId, quantity }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  const handleClick = async () => {
    setLoading(true);
    await addItem({ productId, variantId, quantity });
    setLoading(false);
  };

  return (
    <Button onClick={handleClick} loading={loading}>
      Add to Cart
    </Button>
  );
}
```

---

### Composition Pattern

Server Component wrapping Client Components:

```tsx
// app/(shop)/products/[id]/page.tsx (Server Component)
import { getProduct } from "@/lib/db/products";
import { ProductDetail } from "@/components/products/ProductDetail";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { ProductImages } from "@/components/products/ProductImages";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id); // Server-side DB query

  return (
    <div>
      <ProductDetail product={product} /> {/* Server */}
      <ProductImages images={product.images} /> {/* Client */}
      <AddToCartButton productId={product.id} quantity={1} /> {/* Client */}
    </div>
  );
}
```

---

## Key Components

### CartProvider (Context)

```tsx
// components/cart/CartProvider.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { CartItem } from "@/types";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setItems(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
```

**Usage in layout:**

```tsx
// app/layout.tsx
import { CartProvider } from "@/components/cart/CartProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
```

---

### Button (UI Primitive)

```typescript
// components/ui/Button.tsx
import { cn } from "@/lib/components/cn";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded font-medium transition",
        {
          "bg-black text-white hover:bg-gray-800": variant === "primary",
          "bg-gray-200 text-black hover:bg-gray-300": variant === "secondary",
          "border border-black hover:bg-black hover:text-white": variant === "outline",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2": size === "md",
          "px-6 py-3 text-lg": size === "lg",
          "cursor-not-allowed opacity-50": disabled || loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
```

---

## State Management Strategy

### Local State (useState)
- Component-specific UI state
- Form inputs
- Toggle states

### Context (useContext)
- Cart state (CartProvider)
- Auth state (future - AuthProvider)
- Theme state (future - ThemeProvider)

### Server State
- Product data (fetched in Server Components)
- Order data
- Portfolio data

**No Global State Library:** Next.js Server Components eliminate need for Redux/Zustand for most cases.

---

## Styling Strategy

### Tailwind CSS
- Utility-first approach
- Use `cn()` helper to merge classes conditionally
- Custom colors in `tailwind.config.ts`

### Component Variants (with CVA)

```tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "rounded font-medium transition",
  {
    variants: {
      variant: {
        primary: "bg-black text-white hover:bg-gray-800",
        secondary: "bg-gray-200 text-black hover:bg-gray-300",
        outline: "border border-black hover:bg-black hover:text-white",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export function Button({ variant, size, ...props }) {
  return <button className={buttonVariants({ variant, size })} {...props} />;
}
```

---

## Data Fetching Patterns

### Server Components (Recommended)

```tsx
// app/(shop)/products/page.tsx
import { db } from "@/lib/db";
import { ProductGrid } from "@/components/products/ProductGrid";

export default async function ProductsPage() {
  const products = await db.query.products.findMany({
    where: eq(products.dev_status, 5),
  });

  return <ProductGrid products={products} />;
}
```

### Client Components (when needed)

```tsx
// components/admin/OrdersList.tsx
"use client";

import { useState, useEffect } from "react";

export function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner />;

  return <div>{/* render orders */}</div>;
}
```

---

## Form Handling

### Server Actions (Preferred)

```tsx
// app/orders/lookup/page.tsx
import { db } from "@/lib/db";

async function lookupOrder(formData: FormData) {
  "use server";

  const email = formData.get("email");
  const orderId = formData.get("orderId");

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.customer_email, email)),
  });

  return order;
}

export default function OrderLookupPage() {
  return (
    <form action={lookupOrder}>
      <input name="email" type="email" required />
      <input name="orderId" type="text" required />
      <button type="submit">Lookup Order</button>
    </form>
  );
}
```

### Client-side Forms (when needed)

```tsx
// components/checkout/CheckoutForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CheckoutForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/checkout/session", {
      method: "POST",
      body: JSON.stringify({/* cart items */}),
    });

    const { url } = await res.json();
    router.push(url);
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

---

## Error Handling

### Error Boundaries

```tsx
// app/error.tsx (Global error boundary)
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container py-12 text-center">
      <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
      <p className="mb-6 text-gray-600">{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## Loading States

### Suspense Boundaries

```tsx
// app/(shop)/products/page.tsx
import { Suspense } from "react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsLoader />
    </Suspense>
  );
}

async function ProductsLoader() {
  const products = await getProducts();
  return <ProductGrid products={products} />;
}
```

---

## Performance Optimization

### Image Optimization
- Always use Next.js `<Image>` component
- Cloudinary for transformations
- Lazy load below the fold

### Code Splitting
- Automatic with Next.js App Router
- Dynamic imports for heavy components:
  ```tsx
  const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
    loading: () => <Spinner />,
  });
  ```

### Memoization (when needed)
```tsx
"use client";
import { memo } from "react";

export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  return <div>{/* ... */}</div>;
});
```

---

## Accessibility

- Use semantic HTML (proper heading hierarchy)
- Use `<button>` for actions, `<a>` for navigation
- Add ARIA attributes where needed
- Ensure keyboard navigation works
- Manage focus (especially in modals)

---

**Last Updated:** 2025-10-24
