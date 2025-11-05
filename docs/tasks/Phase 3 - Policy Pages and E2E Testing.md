# Phase 3 - Policy Pages and E2E Testing: TDD Task Specification

**Type:** Feature - Frontend + Testing
**Priority:** HIGH
**Status:** 🟡 Ready for Grooming
**Estimated Effort:** 16-20 hours (4-5 days)
**Dependencies:** Phase 2.5 Complete ✅
**Grooming Status:** ❌ Not Started

---

## Overview

Complete the public-facing website by implementing essential policy pages (FAQ, Terms of Service, Privacy Policy, Returns) and comprehensive end-to-end testing to validate the entire e-commerce flow. This phase ensures legal compliance, customer transparency, and production readiness through thorough automated testing.

### Goals

1. **Legal Compliance:** Terms of Service and Privacy Policy pages for legal protection
2. **Customer Support:** FAQ and Returns policy for self-service customer support
3. **E2E Testing:** Comprehensive checkout, cart, and browsing flows tested end-to-end
4. **Production Confidence:** Smoke tests validate all critical paths before launch

---

## Problem Statement

**Current State:**
- Core pages exist (Homepage, About, Contact, Portfolio, Products, Checkout) ✅
- Shipping and Warranty pages implemented ✅
- Missing essential policy pages (FAQ, Terms, Privacy, Returns)
- No end-to-end tests validating complete user journeys
- No smoke tests for Phase 3 functionality
- Cannot launch without legal pages (Terms, Privacy required)

**Issues:**
- No Terms of Service or Privacy Policy (required for production launch)
- No FAQ for common customer questions
- Returns/refunds policy not clearly stated
- Checkout flow not tested end-to-end in browser environment
- No validation that all Phase 1-3 features work together
- Risk of undiscovered integration bugs in production

**Solution:**
Create minimal but legally compliant policy pages with JSON-based content management, then build comprehensive E2E and smoke test suites to validate all critical user journeys before launch.

---

## Test-First Approach

**This document enumerates ALL 79 test scenarios BEFORE implementation begins.**

**TDD Workflow:**
1. **RED:** Write all tests first (they fail)
2. **GREEN:** Implement minimum code to pass tests
3. **REFACTOR:** Clean up implementation while keeping tests green

---

## Implementation Phases

### Phase 1: Policy Page Infrastructure (4-5 hours)

**Goal:** Create JSON-based content management for policy pages with reusable components

**TDD Approach:** Write tests for PolicyPage component, then implement pages

**1.1 Write PolicyPage Component Tests (RED)**
- [ ] Create `tests/unit/components/PolicyPage.test.tsx`
- [ ] Test renders heading from content
- [ ] Test renders markdown body content
- [ ] Test renders last updated date
- [ ] Test handles missing content gracefully
- [ ] Test markdown link rendering
- [ ] Test markdown list rendering
- [ ] Test sanitizes HTML (XSS protection)
- [ ] Test draft disclaimer badge displays when isDraft is true
- [ ] ~9 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (PolicyPage doesn't exist yet)

**1.2 Write DraftBadge Component Tests (RED)**
- [ ] Create `tests/unit/components/ui/DraftBadge.test.tsx`
- [ ] Test renders "Draft" badge
- [ ] Test renders custom message if provided
- [ ] Test has warning styling
- [ ] ~3 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (DraftBadge doesn't exist yet)

**1.3 Write Content Schema Tests (RED)**
- [ ] Create `tests/unit/config/schema/policy-content-schema.test.ts`
- [ ] Test validates valid policy content structure
- [ ] Test rejects missing required fields
- [ ] Test rejects invalid date format
- [ ] Test accepts optional sections
- [ ] Test accepts optional isDraft boolean
- [ ] ~5 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (schema doesn't exist yet)

**1.4 Implement DraftBadge Component (GREEN)**
- [ ] Create `components/ui/DraftBadge.tsx`
- [ ] Yellow/warning styled badge
- [ ] Displays "Draft - Pending Legal Review" message
- [ ] Optional custom message prop
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 3 tests green)

**1.5 Implement PolicyPage Component with Error Boundary (GREEN)**
- [ ] Create `components/policies/PolicyPage.tsx`
- [ ] Wrap with ErrorBoundary component
- [ ] Accepts content prop with heading, body, updated date, isDraft
- [ ] Renders DraftBadge when isDraft is true
- [ ] Renders markdown with react-markdown + rehype-sanitize
- [ ] Responsive layout using Container and design system
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 9 tests green)

**1.6 Implement Content Schema (GREEN)**
- [ ] Create `config/schema/policy-content-schema.ts`
- [ ] Define PolicyContentSchema with Zod
- [ ] Add isDraft optional boolean field
- [ ] Export validation function `validatePolicyContent()`
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 5 tests green)

**1.7 Refactor (REFACTOR)**
- [ ] Review components for clarity
- [ ] Extract reusable styles to design system if needed
- [ ] Add JSDoc comments
- [ ] Run tests: `npm test` - **MUST STAY GREEN**

