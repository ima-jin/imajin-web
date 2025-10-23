# Component Architecture

## Overview

Next.js 14 App Router uses a mix of Server Components (default) and Client Components (marked with `'use client'`). This architecture leverages React Server Components for performance while using Client Components only where interactivity is needed.

**Key Principles:**
- Server Components by default (better performance, smaller bundles)
- Client Components only when needed (interactivity, browser APIs, state)
- Shared components are framework-agnostic when possible
- Composition over complex prop drilling
- Co-locate related components

---

## Directory Structure

```
/app
├── (marketing)/              # Route group - marketing pages
│   ├── layout.tsx           # Marketing layout (server component)
│   ├── page.tsx             # Homepage
│   ├── about/
│   │   └── page.tsx
│   └── contact/
│       └── page.tsx
│
├── (shop)/                  # Route group - e-commerce pages
│   ├── layout.tsx           # Shop layout
│   ├── products/
│   │   ├── page.tsx         # Product listing
│   │   └── [id]/
│   │       └── page.tsx     # Product detail
│   ├── cart/
│   │   └── page.tsx         # Cart page
│   └── checkout/
│       ├── page.tsx         # Checkout page
│       └── success/
│           └── page.tsx     # Order confirmation
│
├── portfolio/
│   ├── page.tsx             # Portfolio listing
│   └── [slug]/
│       └── page.tsx         # Portfolio detail
│
├── orders/
│   ├── lookup/
│   │   └── page.tsx         # Order lookup form
│   └── [id]/
│       └── page.tsx         # Order details
│
├── admin/
│   ├── layout.tsx           # Admin layout (auth required)
│   ├── page.tsx             # Admin dashboard
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── inventory/
│       └── page.tsx
│
├── api/                     # API routes (see API_ROUTES.md)
├── layout.tsx               # Root layout
├── error.tsx                # Global error boundary
├── not-found.tsx            # 404 page
└── globals.css              # Global styles

/components
├── layout/                  # Layout components
│   ├── Header.tsx           # Site header (client)
│   ├── Footer.tsx           # Site footer (server)
│   ├── Navigation.tsx       # Main nav (client)
│   └── MobileMenu.tsx       # Mobile menu (client)
│
├── ui/                      # Primitive UI components
│   ├── Button.tsx           # Button component
│   ├── Input.tsx            # Input field
│   ├── Card.tsx             # Card container
│   ├── Badge.tsx            # Badge/tag
│   ├── Modal.tsx            # Modal dialog (client)
│   ├── Toast.tsx            # Toast notifications (client)
│   ├── Spinner.tsx          # Loading spinner
│   ├── Skeleton.tsx         # Loading skeleton
│   └── Icon.tsx             # Icon wrapper (client)
│
├── products/                # Product-related components
│   ├── ProductCard.tsx      # Product card (server)
│   ├── ProductGrid.tsx      # Product grid (server)
│   ├── ProductDetail.tsx    # Product detail view (server)
│   ├── ProductSpecs.tsx     # Specs table (server)
│   ├── ProductImages.tsx    # Image gallery (client)
│   ├── VariantSelector.tsx  # Color/option selector (client)
│   ├── AddToCartButton.tsx  # Add to cart (client)
│   ├── QuantityInput.tsx    # Quantity selector (client)
│   ├── LimitedEditionBadge.tsx  # Limited edition indicator
│   └── DependencyWarning.tsx    # Dependency alert
│
├── cart/                    # Shopping cart components
│   ├── CartProvider.tsx     # Cart context provider (client)
│   ├── CartButton.tsx       # Cart icon in header (client)
│   ├── CartDrawer.tsx       # Slide-out cart (client)
│   ├── CartItem.tsx         # Single cart item (client)
│   ├── CartSummary.tsx      # Cart totals (client)
│   └── CartValidation.tsx   # Validation warnings (client)
│
├── checkout/                # Checkout flow components
│   ├── CheckoutForm.tsx     # Main checkout form (client)
│   ├── ShippingForm.tsx     # Shipping address (client)
│   ├── OrderSummary.tsx     # Order review (server)
│   ├── StripeCheckout.tsx   # Stripe embedded (client)
│   └── OrderConfirmation.tsx # Success message (server)
│
├── portfolio/               # Portfolio components
│   ├── PortfolioCard.tsx    # Portfolio item card (server)
│   ├── PortfolioGrid.tsx    # Portfolio grid (server)
│   ├── PortfolioGallery.tsx # Image gallery (client)
│   └── CaseStudy.tsx        # Case study layout (server)
│
├── admin/                   # Admin components
│   ├── AuthGuard.tsx        # Admin auth wrapper (client)
│   ├── OrdersList.tsx       # Orders table (server)
│   ├── OrderDetail.tsx      # Single order view (server)
│   ├── InventoryTable.tsx   # Inventory grid (server)
│   ├── FulfillmentForm.tsx  # Fulfillment form (client)
│   └── NFTTracker.tsx       # NFT tracking (server)
│
└── shared/                  # Shared/utility components
    ├── Image.tsx            # Next.js Image wrapper
    ├── Link.tsx             # Next.js Link wrapper
    ├── Container.tsx        # Content container
    ├── Section.tsx          # Page section
    ├── ErrorBoundary.tsx    # Error boundary (client)
    └── SEO.tsx              # SEO metadata (server)

/lib
├── components/              # Component utilities
│   ├── cn.ts               # Tailwind class merger (clsx + tailwind-merge)
│   └── format.ts           # Formatting utilities (currency, date, etc.)
```

