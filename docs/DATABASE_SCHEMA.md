# Database Schema

## Design Principles

- Only store what Stripe doesn't handle
- Avoid premature optimization
- Extend as needed, not in advance
- Leverage Stripe as source of truth for payment data

**What we store:** Product metadata (dev status, dependencies, specs), variants, inventory limits, orders, portfolio

**What Stripe handles:** Product names/descriptions, pricing, payment processing, checkout, invoices

---

## Schema Overview

```
products
├── variants (1:many)
├── product_dependencies (many:many)
└── product_specs (1:many)

orders
├── order_items (1:many)
└── nft_tokens (1:1 for Founder Editions)

portfolio_items
└── portfolio_images (1:many)
```

---

## Tables

### `products`

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,                    -- Internal product ID
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,                 -- "material", "connector", "control", "diffuser", "kit", "interface"
  dev_status INTEGER NOT NULL DEFAULT 0,  -- 0-5 (only show if status = 5)
  base_price INTEGER NOT NULL,            -- Price in cents (retail/base price)
  is_active BOOLEAN DEFAULT true,
  requires_assembly BOOLEAN DEFAULT false,
  has_variants BOOLEAN DEFAULT false,

  -- Inventory tracking (product level)
  max_quantity INTEGER,                   -- NULL = unlimited inventory
  sold_quantity INTEGER DEFAULT 0,        -- Total units sold (all variants combined)
  available_quantity INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN max_quantity IS NULL THEN NULL  -- Unlimited = no availability calc
      ELSE max_quantity - sold_quantity
    END
  ) STORED,
  is_available BOOLEAN GENERATED ALWAYS AS (
    max_quantity IS NULL OR sold_quantity < max_quantity
  ) STORED,

  -- Product visibility and lifecycle
  is_live BOOLEAN NOT NULL DEFAULT false, -- Show on site? (manual control)
  cost_cents INTEGER,                     -- Manufacturing cost (optional)
  wholesale_price_cents INTEGER,          -- Wholesale/vendor pricing (optional)
  cogs_price INTEGER,                     -- Cost of goods sold (internal tracking)
  presale_deposit_price INTEGER,          -- Refundable deposit amount for pre-sale
  sell_status TEXT NOT NULL DEFAULT 'internal',  -- "for-sale" | "pre-order" | "pre-sale" | "sold-out" | "internal"
  sell_status_note TEXT,                  -- Optional customer-facing message (e.g., "Shipping Dec 1")
  last_synced_at TIMESTAMP,               -- Last sync with Stripe/Cloudinary
  media JSONB,                            -- Array of media items with Cloudinary public IDs

  -- Stripe integration
  stripe_product_id TEXT,                 -- For products WITH variants (parent product)
  stripe_price_id TEXT,                   -- For products WITHOUT variants (single price)

  -- Portfolio & Featured Product fields
  show_on_portfolio_page BOOLEAN NOT NULL DEFAULT false,  -- Show in portfolio gallery?
  portfolio_copy TEXT,                                     -- Markdown content for portfolio page (max 2000 chars)
  is_featured BOOLEAN NOT NULL DEFAULT false,              -- Show in featured products section?
  -- Note: Hero image uses media JSONB array with category="hero"

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_dev_status ON products(dev_status);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_live ON products(is_live);
CREATE INDEX idx_products_sell_status ON products(sell_status);
CREATE INDEX idx_products_portfolio ON products(show_on_portfolio_page);
CREATE INDEX idx_products_featured ON products(is_featured);
```

**Example:**

```sql
-- Unlimited inventory product (standard stock item)
INSERT INTO products (id, name, category, dev_status, base_price, has_variants, max_quantity) VALUES
('Material-8x8-V', '8x8 Void Panel', 'material', 5, 3500, false, NULL);  -- NULL = unlimited

