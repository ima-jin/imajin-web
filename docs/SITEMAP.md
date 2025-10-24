# Site Map - Imajin Web Platform

**Purpose:** Complete map of all public and internal pages, routes, and navigation structure.

**Last Updated:** 2025-10-24
**Status:** Planning document - routes will be implemented across Phases 2-4

---

## Public Site Structure

### Marketing & Information Pages

```
/                           # Homepage
├── /about                  # About Imajin
├── /contact                # Contact form
└── /faq                    # Frequently asked questions
```

**Design Direction:** Black backgrounds (content/info pages)

---

### Product Catalog (E-commerce)

```
/products                   # Product listing page
├── ?category=material      # Filter by category
├── ?category=connector
├── ?category=control
├── ?category=diffuser
├── ?category=kit
│
└── /products/[id]          # Product detail page
    ├── /Material-8x8-V
    ├── /Material-5x5-O
    ├── /Connect-4x31.6-5v
    ├── /Control-2-5v
    ├── /Diffuse-12-C
    ├── /Unit-8x8x8-DIY
    └── /Unit-8x8x8-Founder
```

**Design Direction:** White backgrounds (product/ordering pages)

**Features per page:**
- Product listing: Grid, filters, search
- Product detail: Images, specs, variants, add to cart, dependencies

---

### Shopping & Checkout

```
/cart                       # Shopping cart page
/checkout                   # Checkout page (Stripe embedded)
/checkout/success           # Order confirmation
```

**Cart Features:**
- View cart items
- Update quantities
- Remove items
- See subtotal/total
- Proceed to checkout

**Checkout Features:**
- Customer information
- Shipping address
- Order review
- Stripe embedded checkout
- Payment processing

---

### Orders & Tracking

```
/orders/lookup              # Order lookup (by email/order ID)
/orders/[id]                # Order details & tracking
```

**Lookup Features:**
- Enter email or order ID
- View order status
- Track shipment
- Download invoice (future)

---

### Portfolio & Case Studies

```
/portfolio                  # Portfolio gallery
└── /portfolio/[slug]       # Individual installation/case study
    ├── /venue-downtown-toronto
    └── /commercial-space-vancouver
```

**Design Direction:** Black backgrounds (content pages)

**Portfolio Features:**
- Gallery of installations
- Filter by type/year
- Case study details with images
- Project specifications

---

## Admin Section (Protected)

```
/admin                      # Admin dashboard (requires auth)
├── /admin/login            # Admin login
├── /admin/orders           # Order management
│   └── /admin/orders/[id]  # Order detail & fulfillment
├── /admin/inventory        # Inventory management
├── /admin/products         # Product management (future)
└── /admin/analytics        # Sales analytics (future)
```

**Authentication:** Simple password for now (Phase 2/3), proper auth later (Phase 4)

**Admin Features:**
- View all orders
- Update order status
- Mark as fulfilled/shipped
- Manage inventory (Founder Edition tracking)
- View sales reports

---

## API Routes (Backend)

See `API_ROUTES.md` for complete API documentation.

```
/api/health                 # Health check
/api/products               # Product endpoints
/api/cart                   # Cart validation
/api/checkout               # Stripe session creation
/api/webhooks/stripe        # Stripe webhooks
/api/orders                 # Order lookup
/api/portfolio              # Portfolio data
/api/admin/*                # Admin operations
```

---

## Navigation Structure

### Primary Navigation (Header)

**Public Site:**
```
Logo | Products | Portfolio | About | Contact | Cart (icon with count)
```

**Logged-in Admin:**
```
Logo | Products | Portfolio | About | Contact | Cart | Admin (dropdown)
```

### Footer Navigation

**Column 1 - Shop:**
- All Products
- Materials
- Control Units
- Kits
- DIY vs Assembled

**Column 2 - Learn:**
- About Imajin
- How It Works
- Voltage Systems (5v vs 24v)
- Assembly Guide
- FAQ