---

## Component Patterns

### Server Components (Default)

**When to use:**
- Static content rendering
- Data fetching from database
- SEO-critical content
- No client-side interactivity needed

**Example:**
```tsx
// components/products/ProductCard.tsx
import { Product } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency } from '@/lib/components/format'

interface ProductCardProps {
  product: Product
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
          className="group-hover:scale-105 transition"
        />
        <h3>{product.name}</h3>
        <p>{formatCurrency(product.base_price)}</p>
      </div>
    </Link>
  )
}
```

---

### Client Components

**When to use:**
- useState, useEffect, other React hooks
- Event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, geolocation, etc.)
- Third-party libraries requiring window object

**Example:**
```tsx
// components/products/AddToCartButton.tsx
'use client'

import { useState } from 'react'
import { useCart } from '@/components/cart/CartProvider'
import { Button } from '@/components/ui/Button'

interface AddToCartButtonProps {
  productId: string
  variantId?: string
  quantity: number
}

export function AddToCartButton({ productId, variantId, quantity }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false)
  const { addItem } = useCart()

  const handleClick = async () => {
    setLoading(true)
    await addItem({ productId, variantId, quantity })
    setLoading(false)
  }

  return (
    <Button onClick={handleClick} loading={loading}>
      Add to Cart
    </Button>
  )
}
```

---

### Composition Pattern

**Server Component wrapping Client Components:**

```tsx
// app/(shop)/products/[id]/page.tsx (Server Component)
import { getProduct } from '@/lib/db/products'
import { ProductDetail } from '@/components/products/ProductDetail'
import { AddToCartButton } from '@/components/products/AddToCartButton'
import { ProductImages } from '@/components/products/ProductImages'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id) // Server-side DB query

  return (
    <div>
      {/* Server Component */}
      <ProductDetail product={product} />

      {/* Client Component */}
      <ProductImages images={product.images} />

      {/* Client Component */}
      <AddToCartButton
        productId={product.id}
        quantity={1}
      />
    </div>
  )
}
```

---

## Key Components

### Layout Components

#### Header
```tsx
// components/layout/Header.tsx
'use client'

import { Navigation } from './Navigation'
import { CartButton } from '@/components/cart/CartButton'
import { MobileMenu } from './MobileMenu'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="container flex items-center justify-between h-16">
        <Logo />
        <Navigation />
        <div className="flex items-center gap-4">
          <CartButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
```

**Why Client Component:** Sticky positioning, mobile menu toggle, cart interactions

---

#### Footer
```tsx
// components/layout/Footer.tsx (Server Component)

export function Footer() {
  return (
    <footer className="bg-black text-white py-12">
      <div className="container grid grid-cols-4 gap-8">
        <div>
          <h4>Products</h4>
          <ul>
            <li><Link href="/products">All Products</Link></li>
            <li><Link href="/products?category=kit">Kits</Link></li>
          </ul>
        </div>
        {/* More columns */}
      </div>
    </footer>
  )
}
```

**Why Server Component:** Static content, no interactivity

---

### Product Components

#### ProductGrid
```tsx
// components/products/ProductGrid.tsx (Server Component)
import { Product } from '@/types'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

---

#### VariantSelector
```tsx
// components/products/VariantSelector.tsx
'use client'

import { useState } from 'react'
import { Variant } from '@/types'

