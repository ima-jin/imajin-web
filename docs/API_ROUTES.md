# API Routes

Next.js App Router API routes in `/app/api/`. Each route is a `route.ts` file exporting HTTP handlers.

**Principles**: REST where appropriate, validate all inputs, consistent JSON responses, proper HTTP codes

## Route Structure

```
/app/api/
├── products/
│   ├── route.ts                 # GET /api/products
│   ├── [id]/route.ts            # GET /api/products/:id
│   └── variants/[id]/route.ts   # GET /api/products/variants/:id
├── cart/
│   ├── validate/route.ts        # POST /api/cart/validate
│   └── dependencies/route.ts    # POST /api/cart/dependencies
├── checkout/
│   ├── session/route.ts         # POST /api/checkout/session
│   └── success/route.ts         # GET /api/checkout/success
├── webhooks/
│   ├── stripe/route.ts          # POST /api/webhooks/stripe
│   └── test/route.ts            # POST /api/webhooks/test (dev only)
├── orders/
│   ├── route.ts                 # GET /api/orders (admin)
│   ├── [id]/route.ts            # GET /api/orders/:id
│   └── lookup/route.ts          # POST /api/orders/lookup
├── portfolio/
│   ├── route.ts                 # GET /api/portfolio
│   └── [slug]/route.ts          # GET /api/portfolio/:slug
├── admin/
│   ├── auth/route.ts            # POST /api/admin/auth
│   ├── products/route.ts        # GET/POST/PUT /api/admin/products
│   ├── orders/
│   │   ├── route.ts             # GET /api/admin/orders
│   │   ├── [id]/route.ts        # GET/PUT /api/admin/orders/:id
│   │   └── [id]/fulfill/route.ts # POST /api/admin/orders/:id/fulfill
│   └── inventory/route.ts       # GET /api/admin/inventory
└── health/route.ts              # GET /api/health
```

## Products

### `GET /api/products`
List active products (dev_status = 5)

**Query**: `category`, `limit` (default: 50), `offset` (default: 0)

**Response**:
```json
{
  "products": [{"id": "Material-8x8-V", "name": "8x8 Void Panel", ...}],
  "total": 15, "limit": 50, "offset": 0
}
```

### `GET /api/products/:id`
Single product with specs and dependencies

**Response**:
```json
{
  "product": {
    "id": "Material-8x8-V",
    "specs": [{"key": "dimensions", "value": "240 x 240", "unit": "mm"}],
    "dependencies": [{"product_id": "Diffuse-12-C", "type": "suggests", "message": "..."}]
  }
}
```

**Status**: 200 (success), 404 (not found/inactive)

### `GET /api/products/variants/:id`
Variant details

**Response**:
```json
{
  "variant": {
    "id": "Unit-8x8x8-Founder-Black",
    "is_limited_edition": true,
    "max_quantity": 500,
    "sold_quantity": 47,
    "available_quantity": 453,
    "is_available": true
  }
}
```

## Cart

### `POST /api/cart/validate`
Validate availability and quantities

**Request**:
```json
{"items": [{"product_id": "Material-8x8-V", "variant_id": null, "quantity": 8}]}
```

**Response**:
```json
{
  "valid": true,
  "items": [{"product_id": "Material-8x8-V", "valid": true, "available": true, "price": 3500}],
  "errors": []
}
```

**Error Response**:
```json
{
  "valid": false,
  "errors": [{"product_id": "Unit-8x8x8-Founder-White", "error": "Product sold out"}]
}
```

### `POST /api/cart/dependencies`
Check dependency warnings

**Response**:
```json
{
  "warnings": [{"type": "incompatible", "message": "Cannot mix 5v and 24v components", "products": [...]}],
  "suggestions": [{"type": "missing_component", "suggested_product_id": "Material-8x8-V"}]
}
```

## Checkout

### `POST /api/checkout/session`
Create Stripe Checkout Session

**Request**:
```json
{"items": [{"stripe_product_id": "prod_...", "quantity": 1}], "customer_email": "..."}
```

**Response**:
```json
{"session_id": "cs_test_...", "url": "https://checkout.stripe.com/..."}
```

**Status**: 200 (created), 400 (invalid/sold out), 500 (Stripe error)

**Notes**: Validates availability, checks limited edition quantities, session expires in 24h

### `GET /api/checkout/success`
**Query**: `session_id`
**Response**: Redirects to `/order/confirmation?order_id=...`

## Orders

### `POST /api/orders/lookup`
Look up by email and order ID

**Request**:
```json
{"email": "customer@example.com", "order_id": "cs_test_..."}
```

**Response**:
```json
{
  "order": {
    "id": "cs_test_...", "status": "paid", "total": 103500,
    "items": [{"product_name": "...", "quantity": 1, "unit_price": 99500}],
    "shipping": {...}, "tracking_number": null
  }
}
```

**Status**: 200 (found), 404 (not found/email mismatch)

## Portfolio

### `GET /api/portfolio`
List published items

**Query**: `category`, `featured` (boolean), `limit` (default: 20)