-- Limited inventory product with variants (Founder Edition)
INSERT INTO products (id, name, category, dev_status, base_price, has_variants, max_quantity) VALUES
('Unit-8x8x8-Founder', 'Founder Edition Cube', 'kit', 5, 99500, true, 1000);  -- Total across all variants
```

**Notes:**
- `sold_quantity` tracks ALL sales for this product (sum of all variant sales if applicable)
- `max_quantity = NULL` means unlimited inventory
- `max_quantity = number` means total inventory cap (for limited editions, sum across variants)
- `available_quantity` and `is_available` auto-calculated
- For products with variants, product-level `sold_quantity` = sum of variant `sold_quantity`

---

### `variants`

Product variants (colors, sizes, voltage options). Only used when `products.has_variants = true`.

**Key Change:** Inventory tracking moved to product level. Variants track per-option sales for analytics/display but product enforces total inventory cap.

```sql
CREATE TABLE variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  stripe_product_id TEXT NOT NULL,        -- Stripe Product ID (parent product for variant)
  stripe_price_id TEXT,                   -- Stripe Price ID (for variant-specific pricing)
  variant_type TEXT NOT NULL,             -- "color", "voltage", "size"
  variant_value TEXT NOT NULL,            -- "BLACK", "WHITE", "RED"
  price_modifier INTEGER DEFAULT 0,       -- Adjusts base_price
  wholesale_price_modifier INTEGER DEFAULT 0,  -- Adjusts wholesale_price_cents
  presale_deposit_modifier INTEGER DEFAULT 0,  -- Adjusts presale_deposit_price
  is_limited_edition BOOLEAN DEFAULT false,

  -- Per-variant inventory (for limited editions with color options)
  max_quantity INTEGER,                   -- Per-variant limit (e.g., 500 BLACK units)
  sold_quantity INTEGER DEFAULT 0,        -- Units sold of THIS variant
  available_quantity INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN max_quantity IS NULL THEN NULL
      ELSE max_quantity - sold_quantity
    END
  ) STORED,
  is_available BOOLEAN GENERATED ALWAYS AS (
    max_quantity IS NULL OR sold_quantity < max_quantity
  ) STORED,

  -- Media for this variant
  media JSONB,                            -- Array of variant-specific media (e.g., color-specific images)

  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_available ON variants(is_available);
CREATE UNIQUE INDEX idx_variants_stripe ON variants(stripe_product_id);
```

**Example:**

```sql
-- Founder Edition: Product has max_quantity=1000, variants split it up
INSERT INTO variants (id, product_id, stripe_product_id, variant_type, variant_value, max_quantity) VALUES
('Unit-8x8x8-Founder-Black', 'Unit-8x8x8-Founder', 'prod_stripe_founder_black', 'color', 'BLACK', 500),
('Unit-8x8x8-Founder-White', 'Unit-8x8x8-Founder', 'prod_stripe_founder_white', 'color', 'WHITE', 300),
('Unit-8x8x8-Founder-Red', 'Unit-8x8x8-Founder', 'prod_stripe_founder_red', 'color', 'RED', 200);
-- Note: 500 + 300 + 200 = 1000 (matches product.max_quantity)
```

**Notes:**
- Variants with `max_quantity = NULL` are unlimited (but still need product-level check)
- When order is placed, BOTH `variant.sold_quantity` AND `product.sold_quantity` increment
- Product-level `sold_quantity` = sum of all variant `sold_quantity`
- For display: "5 BLACK remaining" comes from variant, "20 total remaining" from product

---

### `product_dependencies`

Define compatibility rules and suggestions between products.

```sql
CREATE TABLE product_dependencies (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL,
  depends_on_product_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL,          -- "requires", "suggests", "incompatible", "voltage_match"
  message TEXT,
  metadata JSONB,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_dependencies_product ON product_dependencies(product_id);
CREATE INDEX idx_dependencies_type ON product_dependencies(dependency_type);
```

**Example:**

```sql
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type, message) VALUES
('Connect-4x31.6-5v', 'Material-8x8-V', 'requires', 'Requires Material-8x8-V panels to connect'),
('Connect-4x31.6-5v', 'Control-2-5v', 'voltage_match', 'Must use with 5v control unit');
```

**Dependency Types:**
- `requires` - Hard requirement (show warning if missing)
- `suggests` - Soft suggestion (show recommendation)
- `incompatible` - Cannot be used together (show error)
- `voltage_match` - Must match voltage system (5v or 24v)

---

### `product_specs`

Technical specifications (flexible JSON storage).

```sql
CREATE TABLE product_specs (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL,
  spec_key TEXT NOT NULL,                 -- e.g., "voltage", "dimensions"
  spec_value TEXT NOT NULL,
  spec_unit TEXT,                         -- e.g., "v", "mm"
  display_order INTEGER DEFAULT 0,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_specs_product ON product_specs(product_id);
CREATE UNIQUE INDEX idx_specs_key ON product_specs(product_id, spec_key);
```

**Example:**

```sql
INSERT INTO product_specs (product_id, spec_key, spec_value, spec_unit, display_order) VALUES
('Material-8x8-V', 'dimensions', '240 x 240', 'mm', 1),
('Material-8x8-V', 'led_count', '64', 'LEDs', 2);
```

**Alternative:** Could store as JSONB on `products` table. Using separate table for easier querying/validation.

---

### `orders`

Track orders for fulfillment and NFT assignment.

```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,                    -- Stripe Checkout Session ID
  stripe_payment_intent_id TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- "pending", "paid", "applied", "refunded", "fulfilled", "shipped", "delivered", "cancelled"
  subtotal INTEGER NOT NULL,
  tax INTEGER DEFAULT 0,
  shipping INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',

  -- Shipping info
  shipping_name TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,

  -- Tracking
  tracking_number TEXT,
  shipped_at TIMESTAMP,
  applied_at TIMESTAMP,                   -- When deposit was applied to final order

  -- Metadata
  notes TEXT,
  metadata JSONB,                         -- For pre-sale: { target_product_id, deposit_order_id, deposit_applied }

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE UNIQUE INDEX idx_orders_payment_intent ON orders(stripe_payment_intent_id);
```

---

### `order_items`

Line items for each order.

```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  stripe_product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,

  -- Snapshot product info (in case product changes)
  product_name TEXT NOT NULL,
  variant_name TEXT,

  metadata JSONB,

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE SET NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);
```

**Note:** Snapshot pattern preserves order history even if products change later.

---

### `nft_tokens`

Track Solana NFT tokens for Founder Edition units.

```sql
CREATE TABLE nft_tokens (
  id SERIAL PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL,
  order_item_id INTEGER NOT NULL,
  variant_id TEXT NOT NULL,
  unit_number INTEGER NOT NULL,           -- Sequential within color (1-500 for BLACK)

  -- Blockchain info (when minted)
  blockchain TEXT DEFAULT 'solana',
  contract_address TEXT,
  token_id TEXT,
  mint_transaction_hash TEXT,
  minted_at TIMESTAMP,

  -- Physical unit info
  serial_number TEXT UNIQUE,
  warranty_expires_at TIMESTAMP,          -- 10 years from purchase

  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE SET NULL
);