interface VariantSelectorProps {
  variants: Variant[]
  onSelect: (variantId: string) => void
}

export function VariantSelector({ variants, onSelect }: VariantSelectorProps) {
  const [selected, setSelected] = useState<string>(variants[0].id)

  const handleSelect = (variantId: string) => {
    setSelected(variantId)
    onSelect(variantId)
  }

  return (
    <div className="flex gap-2">
      {variants.map(variant => (
        <button
          key={variant.id}
          onClick={() => handleSelect(variant.id)}
          className={cn(
            'px-4 py-2 border rounded',
            selected === variant.id ? 'border-black bg-black text-white' : 'border-gray-300'
          )}
          disabled={!variant.is_available}
        >
          {variant.variant_value}
          {variant.is_limited_edition && (
            <span className="ml-2 text-xs">
              ({variant.available_quantity} left)
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
```

**Why Client Component:** Interactive selection, local state

---

### Cart Components

#### CartProvider (Context)
```tsx
// components/cart/CartProvider.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { CartItem } from '@/types'

interface CartContextValue {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('cart')
    if (stored) setItems(JSON.parse(stored))
  }, [])

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.variantId === item.variantId)
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i))
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
```

**Usage in layout:**
```tsx
// app/layout.tsx
import { CartProvider } from '@/components/cart/CartProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
```

---

#### CartDrawer
```tsx
// components/cart/CartDrawer.tsx
'use client'

import { useCart } from './CartProvider'
import { CartItem } from './CartItem'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, total } = useCart()

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white z-50 shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Cart ({items.length})</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-gray-500">Your cart is empty</p>
          ) : (
            items.map(item => <CartItem key={item.productId} item={item} />)
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex justify-between mb-4">
            <span>Total:</span>
            <span className="font-bold">${(total / 100).toFixed(2)}</span>
          </div>
          <Link href="/checkout">
            <Button className="w-full">Checkout</Button>
          </Link>
        </div>
      </div>
    </>
  )
}
```

---

### UI Components (Primitives)

#### Button
```tsx
// components/ui/Button.tsx
import { cn } from '@/lib/components/cn'
import { Spinner } from './Spinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded font-medium transition',
        {
          'bg-black text-white hover:bg-gray-800': variant === 'primary',
          'bg-gray-200 text-black hover:bg-gray-300': variant === 'secondary',
          'border border-black text-black hover:bg-black hover:text-white': variant === 'outline',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled || loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}
```

---

## State Management Strategy

### Local State (useState)
- Component-specific UI state
- Form inputs
- Toggle states (open/closed, expanded/collapsed)

### Context (useContext)
- Cart state (CartProvider)
- Auth state (future - AuthProvider)
- Theme state (future - ThemeProvider)

### Server State
- Product data (fetched in Server Components)
- Order data (fetched in Server Components)
- Portfolio data (fetched in Server Components)

### No Global State Library
- **Why:** Next.js Server Components eliminate need for Redux/Zustand for most cases
- **When we might add one:** Complex admin dashboard with heavy client-side state
- **Decision:** Re-evaluate after MVP

---

## Styling Strategy

### Tailwind CSS
- Utility-first approach
- Use `cn()` helper to merge classes conditionally
- Custom colors in `tailwind.config.ts` for brand

### Component Variants
- Use `clsx` or `cva` (class-variance-authority) for variant styling
- Keep variant logic in component, not scattered in JSX

**Example with CVA:**
```tsx
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'rounded font-medium transition', // base styles
  {
    variants: {
      variant: {
        primary: 'bg-black text-white hover:bg-gray-800',
        secondary: 'bg-gray-200 text-black hover:bg-gray-300',
        outline: 'border border-black hover:bg-black hover:text-white',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export function Button({ variant, size, ...props }) {
  return <button className={buttonVariants({ variant, size })} {...props} />
}
```

---

## Data Fetching Patterns

### Server Components (Recommended)
```tsx
// app/(shop)/products/page.tsx
import { db } from '@/lib/db'
import { ProductGrid } from '@/components/products/ProductGrid'

export default async function ProductsPage() {
  // Direct DB query in Server Component
  const products = await db.query.products.findMany({
    where: eq(products.dev_status, 5)
  })

  return <ProductGrid products={products} />
}
```

---

### Client Components (when needed)
```tsx
// components/admin/OrdersList.tsx
'use client'

import { useState, useEffect } from 'react'

export function OrdersList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders)
        setLoading(false)
      })
  }, [])

  if (loading) return <Spinner />

  return <div>{/* render orders */}</div>
}
```

**Note:** Prefer Server Components for initial data load, use Client Components for dynamic updates

---

## Form Handling

### Server Actions (Preferred)
```tsx
// app/orders/lookup/page.tsx
import { db } from '@/lib/db'