**Phase 1 Gate Criteria:**
- [ ] All 17 new tests passing (9 PolicyPage + 3 DraftBadge + 5 schema)
- [ ] All existing tests still passing
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Deliverables:**
- PolicyPage component with ErrorBoundary (9 tests)
- DraftBadge component (3 tests)
- Policy content schema with isDraft field (5 tests)
- Total new tests: 17

---

### Phase 2: Policy Content Pages (6-8 hours)

**Goal:** Create FAQ, Terms of Service, Privacy Policy, and Returns pages

**TDD Approach:** Write page component tests first, then implement pages and content

**2.1 Write FAQ Page Tests (RED)**
- [ ] Create `tests/unit/app/faq/page.test.tsx`
- [ ] Test renders FAQ heading
- [ ] Test renders FAQ sections
- [ ] Test renders multiple Q&A items
- [ ] Test has proper metadata
- [ ] ~4 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (page doesn't exist yet)

**2.2 Write Terms of Service Page Tests (RED)**
- [ ] Create `tests/unit/app/terms/page.test.tsx`
- [ ] Test renders Terms heading
- [ ] Test renders company information
- [ ] Test renders last updated date
- [ ] Test has proper metadata
- [ ] ~4 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (page doesn't exist yet)

**2.3 Write Privacy Policy Page Tests (RED)**
- [ ] Create `tests/unit/app/privacy/page.test.tsx`
- [ ] Test renders Privacy heading
- [ ] Test renders data collection sections
- [ ] Test renders contact information
- [ ] Test has proper metadata
- [ ] ~4 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (page doesn't exist yet)

**2.4 Write Returns Page Tests (RED)**
- [ ] Create `tests/unit/app/returns/page.test.tsx`
- [ ] Test renders Returns heading
- [ ] Test renders return policy details
- [ ] Test renders contact information
- [ ] Test has proper metadata
- [ ] ~4 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (page doesn't exist yet)

**2.5 Implement FAQ Page (GREEN)**
- [ ] Create `app/faq/page.tsx`
- [ ] Create `config/content/pages/faq.json`
- [ ] Populate with common questions (shipping, returns, warranty, pre-orders)
- [ ] Use PolicyPage component
- [ ] Run tests: `npm test` - **EXPECT PASSING** (4 tests green)

**2.6 Implement Terms of Service Page (GREEN)**
- [ ] Create `app/terms/page.tsx`
- [ ] Create `config/content/pages/terms.json`
- [ ] Populate with standard ToS (use AI to draft, lawyer review later)
- [ ] Use PolicyPage component
- [ ] Run tests: `npm test` - **EXPECT PASSING** (4 tests green)

**2.7 Implement Privacy Policy Page (GREEN)**
- [ ] Create `app/privacy/page.tsx`
- [ ] Create `config/content/pages/privacy.json`
- [ ] Populate with GDPR-compliant privacy policy (use AI to draft)
- [ ] Use PolicyPage component
- [ ] Run tests: `npm test` - **EXPECT PASSING** (4 tests green)

**2.8 Implement Returns Page (GREEN)**
- [ ] Create `app/returns/page.tsx`
- [ ] Create `config/content/pages/returns.json`
- [ ] Populate with return policy (30 days, conditions, process)
- [ ] Use PolicyPage component
- [ ] Run tests: `npm test` - **EXPECT PASSING** (4 tests green)

**2.9 Refactor (REFACTOR)**
- [ ] Review content for accuracy and clarity
- [ ] Ensure consistent formatting across pages
- [ ] Add links to policy pages in footer
- [ ] Run tests: `npm test` - **MUST STAY GREEN**

**2.10 Update Footer Component**
- [ ] Add links to FAQ, Terms, Privacy, Returns
- [ ] Update footer tests
- [ ] Verify all links work
- [ ] Run tests: `npm test` - **MUST STAY GREEN**

**Phase 2 Gate Criteria:**
- [ ] All 16 new page tests passing (4 per page)
- [ ] All existing tests still passing
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
- [ ] All policy pages accessible via routes
- [ ] Footer links functional

**Deliverables:**
- 4 policy pages with content
- 16 page component tests
- Footer updated with policy links
- Total new tests: 16

---

### Phase 3: E2E Checkout Flow Tests (3-4 hours)

**Goal:** End-to-end testing of complete checkout journey with Playwright

**TDD Approach:** Write E2E test scenarios first, then fix any bugs discovered

**Test Isolation Strategy:**
- Each test uses isolated test data (unique product IDs, order IDs)
- `beforeEach` hook: Seeds test database with fresh fixtures
- `afterEach` hook: Cleans up test orders and inventory changes
- Tests run in parallel but use non-overlapping data
- Stripe test mode prevents real payment processing

**Playwright Configuration (Retry & Stability):**
- Configure retry attempts: 2 retries for flaky tests
- Use `page.waitForLoadState('networkidle')` for page loads
- Use `page.waitForSelector()` with explicit timeouts
- Set `timeout: 30000` for slow operations (Stripe redirect)

**3.1 Configure Playwright for Reliability (SETUP)**
- [ ] Update `playwright.config.ts` with retry: 2
- [ ] Add global timeout: 30000ms
- [ ] Configure test database connection
- [ ] Add test fixture helpers for data setup/teardown

**3.2 Write E2E Checkout Tests (RED)**
- [ ] Create `tests/e2e/checkout.spec.ts`
- [ ] Add beforeEach: Seed test database with products
- [ ] Add afterEach: Clean up test orders and reset inventory
- [ ] Test complete checkout flow (browse → add to cart → checkout → success)
- [ ] Test checkout with single product
- [ ] Test checkout with multiple products
- [ ] Test checkout with Founder Edition variant selection
- [ ] Test address form validation
- [ ] Test country/state selection
- [ ] Test Stripe checkout redirect (test mode)
- [ ] Test order confirmation display
- [ ] Test inventory decrement after purchase
- [ ] Test sold out product handling
- [ ] ~10 tests total
- [ ] Run tests: `npm run test:e2e` - **EXPECT SOME FAILURES** (may discover bugs)

**3.3 Fix Any Bugs Discovered (GREEN)**
- [ ] Address validation issues found
- [ ] Fix race conditions if any
- [ ] Ensure proper error handling
- [ ] Run tests: `npm run test:e2e` - **EXPECT PASSING** (all 10 tests green)

**3.4 Refactor (REFACTOR)**
- [ ] Extract common test helpers (database seeding, cleanup)
- [ ] Add page object model if helpful
- [ ] Document test isolation strategy in README
- [ ] Verify tests can run in parallel without conflicts
- [ ] Run tests: `npm run test:e2e` - **MUST STAY GREEN**

**Phase 3 Gate Criteria:**
- [ ] All 10 E2E checkout tests passing
- [ ] All existing tests still passing
- [ ] TypeScript: 0 errors
- [ ] E2E tests run in < 60 seconds

**Deliverables:**
- Comprehensive E2E checkout test suite
- Total new tests: 10

---

### Phase 4: E2E Product Browsing & Cart Tests (2-3 hours)

**Goal:** End-to-end testing of product discovery and shopping cart

**TDD Approach:** Write E2E test scenarios, validate user journeys work

**Test Isolation Strategy (Same as Phase 3):**
- Each test uses isolated test data
- `beforeEach` hook: Seeds test database, clears localStorage
- `afterEach` hook: Cleans up test data, resets state
- Tests run in parallel with non-overlapping data

**4.1 Write E2E Product Browsing Tests (RED)**
- [ ] Create `tests/e2e/product-browsing.spec.ts`
- [ ] Add beforeEach: Seed test database, clear browser state
- [ ] Add afterEach: Clean up test data
- [ ] Test homepage navigation
- [ ] Test product listing page loads
- [ ] Test product detail page loads
- [ ] Test product search/filtering
- [ ] Test limited edition badge display
- [ ] Test variant selection UI
- [ ] Test product image display
- [ ] Test product specs display
- [ ] ~8 tests total
- [ ] Run tests: `npm run test:e2e` - **EXPECT SOME FAILURES**

**4.2 Write E2E Shopping Cart Tests (RED)**
- [ ] Create `tests/e2e/shopping-cart.spec.ts`
- [ ] Add beforeEach: Seed test database, clear localStorage
- [ ] Add afterEach: Clean up cart state and test data
- [ ] Test add to cart button
- [ ] Test cart drawer opens
- [ ] Test cart item display
- [ ] Test cart quantity updates
- [ ] Test cart item removal
- [ ] Test cart persistence (localStorage)
- [ ] Test cart validation warnings
- [ ] Test voltage compatibility warnings
- [ ] ~8 tests total
- [ ] Run tests: `npm run test:e2e` - **EXPECT SOME FAILURES**

**4.3 Fix Any Bugs Discovered (GREEN)**
- [ ] Address issues found in browsing tests
- [ ] Address issues found in cart tests
- [ ] Run tests: `npm run test:e2e` - **EXPECT PASSING** (all 16 tests green)

**4.4 Refactor (REFACTOR)**
- [ ] Consolidate test helpers
- [ ] Document test patterns
- [ ] Run tests: `npm run test:e2e` - **MUST STAY GREEN**

**Phase 4 Gate Criteria:**
- [ ] All 16 E2E tests passing (8 browsing + 8 cart)
- [ ] All existing tests still passing
- [ ] TypeScript: 0 errors
- [ ] E2E tests run in < 90 seconds total

**Deliverables:**
- E2E product browsing test suite (8 tests)
- E2E shopping cart test suite (8 tests)
- Total new tests: 16

---

### Phase 5: Smoke Tests & Integration Tests (2-3 hours)

**Goal:** Smoke tests for critical paths and integration tests for Stripe/database

**TDD Approach:** Write smoke tests for Phase 3, integration tests for checkout services

**5.1 Write Phase 3 Smoke Tests (RED)**
- [ ] Create `tests/smoke/phase3-complete.spec.ts`
- [ ] Test all policy pages load (FAQ, Terms, Privacy, Returns)
- [ ] Test footer links work
- [ ] Test homepage loads
- [ ] Test about page loads
- [ ] Test contact page loads
- [ ] Test portfolio page loads
- [ ] Test product listing loads
- [ ] Test checkout page loads
- [ ] ~8 tests total
- [ ] Run tests: `npm run test:smoke` - **EXPECT SOME FAILURES**

**5.2 Write Stripe Integration Tests (RED)**
- [ ] Create `tests/integration/stripe/checkout-session.test.ts` (if doesn't exist)
- [ ] Test create checkout session with line items
- [ ] Test checkout session with address data
- [ ] Test checkout session with metadata
- [ ] Test retrieve checkout session
- [ ] ~4 tests total
- [ ] Run tests: `npm test tests/integration` - **EXPECT SOME FAILURES**

**5.3 Write Webhook Integration Tests (RED)**
- [ ] Create `tests/integration/stripe/webhook.test.ts` (if doesn't exist)
- [ ] Test webhook signature validation
- [ ] Test checkout.session.completed handling
- [ ] Test order creation from webhook
- [ ] Test inventory decrement from webhook
- [ ] ~4 tests total
- [ ] Run tests: `npm test tests/integration` - **EXPECT SOME FAILURES**

**5.4 Write Order Repository Tests (RED)**
- [ ] Create `tests/integration/db/orders-repository.test.ts` (if doesn't exist)
- [ ] Test create order with items
- [ ] Test retrieve order by ID
- [ ] Test retrieve order by Stripe session ID
- [ ] Test order item relationships
- [ ] ~4 tests total
- [ ] Run tests: `npm test tests/integration` - **EXPECT SOME FAILURES**

**5.5 Implement Missing Integration Tests (GREEN)**
- [ ] Fill in any missing integration test implementations
- [ ] Ensure proper test database setup/teardown
- [ ] Run tests: `npm test tests/integration` - **EXPECT PASSING**

**5.6 Fix Smoke Test Failures (GREEN)**
- [ ] Address any smoke test failures
- [ ] Run tests: `npm run test:smoke` - **EXPECT PASSING** (all 8 tests green)

**5.7 Refactor (REFACTOR)**
- [ ] Consolidate integration test setup
- [ ] Document smoke test patterns
- [ ] Run tests: `npm test` - **MUST STAY GREEN**

**Phase 5 Gate Criteria:**
- [ ] All 8 smoke tests passing
- [ ] All 12 integration tests passing (4 + 4 + 4)
- [ ] All existing tests still passing
- [ ] TypeScript: 0 errors
- [ ] Smoke tests run in < 30 seconds

**Deliverables:**
- Phase 3 smoke test suite (8 tests)
- Stripe integration tests (8 tests)
- Order repository tests (4 tests)
- Total new tests: 20

---

## Detailed Test Specifications

**This section enumerates ALL 74 test scenarios BEFORE implementation begins.**

### Phase 1: PolicyPage Component Tests (8 tests)

#### File: `tests/unit/components/PolicyPage.test.tsx`

##### 1. Content Rendering (4 tests)

**Test 1.1:** Renders heading from content
```typescript
it('should render page heading from content prop', () => {
  // Arrange
  const content = {
    heading: 'Terms of Service',
    body: 'Content here',
    updated: '2025-11-01'
  };

  // Act
  render(<PolicyPage content={content} />);

  // Assert
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Terms of Service');
});
```

**Test 1.2:** Renders markdown body content
```typescript
it('should render markdown body with proper HTML elements', () => {
  const content = {
    heading: 'Privacy Policy',
    body: '## Section 1\n\nParagraph with **bold** text.',
    updated: '2025-11-01'
  };

  render(<PolicyPage content={content} />);

  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Section 1');
  expect(screen.getByText(/bold/)).toBeInTheDocument();
});
```

**Test 1.3:** Renders last updated date
```typescript
it('should display last updated date in readable format', () => {
  const content = {
    heading: 'FAQ',
    body: 'Content',
    updated: '2025-11-01'
  };

  render(<PolicyPage content={content} />);

  expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
  expect(screen.getByText(/November 1, 2025/)).toBeInTheDocument();
});
```

**Test 1.4:** Handles missing content gracefully
```typescript
it('should show error message when content is missing', () => {
  render(<PolicyPage content={null} />);

  expect(screen.getByText(/content not available/i)).toBeInTheDocument();
});
```

##### 2. Markdown Rendering (3 tests)

**Test 2.1:** Renders markdown links
```typescript
it('should render markdown links with proper attributes', () => {
  const content = {
    heading: 'Policy',
    body: '[Contact us](mailto:info@imajin.ca)',
    updated: '2025-11-01'
  };

  render(<PolicyPage content={content} />);

  const link = screen.getByRole('link', { name: /contact us/i });
  expect(link).toHaveAttribute('href', 'mailto:info@imajin.ca');
});
```

**Test 2.2:** Renders markdown lists
```typescript
it('should render ordered and unordered lists', () => {
  const content = {
    heading: 'Policy',
    body: '- Item 1\n- Item 2\n\n1. Numbered item',
    updated: '2025-11-01'
  };

  render(<PolicyPage content={content} />);

  expect(screen.getByRole('list')).toBeInTheDocument();
});
```

**Test 2.3:** Sanitizes HTML (XSS protection)
```typescript
it('should sanitize dangerous HTML in markdown', () => {
  const content = {
    heading: 'Policy',
    body: '<script>alert("XSS")</script>Safe content',
    updated: '2025-11-01'
  };

  render(<PolicyPage content={content} />);

  expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
  expect(screen.getByText(/Safe content/)).toBeInTheDocument();
});
```

##### 3. SEO and Accessibility (1 test)

**Test 3.1:** Has proper semantic structure
```typescript
it('should use semantic HTML structure', () => {
  const content = {
    heading: 'Policy',
    body: 'Content',
    updated: '2025-11-01'
  };

  const { container } = render(<PolicyPage content={content} />);

  expect(container.querySelector('article')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
});
```

---

### Phase 1: Policy Content Schema Tests (4 tests)

#### File: `tests/unit/config/schema/policy-content-schema.test.ts`

**Test 1:** Validates valid policy content structure
```typescript
it('should accept valid policy content', () => {
  const valid = {
    heading: 'Privacy Policy',
    body: 'Policy content here',
    updated: '2025-11-01'
  };

  const result = validatePolicyContent(valid);

  expect(result.success).toBe(true);
});
```

**Test 2:** Rejects missing required fields
```typescript
it('should reject policy content missing heading', () => {
  const invalid = {
    body: 'Content',
    updated: '2025-11-01'
  };

  const result = validatePolicyContent(invalid);

  expect(result.success).toBe(false);
  expect(result.error?.issues[0].path).toContain('heading');
});
```

**Test 3:** Rejects invalid date format
```typescript
it('should reject invalid date format', () => {
  const invalid = {
    heading: 'Policy',
    body: 'Content',
    updated: 'not-a-date'
  };

  const result = validatePolicyContent(invalid);

  expect(result.success).toBe(false);
});
```

**Test 4:** Accepts optional sections
```typescript
it('should accept policy with optional sections field', () => {
  const valid = {
    heading: 'FAQ',
    body: 'Main content',
    updated: '2025-11-01',
    sections: [
      { question: 'Q1?', answer: 'A1' }
    ]
  };

  const result = validatePolicyContent(valid);

  expect(result.success).toBe(true);
});
```

---

### Phase 2: Policy Page Tests (16 tests, 4 per page)

#### File: `tests/unit/app/faq/page.test.tsx`

**Test 1:** Renders FAQ heading
**Test 2:** Renders FAQ sections
**Test 3:** Renders multiple Q&A items
**Test 4:** Has proper metadata

#### File: `tests/unit/app/terms/page.test.tsx`

**Test 1:** Renders Terms heading
**Test 2:** Renders company information
**Test 3:** Renders last updated date
**Test 4:** Has proper metadata

#### File: `tests/unit/app/privacy/page.test.tsx`

**Test 1:** Renders Privacy heading
**Test 2:** Renders data collection sections
**Test 3:** Renders contact information
**Test 4:** Has proper metadata

#### File: `tests/unit/app/returns/page.test.tsx`

**Test 1:** Renders Returns heading
**Test 2:** Renders return policy details
**Test 3:** Renders contact information
**Test 4:** Has proper metadata

---

### Phase 3: E2E Checkout Tests (10 tests)

#### File: `tests/e2e/checkout.spec.ts`

**Test 1:** Complete checkout flow
```typescript
test('should complete full checkout from browse to success', async ({ page }) => {
  // Navigate to products
  await page.goto('/products');

  // Add product to cart
  await page.click('[data-testid="add-to-cart-button"]');

  // Open cart and proceed to checkout
  await page.click('[data-testid="cart-button"]');
  await page.click('[data-testid="checkout-button"]');

  // Fill address form
  await page.fill('[name="firstName"]', 'John');
  await page.fill('[name="lastName"]', 'Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.fill('[name="address"]', '123 Main St');
  await page.fill('[name="city"]', 'Toronto');
  await page.selectOption('[name="country"]', 'CA');
  await page.selectOption('[name="state"]', 'ON');
  await page.fill('[name="postalCode"]', 'M5V 3A8');

  // Proceed to Stripe checkout
  await page.click('[data-testid="proceed-to-payment"]');

  // Verify redirect to Stripe
  await page.waitForURL(/stripe.com/);

  expect(page.url()).toContain('stripe.com');
});
```

**Test 2:** Checkout with single product
**Test 3:** Checkout with multiple products
**Test 4:** Checkout with Founder Edition variant
**Test 5:** Address form validation
**Test 6:** Country/state selection
**Test 7:** Stripe checkout redirect
**Test 8:** Order confirmation display
**Test 9:** Inventory decrement after purchase
**Test 10:** Sold out product handling

---

### Phase 4: E2E Browsing & Cart Tests (16 tests)

#### File: `tests/e2e/product-browsing.spec.ts` (8 tests)

**Test 1:** Homepage navigation
**Test 2:** Product listing page loads
**Test 3:** Product detail page loads
**Test 4:** Product search/filtering
**Test 5:** Limited edition badge display
**Test 6:** Variant selection UI
**Test 7:** Product image display
**Test 8:** Product specs display

#### File: `tests/e2e/shopping-cart.spec.ts` (8 tests)

**Test 1:** Add to cart button
**Test 2:** Cart drawer opens
**Test 3:** Cart item display
**Test 4:** Cart quantity updates
**Test 5:** Cart item removal
**Test 6:** Cart persistence
**Test 7:** Cart validation warnings
**Test 8:** Voltage compatibility warnings

---

### Phase 5: Smoke & Integration Tests (20 tests)

#### File: `tests/smoke/phase3-complete.spec.ts` (8 tests)

**Test 1:** FAQ page loads
**Test 2:** Terms page loads
**Test 3:** Privacy page loads
**Test 4:** Returns page loads
**Test 5:** Footer links work
**Test 6:** Homepage loads
**Test 7:** About page loads
**Test 8:** Contact page loads

#### File: `tests/integration/stripe/checkout-session.test.ts` (4 tests)

**Test 1:** Create checkout session with line items
**Test 2:** Checkout session with address data
**Test 3:** Checkout session with metadata
**Test 4:** Retrieve checkout session

#### File: `tests/integration/stripe/webhook.test.ts` (4 tests)

**Test 1:** Webhook signature validation
**Test 2:** checkout.session.completed handling
**Test 3:** Order creation from webhook
**Test 4:** Inventory decrement from webhook

#### File: `tests/integration/db/orders-repository.test.ts` (4 tests)

**Test 1:** Create order with items
**Test 2:** Retrieve order by ID
**Test 3:** Retrieve order by Stripe session ID
**Test 4:** Order item relationships

---

## Test Specification Summary

**Total New Tests: 79**

| Phase | Test Type | Count | File(s) |
|-------|-----------|-------|---------|
| 1 | Unit | 17 | PolicyPage.test.tsx (9), DraftBadge.test.tsx (3), policy-content-schema.test.ts (5) |
| 2 | Unit | 16 | faq/page.test.tsx (4), terms/page.test.tsx (4), privacy/page.test.tsx (4), returns/page.test.tsx (4) |
| 3 | E2E | 10 | checkout.spec.ts |
| 4 | E2E | 16 | product-browsing.spec.ts (8), shopping-cart.spec.ts (8) |
| 5 | Smoke | 8 | phase3-complete.spec.ts |
| 5 | Integration | 12 | checkout-session.test.ts (4), webhook.test.ts (4), orders-repository.test.ts (4) |
| **Total** | | **79** | **13 test files** |

---

## Implementation Specification

### File: `components/ui/DraftBadge.tsx`

**Requirements:**
1. Display "Draft - Pending Legal Review" badge
2. Yellow/warning styling
3. Optional custom message prop
4. Accessible with proper ARIA attributes

**Types:**
```typescript
interface DraftBadgeProps {
  message?: string;
}
```

**Component Structure:**
```typescript
export function DraftBadge({ message = "Draft - Pending Legal Review" }: DraftBadgeProps) {
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6" role="alert">
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <Text weight="medium">{message}</Text>
      </div>
    </div>
  );
}
```

---

### File: `components/policies/PolicyPage.tsx`

**Requirements:**
1. Wrap with ErrorBoundary for error handling
2. Accept content prop with heading, body, updated date, isDraft
3. Display DraftBadge when isDraft is true
4. Render markdown content with react-markdown
5. Sanitize HTML with rehype-sanitize
6. Display last updated date in readable format
7. Responsive layout using Container and design system
8. Semantic HTML structure (article, h1, etc.)

**Types:**
```typescript
interface PolicyContent {
  heading: string;
  body: string;
  updated: string; // ISO date format
  isDraft?: boolean;
  sections?: Array<{ question: string; answer: string }>;
}

interface PolicyPageProps {
  content: PolicyContent | null;
}
```

**Component Structure:**
```typescript
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { DraftBadge } from '@/components/ui/DraftBadge';

function PolicyPageContent({ content }: PolicyPageProps) {
  if (!content) {
    return <ErrorState message="Content not available" />;
  }

  const formattedDate = formatDate(content.updated);

  return (
    <Container>
      <article className="prose prose-lg max-w-4xl mx-auto py-12">
        {content.isDraft && <DraftBadge />}
        <Heading level={1}>{content.heading}</Heading>
        <Text size="sm" color="muted">Last updated: {formattedDate}</Text>
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
          {content.body}
        </ReactMarkdown>
      </article>
    </Container>
  );
}

export default function PolicyPage(props: PolicyPageProps) {
  return (
    <ErrorBoundary fallback={<ErrorState message="Unable to load policy page" />}>
      <PolicyPageContent {...props} />
    </ErrorBoundary>
  );
}
```

**Error Handling:**
- ErrorBoundary catches runtime errors
- Null content → Show error state
- Invalid markdown → Sanitize and render safe content
- Missing date → Show "Date not available"

---

### File: `config/schema/policy-content-schema.ts`

**Requirements:**
1. Validate policy content structure with Zod
2. Ensure required fields present
3. Validate date format (ISO 8601)
4. Support optional sections array

**Schema:**
```typescript
import { z } from 'zod';

export const PolicySectionSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const PolicyContentSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  isDraft: z.boolean().optional(),
  sections: z.array(PolicySectionSchema).optional(),
});

export type PolicyContent = z.infer<typeof PolicyContentSchema>;

export function validatePolicyContent(data: unknown) {
  return PolicyContentSchema.safeParse(data);
}
```

---

## Schema Changes

**No database schema changes required for this phase.**

All content is JSON-based in the `config/content/pages/` directory.

---

## Migration Plan

### Files to Update

**1. `components/layout/Footer.tsx`** (add policy links)
```typescript
// BEFORE
<footer>
  <nav>
    <Link href="/about">About</Link>
    <Link href="/contact">Contact</Link>
  </nav>
</footer>

// AFTER
<footer>
  <nav>
    <Link href="/about">About</Link>
    <Link href="/contact">Contact</Link>
    <Link href="/faq">FAQ</Link>
    <Link href="/shipping">Shipping</Link>
    <Link href="/returns">Returns</Link>
    <Link href="/warranty">Warranty</Link>
    <Link href="/terms">Terms</Link>
    <Link href="/privacy">Privacy</Link>
  </nav>
</footer>
```

**2. `package.json`** (add react-markdown if not present)
```json
"dependencies": {
  "react-markdown": "^10.1.0",
  "rehype-sanitize": "^6.0.0"
}
```

---

## Acceptance Criteria

**Tests:**
- [ ] All 74 new tests passing
- [ ] All existing tests still passing (943+/946+)
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
- [ ] Test coverage: >85%

**Implementation:**
- [ ] PolicyPage component working
- [ ] 4 policy pages accessible (FAQ, Terms, Privacy, Returns)
- [ ] Footer links to all policy pages
- [ ] 10 E2E checkout tests passing
- [ ] 16 E2E browsing/cart tests passing
- [ ] 8 smoke tests passing
- [ ] 12 integration tests passing

**Documentation:**
- [ ] Policy content documented in JSON files
- [ ] Test patterns documented
- [ ] Inline code comments added

**Quality Gates:**
- [ ] All phase gate criteria met
- [ ] No regressions introduced
- [ ] E2E tests run in < 2 minutes total
- [ ] Smoke tests run in < 30 seconds

---

## Deliverables

1. **DraftBadge Component** - Warning badge for draft content (~50 LOC)
2. **PolicyPage Component with ErrorBoundary** - Reusable markdown policy page component (~150 LOC)
3. **4 Policy Pages** - FAQ, Terms, Privacy, Returns pages (~50 LOC each)
4. **Policy Content** - 4 JSON content files with isDraft flags (~200-500 LOC each)
5. **Playwright Configuration** - Retry config and test isolation helpers (~100 LOC)
6. **E2E Test Suite** - Checkout, browsing, cart tests (26 tests, ~900 LOC)
7. **Smoke Tests** - Phase 3 critical path tests (8 tests, ~200 LOC)
8. **Integration Tests** - Stripe and order tests (12 tests, ~400 LOC)
9. **Footer Updates** - Policy page links (~20 LOC)

**Total Lines of Code:**
- Production: ~1,370 lines
- Tests: ~2,500 lines
- Content: ~2,000 lines
- Config: ~100 lines
- **Total: ~5,970 lines**

---

## Dependencies

**NPM Packages:**
```bash
npm install react-markdown rehype-sanitize
```

**Environment Variables:**
No new environment variables required.

**External Services:**
- Stripe API (already configured)
- Database (already configured)

---

## Risk Assessment

**High Risk:**
- **E2E tests may be flaky** - Timing issues, network delays
  - **Mitigation:** Playwright retry config (2 retries), proper waits, isolated test data with beforeEach/afterEach hooks
- **Legal content may need lawyer review** - AI-generated policies not legally vetted
  - **Mitigation:** DraftBadge component displays warning, isDraft flag in JSON, get legal review before launch

**Medium Risk:**
- **Playwright setup may have issues** - New E2E testing infrastructure
  - **Mitigation:** Follow Playwright best practices, use Docker for consistent environment
- **Test execution time may be slow** - Many E2E tests can take time
  - **Mitigation:** Run tests in parallel, optimize selectors, use test mode for Stripe

**Low Risk:**
- **Content updates after launch** - May need to revise policies
  - **Mitigation:** JSON-based content is easy to update, version control tracks changes

---

## Decisions Made

1. **React-markdown for content rendering:** ✅ Chosen for simplicity and security
   - Well-maintained library
   - rehype-sanitize prevents XSS
   - Supports standard markdown syntax

2. **JSON-based content management:** ✅ No CMS needed for launch
   - Easy to edit
   - Version controlled
   - Type-safe with Zod
   - Can migrate to CMS post-launch if needed

3. **AI-drafted legal policies:** ✅ Acceptable for MVP with disclaimer
   - Mark as "Draft - pending legal review"
   - Get lawyer review before official launch
   - Standard boilerplate acceptable for soft launch

4. **Playwright for E2E tests:** ✅ Modern, reliable E2E testing framework
   - Better than Cypress for Next.js
   - Supports multiple browsers
   - Fast and reliable

5. **Test mode for Stripe in E2E:** ✅ Don't hit production Stripe in tests
   - Use test mode API keys
   - Mock webhook events where needed
   - Validate flow, not actual payments

## All Decisions Finalized ✅

**No open questions remaining. Ready for grooming.**

---

## Timeline Summary

| Phase | Focus | Duration | Tests | Deliverable |
|-------|-------|----------|-------|-------------|
| 1 | Policy Infrastructure + DraftBadge | 4-5h | +17 | PolicyPage + DraftBadge + schema |
| 2 | Policy Content Pages | 6-8h | +16 | 4 policy pages + footer links |
| 3 | E2E Checkout Tests + Config | 3-4h | +10 | Playwright config + checkout validation |
| 4 | E2E Browsing/Cart Tests | 2-3h | +16 | Browsing + cart validation |
| 5 | Smoke & Integration Tests | 2-3h | +20 | Critical path validation |
| **Total** | **Phase 3 Complete** | **16-20h** | **+79** | **Production-Ready Site** |

**Estimated: 4-5 days of focused work**

**Test Count Progression:**
- Starting: 943/946 tests passing
- After Phase 3: 1,022/1,025 tests passing (+79 new tests)
  - Unit: 612 tests (595 existing + 17 new)
  - Integration: 172 tests (160 existing + 12 new)
  - E2E: 26 tests (0 existing + 26 new)
  - Smoke: 38 tests (30 existing + 8 new)

---

## Test Results (Actual - Fill After Completion)

**Achieved:** TBD

**Test execution time:** TBD

**Coverage:** TBD

**Files updated:** TBD

---

## Future Enhancements

- **Phase 4+:** Lawyer review and finalize legal policies
- **Phase 4+:** Add newsletter signup to FAQ page
- **Phase 4+:** Interactive FAQ with search/filtering
- **Phase 4+:** Migrate to headless CMS (Contentful, Sanity) if content grows complex
- **Phase 4+:** Add more E2E tests for edge cases
- **Phase 4+:** Visual regression testing (Percy, Chromatic)

---

## Status: Planning

**Completion Date:** TBD
**Duration:** TBD
**Quality Gates:** Pending

**Ready for:** Grooming Session

---

## Grooming Session

**⚠️ MANDATORY: All Doctors must review and approve before implementation begins.**

See `docs/TASK_GROOMING_PROCESS.md` for complete grooming workflow.

---

**Status:** 🟡 Ready for Grooming

**Created:** 2025-11-05
**Grooming Initiated:** TBD
**Grooming Complete:** TBD

---

### Dr. Testalot (QA Lead) - Testing Review

**Review Date:** TBD

**Test Specification Review:**
- [ ] All tests enumerated before implementation?
- [ ] Test descriptions specific (not vague)?
- [ ] Test count matches summary table?
- [ ] TDD workflow clear per phase?
- [ ] Acceptance criteria measurable?
- [ ] Edge cases and error scenarios covered?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending | ✅ Approved

**Approved Date:** [TBD]

---

### Dr. Clean (Code Quality) - Architecture Review

**Review Date:** TBD

**Architecture Review:**
- [ ] Follows existing patterns?
- [ ] No unnecessary complexity?
- [ ] Proper separation of concerns?
- [ ] Security considerations addressed?
- [ ] Performance implications considered?
- [ ] Documentation updates planned?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending | ✅ Approved

**Approved Date:** [TBD]

---

### Dr. LeanDev (Implementation) - Feasibility Review

**Review Date:** TBD

**Feasibility Review:**
- [ ] Implementation approach clear?
- [ ] Dependencies identified?
- [ ] Timeline realistic?
- [ ] Known blockers addressed?
- [ ] External APIs understood?
- [ ] Test data/fixtures planned?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending | ✅ Approved

**Approved Date:** [TBD]

---

### Dr. DevOps (Operations) - Deployment Review

**Review Date:** TBD

**Deployment Review:**
- [ ] Infrastructure requirements identified?
- [ ] Environment variables documented?
- [ ] Migration strategy clear?
- [ ] Rollback plan exists?
- [ ] Monitoring/logging adequate?
- [ ] Database changes safe?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending | ✅ Approved

**Approved Date:** [TBD]

---

### Dr. Git (Version Control) - Change Impact Review

**Review Date:** TBD

**Change Impact Review:**
- [ ] Scope reasonable for single commit/PR?
- [ ] Breaking changes identified?
- [ ] Documentation updates planned?
- [ ] Migration path clear?
- [ ] Commit strategy defined?
- [ ] Merge conflicts anticipated?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending | ✅ Approved

**Approved Date:** [TBD]

---

### Grooming Summary

**All Approvals Required Before Implementation:**

| Doctor | Status | Date |
|--------|--------|------|
| Dr. Testalot (QA) | ❌ Pending | - |
| Dr. Clean (Quality) | ❌ Pending | - |
| Dr. LeanDev (Implementation) | ❌ Pending | - |
| Dr. DevOps (Operations) | ❌ Pending | - |
| Dr. Git (Version Control) | ❌ Pending | - |

**Grooming Complete:** ❌ NO | ✅ YES (All approved)

**Implementation Authorized By:** [Dr. Director Name]

**Authorization Date:** [TBD]

---

### Revision History

| Date | Revised By | Changes Made | Re-Grooming Required |
|------|------------|--------------|----------------------|
| 2025-11-05 | Dr. Director | Initial draft | N/A |

---

**⚠️ IMPLEMENTATION CANNOT BEGIN UNTIL ALL APPROVALS RECEIVED**
