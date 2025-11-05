# Phase 2.5.2.1 - Pre-Sale Deposit Checkout Implementation (REVISED)

**Type:** Feature - Revenue Enablement
**Priority:** HIGH - Blocking early-bird revenue
**Status:** 🟢 Approved for Implementation
**Estimated Effort:** 1-2 hours (reduced from 4-6h after Phase 2.5.2 audit)
**Dependencies:** Phase 2.5.2 (Schema + Backend Services) ✅

---

## Revision History

**v2.1 (2025-11-04):** Applied Dr. Clean's minor changes
- **Added:** Zod validation schemas for both API routes
- **Fixed:** Server Component integration (direct service calls)
- **Added:** Component type clarifications (Client vs Server)
- **Added:** 3 additional error handling tests
- **Updated:** Test count from 53 → 56 tests
- **Clarified:** Logger usage requirement

**v2.0 (2025-11-04):** Major revision after Dr. Clean review
- **Removed:** ~80% of tasks already implemented in Phase 2.5.2
- **Reduced:** Test count from 117 → 53 tests
- **Reduced:** Effort estimate from 4-6h → 1-2h
- **Fixed:** Security concern (email in query params)
- **Fixed:** Architecture pattern (use metadata.order_type, not product_id special value)

**v1.0 (2025-11-03):** Initial draft (rejected by Dr. Clean)

---

## Problem Statement

Phase 2.5.2 delivered **backend infrastructure** for pre-sale deposits, but **UI/API wrappers** are missing.

**What we have:**
- ✅ Backend services (createDepositCheckoutSession, userHasPaidDeposit, etc.)
- ✅ Webhook handling for deposit orders
- ✅ Display utilities (getDisplayPrice, getDepositAmount)
- ✅ DepositRefundButton component
- ✅ Product detail page pricing display logic (partial)

**What we need:**
- ❌ DepositButton component (pay deposit UI)
- ❌ API route: POST /api/checkout/deposit
- ❌ API route: POST /api/deposits/check (security: use POST, not GET with email in query params)
- ❌ Session/auth integration (replace hardcoded `userHasPaidDeposit = false`)
- ❌ Integration tests for full flow

---

## What's Already Done ✅

### From Phase 2.5.2 (Backend Complete):

**stripe-service.ts (lines 95-205):**
- ✅ `createDepositCheckoutSession()` - Creates Stripe session for deposit
- ✅ `createPreOrderCheckoutSession()` - Creates session with deposit application
- ✅ Uses `metadata.order_type = 'pre-sale-deposit'` pattern (NOT product_id special value)

**order-service.ts (lines 189-254):**
- ✅ `userHasPaidDeposit(email, productId)` - Checks if user paid deposit
- ✅ `getDepositOrder(email, productId)` - Returns deposit order details
- ✅ Queries orders table with metadata filter

**webhooks/stripe/route.ts (lines 104-233):**
- ✅ `handleDepositOrder()` - Creates order record for deposit
- ✅ `markDepositAsApplied()` - Marks deposit as 'applied' after final payment
- ✅ Stores metadata: `{ order_type: 'pre-sale-deposit', target_product_id, target_variant_id }`

**lib/utils/product-display.ts (lines 248-307):**
- ✅ `getDisplayPrice()` - Conditional pricing (wholesale for deposit holders)
- ✅ `getDepositAmount()` - Calculates deposit amount

**components/products/DepositRefundButton.tsx:**
- ✅ UI for requesting deposit refunds

---

## Implementation Tasks

### Phase 1: Deposit Payment UI (30-45 min)

**Goal:** Customer can click button to pay deposit for pre-sale products

**Files to Create:**
- `components/products/DepositButton.tsx` - "Pay Deposit" button component
- `app/api/checkout/deposit/route.ts` - API route wrapper for createDepositCheckoutSession

