# Phase 2.5.2 - Pre-Sale vs Pre-Order Schema

**Status:** 🟢 Ready to Implement (Business decisions made)
**Priority:** HIGH - Enables early-bird revenue
**Started:** 2025-11-02
**Target Completion:** TBD
**Estimated Duration:** 8-12 hours

---

## Business Decisions (APPROVED 2025-11-02)

### Pricing Model
1. **Deposit Amount:** Fixed dollar amount per product (add `presale_deposit_price` column)
2. **COGS:** Add `cogs_price` column (cost of goods sold)
3. **Wholesale:** Add `wholesale_price` column
4. **Completion:** Via checkout flow, assigned to customer email initially (portal later)
5. **Refunds:** Customer can request refund anytime, even when order is ready
6. **Funds:** Stripe holds deposits in balance
7. **Inventory:** Pre-sale orders don't count against inventory limits

### Pricing Tiers
```
base_price             // Retail price (shown for for-sale, pre-order, pre-sale)
presale_deposit_price  // Deposit amount (customer pays upfront during pre-sale)
wholesale_price        // Wholesale price (ONLY for logged-in vendors - future)
cogs_price             // Cost of goods (internal tracking)
```

**Display Rules:**
- `sell_status: 'for-sale'` → Show `base_price`
- `sell_status: 'pre-order'` → Show `wholesale_price` IF user paid deposit, otherwise `base_price`
- `sell_status: 'pre-sale'` → Show deposit badge ONLY (hide all pricing)
- `wholesale_price` → Only shown to deposit holders during pre-order (or logged-in vendors, future)

**Pre-Sale → Pre-Order Flow:**
1. **Pre-Sale:** Customer sees "PRE-SALE - $250 deposit to secure early pricing" (no price shown)
2. Customer pays: $250 deposit
3. Admin transitions product: `pre-sale` → `pre-order`
4. Email sent to deposit holders: "Ready to order!"
5. **Pre-Order (Deposit Holder):** Sees $975 wholesale price, pays remaining $725
6. **Pre-Order (Public):** Sees $1,295 base price

---

## Problem Statement

Currently only support **pre-order** (full price payment with delayed shipping). Need to add **pre-sale** functionality that allows customers to pay a refundable deposit to secure wholesale pricing before public release.

### Current State

**Pre-Order** (`sell_status: "pre-order"`):
- Customer pays **full retail price** upfront
- Product ships when available
- Payment processed immediately
- Non-refundable (standard return policy applies)

**Example:** DIY Cube at $599 - pay $599 now, ships in 8 weeks

---

### Required New State

**Pre-Sale** (`sell_status: "pre-sale"`):
- Customer pays **deposit** to join pre-sale waitlist
- Pricing is **not shown** during pre-sale period
- Deposit is **fully refundable** anytime
- Holds their place in line for wholesale pricing
- Product transitions to `pre-order` when ready

**Pre-Order (Post-Pre-Sale Transition):**
- Admin changes `sell_status` from `pre-sale` → `pre-order`
- Admin sends email notification to deposit holders
- Deposit holders see **wholesale price** when they visit
- Public sees **base price** (higher)
- Deposit holders complete purchase at wholesale price

**Example:** Founder Edition Flow
1. **Pre-Sale Period** (`sell_status: 'pre-sale'`):
   - Show: "PRE-SALE - $250 deposit to secure early pricing"
   - Hide: All pricing
   - Customer pays: $250 deposit

2. **Transition to Pre-Order** (Admin changes to `sell_status: 'pre-order'`):
   - Email sent: "Your pre-sale item is ready to order!"
   - Email includes link to product page

3. **Pre-Order Period** (`sell_status: 'pre-order'`):
   - Deposit holder sees: $975 (wholesale) - $250 = $725 remaining
   - Public sees: $1,295 (base price)
   - Deposit holder saves: $320 vs public pricing

---

## Final Schema Design ✅

