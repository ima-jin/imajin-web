# API Routes

## Overview

Next.js App Router API routes live in `/app/api/` directory. Each route is a `route.ts` file that exports HTTP method handlers (GET, POST, PUT, DELETE, etc.).

**Key Principles:**

- RESTful design where appropriate
- Secure by default (validate all inputs)
- Return consistent JSON responses
- Use proper HTTP status codes
- Leverage Next.js server-side capabilities

---

## Route Structure

```
/app/api/
├── products/
│   ├── route.ts                    # GET /api/products (list all)
│   ├── [id]/
│   │   └── route.ts                # GET /api/products/:id (single product)
│   └── variants/
│       └── [id]/
│           └── route.ts            # GET /api/products/variants/:id
│
├── cart/
│   ├── validate/
│   │   └── route.ts                # POST /api/cart/validate
│   └── dependencies/
│       └── route.ts                # POST /api/cart/dependencies
│
├── checkout/
│   ├── session/
│   │   └── route.ts                # POST /api/checkout/session (create Stripe session)
│   └── success/
│       └── route.ts                # GET /api/checkout/success (redirect handler)
│
├── webhooks/
│   ├── stripe/
│   │   └── route.ts                # POST /api/webhooks/stripe
│   └── test/
│       └── route.ts                # POST /api/webhooks/test (dev only)
│
├── orders/
│   ├── route.ts                    # GET /api/orders (list, admin only)
│   ├── [id]/
│   │   └── route.ts                # GET /api/orders/:id
│   └── lookup/
│       └── route.ts                # POST /api/orders/lookup (by email)
│
├── portfolio/
│   ├── route.ts                    # GET /api/portfolio (list)
│   └── [slug]/
│       └── route.ts                # GET /api/portfolio/:slug
│
├── admin/
│   ├── auth/
│   │   └── route.ts                # POST /api/admin/auth (login)
│   ├── products/
│   │   └── route.ts                # GET/POST/PUT /api/admin/products
│   ├── orders/
│   │   ├── route.ts                # GET /api/admin/orders
│   │   └── [id]/
│   │       ├── route.ts            # GET/PUT /api/admin/orders/:id
│   │       └── fulfill/
│   │           └── route.ts        # POST /api/admin/orders/:id/fulfill
│   └── inventory/
│       └── route.ts                # GET /api/admin/inventory
│
└── health/
    └── route.ts                    # GET /api/health (health check)
```

---

## Public Routes

### Products

#### `GET /api/products`

List all active products (dev_status = 5).

**Query Parameters:**

