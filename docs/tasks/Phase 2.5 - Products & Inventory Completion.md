# Phase 2.5 - Products & Inventory Completion

**Status:** 🟡 In Progress
**Priority:** HIGH - Blocking revenue generation
**Started:** 2025-11-01
**Target Completion:** TBD

---

## Overview

Phase 2.5 completes the product management and inventory tracking infrastructure that Phase 2.4 (Checkout Flow) depends on. While checkout technically works, the product/inventory system has critical architectural issues that must be resolved before going live with sales.

**Why This Phase Exists:**

After implementing Phase 2.4 (Checkout), we discovered that our Stripe product architecture doesn't follow industry best practices. We're syncing variants as separate Stripe Products instead of as Prices under a single Product. This causes:

- Dashboard clutter (4 Stripe products instead of 1 for Founder Edition)
- Analytics fragmentation (can't see total Founder sales)
- Inventory complexity (tracking spread across multiple products)
- Non-standard implementation (not how Stripe is designed to work)

Phase 2.5 fixes these foundational issues before we can confidently process real customer orders.

---

## Sub-Phases

### Phase 2.5.1 - Stripe Product/Price Architecture ✅ [CURRENT]
**Fix Stripe variant sync to use one-product-multiple-prices pattern**

- Refactor `stripe-sync-service.ts` to create Prices instead of Products for variants
- Update database schema to store `stripe_price_id` on variants table
- Migrate existing Stripe Products to proper structure
- Update checkout flow to use Price IDs instead of Product IDs
- Test end-to-end: Add to cart → Checkout → Payment

**Blocks:** All revenue generation
**Estimated Duration:** 4-8 hours

---

### Phase 2.5.2 - Pre-Sale vs Pre-Order Schema
**Add deposit-based pre-sale functionality alongside existing pre-order**

Currently have:
- `pre-order`: Full price payment, delayed shipping

Need to add:
- `pre-sale`: Deposit payment (refundable), holds place in line, wholesale pricing

**Key Questions to Resolve:**
- Deposit amount (fixed $ or % of wholesale?)
- How customers complete purchase later (email? portal?)
- Where to hold funds (Stripe? Escrow?)
- Schema changes (`sell_status` value? New pricing fields?)

**Blocks:** Founder Edition early-bird sales
**Estimated Duration:** 6-12 hours

---

### Phase 2.5.3 - Content Placeholder Cleanup
**Remove placeholder content across website**

- Identify all placeholder text/images
- Replace with final content or proper "Coming Soon" messaging
- Ensure all product descriptions are production-ready
- Review all public-facing pages

**Blocks:** Professional launch
**Estimated Duration:** 2-4 hours

---

### Phase 2.5.4 - Stripe Link Integration Testing
**Verify Stripe Link checkout works end-to-end**

- Already enabled in code (`payment_method_types: ['card', 'link']`)
- Need to test full flow with real Stripe account
- Verify Link autofill works correctly
- Test both new and returning customers

**Blocks:** Enhanced checkout UX
**Estimated Duration:** 1-2 hours

---

### Phase 2.5.5 - Real-Time Inventory Management
**Add UI components for limited edition inventory tracking**

- Display "X remaining" badges on product cards
- Show sold out states
- Real-time inventory polling (optional)
- Admin inventory dashboard (optional)

**Blocks:** Founder Edition sales confidence
**Estimated Duration:** 8-16 hours
**Details:** See `Phase 2.5.5 - Real-Time Inventory Management.md`

---

## Dependencies

**Requires:**
- ✅ Phase 2.4 (Checkout Flow) - Complete
- ✅ Phase 2.4.6 (Product Data Normalization) - Complete
- ✅ Phase 2.4.7 (Emergency Fixes) - Complete

**Blocks:**
- Phase 2.6 (E2E & Smoke Tests)
- Phase 3 (Content Pages)
- MVP Launch

---

## Success Criteria

- [ ] Stripe Products structured correctly (variants as Prices, not Products)
- [ ] Pre-sale functionality implemented (deposit payments, refunds)
- [ ] All placeholder content removed or replaced
- [ ] Stripe Link tested and working
- [ ] Inventory UI displays correctly on product pages
- [ ] Full checkout flow tested end-to-end
- [ ] All tests passing (unit, integration, E2E)

---

## Current Status

**Completed:**
- ✅ Products synced to Stripe (7 products created)
- ✅ Stripe Link enabled in code

**In Progress:**
- 🟡 Phase 2.5.1 - Stripe Product/Price Architecture (Task doc created)

**Blocked:**
- ⏸️ Phase 2.5.2 - Awaiting business logic decisions
- ⏸️ Phase 2.5.3 - Awaiting Phase 2.5.1 completion
- ⏸️ Phase 2.5.4 - Awaiting Phase 2.5.1 completion
- ⏸️ Phase 2.5.5 - Deferred (optional for MVP)

---

## Notes

- **Phase 2.5.1 is critical** - Must be done before any real transactions
- **Phase 2.5.2 requires product decisions** - Can't proceed until deposit amount/workflow is defined
- **Phase 2.5.5 is optional** - Real-time inventory UI is nice-to-have, not MVP blocker
- All sub-phases should have dedicated task documents in `/docs/tasks/`

---

## Related Documents

- [Phase 2.4 - Checkout Flow](./Phase%202.4%20-%20Checkout%20Flow.md)
- [Phase 2.5.1 - Stripe Product/Price Architecture](./Phase%202.5.1%20-%20Stripe%20Product%20Price%20Architecture.md) (To be created)
- [Phase 2.5.5 - Real-Time Inventory Management](./Phase%202.5.5%20-%20Real-Time%20Inventory%20Management.md)
- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)
