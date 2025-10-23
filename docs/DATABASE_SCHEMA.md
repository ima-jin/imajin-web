# Database Schema

## Design Principles

**Keep it lean:**
- Only store what Stripe doesn't handle
- Avoid premature optimization
- Extend as needed, not in advance
- Leverage Stripe as source of truth for payment data

**What we store:**
- Product metadata (dev status, dependencies, specifications)
- Variant information (colors, limited edition tracking)
- Inventory/quantity limits
- Order records (for fulfillment and NFT tracking)
- Portfolio content

**What Stripe handles:**
- Product names and descriptions
- Pricing
- Payment processing
- Checkout sessions
- Invoices and receipts

---

## Schema Overview

```
products
├── variants (1:many)
├── product_dependencies (many:many)
└── product_specs (1:many - JSON storage)

orders
├── order_items (1:many)
└── nft_tokens (1:1 for Founder Editions)

portfolio_items
└── portfolio_images (1:many)
```

---

## Tables

### `products`

Core product information.

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,                    -- Matches Stripe Product ID (e.g., "Material-8x8-V")
  name TEXT NOT NULL,                     -- Display name
  description TEXT,                       -- Short description
  category TEXT NOT NULL,                 -- "material", "connector", "control", "diffuser", "kit", "interface"
  dev_status INTEGER NOT NULL DEFAULT 0,  -- 0-5 (only show if status = 5)
  base_price INTEGER NOT NULL,            -- Price in cents (from Stripe, cached for display)
  is_active BOOLEAN DEFAULT true,         -- Enable/disable product
  requires_assembly BOOLEAN DEFAULT false,-- DIY vs pre-assembled
  has_variants BOOLEAN DEFAULT false,     -- Does this product have color/option variants?
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_dev_status ON products(dev_status);
CREATE INDEX idx_products_active ON products(is_active);
```

**Example rows:**
```sql
INSERT INTO products (id, name, category, dev_status, base_price, has_variants) VALUES
('Material-8x8-V', '8x8 Void Panel', 'material', 5, 3500, false),
('Control-2-5v', '2-Output Control (5v)', 'control', 1, 4500, false),
('Unit-8x8x8-Founder', 'Founder Edition Cube', 'kit', 5, 99500, true);
```

---

### `variants`

Product variants (colors, options). Only used when `products.has_variants = true`.

```sql
CREATE TABLE variants (
  id TEXT PRIMARY KEY,                    -- e.g., "Unit-8x8x8-Founder-Black"
  product_id TEXT NOT NULL,               -- Foreign key to products.id
  stripe_product_id TEXT NOT NULL,        -- Stripe Product ID for this variant
  variant_type TEXT NOT NULL,             -- "color", "voltage", "size", etc.
  variant_value TEXT NOT NULL,            -- "BLACK", "WHITE", "RED", "5v", "24v", etc.
  price_modifier INTEGER DEFAULT 0,       -- Price difference from base (in cents)
  is_limited_edition BOOLEAN DEFAULT false,
  max_quantity INTEGER,                   -- NULL = unlimited, otherwise limit
  sold_quantity INTEGER DEFAULT 0,        -- Track sales for limited editions
  available_quantity INTEGER GENERATED ALWAYS AS (max_quantity - sold_quantity) STORED,
  is_available BOOLEAN GENERATED ALWAYS AS (max_quantity IS NULL OR sold_quantity < max_quantity) STORED,
  metadata JSONB,                         -- Flexible storage for variant-specific data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_available ON variants(is_available);
CREATE UNIQUE INDEX idx_variants_stripe ON variants(stripe_product_id);
```

**Example rows:**
```sql
INSERT INTO variants (id, product_id, stripe_product_id, variant_type, variant_value, is_limited_edition, max_quantity) VALUES
('Unit-8x8x8-Founder-Black', 'Unit-8x8x8-Founder', 'prod_stripe_founder_black', 'color', 'BLACK', true, 500),
('Unit-8x8x8-Founder-White', 'Unit-8x8x8-Founder', 'prod_stripe_founder_white', 'color', 'WHITE', true, 300),
('Unit-8x8x8-Founder-Red', 'Unit-8x8x8-Founder', 'prod_stripe_founder_red', 'color', 'RED', true, 200);
```

**Notes:**
- `available_quantity` and `is_available` are computed columns (automatic)
- Decrement `sold_quantity` on successful order
- For future: Can add color variants to Material-8x8-V using same table structure

---

### `product_dependencies`

Define compatibility rules and suggestions between products.

```sql
CREATE TABLE product_dependencies (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL,               -- The product that has the dependency
  depends_on_product_id TEXT NOT NULL,    -- The product it depends on/relates to
  dependency_type TEXT NOT NULL,          -- "requires", "suggests", "incompatible", "voltage_match"
  message TEXT,                           -- User-facing message (e.g., "Requires 5v control unit")
  metadata JSONB,                         -- Additional rules (quantity ratios, etc.)

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_dependencies_product ON product_dependencies(product_id);
CREATE INDEX idx_dependencies_type ON product_dependencies(dependency_type);
```

**Example rows:**
```sql
-- Spine connectors require Material-8x8-V panels
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type, message) VALUES
('Connect-4x31.6-5v', 'Material-8x8-V', 'requires', 'Requires Material-8x8-V panels to connect'),
('Connect-4x31.6-5v', 'Control-2-5v', 'voltage_match', 'Must use with 5v control unit');

-- Material panels suggest diffusion caps
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type, message, metadata) VALUES
('Material-8x8-V', 'Diffuse-12-C', 'suggests', 'Recommended: 64 diffusion caps per panel', '{"quantity_ratio": 64}');
```

**Dependency Types:**
- `requires` - Hard requirement (show warning if missing)
- `suggests` - Soft suggestion (show recommendation)
- `incompatible` - Cannot be used together (show error)
- `voltage_match` - Must match voltage system (5v or 24v)

---

### `product_specs`

Technical specifications for products (flexible JSON storage).

```sql
CREATE TABLE product_specs (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL,
  spec_key TEXT NOT NULL,                 -- e.g., "voltage", "max_panels", "dimensions", "led_count"
  spec_value TEXT NOT NULL,               -- e.g., "5v", "8-10", "240mm x 240mm", "64"
  spec_unit TEXT,                         -- e.g., "v", "mm", "panels", null
  display_order INTEGER DEFAULT 0,        -- Order to display specs

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_specs_product ON product_specs(product_id);
CREATE UNIQUE INDEX idx_specs_key ON product_specs(product_id, spec_key);
```

**Example rows:**
```sql
INSERT INTO product_specs (product_id, spec_key, spec_value, spec_unit, display_order) VALUES
('Material-8x8-V', 'dimensions', '240 x 240', 'mm', 1),
('Material-8x8-V', 'led_count', '64', 'LEDs', 2),
('Material-8x8-V', 'spacing', '31.6', 'mm', 3),
('Control-2-5v', 'voltage', '5', 'v', 1),
('Control-2-5v', 'max_panels', '8-10', 'panels', 2),
('Control-2-5v', 'outputs', '2', 'ESP32 outputs', 3);
```

**Alternative Approach:**
Could store specs as JSONB on `products` table instead:
```sql
ALTER TABLE products ADD COLUMN specs JSONB;

-- Example:
UPDATE products SET specs = '{
  "voltage": "5v",
  "max_panels": "8-10",
  "outputs": 2,
  "dimensions": {"width": 240, "height": 240, "unit": "mm"}
}'::jsonb WHERE id = 'Control-2-5v';
```

**Decision:** Use separate `product_specs` table for now (easier to query and validate). Can migrate to JSONB later if needed.

---

### `orders`

Track orders for fulfillment and NFT assignment.

```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,                    -- Stripe Checkout Session ID
  stripe_payment_intent_id TEXT,          -- Stripe Payment Intent ID
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- "pending", "paid", "fulfilled", "shipped", "delivered", "cancelled"
  subtotal INTEGER NOT NULL,              -- Amount in cents (before tax/shipping)
  tax INTEGER DEFAULT 0,
  shipping INTEGER DEFAULT 0,
  total INTEGER NOT NULL,                 -- Total amount charged
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

  -- Metadata
  notes TEXT,                             -- Internal notes
  metadata JSONB,                         -- Flexible storage

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
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
  product_id TEXT NOT NULL,               -- References products.id
  variant_id TEXT,                        -- References variants.id (if applicable)
  stripe_product_id TEXT NOT NULL,        -- Stripe Product ID used in checkout
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,            -- Price per unit in cents
  total_price INTEGER NOT NULL,           -- quantity * unit_price

  -- Snapshot product info (in case product changes later)
  product_name TEXT NOT NULL,
  variant_name TEXT,                      -- e.g., "BLACK", "WHITE"

  metadata JSONB,                         -- Custom options, notes, etc.

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);
```

**Notes:**
- We snapshot `product_name` and `variant_name` so order history remains accurate even if products change
- `metadata` can store assembly preferences, custom requests, etc.

---

### `nft_tokens`

Track MJN NFT tokens for Founder Edition units.

```sql
CREATE TABLE nft_tokens (
  id SERIAL PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,        -- MJN RWA token hash
  order_id TEXT NOT NULL,                 -- Which order this token belongs to
  order_item_id INTEGER NOT NULL,         -- Specific line item (Founder Edition unit)
  variant_id TEXT NOT NULL,               -- Color variant
  unit_number INTEGER NOT NULL,           -- Sequential number within color (1-500 for BLACK, etc.)

  -- Blockchain info (when minted)
  blockchain TEXT DEFAULT 'solana',
  contract_address TEXT,
  token_id TEXT,
  mint_transaction_hash TEXT,
  minted_at TIMESTAMP,

  -- Physical unit info
  serial_number TEXT UNIQUE,              -- Physical serial number printed on unit
  warranty_expires_at TIMESTAMP,          -- 10 years from purchase

  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_nft_order ON nft_tokens(order_id);
CREATE INDEX idx_nft_variant ON nft_tokens(variant_id);
CREATE UNIQUE INDEX idx_nft_serial ON nft_tokens(serial_number);
CREATE INDEX idx_nft_minted ON nft_tokens(minted_at);
```

**Workflow:**
1. Customer orders Founder Edition
2. Order created → `nft_tokens` row created with generated `token_hash`
3. Unit manufactured → `serial_number` added, hash printed on unit
4. Unit shipped → NFT minted on Solana blockchain → `token_id`, `mint_transaction_hash`, `minted_at` populated
5. Customer receives unit with hash printed on it + NFT in their wallet (future feature)

---

### `portfolio_items`

Installation work and case studies.

```sql
CREATE TABLE portfolio_items (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,              -- URL-friendly identifier (e.g., "venue-name-toronto")
  title TEXT NOT NULL,
  description TEXT,                       -- Short description
  content TEXT,                           -- Full content (markdown or HTML)
  category TEXT,                          -- "installation", "case_study", "event", etc.
  location TEXT,                          -- "Toronto, ON" or venue name
  year INTEGER,                           -- Year of installation/project
  featured_image_url TEXT,                -- Main image (Cloudinary URL)
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,      -- Show on homepage?
  display_order INTEGER DEFAULT 0,
  metadata JSONB,                         -- Flexible: client name, products used, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
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
  image_url TEXT NOT NULL,                -- Cloudinary URL
  thumbnail_url TEXT,                     -- Optimized thumbnail
  alt_text TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  metadata JSONB,                         -- Width, height, format, etc.
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (portfolio_item_id) REFERENCES portfolio_items(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_portfolio_images_item ON portfolio_images(portfolio_item_id);
```

---

## Data Flow

### Product Display
1. Query `products` WHERE `dev_status = 5` AND `is_active = true`
2. If `has_variants = true`, join with `variants` to show color options
3. Load `product_specs` for technical details
4. Load `product_dependencies` to show warnings/suggestions

### Add to Cart
1. Validate product/variant exists and is available
2. Check `variants.is_available` for limited editions
3. Store in session/localStorage (no DB write yet)

### Checkout
1. Create Stripe Checkout Session with products from cart
2. Redirect to Stripe embedded checkout
3. User completes payment on Stripe

### Webhook: `checkout.session.completed`
1. Receive webhook from Stripe
2. Create `orders` record
3. Create `order_items` records
4. For each limited edition variant:
   - Increment `variants.sold_quantity`
   - Create `nft_tokens` record (if Founder Edition)
5. Send confirmation email (future)

### Order Fulfillment
1. Admin views orders with `status = 'paid'`
2. Assemble/package units
3. For Founder Edition: Print token hash on unit, update `nft_tokens.serial_number`
4. Ship → update `status = 'shipped'`, add `tracking_number`
5. Mint NFT → update `nft_tokens` blockchain fields

---

## Implementation Notes

All tables described in this schema are part of the core system and should be implemented together. The database design is intentionally lean - we only store what's necessary and can extend later as needs evolve.

**Migration Approach:**
- Initial migration creates all tables
- Seed script populates products from JSON configs
- Schema supports future extensions via JSONB metadata fields

**See IMPLEMENTATION_PLAN.md for phased development approach to building features that use this schema.**

---

## Seed Data Structure

```typescript
// seed-data.ts
export const products = [
  {
    id: 'Material-8x8-V',
    name: '8x8 Void Panel',
    category: 'material',
    dev_status: 5,
    base_price: 3500,
    has_variants: false,
    // ... specs
  },
  // ... more products
];

export const variants = [
  {
    id: 'Unit-8x8x8-Founder-Black',
    product_id: 'Unit-8x8x8-Founder',
    stripe_product_id: 'prod_XXXXX', // Real Stripe ID
    variant_type: 'color',
    variant_value: 'BLACK',
    is_limited_edition: true,
    max_quantity: 500,
  },
  // ... more variants
];

export const dependencies = [
  {
    product_id: 'Connect-4x31.6-5v',
    depends_on_product_id: 'Material-8x8-V',
    dependency_type: 'requires',
    message: 'Requires Material-8x8-V panels to connect',
  },
  // ... more dependencies
];
```

---

## Open Questions / Future Considerations

1. **User accounts:** Not in MVP, but would need `users` table for saved carts, order history, etc.

2. **Inventory management:** Currently only tracking limited editions. Do we need to track inventory for all products?

3. **Pricing history:** Should we track price changes over time? Or just rely on Stripe?

4. **Product images:** Store URLs in `products.metadata` as JSONB, or separate `product_images` table?

5. **Reviews/ratings:** Future feature would need `product_reviews` table.

6. **Bulk discounts:** Handle in Stripe or custom logic?

7. **Gift cards / promo codes:** Stripe Coupons or custom implementation?

---

**Document Created:** 2025-10-22
**Last Updated:** 2025-10-22
**Status:** Ready for review