- `category` (optional) - Filter by category (material, connector, control, diffuser, kit)
- `limit` (optional) - Number of results (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Response:**

```json
{
  "products": [
    {
      "id": "Material-8x8-V",
      "name": "8x8 Void Panel",
      "description": "240mm, 8×8 prototype PCB...",
      "category": "material",
      "base_price": 3500,
      "has_variants": false,
      "specs": {
        "dimensions": "240 x 240 mm",
        "led_count": "64",
        "spacing": "31.6 mm"
      },
      "images": ["https://..."]
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0
}
```

---

#### `GET /api/products/:id`

Get single product with full details.

**Path Parameters:**

- `id` - Product ID (e.g., "Material-8x8-V")

**Response:**

```json
{
  "product": {
    "id": "Material-8x8-V",
    "name": "8x8 Void Panel",
    "description": "...",
    "category": "material",
    "base_price": 3500,
    "has_variants": false,
    "specs": [
      { "key": "dimensions", "value": "240 x 240", "unit": "mm" },
      { "key": "led_count", "value": "64", "unit": "LEDs" }
    ],
    "dependencies": [
      {
        "product_id": "Diffuse-12-C",
        "type": "suggests",
        "message": "Recommended: 64 diffusion caps per panel",
        "quantity_ratio": 64
      }
    ],
    "images": ["https://..."]
  }
}
```

**Status Codes:**

- `200` - Success
- `404` - Product not found or not active

---

#### `GET /api/products/variants/:id`

Get variant details (for products with variants).

**Path Parameters:**

- `id` - Variant ID (e.g., "Unit-8x8x8-Founder-Black")

**Response:**

```json
{
  "variant": {
    "id": "Unit-8x8x8-Founder-Black",
    "product_id": "Unit-8x8x8-Founder",
    "stripe_product_id": "prod_...",
    "variant_type": "color",
    "variant_value": "BLACK",
    "is_limited_edition": true,
    "max_quantity": 500,
    "sold_quantity": 47,
    "available_quantity": 453,
    "is_available": true
  }
}
```

---

### Cart Validation

#### `POST /api/cart/validate`

Validate cart items (check availability, quantities).

**Request Body:**

```json
{
  "items": [
    {
      "product_id": "Material-8x8-V",
      "variant_id": null,
      "quantity": 8
    },
    {
      "product_id": "Unit-8x8x8-Founder",
      "variant_id": "Unit-8x8x8-Founder-Black",
      "quantity": 1
    }
  ]
}
```

**Response:**

```json
{
  "valid": true,
  "items": [
    {
      "product_id": "Material-8x8-V",
      "valid": true,
      "available": true,
      "price": 3500
    },
    {
      "product_id": "Unit-8x8x8-Founder",
      "variant_id": "Unit-8x8x8-Founder-Black",
      "valid": true,
      "available": true,
      "remaining": 453,
      "price": 99500
    }
  ],
  "errors": []
}
```

**Error Response:**

```json
{
  "valid": false,
  "items": [...],
  "errors": [
    {
      "product_id": "Unit-8x8x8-Founder-White",
      "error": "Product sold out"
    }
  ]
}
```

---

#### `POST /api/cart/dependencies`

Check for dependency warnings/issues in cart.

**Request Body:**

```json
{
  "items": [
    {
      "product_id": "Connect-4x31.6-5v",
      "quantity": 4
    },
    {
      "product_id": "Control-8-24v",
      "quantity": 1
    }
  ]
}
```

**Response:**

```json
{
  "warnings": [
    {
      "type": "incompatible",
      "message": "Cannot mix 5v and 24v components in same fixture",
      "products": ["Connect-4x31.6-5v", "Control-8-24v"]
    }
  ],
  "suggestions": [
    {
      "type": "missing_component",
      "message": "Spine connectors require Material-8x8-V panels",
      "suggested_product_id": "Material-8x8-V"
    }
  ]
}
```

---

### Checkout

#### `POST /api/checkout/session`

Create Stripe Checkout Session.

**Request Body:**

```json
{
  "items": [
    {
      "stripe_product_id": "prod_...",
      "quantity": 1
    }
  ],
  "customer_email": "customer@example.com"
}
```

**Response:**

```json
{
  "session_id": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

**Status Codes:**

- `200` - Session created
- `400` - Invalid items or sold out
- `500` - Stripe error

**Notes:**

- Validates all items are available before creating session
- For limited editions, checks available_quantity
- Session expires after 24 hours

---

#### `GET /api/checkout/success`

Handle successful checkout redirect.

**Query Parameters:**

- `session_id` - Stripe session ID

**Response:**
Redirects to `/order/confirmation?order_id=...`

---

### Orders

#### `POST /api/orders/lookup`

Look up order by email and order ID.

**Request Body:**

```json
{
  "email": "customer@example.com",
  "order_id": "cs_test_..."
}
```

**Response:**

```json
{
  "order": {
    "id": "cs_test_...",
    "status": "paid",
    "customer_email": "customer@example.com",
    "total": 103500,
    "created_at": "2025-10-22T...",
    "items": [
      {
        "product_name": "Founder Edition Cube",
        "variant_name": "BLACK",
        "quantity": 1,
        "unit_price": 99500
      }
    ],
    "shipping": {
      "name": "John Doe",
      "address_line1": "123 Main St",
      "city": "Toronto",
      "state": "ON",
      "postal_code": "M5V 1A1",
      "country": "CA"
    },
    "tracking_number": null,
    "shipped_at": null
  }
}
```

**Status Codes:**

- `200` - Order found
- `404` - Order not found or email doesn't match

---

### Portfolio

#### `GET /api/portfolio`

List published portfolio items.

**Query Parameters:**

- `category` (optional) - Filter by category
- `featured` (optional) - Only featured items (boolean)
- `limit` (optional) - Number of results (default: 20)

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "slug": "venue-name-toronto",
      "title": "Venue Installation - Toronto",
      "description": "Custom LED installation...",
      "category": "installation",
      "location": "Toronto, ON",
      "year": 2024,
      "featured_image_url": "https://...",
      "is_featured": true
    }
  ],
  "total": 12
}
```

---

#### `GET /api/portfolio/:slug`

Get single portfolio item with full details and image gallery.

**Response:**

```json
{
  "item": {
    "id": 1,
    "slug": "venue-name-toronto",
    "title": "Venue Installation - Toronto",
    "description": "...",
    "content": "Full markdown content...",
    "category": "installation",
    "location": "Toronto, ON",
    "year": 2024,
    "featured_image_url": "https://...",
    "images": [
      {
        "image_url": "https://...",
        "thumbnail_url": "https://...",
        "alt_text": "Installation view 1",
        "caption": "Main installation space"
      }
    ],
    "metadata": {
      "client": "Venue Name",
      "products_used": ["Material-8x8-V", "Control-2-5v"]
    }
  }
}
```

---

## Webhook Routes

### `POST /api/webhooks/stripe`

Handle Stripe webhooks.

**Events Handled:**

- `checkout.session.completed` - Create order, decrement inventory
- `charge.refunded` - Update order status (future)
- `payment_intent.payment_failed` - Log failure (future)

**Request:**
Stripe sends signed webhook payload.

**Response:**

```json
{
  "received": true
}
```

**Implementation Notes:**

- Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
- Idempotent (can process same event multiple times safely)
- For `checkout.session.completed`:
  1. Create `orders` record
  2. Create `order_items` records
  3. For limited editions: increment `variants.sold_quantity`
  4. For Founder Editions: create `nft_tokens` record
  5. Send confirmation email (future)

**Status Codes:**

- `200` - Event processed
- `400` - Invalid signature
- `500` - Processing error

---

### `POST /api/webhooks/test`

Test webhook handler (dev/local environment only).

**Purpose:** Simulate Stripe webhooks without Stripe CLI.

**Request Body:**

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "customer_email": "test@example.com",
      "amount_total": 99500,
      "line_items": [...]
    }
  }
}
```

**Note:** Only enabled when `NODE_ENV !== 'production'`

---

## Admin Routes

All admin routes require authentication (Basic Auth or session-based).

### Authentication

#### `POST /api/admin/auth`

Admin login.

**Request Body:**

```json
{
  "password": "admin_password"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt_token_or_session_id"
}
```

**Notes:**

- For MVP: Simple password-based auth (compare with `ADMIN_PASSWORD` env var)
- Future: Proper user accounts with roles

---

### Products Management

#### `GET /api/admin/products`

List all products (including dev_status < 5).

**Query Parameters:**

- `dev_status` (optional) - Filter by dev status
- `category` (optional) - Filter by category

**Response:** Same as public `/api/products` but includes all products.

---

#### `POST /api/admin/products`

Create new product (future - for now products come from seed data).

---

#### `PUT /api/admin/products/:id`

Update product (e.g., change dev_status, price, etc.).

---

### Orders Management

#### `GET /api/admin/orders`

List all orders.

**Query Parameters:**

- `status` (optional) - Filter by status
- `limit` (optional) - Pagination
- `offset` (optional) - Pagination

**Response:**

```json
{
  "orders": [
    {
      "id": "cs_test_...",
      "customer_email": "customer@example.com",
      "customer_name": "John Doe",
      "status": "paid",
      "total": 99500,
      "created_at": "2025-10-22T...",
      "items_count": 3,
      "has_founder_edition": true
    }
  ],
  "total": 127,
  "limit": 50,
  "offset": 0
}
```

---

#### `GET /api/admin/orders/:id`

Get full order details (including fulfillment info).

**Response:**
Same as public order lookup, plus:

```json
{
  "order": {
    ...
    "stripe_payment_intent_id": "pi_...",
    "notes": "Internal notes",
    "nft_tokens": [
      {
        "token_hash": "abc123...",
        "serial_number": "IMJ-BLK-00047",
        "warranty_expires_at": "2035-10-22T..."
      }
    ]
  }
}
```

---

#### `PUT /api/admin/orders/:id`

Update order (status, notes, etc.).

**Request Body:**

```json
{
  "status": "shipped",
  "tracking_number": "1Z999AA...",
  "notes": "Shipped via UPS"
}
```

---

#### `POST /api/admin/orders/:id/fulfill`

Mark order as fulfilled and update inventory/NFT tracking.

**Request Body:**

```json
{
  "tracking_number": "1Z999AA...",
  "nft_updates": [
    {
      "token_hash": "abc123...",
      "serial_number": "IMJ-BLK-00047"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "order": {
    "id": "cs_test_...",
    "status": "shipped",
    "shipped_at": "2025-10-23T..."
  }
}
```

---

### Inventory Management

#### `GET /api/admin/inventory`

Get inventory levels for limited editions.

**Response:**

```json
{
  "inventory": [
    {
      "variant_id": "Unit-8x8x8-Founder-Black",
      "product_name": "Founder Edition Cube",
      "variant_value": "BLACK",
      "max_quantity": 500,
      "sold_quantity": 47,
      "available_quantity": 453,
      "reserved_quantity": 2
    },
    {
      "variant_id": "Unit-8x8x8-Founder-White",
      "product_name": "Founder Edition Cube",
      "variant_value": "WHITE",
      "max_quantity": 300,
      "sold_quantity": 89,
      "available_quantity": 211,
      "reserved_quantity": 0
    }
  ]
}
```

**Notes:**

- `reserved_quantity` = items in active checkout sessions (future feature)

---

## Utility Routes

### `GET /api/health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-22T14:30:00Z",
  "database": "connected",
  "stripe": "configured"
}
```

**Status Codes:**

- `200` - All systems operational
- `503` - Service unavailable (DB connection failed, etc.)

**Use Cases:**

- Uptime monitoring
- Load balancer health checks
- Deployment verification

---

## Error Response Format

All API routes return errors in consistent format:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      "field": "Additional context"
    }
  }
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., sold out during checkout)
- `422` - Unprocessable Entity (semantic error)
- `500` - Internal Server Error

---

## Rate Limiting

**Strategy:**

- Production: Cloudflare rate limiting (configured per route)
- Dev/Local: No rate limiting

**Limits (Production):**

- Public routes: 100 requests/minute per IP
- Admin routes: 20 requests/minute per IP
- Webhooks: No limit (verified by signature)

---

## Authentication & Security

### Public Routes

- No authentication required
- Input validation on all parameters
- CORS configured for `imajin.ai` domains only

### Admin Routes

- **MVP:** Basic password authentication
  - Check password against `ADMIN_PASSWORD` env var
  - Return session token (JWT or signed cookie)
  - Token expires after 24 hours
- **Future:** Full auth system with roles

### Webhook Routes

- Verify Stripe webhook signatures
- Reject requests without valid signature
- Log all webhook events

---

## Future Routes (Post-MVP)

### Solana/NFT Integration

- `POST /api/nft/mint` - Mint NFT for Founder Edition
- `GET /api/nft/:token_hash` - Get NFT details
- `POST /api/checkout/solana` - Solana Pay checkout

### Customer Accounts

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/account/orders`
- `GET /api/account/configurations` - Saved fixture configs

### Configurator

- `POST /api/configurator/calculate` - Calculate power/voltage
- `POST /api/configurator/validate` - Validate configuration
- `POST /api/configurator/export` - Export BOM/wiring diagram

---

## Implementation Notes

### Server Actions vs API Routes

Next.js App Router supports both:

- **Server Actions** - Direct server functions called from components
- **API Routes** - Traditional HTTP endpoints

**When to use each:**

**API Routes (this document):**

- External integrations (Stripe webhooks)
- Mobile app endpoints (future)
- Third-party API consumers (future)
- Endpoints requiring specific HTTP behavior

**Server Actions:**

- Form submissions
- Data mutations from components
- When you don't need a public endpoint
- Simpler type safety with TypeScript

**Decision for MVP:**

- Use API routes for everything documented here
- Consider Server Actions for internal forms (admin updates, etc.)
- Re-evaluate as Next.js best practices evolve

---

## Testing Strategy

### Development

- Use Stripe CLI for webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Test endpoint: `/api/webhooks/test` for simulating webhooks
- Manual testing with Postman/Thunder Client/curl

### Automated Testing (Future)

- Unit tests for route handlers
- Integration tests for checkout flow
- Webhook replay tests

---

**Document Created:** 2025-10-22
**Last Updated:** 2025-10-22
**Status:** Complete - Ready for implementation