Based on business requirements, we're adding **three** new pricing columns:

```sql
ALTER TABLE products
ADD COLUMN presale_deposit_price INTEGER, -- Deposit amount (what customer pays during pre-sale)
ADD COLUMN wholesale_price INTEGER,       -- Wholesale price (vendor-only, future)
ADD COLUMN cogs_price INTEGER;            -- Cost of goods sold (internal)

ALTER TABLE variants
ADD COLUMN presale_deposit_modifier INTEGER DEFAULT 0,
ADD COLUMN wholesale_price_modifier INTEGER DEFAULT 0;
```

**Pricing Model:**
```typescript
interface Product {
  basePrice: number;                // Retail price (shown for all sell_status types)
  presaleDepositPrice?: number;     // Deposit amount (what customer pays upfront during pre-sale)
  wholesalePrice?: number;          // Wholesale (vendors only - future)
  cogsPrice?: number;               // Cost of goods (internal)
  sellStatus: 'for-sale' | 'pre-order' | 'pre-sale' | 'sold-out' | 'internal';
}

interface Variant {
  priceModifier: number;                  // Adjusts basePrice
  presaleDepositModifier: number;         // Adjusts presaleDepositPrice
  wholesalePriceModifier: number;         // Adjusts wholesalePrice (future)
}
```

**Key Points:**
- **Pre-sale hides all pricing** - Only show deposit badge during pre-sale period
- **Pre-order shows conditional pricing** - Wholesale for deposit holders, base for public
- Pre-sale: Customer pays deposit ($250), product transitions to pre-order when ready
- Pre-order: Deposit holders see wholesale ($975), public sees base ($1,295)
- `wholesale_price` is ONLY shown to deposit holders during pre-order (or logged-in vendors, future)
- Pre-sale orders don't count against inventory limits
- Deposits held in Stripe balance until final payment
- Customers can refund deposit anytime (even after product transitions to pre-order)

---

## Proposed Implementation

### Database Schema Changes

```sql
-- Add wholesale pricing fields to products
ALTER TABLE products
ADD COLUMN presale_deposit_price INTEGER,  -- Deposit amount for pre-sale
ADD COLUMN wholesale_price INTEGER,        -- Wholesale price for deposit holders
ADD COLUMN cogs_price INTEGER;             -- Cost of goods sold (internal)

-- Add modifiers to variants
ALTER TABLE variants
ADD COLUMN presale_deposit_modifier INTEGER DEFAULT 0,
ADD COLUMN wholesale_price_modifier INTEGER DEFAULT 0;

-- Update orders table to support deposit tracking
-- Add new status values: 'paid', 'applied', 'refunded'
-- Use metadata JSONB column to store:
--   {
--     target_product_id: 'Unit-8x8x8-Founder',  -- For deposit orders
--     deposit_order_id: 'uuid',                 -- For final orders
--     deposit_applied: 25000                     -- For final orders
--   }

-- Add applied_at timestamp for deposit orders
ALTER TABLE orders
ADD COLUMN applied_at TIMESTAMP;  -- When deposit was applied to final order
```

**Key Points:**
- **No separate deposit_payments table** - Use orders table with `product_id = 'pre-sale-deposit'`
- **Metadata tracks relationships** - Links deposits to target products and final orders
- **Status tracking:** `paid` → `applied` → `refunded` (optional)
- **Applied_at timestamp** - Records when deposit was used

---

### Order Workflow

**Pre-Sale → Pre-Order Lifecycle:**

1. **Deposit Payment (Pre-Sale Period)**
   ```
   Product sell_status: 'pre-sale'
   Customer clicks "Pay Deposit" ($250)

   → Create Stripe Checkout Session:
      - Product: "Pre-Sale Deposit" (generic Stripe product)
      - Amount: Dynamic (from presale_deposit_price)
      - Metadata: { target_product_id: 'Unit-8x8x8-Founder' }

   → Webhook creates order:
      INSERT INTO orders (
        product_id: 'pre-sale-deposit',
        customer_email: 'customer@example.com',
        total_amount: 25000,
        status: 'paid',
        metadata: { target_product_id: 'Unit-8x8x8-Founder' }
      )

   → Send confirmation email: "Deposit received, we'll notify you when ready"
   ```