**Response**:
```json
{
  "items": [{
    "slug": "venue-name-toronto", "title": "...", "category": "installation",
    "featured_image_url": "...", "is_featured": true
  }],
  "total": 12
}
```

### `GET /api/portfolio/:slug`
Full details with image gallery

**Response**: Includes `content` (markdown), `images` array, `metadata` (client, products_used)

## Webhooks

### `POST /api/webhooks/stripe`
Handle Stripe events

**Events**: `checkout.session.completed`, `charge.refunded`, `payment_intent.payment_failed`

**Implementation** (`checkout.session.completed`):
1. Create `orders` record
2. Create `order_items` records
3. Increment `variants.sold_quantity` (limited editions)
4. Create `nft_tokens` record (Founder Editions)
5. Send confirmation email (future)

**Notes**: Verify signature with `STRIPE_WEBHOOK_SECRET`, idempotent processing

**Status**: 200 (processed), 400 (invalid signature), 500 (processing error)

### `POST /api/webhooks/test`
Test webhook (dev only, `NODE_ENV !== 'production'`)

## Admin Routes

**Auth**: All require authentication (Basic Auth or session-based)

### `POST /api/admin/auth`
Login

**Request**:
```json
{"password": "admin_password"}
```

**Response**:
```json
{"success": true, "token": "jwt_token_or_session_id"}
```

**MVP**: Compare with `ADMIN_PASSWORD` env var. Future: User accounts with roles

### `GET /api/admin/products`
List all products (including dev_status < 5)

**Query**: `dev_status`, `category`

### `POST /api/admin/products`
Create product (future - products from seed data for now)

### `PUT /api/admin/products/:id`
Update product (dev_status, price, etc.)

### `GET /api/admin/orders`
List all orders

**Query**: `status`, `limit`, `offset`

**Response**:
```json
{
  "orders": [{
    "id": "cs_test_...", "customer_email": "...", "status": "paid",
    "total": 99500, "items_count": 3, "has_founder_edition": true
  }],
  "total": 127
}
```

### `GET /api/admin/orders/:id`
Full order details (includes `stripe_payment_intent_id`, `notes`, `nft_tokens`)

### `PUT /api/admin/orders/:id`
Update order

**Request**:
```json
{"status": "shipped", "tracking_number": "1Z999AA...", "notes": "..."}
```

### `POST /api/admin/orders/:id/fulfill`
Mark fulfilled, update inventory/NFT tracking

**Request**:
```json
{
  "tracking_number": "...",
  "nft_updates": [{"token_hash": "abc123...", "serial_number": "IMJ-BLK-00047"}]
}
```

### `GET /api/admin/inventory`
Limited edition inventory levels

**Response**:
```json
{
  "inventory": [{
    "variant_id": "Unit-8x8x8-Founder-Black",
    "max_quantity": 500, "sold_quantity": 47,
    "available_quantity": 453, "reserved_quantity": 2
  }]
}
```

**Note**: `reserved_quantity` = active checkout sessions (future)

## Utility

### `GET /api/health`
Health check

**Response**:
```json
{"status": "ok", "timestamp": "...", "database": "connected", "stripe": "configured"}
```

**Status**: 200 (operational), 503 (DB failed, etc.)

**Use**: Uptime monitoring, load balancer checks, deployment verification

## Error Format

```json
{
  "error": {
    "message": "Human-readable error",
    "code": "ERROR_CODE",
    "details": {"field": "Additional context"}
  }
}
```

**HTTP Status Codes**: 200 (success), 201 (created), 400 (validation error), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict/sold out), 422 (semantic error), 500 (internal error)

## Rate Limiting

**Production** (Cloudflare):
- Public routes: 100 req/min per IP
- Admin routes: 20 req/min per IP
- Webhooks: No limit (signature-verified)

**Dev/Local**: No rate limiting

## Authentication & Security

**Public**: No auth, input validation, CORS for `imajin.ai` domains only
**Admin**: MVP = password check (`ADMIN_PASSWORD`), session token (JWT/signed cookie, 24h expiry). Future = roles
**Webhooks**: Verify Stripe signatures, reject invalid, log all events

## Future Routes (Post-MVP)

**Solana/NFT**: `/api/nft/mint`, `/api/nft/:token_hash`, `/api/checkout/solana`
**Customer Accounts**: `/api/auth/register`, `/api/auth/login`, `/api/account/orders`, `/api/account/configurations`
**Configurator**: `/api/configurator/calculate`, `/api/configurator/validate`, `/api/configurator/export`

## Implementation Notes

**Server Actions vs API Routes**:
- **API Routes** (this doc): Webhooks, mobile endpoints (future), third-party consumers, specific HTTP behavior
- **Server Actions**: Form submissions, data mutations from components, internal operations, better type safety

**MVP Decision**: Use API routes for all documented here, consider Server Actions for internal admin forms

## Testing

**Development**:
- Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Test endpoint: `/api/webhooks/test` for simulating webhooks
- Manual: Postman/Thunder Client/curl

**Automated** (Future): Unit tests for handlers, integration tests for checkout, webhook replay tests

---

**Last Updated:** 2025-10-24