**DepositButton Component:**
```typescript
'use client';

interface DepositButtonProps {
  productId: string;
  variantId?: string;
  depositAmount: number; // Amount in cents
  productName: string;
}

/**
 * Button to initiate pre-sale deposit payment
 *
 * Flow:
 * 1. User clicks "Pay Deposit" button
 * 2. Email input form appears (or use session email if logged in)
 * 3. POST /api/checkout/deposit with { productId, variantId?, email }
 * 4. API returns Stripe Checkout URL
 * 5. Redirect to Stripe Checkout
 */
export function DepositButton({ productId, variantId, depositAmount, productName }: DepositButtonProps) {
  // Implementation
}
```

**Component Type:** Client Component (uses 'use client' directive)
- Handles user interactions (button clicks)
- Manages form state (email input)
- Calls API route for Stripe session creation

**Validation Schema:**
```typescript
// lib/validation/deposit-schemas.ts
import { z } from 'zod';

export const DepositCheckoutSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  email: z.string().email(),
});
```

**API Route:**
```typescript
// POST /api/checkout/deposit
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { productId, variantId, email } = DepositCheckoutSchema.parse(body);

  // Fetch product to get deposit amount
  const product = await getProductById(productId);
  if (!product) {
    return errorResponse(ERROR_CODES.NOT_FOUND, 'Product not found');
  }

  // Call existing service
  const session = await createDepositCheckoutSession({
    productId,
    variantId,
    depositAmount: getDepositAmount(product),
    customerEmail: email,
  });

  return Response.json({ url: session.url });
}
```

**Tests to Write:**
- `tests/unit/components/DepositButton.test.tsx` (13 tests)
  - Renders with deposit amount
  - Shows email input when clicked
  - Validates email format
  - Calls API on submit
  - Redirects to Stripe on success
  - Shows error toast on API failure
  - Handles Stripe API errors gracefully
  - Shows user-friendly error message
  - Logs error for debugging (using logger, not console)
  - Disables button during loading
  - Uses session email if available (future)
  - Handles variant selection
  - Formats currency correctly

- `tests/integration/api/checkout/deposit.test.ts` (8 tests)
  - Creates deposit checkout session
  - Validates request body (productId, email required)
  - Returns Stripe session URL
  - Handles invalid productId
  - Handles invalid email
  - Sets correct metadata
  - Handles variant deposits
  - Error handling for Stripe failures

**Acceptance Criteria:**
- [ ] DepositButton appears on pre-sale products (in ProductAddToCart.tsx)
- [ ] Clicking "Pay Deposit" prompts for email
- [ ] API creates Stripe session with correct amount
- [ ] Session metadata includes order_type='pre-sale-deposit'
- [ ] Redirects to Stripe Checkout
- [ ] All 21 tests passing (13 component + 8 API)

---

### Phase 2: Deposit Status Check (30-45 min)

**Goal:** Product pages show correct pricing based on deposit status

**Files to Create/Modify:**
- `app/api/deposits/check/route.ts` - API to check deposit status (POST, not GET)
- `app/products/[id]/page.tsx` - Call API to check deposit status

