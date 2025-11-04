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
base_price          // Retail price (public)
wholesale_price     // Wholesale price (pre-sale customers)
cogs_price          // Cost of goods (internal tracking)
presale_deposit_price  // Refundable deposit amount
```

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

**Pre-Sale** (`sell_status: "pre-sale"` or new status?):
- Customer pays **deposit** (amount TBD)
- Secures **wholesale price** (lower than retail)
- Deposit is **fully refundable**
- Holds their place in line
- Complete purchase later when product ready

**Example:** Founder Edition at wholesale $975 (vs retail $1,295)
- Pay $200 deposit now (refundable)
- Complete purchase ($775 remaining) when product ships
- Save $320 vs retail price

---

## Final Schema Design ✅

Based on business requirements, we're adding three new pricing columns to track retail, wholesale, COGS, and deposit amounts:

```sql
ALTER TABLE products
ADD COLUMN wholesale_price INTEGER,      -- Wholesale price (pre-sale pricing)
ADD COLUMN cogs_price INTEGER,           -- Cost of goods sold (internal)
ADD COLUMN presale_deposit_price INTEGER; -- Refundable deposit amount

ALTER TABLE variants
ADD COLUMN wholesale_price_modifier INTEGER DEFAULT 0,
ADD COLUMN presale_deposit_modifier INTEGER DEFAULT 0;
```

**Pricing Model:**
```typescript
interface Product {
  basePrice: number;               // Retail (public pricing)
  wholesalePrice?: number;         // Wholesale (pre-sale pricing)
  cogsPrice?: number;              // Cost of goods (internal tracking)
  presaleDepositPrice?: number;    // Deposit amount (refundable)
  sellStatus: 'for-sale' | 'pre-order' | 'pre-sale' | 'sold-out' | 'internal';
}

interface Variant {
  priceModifier: number;                 // Adjusts basePrice
  wholesalePriceModifier: number;        // Adjusts wholesalePrice
  presaleDepositModifier: number;        // Adjusts presaleDepositPrice
}
```

**Key Points:**
- `sell_status: 'pre-sale'` indicates product available for pre-sale
- Pre-sale orders don't count against inventory limits
- Deposits held in Stripe balance until final payment
- Customers can refund anytime (even after order ready)

---

## Proposed Implementation

### Database Schema Changes

```sql
-- Add wholesale pricing fields
ALTER TABLE products
ADD COLUMN wholesale_price INTEGER,
ADD COLUMN deposit_amount INTEGER;

ALTER TABLE variants
ADD COLUMN wholesale_price_modifier INTEGER DEFAULT 0;

-- Add deposit payment tracking
CREATE TABLE deposit_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  stripe_payment_intent_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'refunded'
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add final payment tracking
CREATE TABLE final_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  deposit_payment_id UUID REFERENCES deposit_payments(id),
  stripe_payment_intent_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed'
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Order Workflow

**Pre-Sale Order Lifecycle:**

1. **Deposit Payment**
   ```
   Customer clicks "Reserve with Deposit"
   → Create order with status 'pending_deposit'
   → Stripe checkout for deposit amount
   → Webhook: Mark order as 'deposit_paid'
   → Send confirmation email
   ```

2. **Waiting Period**
   ```
   Order status: 'deposit_paid'
   → Customer can request refund anytime
   → Admin can trigger final payment request
   ```

3. **Final Payment Request**
   ```
   Admin triggers "Request Final Payment"
   → Send email with Stripe payment link
   → Link expires in 7 days
   → Order status: 'awaiting_final_payment'
   ```

4. **Final Payment Completed**
   ```
   Customer pays remaining amount
   → Webhook: Mark order as 'paid'
   → Transition to fulfillment
   → Ship product
   ```

5. **Refund Request**
   ```
   Customer requests refund (before final payment)
   → Process Stripe refund
   → Mark deposit_payment as 'refunded'
   → Cancel order
   ```

---

### JSON Config Schema Changes

**File:** `config/schema.ts`

```typescript
export const ProductConfigSchema = z.object({
  // ... existing fields ...
  base_price: z.number(),
  wholesale_price: z.number().optional(), // NEW
  deposit_amount: z.number().optional(),  // NEW
  sell_status: z.enum(['for-sale', 'pre-order', 'pre-sale', 'sold-out', 'internal']),
});

export const VariantConfigSchema = z.object({
  // ... existing fields ...
  price_modifier: z.number().default(0),
  wholesale_price_modifier: z.number().default(0), // NEW
});
```

**Example:** `config/content/products.json`

```json
{
  "id": "Unit-8x8x8-Founder",
  "name": "Founder Edition Cube",
  "base_price": 129500,
  "wholesale_price": 97500,
  "deposit_amount": 25000,
  "sell_status": "pre-sale"
}
```

---

### UI Changes

**Product Card Badge:**
```tsx
{product.sellStatus === 'pre-sale' && (
  <Badge variant="success">
    Pre-Sale: ${formatPrice(product.depositAmount)} Deposit
  </Badge>
)}
```

**Product Detail Page:**
```tsx
<div className="pricing">
  <div className="wholesale-price">
    ${formatPrice(product.wholesalePrice)}
    <span className="discount">Save ${formatPrice(product.basePrice - product.wholesalePrice)}</span>
  </div>
  <div className="deposit-info">
    Reserve now with ${formatPrice(product.depositAmount)} refundable deposit
  </div>
  <Button onClick={handleReserveWithDeposit}>
    Reserve with Deposit
  </Button>
</div>
```

---

### Checkout Flow Changes

**Pre-Sale Checkout:**
- Cart shows wholesale price
- Checkout only charges deposit amount
- Order summary shows:
  - Subtotal (wholesale price)
  - Due today (deposit)
  - Due later (remaining balance)

**Stripe Session Creation:**
```typescript
if (product.sellStatus === 'pre-sale') {
  // Charge deposit only
  amount = product.depositAmount;
  metadata.order_type = 'pre-sale-deposit';
  metadata.wholesale_price = product.wholesalePrice;
  metadata.remaining_balance = product.wholesalePrice - product.depositAmount;
}
```

---

### Admin Workflow

**Trigger Final Payment:**
1. Admin selects orders with status `deposit_paid`
2. Click "Request Final Payment"
3. System generates Stripe payment link
4. Email sent to customer
5. Order status → `awaiting_final_payment`

**Refund Deposit:**
1. Admin (or customer self-service) requests refund
2. System processes Stripe refund
3. Mark deposit as refunded
4. Cancel order

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
- Email sending for final payment request
- Refund processing

### E2E Tests
- Customer reserves with deposit
- Customer receives confirmation email
- Admin requests final payment
- Customer completes final payment
- Customer requests refund

---

## Acceptance Criteria

- [ ] Business decisions made (deposit amount, wholesale pricing, completion workflow)
- [ ] Database schema updated with pricing and payment tracking tables
- [ ] JSON config schema supports wholesale pricing
- [ ] Pre-sale products display correctly on product pages
- [ ] Deposit checkout flow works end-to-end
- [ ] Order tracks deposit and final payment separately
- [ ] Admin can trigger final payment request
- [ ] Customer receives payment link email
- [ ] Final payment completes successfully
- [ ] Refund workflow works correctly
- [ ] All tests passing

---

## Estimated Duration

**After business decisions made:**
- Schema design: 1 hour
- Database migrations: 30 min
- Order service logic: 2-3 hours
- Checkout flow updates: 2-3 hours
- Admin workflow: 2-3 hours
- Email templates: 1 hour
- Testing: 2-3 hours
- **Total: 11-15 hours**

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