CREATE INDEX idx_nft_order ON nft_tokens(order_id);
CREATE INDEX idx_nft_variant ON nft_tokens(variant_id);
CREATE UNIQUE INDEX idx_nft_serial ON nft_tokens(serial_number);
CREATE INDEX idx_nft_minted ON nft_tokens(minted_at);
```

**Workflow:**
1. Order created → `nft_tokens` row with generated `token_hash`
2. Unit manufactured → `serial_number` added, hash printed on unit
3. Unit shipped → NFT minted → blockchain fields populated

---

### `portfolio_items`

Installation work and case studies.

```sql
CREATE TABLE portfolio_items (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,                           -- Full content (markdown or HTML)
  category TEXT,                          -- "installation", "case_study", "event"
  location TEXT,
  year INTEGER,
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portfolio_slug ON portfolio_items(slug);
CREATE INDEX idx_portfolio_published ON portfolio_items(is_published);
CREATE INDEX idx_portfolio_featured ON portfolio_items(is_featured);
CREATE INDEX idx_portfolio_category ON portfolio_items(category);
```

---

### `portfolio_images`

Gallery images for portfolio items.

```sql
CREATE TABLE portfolio_images (
  id SERIAL PRIMARY KEY,
  portfolio_item_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (portfolio_item_id) REFERENCES portfolio_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_portfolio_images_item ON portfolio_images(portfolio_item_id);
```

---

## Data Flow

### Product Display
1. Query `products` WHERE `dev_status = 5` AND `is_active = true`
2. If `has_variants = true`, join `variants`
3. Load `product_specs` for technical details
4. Load `product_dependencies` for warnings/suggestions

### Add to Cart
1. Validate product/variant exists and is available
2. Check `variants.is_available` for limited editions
3. Store in session/localStorage (no DB write yet)

### Checkout
1. Create Stripe Checkout Session with products from cart
2. Redirect to Stripe embedded checkout
3. User completes payment

### Webhook: `checkout.session.completed`
1. Receive webhook from Stripe
2. Create `orders` record
3. Create `order_items` records
4. For limited editions: increment `variants.sold_quantity`
5. For Founder Editions: create `nft_tokens` record

### Order Fulfillment
1. Admin views orders with `status = 'paid'`
2. Assemble/package units
3. For Founder Edition: Print token hash, update `serial_number`
4. Ship → update `status = 'shipped'`, add `tracking_number`
5. Mint NFT → update blockchain fields

---

## Seed Data Structure

```typescript
// seed-data.ts
export const products = [
  {
    id: "Material-8x8-V",
    name: "8x8 Void Panel",
    category: "material",
    dev_status: 5,
    base_price: 3500,
    has_variants: false,
  },
];

export const variants = [
  {
    id: "Unit-8x8x8-Founder-Black",
    product_id: "Unit-8x8x8-Founder",
    stripe_product_id: "prod_XXXXX",
    variant_type: "color",
    variant_value: "BLACK",
    is_limited_edition: true,
    max_quantity: 500,
  },
];

export const dependencies = [
  {
    product_id: "Connect-4x31.6-5v",
    depends_on_product_id: "Material-8x8-V",
    dependency_type: "requires",
    message: "Requires Material-8x8-V panels to connect",
  },
];
```

---

## Open Questions

1. **User accounts:** Not in MVP, would need `users` table
2. **Inventory management:** Only tracking limited editions currently
3. **Pricing history:** Rely on Stripe or track separately?
4. **Product images:** Store URLs in `metadata` JSONB or separate table?
5. **Reviews/ratings:** Future feature - need `product_reviews` table
6. **Bulk discounts:** Handle in Stripe or custom logic?

---

**Last Updated:** 2025-10-24