**Column 3 - Support:**
- Contact Us
- Order Tracking
- Shipping & Returns
- Warranty Info
- Technical Support

**Column 4 - Company:**
- About Us
- Portfolio
- Founder Edition
- MJN Token (future)
- Careers (future)

**Bottom Bar:**
- © 2025 Imajin
- Privacy Policy
- Terms of Service
- Social Links (optional)

---

## Route Groups (Next.js App Router)

**Organizational structure in `/app`:**

```
/app
├── (marketing)/            # Marketing pages (black backgrounds)
│   ├── layout.tsx          # Marketing layout
│   ├── page.tsx            # Homepage
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   └── faq/page.tsx
│
├── (shop)/                 # E-commerce pages (white backgrounds)
│   ├── layout.tsx          # Shop layout
│   ├── products/
│   │   ├── page.tsx        # Product listing
│   │   └── [id]/page.tsx   # Product detail
│   ├── cart/page.tsx
│   └── checkout/
│       ├── page.tsx        # Checkout
│       └── success/page.tsx
│
├── portfolio/              # Portfolio section (black backgrounds)
│   ├── page.tsx
│   └── [slug]/page.tsx
│
├── orders/                 # Order tracking (white backgrounds)
│   ├── lookup/page.tsx
│   └── [id]/page.tsx
│
├── admin/                  # Admin section (auth required)
│   ├── layout.tsx          # Admin layout with auth
│   ├── page.tsx            # Dashboard
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── inventory/page.tsx
│
├── api/                    # API routes
├── layout.tsx              # Root layout
├── error.tsx               # Error page
└── not-found.tsx           # 404 page
```

---

## User Flows

### Browse → Purchase Flow

```
1. Homepage (/)
   → See featured products
   → Click "Shop All Products"

2. Product Listing (/products)
   → Browse products
   → Filter by category
   → Click product

3. Product Detail (/products/[id])
   → View specs, images
   → Select variant (Founder Edition)
   → Choose quantity
   → Add to cart

4. Cart (/cart)
   → Review items
   → See total
   → Click "Checkout"

5. Checkout (/checkout)
   → Enter shipping info
   → Stripe embedded checkout
   → Complete payment

6. Confirmation (/checkout/success)
   → Order number
   → Email confirmation
   → Track order link
```

### Order Tracking Flow

```
1. Order Lookup (/orders/lookup)
   → Enter email or order ID
   → Submit

2. Order Details (/orders/[id])
   → View order status
   → See items purchased
   → Track shipment
   → Download invoice (future)
```

### Admin Flow

```
1. Admin Login (/admin/login)
   → Enter password
   → Redirect to dashboard

2. Admin Dashboard (/admin)
   → Recent orders
   → Inventory alerts
   → Quick actions

3. Order Management (/admin/orders)
   → View all orders
   → Filter by status
   → Click order

4. Fulfill Order (/admin/orders/[id])
   → Update status
   → Add tracking number
   → Mark as shipped
```

---

## SEO & Meta Information

### Homepage
```
Title: Imajin - Modular LED Fixtures | Custom Lighting Systems
Description: Design and build custom LED fixtures with our modular system. From DIY kits to fully assembled Founder Edition cubes.
```

### Product Listing
```
Title: Products | Imajin LED Fixtures
Description: Browse our complete lineup of modular LED panels, control units, connectors, and complete kits.
```

### Product Detail (Example)
```
Title: 8x8 Void Panel - Material-8x8-V | Imajin
Description: 240mm LED panel with 64 addressable LEDs. Compatible with 5v and 24v systems. Perfect for scalable installations.
```

### Portfolio
```
Title: Portfolio | Imajin LED Installations
Description: Explore our custom LED installations and case studies from venues and commercial spaces.
```

---

## Redirects & Aliases

**Legacy URLs (if applicable):**
```
/old-shop → /products
/cube → /products/Unit-8x8x8-Founder
/diy → /products/Unit-8x8x8-DIY
```