async function lookupOrder(formData: FormData) {
  'use server'

  const email = formData.get('email')
  const orderId = formData.get('orderId')

  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.id, orderId),
      eq(orders.customer_email, email)
    )
  })

  return order
}

export default function OrderLookupPage() {
  return (
    <form action={lookupOrder}>
      <input name="email" type="email" required />
      <input name="orderId" type="text" required />
      <button type="submit">Lookup Order</button>
    </form>
  )
}
```

### Client-side Forms (when needed)
```tsx
// components/checkout/CheckoutForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CheckoutForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify({ /* cart items */ })
    })

    const { url } = await res.json()
    router.push(url)
  }

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>
}
```

---

## Error Handling

### Error Boundaries
```tsx
// app/error.tsx (Global error boundary)
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container py-12 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Component-level Error Handling
```tsx
// components/shared/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>
    }

    return this.props.children
  }
}
```

---

## Loading States

### Suspense Boundaries
```tsx
// app/(shop)/products/page.tsx
import { Suspense } from 'react'
import { ProductGrid } from '@/components/products/ProductGrid'
import { ProductGridSkeleton } from '@/components/products/ProductGridSkeleton'

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsLoader />
    </Suspense>
  )
}

async function ProductsLoader() {
  const products = await getProducts() // async data fetch
  return <ProductGrid products={products} />
}
```

### Loading.tsx Files
```tsx
// app/(shop)/products/loading.tsx
import { Spinner } from '@/components/ui/Spinner'

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>
  )
}
```

---

## Testing Strategy

### Component Testing (Future)
- Vitest + React Testing Library
- Test UI components in isolation
- Test user interactions (clicks, form submissions)

### Visual Regression Testing (Future)
- Chromatic or Percy
- Catch unintended style changes

### E2E Testing (Future)
- Playwright
- Test critical flows (checkout, order lookup)

---

## Performance Optimization

### Image Optimization
- Always use Next.js `<Image>` component
- Cloudinary for transformations (resize, format, quality)
- Lazy load images below the fold

### Code Splitting
- Automatic with Next.js App Router
- Dynamic imports for heavy components:
  ```tsx
  const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <Spinner />
  })
  ```

### Memoization (when needed)
```tsx
'use client'
import { memo } from 'react'

export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Heavy computation or rendering
  return <div>{/* ... */}</div>
})
```

---

## Accessibility

### Semantic HTML
- Use proper heading hierarchy (h1 → h2 → h3)
- Use `<button>` for actions, `<a>` for navigation
- Use `<label>` for form inputs

### ARIA Attributes
```tsx
<button
  aria-label="Add to cart"
  aria-describedby="price-info"
  aria-disabled={loading}
>
  Add to Cart
</button>
```

### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Use `tabIndex` appropriately
- Test with keyboard only (Tab, Enter, Escape)

### Focus Management
```tsx
'use client'
import { useEffect, useRef } from 'react'

export function Modal({ open, onClose }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus()
    }
  }, [open])

  return (
    <div role="dialog" aria-modal="true">
      <button ref={closeButtonRef} onClick={onClose}>Close</button>
      {/* modal content */}
    </div>
  )
}
```

---

## Component Development Workflow

1. **Identify component type** (Server or Client)
2. **Design props interface** (TypeScript)
3. **Build component** (HTML structure + Tailwind)
4. **Add interactivity** (if Client Component)
5. **Test in isolation** (Storybook or dedicated page - future)
6. **Integrate into page** (use in route)
7. **Test user flow** (manual testing)
8. **Optimize** (memoization, lazy loading if needed)

---

## Future Considerations

### Component Library (Future)
- Extract UI components to separate package
- Publish to npm for reuse in `admin/`, `portal/`, `mobile/` repos
- Use Storybook for documentation

### Design System (Future)
- Formalize color palette, typography, spacing
- Create design tokens
- Generate Tailwind config from tokens

### Animation Library (Future)
- Framer Motion for complex animations
- Keep simple transitions in Tailwind

---

**Document Created:** 2025-10-22
**Last Updated:** 2025-10-22
**Status:** Complete - Ready for implementation