2. **Waiting Period (Product Still Pre-Sale)**
   ```
   Deposit order status: 'paid'
   Product sell_status: 'pre-sale'
   → Customer can request manual refund
   → Admin prepares product for launch
   ```

3. **Product Launch (Admin Transitions to Pre-Order)**
   ```
   Admin changes product sell_status: 'pre-sale' → 'pre-order'

   → System queries deposit holders:
      SELECT * FROM orders
      WHERE product_id = 'pre-sale-deposit'
        AND metadata->>'target_product_id' = 'Unit-8x8x8-Founder'
        AND status = 'paid'

   → Send email to all deposit holders:
      Subject: "Your pre-sale item is ready to order!"
      Body: "Complete your order at $975 wholesale (deposit applied)"
      Link: /products/Unit-8x8x8-Founder?email={customer_email}
   ```

4. **Final Payment (Pre-Order Period - Deposit Holder)**
   ```
   Deposit holder visits product page (/products/Unit-8x8x8-Founder?email=...)
   → System checks: userHasPaidDeposit(email, productId) = true
   → Shows: $975 wholesale price
   → Breakdown: $975 total - $250 deposit = $725 to pay

   Customer adds to cart, proceeds to checkout

   → Create Stripe Checkout Session:
      - Amount: $725 (wholesale - deposit)
      - Metadata: {
          deposit_order_id: 'uuid-of-deposit-order',
          original_wholesale_price: 97500,
          deposit_applied: 25000
        }

   → Webhook creates final order:
      INSERT INTO orders (
        product_id: 'Unit-8x8x8-Founder',
        customer_email: 'customer@example.com',
        total_amount: 97500,  -- Full wholesale price
        status: 'paid',
        metadata: { deposit_order_id: '...', deposit_applied: 25000 }
      )

   → Update deposit order:
      UPDATE orders
      SET status = 'applied', applied_at = NOW()
      WHERE id = deposit_order_id

   → Transition to fulfillment → Ship product
   ```

5. **Final Payment (Pre-Order Period - Public, No Deposit)**
   ```
   Public customer visits product page
   → System checks: userHasPaidDeposit(email, productId) = false
   → Shows: $1,295 base price

   → Create Stripe Checkout Session:
      - Amount: $1,295 (full base price)

   → Standard order creation, no deposit involved
   ```

6. **Refund Request (Self-Service)**
   ```
   Customer clicks "Request refund" link on product page (before completing final payment)

   → API route handler:
      POST /api/orders/refund-deposit
      Body: { email, productId }

   → Validate request:
      - Find deposit order (product_id = 'pre-sale-deposit', status = 'paid')
      - Verify order belongs to requesting email
      - Ensure deposit not already applied

   → Process Stripe refund:
      const depositOrder = await getDepositOrder(email, productId);
      await stripe.refunds.create({
        payment_intent: depositOrder.stripePaymentIntentId,
        reason: 'requested_by_customer'
      });

   → Update deposit order:
      UPDATE orders
      SET status = 'refunded', refunded_at = NOW()
      WHERE id = deposit_order_id

   → Send refund confirmation email:
      "Your $250 deposit has been refunded. Processing time: 5-10 business days."

   → Redirect to confirmation page
   ```

---

### JSON Config Schema Changes

**File:** `config/schema.ts`