**Convenience URLs:**
```
/founder → /products/Unit-8x8x8-Founder
/shop → /products
/track → /orders/lookup
```

---

## Sitemap.xml Structure

**For SEO (to be generated):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>https://www.imajin.ai/</loc>
    <lastmod>2025-10-24</lastmod>
    <priority>1.0</priority>
  </url>

  <!-- Static Pages -->
  <url>
    <loc>https://www.imajin.ai/products</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.imajin.ai/about</loc>
    <priority>0.7</priority>
  </url>

  <!-- Products (dynamic) -->
  <url>
    <loc>https://www.imajin.ai/products/Material-8x8-V</loc>
    <priority>0.8</priority>
  </url>
  <!-- ... more products -->

  <!-- Portfolio (dynamic) -->
  <url>
    <loc>https://www.imajin.ai/portfolio</loc>
    <priority>0.7</priority>
  </url>
  <!-- ... case studies -->

  <!-- Exclude from sitemap: -->
  <!-- - /admin/* (noindex) -->
  <!-- - /api/* (not pages) -->
  <!-- - /checkout/* (no SEO value) -->
  <!-- - /orders/* (private) -->
</urlset>
```

---

## robots.txt

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /orders/
Disallow: /cart

Sitemap: https://www.imajin.ai/sitemap.xml
```

---

## Mobile Navigation

**Hamburger menu structure:**
```
☰ Menu
├── Products
│   ├── All Products
│   ├── Materials
│   ├── Controls
│   ├── Connectors
│   ├── Diffusers
│   └── Complete Kits
├── Portfolio
├── About
├── Contact
├── Track Order
└── Cart
```

---

## Breadcrumbs

**Product pages:**
```
Home > Products > Materials > 8x8 Void Panel
```

**Portfolio:**
```
Home > Portfolio > Case Studies > Downtown Toronto Venue
```

**Order tracking:**
```
Home > Orders > Order #12345
```

---

## Special Pages

### 404 Not Found
```
/not-found
- Friendly message
- Search products
- Popular links
- Back to homepage
```

### 500 Error
```
/error
- Generic error message
- Contact support
- Try again button
```

### Maintenance Mode (Future)
```
/maintenance
- Coming back soon
- Estimated time
- Contact email
```

---

## Implementation Phases

**Phase 2 (E-commerce Core):**
- `/` - Homepage
- `/products` - Product listing
- `/products/[id]` - Product detail
- `/cart` - Shopping cart
- `/api/products` - Product APIs

**Phase 3 (Checkout & Orders):**
- `/checkout` - Checkout page
- `/checkout/success` - Order confirmation
- `/orders/lookup` - Order lookup
- `/orders/[id]` - Order details
- `/api/checkout` - Checkout APIs
- `/api/webhooks/stripe` - Stripe webhooks

**Phase 4 (Polish & Admin):**
- `/admin/*` - Admin section
- `/portfolio` - Portfolio gallery
- `/portfolio/[slug]` - Case studies
- `/about` - About page
- `/contact` - Contact form
- `/faq` - FAQ page

---

## Future Expansion

**Potential additions:**
- `/configurator` - Visual fixture builder (future)
- `/account` - Customer accounts (future)
- `/blog` - Content marketing (future)
- `/docs` - Technical documentation (future)
- `/community` - User gallery (future)

---

## Notes

**Design Consistency:**
- Marketing/portfolio pages: Black backgrounds
- Product/checkout pages: White backgrounds
- Maintain consistent header/footer throughout

**Navigation Best Practices:**
- Max 7 items in primary nav
- Mega menu for products (categories)
- Sticky header on scroll
- Mobile: Hamburger menu

**Performance:**
- All pages use Next.js App Router
- Server components by default
- Static generation where possible
- ISR for product pages (revalidate on product updates)

---

**This sitemap will evolve as features are added. Keep it updated!**

**Last Updated:** 2025-10-24
**Next Review:** After Phase 2 completion