**Security Fix (Dr. Clean's concern):**
- ❌ **Original (insecure):** `GET /api/deposits/check?email=user@example.com&productId=...`
- ✅ **Revised (secure):** `POST /api/deposits/check` with email in request body

**Integration Pattern:**
- Product page is Server Component → calls service directly (no HTTP overhead)
- DepositButton is Client Component → calls API route
- API route exists for client components only

**Validation Schema:**
```typescript
// lib/validation/deposit-schemas.ts
export const DepositCheckSchema = z.object({
  email: z.string().email(),
  productId: z.string().min(1),
});
```

**API Route:**
```typescript
// POST /api/deposits/check
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, productId } = DepositCheckSchema.parse(body);

  // Call existing service
  const hasDeposit = await userHasPaidDeposit(email, productId);
  const depositOrder = hasDeposit ? await getDepositOrder(email, productId) : null;

  return Response.json({
    hasDeposit,
    depositAmount: depositOrder?.total || null,
    orderId: depositOrder?.id || null,
  });
}
```

**Product Page Integration:**
```typescript
// app/products/[id]/page.tsx (lines 104-107)
// BEFORE (hardcoded):
const userHasPaidDeposit = false;

// AFTER (dynamic - Server Component calls service directly):
import { userHasPaidDeposit as checkDeposit } from '@/lib/services/order-service';

const { email } = await getSession(); // Or from searchParams for email links
const userHasPaidDeposit = email ? await checkDeposit(email, product.id) : false;
```

**Note:** Server Components should call services directly, not go through HTTP API routes. This avoids unnecessary HTTP overhead and simplifies the call stack.

**Tests to Write:**
- `tests/integration/api/deposits/check.test.ts` (10 tests)
  - Returns hasDeposit=true when deposit exists
  - Returns hasDeposit=false when no deposit
  - Returns deposit amount and order ID
  - Validates request body
  - Handles missing email
  - Handles missing productId
  - Handles non-existent deposit
  - Only returns deposits with status='paid'
  - Doesn't return 'applied' or 'refunded' deposits
  - Error handling

- `tests/integration/products/deposit-price-display.test.tsx` (12 tests)
  - Pre-sale product shows deposit amount
  - Pre-order with deposit shows wholesale price
  - Pre-order without deposit shows base price
  - For-sale product always shows base price
  - Wholesale price badge appears for deposit holders
  - Deposit note displayed correctly
  - Email link query param works
  - Session-based auth works (future)
  - Variant-specific wholesale pricing
  - Handles missing wholesale price gracefully
  - Error handling for API failures
  - Loading states

**Acceptance Criteria:**
- [ ] API returns correct deposit status
- [ ] Product page checks deposit status on load
- [ ] Wholesale price shown to deposit holders (pre-order only)
- [ ] Base price shown to public (pre-order)
- [ ] Deposit badge hidden (pre-sale)
- [ ] All 22 tests passing

---

### Phase 3: Integration Tests (15-30 min)

**Goal:** Verify full flow end-to-end

**Files to Create:**
- `tests/integration/checkout/deposit-flow.test.ts` - Full deposit → pre-order → final payment flow

**Test Scenarios:**
1. **Happy path:**
   - Product is pre-sale
   - User pays deposit
   - Product transitions to pre-order
   - User sees wholesale price
   - User completes order
   - Deposit marked as 'applied'

2. **Refund flow:**
   - User pays deposit
   - Product still pre-sale
   - User requests refund
   - Deposit refunded

3. **No deposit flow:**
   - Product is pre-order
   - User sees base price
   - User completes order at base price

**Tests to Write:**
- `tests/integration/checkout/deposit-flow.test.ts` (13 tests)
  - Full deposit → wholesale checkout flow
  - Deposit payment creates order with correct metadata
  - userHasPaidDeposit returns true after payment
  - Wholesale price displayed after deposit paid
  - Final order applies deposit correctly
  - Deposit marked as 'applied' after final payment
  - Refund flow works correctly
  - Public user sees base price (no deposit)
  - Handles variant-specific deposits
  - Multiple products with deposits
  - Concurrent deposit attempts (race conditions)
  - Error recovery (webhook failures)
  - Idempotency (duplicate webhook events)

**Acceptance Criteria:**
- [ ] All 13 integration tests passing
- [ ] Full flow tested from deposit → final payment
- [ ] Error cases covered
- [ ] Edge cases validated

---

## Test Summary

**Total Tests:** 56 tests (reduced from 117)

| Phase | Component | Tests |
|-------|-----------|-------|
| Phase 1 | DepositButton.tsx | 13 |
| Phase 1 | POST /api/checkout/deposit | 8 |
| Phase 2 | POST /api/deposits/check | 10 |
| Phase 2 | Deposit price display | 12 |
| Phase 3 | Full flow integration | 13 |
| **TOTAL** | | **56** |

**Test Strategy:** TDD - Write tests FIRST, then implement

---

## Acceptance Criteria (Phase 2.5.2.1 Complete)

### Functional Requirements
- [ ] Customer can pay deposit for pre-sale products via DepositButton
- [ ] Deposit tracked in orders table with metadata.order_type='pre-sale-deposit'
- [ ] Deposit holders identified via POST /api/deposits/check
- [ ] Wholesale price shown to deposit holders when product is pre-order
- [ ] Deposit automatically applied at final checkout (existing webhook handles this)
- [ ] Deposit order marked 'applied' after final payment (existing webhook handles this)

### Technical Requirements
- [ ] All 56 tests passing
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
- [ ] No console.log in production code (use logger utility instead)
- [ ] Security: Email passed in POST body, not query params
- [ ] Architecture: Uses metadata.order_type pattern (not product_id special value)

### Quality Gates
- [ ] TDD workflow followed (tests written first)
- [ ] Dr. Clean approval
- [ ] Dr. Testalot approval
- [ ] Dr. LeanDev approval
- [ ] Dr. DevOps approval
- [ ] Dr. Git approval

---

## Out of Scope (Future Phases)

- Admin dashboard for viewing deposits
- Email notifications when pre-sale → pre-order
- Customer portal for viewing deposits
- Auth/session management (using email input for now)
- Deposit refund automation (manual admin process)

---

## Architecture Decisions

### ✅ Use Existing Pattern (Dr. Clean's feedback)
```typescript
// Store deposit orders with metadata, not special product_id
{
  metadata: {
    order_type: 'pre-sale-deposit',  // ✅ Existing pattern
    target_product_id: 'Unit-8x8x8-Founder',
    target_variant_id: 'Unit-8x8x8-Founder-BLACK' // optional
  }
}
```

### ✅ Security: POST with body, not GET with query params
```typescript
// ❌ INSECURE (original proposal)
GET /api/deposits/check?email=user@example.com&productId=...

// ✅ SECURE (revised)
POST /api/deposits/check
Body: { email: 'user@example.com', productId: '...' }
```

### ✅ Reuse Existing Services (Don't Duplicate)
```typescript
// ✅ API routes are thin wrappers
import { createDepositCheckoutSession } from '@/lib/services/stripe-service';
import { userHasPaidDeposit } from '@/lib/services/order-service';

// API routes just handle HTTP and call services
```

---

## Business Context

**Pre-Sale Flow:**
1. Product has `sell_status: 'pre-sale'` (not available for purchase yet)
2. Customer pays `presale_deposit_price` ($250 for Founder Edition) via DepositButton
3. Admin transitions product to `sell_status: 'pre-order'`
4. Customer returns and sees `wholesale_price` ($975 for Founder Edition)
5. Customer completes order, deposit ($250) applied → Final charge = $725

**Value Prop:** Deposit holders save $320 vs public pricing ($1,295)

**Current Products:**
- Unit-8x8-8-Founder: $250 deposit, $975 wholesale, $1,295 public

---

## Related Documents

- `/docs/tasks/Phase 2.5.2 - Pre-Sale vs Pre-Order Schema.md` - Backend implementation (complete)
- `/docs/LAUNCH_PLAN.md` - Early access queue strategy
- `/lib/services/stripe-service.ts` - Existing deposit services (lines 95-205)
- `/lib/services/order-service.ts` - Existing deposit tracking (lines 189-254)
- `/app/api/webhooks/stripe/route.ts` - Existing webhook handling (lines 104-233)

---

## Grooming Status

**Status:** 🟢 Approved for Implementation

**Completed Approvals:**
- [x] Dr. Clean (Quality) - ⚠️ Approved with minor changes (applied in v2.1)
- [x] Dr. LeanDev (Implementation) - ✅ Approved (feasibility confirmed)
- [x] Dr. Git (Version Control) - ✅ Approved with conditions (git cleanup required)

**Deferred Approvals** (per director request):
- [ ] Dr. Testalot (QA) - Not required for this task
- [ ] Dr. DevOps (Operations) - Not required for this task

**v1.0 Blockers (Resolved in v2.0):**
- ✅ Duplicate work eliminated (80% scope reduction)
- ✅ Architecture pattern corrected
- ✅ Security concern fixed

**v2.0 → v2.1 Changes (Applied 2025-11-04):**
- Fixed line 118: Use `getDepositAmount(product)` instead of invented function
- Fixed lines 198-204: Server Component calls service directly (not fetch)
- Added Zod schemas for API validation
- Added component type clarifications (Server vs Client)
- Added Stripe error handling test scenario
- Clarified logger usage in acceptance criteria

---

**Status:** ✅ Approved and ready for implementation (v2.1 - grooming complete, minor revisions applied)
