# Phase 3 - E2E Test Requirements

**Status**: Requirements documented from RED phase testing
**Created**: 2025-11-06
**Tests Written**: 46 E2E, smoke, and integration tests

**IMPORTANT**: Cart and checkout functionality already exists! Only test IDs need to be added.

---

## Overview

This document lists the test IDs that need to be added to existing components to make the E2E tests pass. The functionality is already implemented - we just need to add `data-testid` attributes for testing.

---

## 1. Test IDs to Add to Existing Components

### Product Components

**File**: `components/products/ProductCard.tsx`
- Add `data-testid="product-card"` to the `<Link>` or wrapping element (line 50)
- Add `data-testid="product-price"` to the `<Price>` component

**File**: `components/products/ProductAddToCart.tsx` or `components/cart/AddToCartButton.tsx`
- Add `data-testid="add-to-cart-button"` to the `<Button>` component (line 68)

**File**: Product detail page variant selector (if exists)
- Add `data-testid="variant-selector"` to variant selection component
- Add `data-testid="variant-option"` to individual variant options

### Cart Components

**File**: `components/cart/CartButton.tsx`
- Add `data-testid="cart-button"` to the `<button>` element (line 17)

**File**: `components/cart/CartDrawer.tsx`
- Already has `data-testid="cart-drawer-overlay"` ✅
- Already has `data-testid="cart-drawer-content"` ✅
- Add `data-testid="close-cart"` to close button
- Add `data-testid="checkout-button"` to checkout button

**File**: `components/cart/CartItem.tsx`
- Add `data-testid="remove-item-button"` to remove button
- Add `data-testid="increase-quantity"` to increase button
- Add `data-testid="decrease-quantity"` to decrease button (if exists)
- Add `data-testid="quantity-input"` to quantity input field

**File**: `components/cart/CartSummary.tsx`
- Add `data-testid="cart-subtotal"` to subtotal display
- Add `data-testid="order-summary"` to order summary section

### Checkout Components

**File**: `app/checkout/page.tsx` or components
- Form field names (already standard HTML):
  - `name="firstName"`
  - `name="lastName"`
  - `name="email"`
  - `name="address"`
  - `name="city"`
  - `name="country"`
  - `name="state"`
  - `name="postalCode"`
- `data-testid="proceed-to-payment"` - Submit checkout button

### General UI

- Empty cart message with text matching `/empty|no items/i`
- Success page with text matching `/thank you|order confirmed|success/i`
- Error messages with text matching `/required/i` for validation
- Sold out badge with text matching `/sold out/i`
- Availability badge with text matching `/available/i`

---

## 2. Existing Functionality (Already Implemented ✅)

The following functionality already exists and is working:

### Cart System ✅
- **Components**: `components/cart/` (CartButton, CartDrawer, CartItem, CartSummary, AddToCartButton, CartProvider)
- **Services**: `lib/services/cart-service.ts`, `lib/services/cart-validator.ts`
- **Features**: Add/remove items, quantity updates, cart persistence, drawer UI, badge counter

### Checkout Flow ✅
- **Pages**: `app/checkout/page.tsx`, `app/checkout/success/page.tsx`
- **Features**: Address form, form validation, Stripe integration, order summary

### Product Pages ✅
- **Components**: `components/products/ProductCard.tsx`, product detail pages
- **Features**: Product listing, filtering, category sections, sold out handling

**What's Missing**: Only test IDs (data-testid attributes) for E2E testing

---

## 3. Test Coverage Summary

### Tests by Type

**Checkout Flow (10 tests)**:
- Complete checkout journey
- Single/multiple product checkout
- Variant selection
- Form validation
- Country/state selection
- Stripe redirect
- Success page display
- Inventory decrement (skipped - requires webhook)
- Sold out handling

**Product Browsing (8 tests)**:
- Product listing display
- Category browsing
- Product detail view
- Category filtering
- Founder Edition variants
- Out of stock handling
- Category navigation
- Specifications display

**Shopping Cart (8 tests)**:
- Add item to cart
- Remove item from cart
- Update quantity
- Cart persistence
- Empty cart state
- Cart badge updates
- Cart drawer open/close
- Proceed to checkout