```typescript
export const ProductConfigSchema = z.object({
  // ... existing fields ...
  base_price: z.number(),
  presale_deposit_price: z.number().optional(),  // NEW - Deposit amount for pre-sale
  wholesale_price: z.number().optional(),        // NEW - Vendor-only (future)
  cogs_price: z.number().optional(),             // NEW - Internal cost tracking
  sell_status: z.enum(['for-sale', 'pre-order', 'pre-sale', 'sold-out', 'internal']),
});

export const VariantConfigSchema = z.object({
  // ... existing fields ...
  price_modifier: z.number().default(0),
  presale_deposit_modifier: z.number().default(0),   // NEW - Adjusts deposit amount
  wholesale_price_modifier: z.number().default(0),   // NEW - Adjusts wholesale price
});
```

**Example:** `config/content/products.json`

```json
{
  "id": "Unit-8x8x8-Founder",
  "name": "Founder Edition Cube",
  "base_price": 129500,
  "presale_deposit_price": 25000,
  "wholesale_price": 97500,
  "cogs_price": 45000,
  "sell_status": "pre-sale"
}
```

---

### UI Changes - CONDITIONAL PRICING DISPLAY

**Pricing Display Logic (All Pages):**

```typescript
// Check if user paid deposit for this product
function userHasPaidDeposit(userEmail: string | null, productId: string): boolean {
  if (!userEmail) return false;
  // Query orders table for deposit payment with matching email + product
  // order_type = 'pre-sale-deposit' AND status = 'deposit_paid'
  return checkDepositPaid(userEmail, productId);
}

// Get display price based on sell_status and user status
function getDisplayPrice(
  product: Product,
  variant: Variant | undefined,
  userEmail: string | null
): { price: number; type: 'base' | 'wholesale' } | null {

  // Pre-sale: Hide all pricing
  if (product.sellStatus === 'pre-sale') {
    return null; // Don't show price
  }

  // Pre-order: Conditional pricing
  if (product.sellStatus === 'pre-order') {
    const hasPaidDeposit = userHasPaidDeposit(userEmail, product.id);

    if (hasPaidDeposit) {
      // Show wholesale price to deposit holders
      const price = (product.wholesalePrice || product.basePrice) + (variant?.wholesalePriceModifier || 0);
      return { price, type: 'wholesale' };
    } else {
      // Show base price to public
      const price = product.basePrice + (variant?.priceModifier || 0);
      return { price, type: 'base' };
    }
  }

  // For-sale: Always show base price
  const price = product.basePrice + (variant?.priceModifier || 0);
  return { price, type: 'base' };
}

// Get deposit amount for pre-sale products
function getDepositAmount(product: Product, variant?: Variant): number | null {
  if (product.sellStatus !== 'pre-sale') return null;
  return (product.presaleDepositPrice || 0) + (variant?.presaleDepositModifier || 0);
}
```

**Product Card:**
```tsx
// Pre-sale: Show deposit badge only, hide price
{product.sellStatus === 'pre-sale' && (
  <>
    <Badge variant="success">PRE-SALE</Badge>
    <div className="deposit">${formatPrice(product.presaleDepositPrice)} deposit to secure early pricing</div>
  </>
)}

// Pre-order: Conditional pricing
{product.sellStatus === 'pre-order' && (
  <>
    <Badge variant="warning">Pre-Order</Badge>
    {(() => {
      const priceInfo = getDisplayPrice(product, undefined, userEmail);
      if (!priceInfo) return null;

      return (
        <>
          <div className="price">${formatPrice(priceInfo.price)}</div>
          {priceInfo.type === 'wholesale' && (
            <Badge variant="success">Your Pre-Sale Price</Badge>
          )}
          <div className="ship-date">Ships {product.shipDate}</div>
        </>
      );
    })()}
  </>
)}

// For-sale: Normal pricing
{product.sellStatus === 'for-sale' && (
  <div className="price">${formatPrice(product.basePrice)}</div>
)}
```

**Product Detail Page:**
```tsx
{product.sellStatus === 'pre-sale' ? (
  // Pre-sale: Hide price, show deposit only
  <div>
    <Badge variant="success">PRE-SALE</Badge>
    <div className="deposit-info">
      ${formatPrice(product.presaleDepositPrice)} refundable deposit
      <p>Secure early access to wholesale pricing when this product launches.</p>
    </div>
    <Button onClick={handleReserveWithDeposit}>Pay Deposit</Button>
  </div>
) : product.sellStatus === 'pre-order' ? (
  // Pre-order: Conditional pricing
  <div>
    <Badge variant="warning">Pre-Order</Badge>
    {(() => {
      const priceInfo = getDisplayPrice(product, selectedVariant, userEmail);
      if (!priceInfo) return null;

      const hasPaidDeposit = userHasPaidDeposit(userEmail, product.id);
      const depositAmount = product.presaleDepositPrice || 0;
      const remainingBalance = priceInfo.price - depositAmount;

      return (
        <>
          <div className="price">${formatPrice(priceInfo.price)}</div>
          {priceInfo.type === 'wholesale' && hasPaidDeposit && (
            <div className="savings">
              <Badge variant="success">Your Pre-Sale Price</Badge>
              <p>Deposit: ${formatPrice(depositAmount)} | Remaining: ${formatPrice(remainingBalance)}</p>
              <p className="text-sm text-gray-600">
                Not interested? <button onClick={handleRequestRefund} className="underline">Request refund</button>
              </p>
            </div>
          )}
          <div className="ship-info">Ships {product.shipDate}</div>
          <Button onClick={handleAddToCart}>
            {hasPaidDeposit ? 'Complete Pre-Order' : 'Pre-Order Now'}
          </Button>
        </>
      );
    })()}
  </div>
) : (
  // For-sale: Normal pricing
  <div>
    <div className="price">${formatPrice(product.basePrice + (selectedVariant?.priceModifier || 0))}</div>
    <Button onClick={handleAddToCart}>Add to Cart</Button>
  </div>
)}
```

**Key Points:**
- ✅ Pre-sale → Hide price, show deposit badge only
- ✅ Pre-order → Show wholesale to deposit holders, base to public
- ✅ For-sale → Show base price
- ✅ Wholesale pricing → Only visible to deposit holders during pre-order
- ✅ Need to track deposit payments by email
- ⏸️ Email notification system → **DEFERRED to Phase 4.1.1** (manual notification initially)

---

### Checkout Flow Changes

**Pre-Sale Deposit Checkout:**
```typescript
// Customer clicks "Pay Deposit" on pre-sale product
if (product.sellStatus === 'pre-sale') {
  const depositAmount = (product.presaleDepositPrice || 0) + (variant?.presaleDepositModifier || 0);

  // Create Stripe session for generic "Pre-Sale Deposit" product
  await createCheckoutSession({
    items: [{
      stripePriceId: 'price_presale_deposit_dynamic', // Dynamic pricing
      quantity: 1,
    }],
    customerEmail: email,
    metadata: {
      order_type: 'pre-sale-deposit',
      target_product_id: product.id,
      target_variant_id: variant?.id || null,
      deposit_amount: depositAmount,
    },
    // Override amount for dynamic pricing
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: depositAmount,
        product: 'prod_presale_deposit', // Generic Stripe product
      },
      quantity: 1,
    }],
  });
}
```

**Pre-Order Checkout (Deposit Holder):**
```typescript
// Deposit holder completes pre-order
if (product.sellStatus === 'pre-order' && userHasPaidDeposit(email, productId)) {
  const depositOrder = await getDepositOrder(email, productId);
  const wholesalePrice = (product.wholesalePrice || 0) + (variant?.wholesalePriceModifier || 0);
  const depositAmount = depositOrder.totalAmount;
  const amountToCharge = wholesalePrice - depositAmount; // $975 - $250 = $725

  await createCheckoutSession({
    items: [{
      stripePriceId: variant?.stripePriceId || product.stripePriceId, // Wholesale price
      quantity: 1,
    }],
    customerEmail: email,
    metadata: {
      order_type: 'pre-order-with-deposit',
      deposit_order_id: depositOrder.id,
      original_wholesale_price: wholesalePrice,
      deposit_applied: depositAmount,
    },
    // Override amount to charge remaining balance
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: amountToCharge,
        product: product.stripeProductId,
      },
      quantity: 1,
    }],
  });
}
```