**Smoke Tests (8 tests)**:
- Homepage load
- Products page load
- Product detail load
- Cart access
- Checkout access
- Database connectivity
- API routes respond
- Page navigation

**Integration Tests (12 tests)**:
- Database to UI data flow
- Cart state integration
- Checkout flow integration
- Stripe integration
- Order creation workflow
- Product filtering integration
- Variant pricing integration
- Inventory integration
- Price calculations
- Form validation
- Error state handling
- Success state handling

---

## 4. Implementation Priority

All functionality is implemented ✅ - just need to add test IDs in this order:

### High Priority (Most Test Failures)
1. `components/products/ProductCard.tsx` - Add `data-testid="product-card"`
2. `components/cart/CartButton.tsx` - Add `data-testid="cart-button"`
3. `components/cart/AddToCartButton.tsx` - Add `data-testid="add-to-cart-button"`

### Medium Priority (Checkout Flow)
4. `components/cart/CartDrawer.tsx` - Add `data-testid="checkout-button"` and `data-testid="close-cart"`
5. `components/cart/CartItem.tsx` - Add all quantity/remove test IDs
6. `app/checkout/page.tsx` - Add `data-testid="proceed-to-payment"`

### Lower Priority (Nice to Have)
7. Product price and variant test IDs
8. Cart summary test IDs

---

## 5. Acceptance Criteria

**Phase 3 is complete when**:
- ✅ All 46 tests written
- ✅ Tests run and fail in RED state
- ✅ Requirements documented (this file)

**Future GREEN phase complete when**:
- All 46 E2E tests pass
- All required test IDs added
- No console errors during test runs
- TypeScript builds without errors
- Lint passes

---

## 6. Notes for Implementation

### Test ID Naming Convention
- Use kebab-case: `data-testid="add-to-cart-button"`
- Be descriptive: `data-testid="cart-item-remove"` not just `data-testid="remove"`
- Use consistent prefixes: `cart-`, `product-`, `checkout-`

### Cart State Management
- Consider using Zustand (already in project) or Context API
- Persist to localStorage for client-side persistence
- Sync with server for inventory validation
- Clear cart after successful checkout

### Stripe Integration
- Use existing Stripe config from Phase 2.4
- Create checkout session server-side
- Pass cart items with stripePriceId
- Handle success/cancel webhooks

### Error Handling
- Graceful degradation for API failures
- User-friendly error messages
- Retry mechanisms for transient errors
- Logging for debugging

---

## 7. Quick Implementation Checklist

```bash
# 1. Add test IDs to ProductCard.tsx
- Line 50: Add data-testid="product-card" to <Link>
- Add data-testid="product-price" to <Price> component

# 2. Add test IDs to CartButton.tsx
- Line 17: Add data-testid="cart-button" to <button>

# 3. Add test IDs to AddToCartButton.tsx
- Line 68: Add data-testid="add-to-cart-button" to <Button>

# 4. Add test IDs to CartDrawer.tsx
- Add data-testid="checkout-button" to checkout button
- Add data-testid="close-cart" to close button

# 5. Add test IDs to CartItem.tsx
- Add data-testid="remove-item-button"
- Add data-testid="increase-quantity"
- Add data-testid="quantity-input"

# 6. Add test IDs to CartSummary.tsx
- Add data-testid="cart-subtotal"
- Add data-testid="order-summary"

# 7. Add test IDs to checkout/page.tsx
- Add data-testid="proceed-to-payment" to submit button

# 8. Run tests
npx playwright test --project=chromium
```

---

## 8. Related Documentation

- **Task Document**: `docs/tasks/Phase 3 - Policy Pages and E2E Testing.md`
- **Test Files**:
  - `tests/e2e/checkout.spec.ts`
  - `tests/e2e/product-browsing.spec.ts`
  - `tests/e2e/cart.spec.ts`
  - `tests/e2e/smoke.spec.ts`
  - `tests/e2e/integration.spec.ts`
- **Test Helpers**: `tests/helpers/e2e-helpers.ts`
- **Database Schema**: `docs/DATABASE_SCHEMA.md`
- **API Routes**: `docs/API_ROUTES.md`
- **Component Architecture**: `docs/COMPONENT_ARCHITECTURE.md`

---

**Last Updated**: 2025-11-06
**Status**: Ready for GREEN phase implementation