**Pre-Order Checkout (Public, No Deposit):**
```typescript
// Standard pre-order checkout
if (product.sellStatus === 'pre-order' && !userHasPaidDeposit(email, productId)) {
  const basePrice = product.basePrice + (variant?.priceModifier || 0);

  await createCheckoutSession({
    items: [{
      stripePriceId: variant?.stripePriceId || product.stripePriceId,
      quantity: 1,
    }],
    customerEmail: email,
    metadata: {
      order_type: 'pre-order',
    },
  });
}
```

---

### Refund Link Flow (Customer Self-Service)

**User Journey:**
1. Customer receives email with link: `/products/{productId}?token={refund_token}`
2. Customer lands on product page
3. Product page detects `token` query param
4. Frontend validates token and shows deposit status
5. If valid, show "Request Refund" button
6. Customer clicks button → refund processed

**URL Structure:**
```
https://imajin.ai/products/Unit-8x8x8-Founder?token=eyJvcmRlcl9pZCI6IjEyMzQ1Ni...
```

**Token Format (JWT):**
```typescript
// lib/utils/refund-token.ts
import jwt from 'jsonwebtoken';

const REFUND_TOKEN_SECRET = process.env.REFUND_TOKEN_SECRET || 'fallback-secret-change-in-prod';

export interface RefundTokenPayload {
  orderId: string;          // Deposit order ID
  email: string;            // Customer email
  productId: string;        // Target product ID
  exp: number;              // Expiration (7 days)
}

export function generateRefundToken(params: Omit<RefundTokenPayload, 'exp'>): string {
  const payload: RefundTokenPayload = {
    ...params,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };

  return jwt.sign(payload, REFUND_TOKEN_SECRET);
}

export function verifyRefundToken(token: string): RefundTokenPayload | null {
  try {
    const payload = jwt.verify(token, REFUND_TOKEN_SECRET) as RefundTokenPayload;
    return payload;
  } catch (error) {
    console.error('[Refund Token] Verification failed', error);
    return null;
  }
}
```

**Product Page Component (with Refund UI):**
```typescript
// app/products/[id]/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { verifyRefundToken } from '@/lib/utils/refund-token';
import { Button } from '@/components/ui/Button';

export default function ProductPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const refundToken = searchParams.get('token');
  const [depositStatus, setDepositStatus] = useState<'checking' | 'valid' | 'invalid' | 'refunded'>('checking');
  const [refundProcessing, setRefundProcessing] = useState(false);

  useEffect(() => {
    if (refundToken) {
      // Verify token client-side (basic check)
      // Server will do full verification during refund request
      const payload = verifyRefundToken(refundToken);
      if (payload && payload.productId === params.id) {
        setDepositStatus('valid');
      } else {
        setDepositStatus('invalid');
      }
    }
  }, [refundToken, params.id]);

  const handleRequestRefund = async () => {
    if (!refundToken) return;

    setRefundProcessing(true);

    try {
      const response = await fetch('/api/orders/refund-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refundToken }),
      });

      if (response.ok) {
        setDepositStatus('refunded');
        alert('Refund processed successfully! Funds will appear in 5-10 business days.');
      } else {
        const error = await response.json();
        alert(`Refund failed: ${error.message}`);
      }
    } catch (error) {
      alert('Failed to process refund. Please contact support.');
    } finally {
      setRefundProcessing(false);
    }
  };

  return (
    <div>
      {/* Product details */}

      {/* Deposit holder notice */}
      {depositStatus === 'valid' && (
        <div className="deposit-notice">
          <h3>You've Reserved This Product</h3>
          <p>Your deposit has been applied. Complete your order at the exclusive wholesale price, or request a full refund.</p>

          <div className="actions">
            <Button onClick={handleCheckout}>Complete Order (${wholesalePrice})</Button>
            <Button
              variant="secondary"
              onClick={handleRequestRefund}
              disabled={refundProcessing}
            >
              {refundProcessing ? 'Processing...' : 'Request Full Refund'}
            </Button>
          </div>
        </div>
      )}

      {depositStatus === 'refunded' && (
        <div className="refund-confirmation">
          <h3>Refund Processed</h3>
          <p>Your deposit has been refunded. Funds will appear in your account within 5-10 business days.</p>
        </div>
      )}

      {depositStatus === 'invalid' && (
        <div className="error-notice">
          <p>Invalid or expired refund link. Please contact support if you believe this is an error.</p>
        </div>
      )}
    </div>
  );
}
```

**Refund API Route:**
```typescript
// app/api/orders/refund-deposit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyRefundToken } from '@/lib/utils/refund-token';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createRefund } from '@/lib/services/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // 1. Verify token
    const payload = verifyRefundToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const { orderId, email, productId } = payload;

    // 2. Fetch deposit order
    const depositOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.customer_email, email),
        eq(orders.product_id, 'pre-sale-deposit'),
        eq(orders.status, 'paid')
      ),
    });

    if (!depositOrder) {
      return NextResponse.json({ error: 'Deposit order not found or already refunded' }, { status: 404 });
    }

    // 3. Verify product ID matches
    if (depositOrder.metadata?.target_product_id !== productId) {
      return NextResponse.json({ error: 'Product ID mismatch' }, { status: 400 });
    }

    // 4. Process Stripe refund
    const refund = await createRefund(depositOrder.stripe_payment_intent_id, depositOrder.total_amount);

    // 5. Update order status
    await db.update(orders)
      .set({
        status: 'refunded',
        metadata: {
          ...depositOrder.metadata,
          refunded_at: new Date().toISOString(),
          refund_id: refund.id,
        }
      })
      .where(eq(orders.id, orderId));

    // 6. TODO: Send refund confirmation email (Phase 4.1.1)

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      refundId: refund.id,
    });
  } catch (error) {
    console.error('[API] Refund deposit failed', error);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}
```

**Key Points:**
- ✅ Token-based authentication (no login required)
- ✅ 7-day token expiration
- ✅ Customer can see deposit status on product page
- ✅ One-click refund from product page
- ✅ Admin manually sends email with token (Phase 2.5.2)
- ⏸️ Automated email with token (Phase 4.1.1)

---

### Admin Workflow

**Launch Pre-Sale Product (Transition to Pre-Order):**
1. Admin opens product in admin panel
2. Change `sell_status` from `pre-sale` → `pre-order`
3. **Manual notification initially** (Phase 2.5.2):
   - Admin views list of deposit holders (see below)
   - Admin manually emails customers with product link
   - Email includes: `/products/{product_id}?email={customer_email}&refund_token={token}`
4. **Automated notification later** (Phase 4.1.1):
   - System triggers automated workflow
   - Query all orders: `product_id = 'pre-sale-deposit'` AND `status = 'paid'` AND `metadata.target_product_id = X`
   - For each deposit holder, send email notification via Resend
   - Email includes personalized link with refund token

**View Deposit Holders:**
1. Admin views product detail page
2. See list of deposit holders:
   ```sql
   SELECT customer_email, total_amount, created_at, status
   FROM orders
   WHERE product_id = 'pre-sale-deposit'
     AND metadata->>'target_product_id' = 'Unit-8x8x8-Founder'
   ORDER BY created_at ASC
   ```
3. Shows count: "42 deposits paid ($10,500 total)"

**Manual Refund (Optional):**
- If customer contacts support, admin can manually process refund
- Same logic as self-service refund
- Admin notes reason in order metadata

---

## Testing Strategy

### Unit Tests
- Pre-sale order creation
- Deposit payment processing
- Final payment calculation
- Refund logic
- Price calculations (retail vs wholesale)

### Integration Tests
- Full pre-sale checkout flow
- Webhook handling for deposits
- ~~Email sending for final payment request~~ → **DEFERRED to Phase 4.1.1**
- Refund processing with token validation

### E2E Tests
- Customer reserves with deposit
- ~~Customer receives confirmation email~~ → **DEFERRED to Phase 4.1.1**
- Admin transitions product to pre-order (manual email notification initially)
- Customer receives email with refund token (manual, Phase 2.5.2)
- Customer lands on product page via token link
- Customer sees deposit status and wholesale price
- Customer completes final payment
- Customer requests refund via token link

---

## Acceptance Criteria

- [x] Business decisions made (deposit amount, wholesale pricing, completion workflow) ✅
- [ ] Database schema updated with pricing columns (presale_deposit_price, wholesale_price, cogs_price)
- [ ] Database schema supports applied_at timestamp for deposits
- [ ] JSON config schema supports wholesale pricing fields
- [ ] Stripe "Pre-Sale Deposit" product created with dynamic pricing
- [ ] Pre-sale products hide pricing, show deposit badge only
- [ ] Pre-order products show wholesale price to deposit holders, base price to public
- [ ] Deposit checkout flow creates order with product_id = 'pre-sale-deposit'
- [ ] Deposit orders store target_product_id in metadata
- [ ] Admin can transition product from pre-sale → pre-order (sell_status change)
- [ ] Admin can view list of deposit holders for each product
- ~~[ ] Email notification system sends alerts to deposit holders~~ → **DEFERRED to Phase 4.1.1** (manual email initially)
- [ ] Refund token generation utility (`lib/utils/refund-token.ts`)
- [ ] Product page detects `?token=` query param and shows deposit status
- [ ] Product page shows "Request Refund" button for valid token holders
- [ ] Pre-order checkout calculates remaining balance (wholesale - deposit)
- [ ] Pre-order checkout charges $725 for deposit holders, $1,295 for public
- [ ] Final payment marks deposit order as 'applied' with applied_at timestamp
- [ ] Self-service refund API route created (POST /api/orders/refund-deposit)
- [ ] Refund workflow validates token, ownership, and processes Stripe refund
- [ ] Refund marks order as 'refunded' with refund_id in metadata
- ~~[ ] Refund marks order as 'refunded' and sends confirmation email~~ → **Email deferred to Phase 4.1.1**
- [ ] Refund token expires after 7 days
- [ ] Product page shows refund confirmation message after successful refund
- [ ] Environment variable `REFUND_TOKEN_SECRET` added for JWT signing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Full pre-sale → pre-order E2E test passing

---

## Estimated Duration

**After business decisions made:**
- Schema design: 1 hour
- Database migrations: 30 min
- Order service logic: 2-3 hours
- Checkout flow updates: 2-3 hours
- Refund token utility: 1 hour
- Product page refund UI: 1-2 hours
- Refund API route: 1 hour
- Admin workflow (UI for viewing deposit holders): 1-2 hours
- ~~Email templates: 1 hour~~ → **DEFERRED to Phase 4.1.1**
- Testing: 2-3 hours
- **Total: 12-16 hours** (was 11-15 hours, added refund UI work)

---

## Dependencies

**Requires:**
- Phase 2.5.1 (Stripe Price Architecture) recommended first
- Products synced to Stripe

**Blocks:**
- Pre-sale customer onboarding
- Early-bird revenue generation

---

## Related Documents

- [Phase 2.5 - Products & Inventory Completion](./Phase%202.5%20-%20Products%20&%20Inventory%20Completion.md)
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)
- [Stripe Payment Intents API](https://stripe.com/docs/api/payment_intents)
- [Stripe Payment Links](https://stripe.com/docs/payment-links)
