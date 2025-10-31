# Phase 2.4.7 - Launch Injection: Browsable Site Readiness

**Type:** Feature - Frontend Development
**Priority:** CRITICAL
**Status:** 🟢 Approved for Implementation
**Estimated Effort:** 24-30 hours (5 days)
**Dependencies:** Phase 2.4.6 (Product Data Normalization) ✅
**Grooming Status:** ✅ Complete (All 5 doctors reviewed, conditions accepted)

---

## Overview

Transform the e-commerce backend into a publicly browsable frontend experience by implementing essential customer-facing pages, portfolio showcase functionality, and UX polish. This phase delivers a launch-ready site with homepage, portfolio page, contact page, responsive design, and production-quality polish.

### Goals

1. **Browsable Frontend:** Homepage, Portfolio, Contact pages ready for public viewing
2. **Portfolio System:** Add `showOnPortfolioPage` and `portfolioCopy` fields for product showcase
3. **UX Polish:** Loading states, error boundaries, 404 page, mobile responsiveness
4. **Production Ready:** SEO meta tags, image optimization, policy pages

---

## Problem Statement

**Current State:**
- E-commerce backend functional (products, cart, checkout work)
- Only product listing/detail pages exist
- No homepage, portfolio showcase, or contact information
- Missing UX polish (loading states, error handling, mobile optimization)
- Not launch-ready for public viewing

**Issues:**
- Cannot showcase products as portfolio/installations work
- No way for customers to contact us (info@imajin.ca)
- No homepage hero or featured products
- Mobile experience untested
- Missing SEO and policy pages

**Solution:**
Build minimal but complete set of frontend pages with portfolio showcase functionality, ensuring responsive design and production-quality UX polish.

---

## Grooming Decisions (User Approved)

**Date:** 2025-10-29
**Reviewers:** Dr. Testalot, Dr. Clean, Dr. LeanDev, Dr. DevOps, Dr. Git

### Key Decisions Made:

**1. Featured Products Selection (Dr. Testalot #1)**
- ✅ **Decision:** Add `isFeatured` boolean flag to products schema
- **Requirement:** Product must have `isFeatured: true` AND a hero image loaded
- **Display:** Show all featured products on homepage (no limit specified - use 3-6 products)

**2. Markdown Library (Dr. Testalot #2)**
- ✅ **Decision:** Use `react-markdown` (widely used, well-maintained, secure)
- **Sanitization:** Include `rehype-sanitize` plugin for XSS protection
- **Alternative considered:** Notepad++ uses Scintilla (C++ library, not JS-compatible)

**3. Test Specifications (Dr. Testalot #3)**
- ✅ **Decision:** Test titles enumerated; full implementations written during RED phase
- **Rationale:** This maintains TDD workflow (write test → see failure → implement)
- **Task doc provides:** Test names, assertions, expected outcomes

**4. Monitoring Strategy (Dr. DevOps #1)**
- ✅ **Decision:** Vercel logs only for MVP launch
- **Post-launch:** Add Sentry/Plausible after initial launch
- **Rationale:** Ship faster, add comprehensive monitoring in Phase 2.5+

**5. Content Validation (Dr. DevOps #2)**
- ✅ **Decision:** No pre-commit hook for MVP
- **Rationale:** Using custom-entered content, manual validation acceptable initially
- **Post-launch:** Add automated validation as content management matures

**6. Vercel Infrastructure (Dr. DevOps #3)**
- ✅ **Decision:** Will be provisioned in time for deployment
- **Action:** CTO handles Vercel + Neon setup before Phase 8 completion

**7. Migration Strategy (Dr. Git #1)**
- ✅ **Decision:** Create SQL migration script for Vercel deployment
- **Process:** `db:push` for local dev, manual SQL for first production deploy
- **Action:** Create `db/migrations/2025-10-29_add_portfolio_featured_fields.sql`

**8. Validation Script (Dr. Git #2)**
- ✅ **Decision:** Fix reference to use `npm run validate:content` (existing script)
- **Action:** Update Phase 1.3 task to use correct command

**9. Schema Enhancements (Dr. Clean)**
- ✅ **Decision:** Add `max(2000)` validation to `portfolioCopy` field
- **Rationale:** Prevent abuse, ensure reasonable content length

**10. Timeline (Dr. LeanDev)**
- ✅ **Decision:** Extended from 2-3 days to 5 days (24-30 hours)
- **Rationale:** Realistic estimate including content prep and mobile testing

**11. Content Preparation (Dr. LeanDev)**
- ✅ **Decision:** Use placeholder content initially
- **Process:** Define properties, copy team fills JSON manually post-implementation
- **Rationale:** Don't block development on content writing

**12. Mobile Testing (Dr. LeanDev)**
- ✅ **Decision:** Single round of mobile testing at end (Phase 6)
- **Rationale:** Efficient for tight timeline, components already use responsive patterns

**13. Post-Launch Items (Deferred)**
- CI/CD pipeline → Post-launch
- Performance baselines → Post-launch
- Rollback script → Post-launch
- Cloudinary config → Add to prod env files during deployment

**14. PR Strategy (Dr. Git)**
- ✅ **Decision:** One sprint = one PR (all 8 phases together)
- **Branch:** `feature/phase-2.4.7-launch-injection`
- **Commits:** 8 sequential commits (one per phase)

**15. Content Media Directory (Dr. Git)**
- ✅ **Decision:** Ignore `config/content/media/` for now
- **Action:** CTO will clean up when ready

**16. Commit Message Strategy (Dr. Git)**
- ✅ **Format:** `feat(phase-2.4.7): <description> [Phase N]`
- **Example:** `feat(phase-2.4.7): Add portfolio schema fields [Phase 1]`

---

## Test-First Approach

**This document enumerates ALL test scenarios BEFORE implementation begins.**

**TDD Workflow:**
1. **RED:** Write all tests first (they fail)
2. **GREEN:** Implement minimum code to pass tests
3. **REFACTOR:** Clean up implementation while keeping tests green

---

## Implementation Phases

### Phase 1: Portfolio & Featured Product Schema Extension (1-2 hours)

**Goal:** Add portfolio showcase and featured product fields to products schema

**TDD Approach:** Schema validation tests first, then migration

**1.1 Write Schema Tests (RED)**
- [ ] Create `tests/unit/config/products/portfolio-featured-schema.test.ts`
- [ ] Test `showOnPortfolioPage` boolean field validation
- [ ] Test `portfolioCopy` text field validation (optional, markdown support, max 2000 chars)
- [ ] Test `isFeatured` boolean field validation
- [ ] Test schema accepts valid portfolio/featured products
- [ ] Test schema rejects invalid portfolio fields
- [ ] Test portfolioCopy max length (2000 chars)
- [ ] Test media array accepts "hero" category for featured products
- [ ] ~8 tests total (see Test Specification section below)
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (fields don't exist yet)
- [ ] **Note:** Hero images use existing `media` array with `category="hero"` (not a separate field)

**1.2 Update Database Schema (GREEN)**
- [ ] Add `showOnPortfolioPage: boolean` to `products` table (default false, NOT NULL)
- [ ] Add `portfolioCopy: text` to `products` table (nullable, for markdown content)
- [ ] Add `isFeatured: boolean` to `products` table (default false, NOT NULL)
- [ ] Add `"hero"` to MediaItem category enum (for featured product hero images)
- [ ] **No separate heroImage column** - use existing `media` JSONB array
- [ ] Run migration: `npm run db:push` (local dev)
- [ ] Update `types/product.ts` with new fields and "hero" media category
- [ ] Update `config/schema.ts` ProductConfig with new fields (portfolioCopy max 2000)
- [ ] Update product-mapper to handle new fields
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 8 tests green)

**1.3 Create SQL Migration Script (GREEN)**
- [ ] Create `db/migrations/2025-10-29_add_portfolio_featured_fields.sql`
- [ ] Include UP migration (ADD COLUMN statements)
- [ ] Include DOWN migration (DROP COLUMN statements, commented)
- [ ] Test migration locally: apply → rollback → re-apply
- [ ] Document in migration file: "For Vercel deployment, run UP migration only"

**1.4 Update products.json (GREEN)**
- [ ] Add `showOnPortfolioPage: false` to all products (opt-in)
- [ ] Add `portfolioCopy: null` to all products (empty by default)
- [ ] Add `isFeatured: false` to all products (opt-in)
- [ ] **Note:** Hero images added later via `media` array with `category: "hero"`
- [ ] Validate with `npm run validate:content` (FIXED: using existing script)

**Phase 1 Gate Criteria:**
- [ ] All 8 new schema tests passing (reduced from 10 - no separate heroImage tests needed)
- [ ] All existing tests still passing (955/958)
- [ ] TypeScript: 0 errors (runtime code clean)
- [ ] Lint: 0 errors
- [ ] Migration applied successfully to local DB and test DB
- [ ] SQL migration script created and tested
- [ ] products.json validates successfully

**Deliverables:**
- Portfolio + featured product schema fields implemented with 8 tests
- "hero" category added to MediaItem enum
- SQL migration script for Vercel deployment
- Updated products.json with new fields
- Total new tests: 8 (corrected - using media array for hero images)

---

### Phase 2: Homepage Implementation (4-5 hours)

**Goal:** Build homepage with hero section and featured products

**TDD Approach:** Component tests first, then implementation

**2.1 Write Homepage Component Tests (RED)**
- [ ] Create `tests/unit/app/page.test.tsx`
- [ ] Test hero section renders
- [ ] Test featured products section renders
- [ ] Test CTA buttons present and linked correctly
- [ ] Test responsive layout
- [ ] ~12 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (components don't exist yet)

**2.2 Write HeroSection Component Tests (RED)**
- [ ] Create `tests/unit/components/home/HeroSection.test.tsx`
- [ ] Test renders title and subtitle
- [ ] Test CTA button links to products page
- [ ] Test background image/styling
- [ ] Test responsive behavior
- [ ] ~8 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**2.3 Write FeaturedProducts Component Tests (RED)**
- [ ] Create `tests/unit/components/home/FeaturedProducts.test.tsx`
- [ ] Test renders product grid
- [ ] Test shows only `isLive` products
- [ ] Test limits to 3-6 featured products
- [ ] Test responsive grid layout
- [ ] ~10 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**2.4 Implement Homepage (GREEN)**
- [ ] Create `components/home/HeroSection.tsx`
- [ ] Create `components/home/FeaturedProducts.tsx`
- [ ] Update `app/page.tsx` (homepage)
- [ ] Add homepage content to `config/content/pages/home.json`
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 30 tests green)

**2.5 Refactor (REFACTOR)**
- [ ] Extract reusable section components
- [ ] Add JSDoc comments
- [ ] Optimize bundle size
- [ ] Run tests: `npm test` - **MUST STAY GREEN**

**Phase 2 Gate Criteria:**
- [ ] All 30 new homepage tests passing
- [ ] All existing tests still passing (951/954 expected)
- [ ] Homepage renders without errors
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Deliverables:**
- Homepage with hero and featured products
- 30 new tests
- Homepage content JSON

---

### Phase 3: Portfolio Page Implementation (3-4 hours)

**Goal:** Build portfolio page showcasing products where `showOnPortfolioPage = true`

**TDD Approach:** Page and component tests first

**3.1 Write Portfolio Page Tests (RED)**
- [ ] Create `tests/unit/app/portfolio/page.test.tsx`
- [ ] Test page renders portfolio grid
- [ ] Test filters products by `showOnPortfolioPage = true`
- [ ] Test displays `portfolioCopy` for each product
- [ ] Test links to product detail pages
- [ ] Test empty state when no portfolio products
- [ ] ~10 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**3.2 Write PortfolioCard Component Tests (RED)**
- [ ] Create `tests/unit/components/portfolio/PortfolioCard.test.tsx`
- [ ] Test renders product image
- [ ] Test displays product name
- [ ] Test displays `portfolioCopy` (markdown support)
- [ ] Test links to product detail
- [ ] Test responsive layout
- [ ] ~8 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**3.3 Write Portfolio API Tests (RED)**
- [ ] Create `tests/integration/api/portfolio/route.test.ts`
- [ ] Test GET /api/portfolio returns only portfolio products
- [ ] Test filters by `showOnPortfolioPage = true`
- [ ] Test includes product images and portfolioCopy
- [ ] Test returns empty array when no portfolio products
- [ ] ~6 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**3.4 Implement Portfolio (GREEN)**
- [ ] Create `app/api/portfolio/route.ts`
- [ ] Create `app/portfolio/page.tsx`
- [ ] Create `components/portfolio/PortfolioCard.tsx`
- [ ] Create `components/portfolio/PortfolioGrid.tsx`
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 24 tests green)

**3.5 Refactor (REFACTOR)**
- [ ] Review grid layout responsiveness
- [ ] Add loading states
- [ ] Run tests: `npm test` - **MUST STAY GREEN**

**Phase 3 Gate Criteria:**
- [ ] All 24 new portfolio tests passing
- [ ] All existing tests still passing (975/978 expected)
- [ ] Portfolio page renders correctly
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Deliverables:**
- Portfolio page with grid layout
- Portfolio API endpoint
- 24 new tests

---

### Phase 4: Contact Page Implementation (1 hour)

**Goal:** Simple contact page with email info

**TDD Approach:** Basic component tests

**4.1 Write Contact Page Tests (RED)**
- [ ] Create `tests/unit/app/contact/page.test.tsx`
- [ ] Test page renders
- [ ] Test displays email: info@imajin.ca
- [ ] Test email link (mailto:) works
- [ ] Test responsive layout
- [ ] ~5 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**4.2 Implement Contact Page (GREEN)**
- [ ] Create `app/contact/page.tsx`
- [ ] Add contact content to `config/content/pages/contact.json`
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 5 tests green)

**Phase 4 Gate Criteria:**
- [ ] All 5 new contact tests passing
- [ ] All existing tests still passing (980/983 expected)
- [ ] Contact page displays correctly
- [ ] TypeScript: 0 errors

**Deliverables:**
- Contact page
- 5 new tests

---

### Phase 5: UX Polish - Loading States & Error Handling (2-3 hours)

**Goal:** Add loading skeletons, error boundaries, 404 page

**TDD Approach:** Test each state condition

**5.1 Write Loading Component Tests (RED)**
- [ ] Create `tests/unit/components/loading/ProductSkeleton.test.tsx`
- [ ] Test skeleton renders with correct structure
- [ ] Test matches ProductCard dimensions
- [ ] Test grid of skeletons renders
- [ ] ~6 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**5.2 Write Error Boundary Tests (RED)**
- [ ] Create `tests/unit/components/error/ErrorBoundary.test.tsx`
- [ ] Test catches component errors
- [ ] Test displays fallback UI
- [ ] Test logs error details
- [ ] Test "Try Again" button works
- [ ] ~8 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**5.3 Write 404 Page Tests (RED)**
- [ ] Create `tests/unit/app/not-found.test.tsx`
- [ ] Test 404 page renders
- [ ] Test displays helpful message
- [ ] Test "Back to Home" link works
- [ ] ~4 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**5.4 Implement UX Components (GREEN)**
- [ ] Create `components/loading/ProductSkeleton.tsx`
- [ ] Update ProductGrid to show skeletons while loading
- [ ] Create `components/error/ErrorBoundary.tsx`
- [ ] Wrap app layout with ErrorBoundary
- [ ] Create `app/not-found.tsx`
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 18 tests green)

**Phase 5 Gate Criteria:**
- [ ] All 18 new UX tests passing
- [ ] All existing tests still passing (998/1001 expected)
- [ ] Loading states visible during data fetch
- [ ] Error boundaries catch errors gracefully
- [ ] 404 page renders for invalid routes
- [ ] TypeScript: 0 errors

**Deliverables:**
- Loading skeletons
- Error boundaries
- 404 page
- 18 new tests

---

### Phase 6: Mobile Responsiveness Audit (1-2 hours)

**Goal:** Ensure all pages work on mobile devices

**TDD Approach:** Visual regression tests + manual testing

**6.1 Write Responsive Tests (RED)**
- [ ] Create `tests/e2e/responsive.spec.ts`
- [ ] Test homepage mobile layout (viewport: 375px)
- [ ] Test product grid mobile layout
- [ ] Test cart drawer mobile behavior
- [ ] Test navigation mobile menu
- [ ] Test portfolio grid mobile layout
- [ ] ~8 tests total (Playwright)
- [ ] Run tests: `npm run test:e2e` - **EXPECT FAILURES**

**6.2 Fix Mobile Issues (GREEN)**
- [ ] Review all pages at mobile breakpoints (375px, 768px, 1024px)
- [ ] Fix any layout issues
- [ ] Test cart drawer on mobile
- [ ] Test touch interactions
- [ ] Run tests: `npm run test:e2e` - **EXPECT PASSING** (all 8 tests green)

**Phase 6 Gate Criteria:**
- [ ] All 8 responsive tests passing
- [ ] All pages tested on mobile viewport
- [ ] Touch interactions work correctly
- [ ] No horizontal scroll on mobile

**Deliverables:**
- Mobile-responsive fixes
- 8 E2E responsive tests

---

### Phase 7: Image Optimization (1-2 hours)

**Goal:** Use Next.js Image component for optimized loading

**TDD Approach:** Integration tests for image rendering

**7.1 Write Image Tests (RED)**
- [ ] Create `tests/integration/components/image-optimization.test.tsx`
- [ ] Test Next.js Image component renders
- [ ] Test proper sizing attributes
- [ ] Test lazy loading works
- [ ] Test placeholder blur works
- [ ] ~6 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**7.2 Replace img with Image (GREEN)**
- [ ] Update Header logo to use Next.js Image
- [ ] Update ProductCard images to use Next.js Image
- [ ] Update PortfolioCard images to use Next.js Image
- [ ] Configure Cloudinary loader in `next.config.ts`
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 6 tests green)

**Phase 7 Gate Criteria:**
- [ ] All 6 image tests passing
- [ ] All `<img>` replaced with `<Image />`
- [ ] Cloudinary loader configured
- [ ] Images lazy load correctly

**Deliverables:**
- Optimized images with Next.js Image
- Cloudinary loader config
- 6 new tests

---

### Phase 8: SEO & Policy Pages (2-3 hours)

**Goal:** Add meta tags, OpenGraph, and policy pages

**TDD Approach:** Test meta tags presence, policy page content

**8.1 Write SEO Tests (RED)**
- [ ] Create `tests/integration/seo/metadata.test.ts`
- [ ] Test homepage has title and description
- [ ] Test product pages have title and description
- [ ] Test OpenGraph tags present
- [ ] Test Twitter Card tags present
- [ ] ~8 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**8.2 Write Policy Page Tests (RED)**
- [ ] Create `tests/unit/app/shipping/page.test.tsx`
- [ ] Test shipping policy page renders
- [ ] ~2 tests total
- [ ] Create `tests/unit/app/warranty/page.test.tsx`
- [ ] Test warranty page renders
- [ ] ~2 tests total
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**8.3 Implement SEO & Policies (GREEN)**
- [ ] Add `metadata` export to all pages
- [ ] Create `config/content/seo.json`
- [ ] Create `app/shipping/page.tsx`
- [ ] Create `app/warranty/page.tsx`
- [ ] Add shipping content to `config/content/pages/shipping.json`
- [ ] Add warranty content to `config/content/pages/warranty.json`
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 12 tests green)

**Phase 8 Gate Criteria:**
- [ ] All 12 SEO/policy tests passing
- [ ] All pages have proper meta tags
- [ ] OpenGraph tags correct
- [ ] Policy pages render correctly

**Deliverables:**
- SEO metadata on all pages
- Shipping policy page
- Warranty policy page
- 12 new tests

---

## Detailed Test Specifications

**This section enumerates ALL 103 test scenarios BEFORE implementation begins.**
**(Reduced from 105 - removed 2 heroImage-specific tests since we use media array)**

### Phase 1: Portfolio Schema Tests (8 tests)
**Note:** Hero images use existing `media` array with `category="hero"` (not a separate field)

#### File: `tests/unit/config/products/portfolio-schema.test.ts`

##### 1. Schema Validation (4 tests)

**Test 1.1:** Should accept valid showOnPortfolioPage boolean
```typescript
it('should accept showOnPortfolioPage: true', () => {
  const product = {
    ...validProduct,
    showOnPortfolioPage: true,
  };
  const result = ProductConfigSchema.safeParse(product);
  expect(result.success).toBe(true);
});
```

**Test 1.2:** Should accept showOnPortfolioPage: false (default)
```typescript
it('should default showOnPortfolioPage to false', () => {
  const product = { ...validProduct };
  const result = ProductConfigSchema.safeParse(product);
  expect(result.success).toBe(true);
  expect(result.data?.showOnPortfolioPage).toBe(false);
});
```

**Test 1.3:** Should accept optional portfolioCopy text
```typescript
it('should accept portfolioCopy with markdown content', () => {
  const product = {
    ...validProduct,
    portfolioCopy: '## Custom Installation\n\nThis was featured in...',
  };
  const result = ProductConfigSchema.safeParse(product);
  expect(result.success).toBe(true);
});
```

**Test 1.4:** Should accept null/undefined portfolioCopy
```typescript
it('should accept missing portfolioCopy field', () => {
  const product = { ...validProduct };
  const result = ProductConfigSchema.safeParse(product);
  expect(result.success).toBe(true);
});
```

##### 2. Invalid Data Rejection (4 tests)

**Test 2.1:** Should reject non-boolean showOnPortfolioPage
```typescript
it('should reject showOnPortfolioPage as string', () => {
  const product = {
    ...validProduct,
    showOnPortfolioPage: 'true', // String instead of boolean
  };
  const result = ProductConfigSchema.safeParse(product);
  expect(result.success).toBe(false);
});
```

**Test 2.2:** Should reject non-string portfolioCopy
```typescript
it('should reject portfolioCopy as number', () => {
  const product = {
    ...validProduct,
    portfolioCopy: 12345,
  };
  const result = ProductConfigSchema.safeParse(product);
  expect(result.success).toBe(false);
});
```

**Test 2.3:** Should handle empty portfolioCopy string
```typescript
it('should accept empty portfolioCopy string', () => {
  const product = {
    ...validProduct,
    portfolioCopy: '',
  };
  const result = ProductConfigSchema.safeParse(product);
  expect(result.success).toBe(true);
});
```

**Test 2.4:** Should validate complete product with portfolio fields
```typescript
it('should validate complete Founder Edition with portfolio fields', () => {
  const product = {
    ...founderEditionProduct,
    showOnPortfolioPage: true,
    portfolioCopy: '**Limited Edition:** Featured in downtown installation.',
  };
  const result = ProductConfigSchema.safeParse(product);
  expect(result.success).toBe(true);
});
```

---

### Phase 2: Homepage Component Tests (30 tests)

#### File: `tests/unit/app/page.test.tsx` (12 tests)

##### 1. Homepage Rendering (6 tests)

**Test 1.1:** Should render homepage without errors
```typescript
it('should render homepage', () => {
  render(<HomePage />);
  expect(screen.getByRole('main')).toBeInTheDocument();
});
```

**Test 1.2:** Should render hero section
```typescript
it('should contain hero section', () => {
  render(<HomePage />);
  expect(screen.getByTestId('hero-section')).toBeInTheDocument();
});
```

**Test 1.3:** Should render featured products section
```typescript
it('should contain featured products section', () => {
  render(<HomePage />);
  expect(screen.getByTestId('featured-products')).toBeInTheDocument();
});
```

**Test 1.4:** Should have proper page title
```typescript
it('should have correct page title', () => {
  const metadata = generateMetadata();
  expect(metadata.title).toBe('Imajin - Modular LED Fixtures');
});
```

**Test 1.5:** Should have proper meta description
```typescript
it('should have SEO meta description', () => {
  const metadata = generateMetadata();
  expect(metadata.description).toContain('LED');
});
```

**Test 1.6:** Should render primary CTA button
```typescript
it('should have Shop Products button', () => {
  render(<HomePage />);
  expect(screen.getByRole('link', { name: /shop products/i })).toBeInTheDocument();
});
```

##### 2. Responsive Layout (6 tests)

**Test 2.1:** Should use Container component
```typescript
it('should wrap content in Container', () => {
  render(<HomePage />);
  const main = screen.getByRole('main');
  expect(main.querySelector('.container')).toBeInTheDocument();
});
```

**Test 2.2:** Should have responsive spacing
```typescript
it('should have proper spacing between sections', () => {
  render(<HomePage />);
  const sections = screen.getAllByRole('region');
  expect(sections).toHaveLength(2); // Hero + Featured
});
```

[Continue for remaining 4 responsive tests...]

---

#### File: `tests/unit/components/home/HeroSection.test.tsx` (8 tests)

##### 1. Hero Content (4 tests)

**Test 1.1:** Should render hero title
```typescript
it('should display hero title', () => {
  render(<HeroSection />);
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
});
```

**Test 1.2:** Should render hero subtitle
```typescript
it('should display subtitle', () => {
  render(<HeroSection />);
  expect(screen.getByText(/modular led/i)).toBeInTheDocument();
});
```

**Test 1.3:** Should render CTA button
```typescript
it('should have CTA button linking to products', () => {
  render(<HeroSection />);
  const link = screen.getByRole('link', { name: /explore products/i });
  expect(link).toHaveAttribute('href', '/products');
});
```

**Test 1.4:** Should use Heading component for title
```typescript
it('should use design system Heading component', () => {
  render(<HeroSection />);
  const heading = screen.getByRole('heading', { level: 1 });
  expect(heading).toHaveClass('heading');
});
```

##### 2. Styling & Layout (4 tests)

[Continue with styling tests...]

---

#### File: `tests/unit/components/home/FeaturedProducts.test.tsx` (10 tests)

##### 1. Product Display (5 tests)

**Test 1.1:** Should fetch and display featured products
```typescript
it('should display product grid', async () => {
  const products = [mockProduct1, mockProduct2, mockProduct3];
  vi.mocked(getAllProducts).mockResolvedValue(products);

  render(<FeaturedProducts />);

  await waitFor(() => {
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
});
```

**Test 1.2:** Should limit to 6 featured products max
```typescript
it('should show max 6 products', async () => {
  const products = Array(10).fill(mockProduct);
  vi.mocked(getAllProducts).mockResolvedValue(products);

  render(<FeaturedProducts />);

  await waitFor(() => {
    expect(screen.getAllByRole('article')).toHaveLength(6);
  });
});
```

[Continue for remaining product display tests...]

##### 2. Loading & Error States (5 tests)

**Test 2.1:** Should show loading skeleton while fetching
**Test 2.2:** Should display error message if fetch fails
**Test 2.3:** Should show empty state if no products
**Test 2.4:** Should retry on error
**Test 2.5:** Should handle network timeout

[Detailed test implementations for each...]

---

### Phase 3: Portfolio Tests (24 tests)

#### File: `tests/unit/app/portfolio/page.test.tsx` (10 tests)

##### 1. Portfolio Page Rendering (5 tests)

**Test 1.1:** Should render portfolio page
```typescript
it('should render portfolio page', () => {
  render(<PortfolioPage />);
  expect(screen.getByRole('main')).toBeInTheDocument();
});
```

**Test 1.2:** Should fetch portfolio products from API
```typescript
it('should call /api/portfolio endpoint', async () => {
  const fetchSpy = vi.spyOn(global, 'fetch');
  render(<PortfolioPage />);

  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith('/api/portfolio');
  });
});
```

**Test 1.3:** Should display only products with showOnPortfolioPage = true
```typescript
it('should show only portfolio products', async () => {
  const portfolioProducts = [
    { ...mockProduct, showOnPortfolioPage: true },
  ];
  vi.mocked(fetch).mockResolvedValue({
    json: async () => portfolioProducts,
  });

  render(<PortfolioPage />);

  await waitFor(() => {
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
  });
});
```

[Continue for remaining rendering tests...]

##### 2. Empty State & Error Handling (5 tests)

**Test 2.1:** Should show empty state when no portfolio products
**Test 2.2:** Should display helpful message in empty state
**Test 2.3:** Should show link to products page from empty state
**Test 2.4:** Should handle API error gracefully
**Test 2.5:** Should retry failed requests

---

#### File: `tests/unit/components/portfolio/PortfolioCard.test.tsx` (8 tests)

##### 1. Card Content (4 tests)

**Test 1.1:** Should render product image
```typescript
it('should display product image', () => {
  render(<PortfolioCard product={mockPortfolioProduct} />);
  expect(screen.getByRole('img', { name: mockPortfolioProduct.name })).toBeInTheDocument();
});
```

**Test 1.2:** Should render product name as heading
```typescript
it('should display product name', () => {
  render(<PortfolioCard product={mockPortfolioProduct} />);
  expect(screen.getByRole('heading')).toHaveTextContent(mockPortfolioProduct.name);
});
```

**Test 1.3:** Should render portfolioCopy with markdown support
```typescript
it('should render portfolioCopy as markdown', () => {
  const product = {
    ...mockPortfolioProduct,
    portfolioCopy: '**Featured** in downtown installation',
  };
  render(<PortfolioCard product={product} />);
  expect(screen.getByText('Featured')).toHaveStyle({ fontWeight: 'bold' });
});
```

**Test 1.4:** Should link to product detail page
```typescript
it('should link to product detail', () => {
  render(<PortfolioCard product={mockPortfolioProduct} />);
  const link = screen.getByRole('link');
  expect(link).toHaveAttribute('href', `/products/${mockPortfolioProduct.id}`);
});
```

##### 2. Layout & Styling (4 tests)

[Continue with layout tests...]

---

#### File: `tests/integration/api/portfolio/route.test.ts` (6 tests)

##### 1. API Behavior (6 tests)

**Test 1.1:** Should return only products with showOnPortfolioPage = true
```typescript
it('GET /api/portfolio should return portfolio products', async () => {
  await db.insert(products).values([
    { ...testProduct1, showOnPortfolioPage: true },
    { ...testProduct2, showOnPortfolioPage: false }, // Should not be returned
  ]);

  const response = await GET();
  const data = await response.json();

  expect(data).toHaveLength(1);
  expect(data[0].id).toBe(testProduct1.id);
});
```

**Test 1.2:** Should include portfolioCopy in response
```typescript
it('should include portfolioCopy field', async () => {
  await db.insert(products).values([
    {
      ...testProduct,
      showOnPortfolioPage: true,
      portfolioCopy: 'Featured installation',
    },
  ]);

  const response = await GET();
  const data = await response.json();

  expect(data[0].portfolioCopy).toBe('Featured installation');
});
```

**Test 1.3:** Should return empty array when no portfolio products
```typescript
it('should return empty array when no portfolio products', async () => {
  await db.insert(products).values([
    { ...testProduct, showOnPortfolioPage: false },
  ]);

  const response = await GET();
  const data = await response.json();

  expect(data).toEqual([]);
});
```

**Test 1.4:** Should only return live products
**Test 1.5:** Should include media field
**Test 1.6:** Should return 200 status code

---

### Phase 4: Contact Page Tests (5 tests)

#### File: `tests/unit/app/contact/page.test.tsx` (5 tests)

**Test 1:** Should render contact page
**Test 2:** Should display email: info@imajin.ca
**Test 3:** Should have mailto link
**Test 4:** Should have page heading
**Test 5:** Should use Container layout

[Detailed implementations for each...]

---

### Phase 5: UX Polish Tests (18 tests)

#### File: `tests/unit/components/loading/ProductSkeleton.test.tsx` (6 tests)

**Test 1:** Should render skeleton with correct structure
**Test 2:** Should match ProductCard dimensions
**Test 3:** Should show loading animation
**Test 4:** Should render multiple skeletons in grid
**Test 5:** Should be accessible (aria-label)
**Test 6:** Should have proper spacing

---

#### File: `tests/unit/components/error/ErrorBoundary.test.tsx` (8 tests)

**Test 1:** Should render children when no error
**Test 2:** Should catch component errors
**Test 3:** Should display fallback UI on error
**Test 4:** Should log error to console
**Test 5:** Should show "Try Again" button
**Test 6:** Should reset error state on retry
**Test 7:** Should display error message
**Test 8:** Should work with nested components

---

#### File: `tests/unit/app/not-found.test.tsx` (4 tests)

**Test 1:** Should render 404 page
**Test 2:** Should display "Page Not Found" heading
**Test 3:** Should have "Back to Home" link
**Test 4:** Should suggest browsing products

---

### Phase 6: Mobile Responsiveness Tests (8 tests)

#### File: `tests/e2e/responsive.spec.ts` (8 tests)

**Test 1:** Homepage mobile layout (375px viewport)
**Test 2:** Product grid responsive breakpoints
**Test 3:** Cart drawer mobile behavior
**Test 4:** Navigation mobile menu
**Test 5:** Portfolio grid mobile layout
**Test 6:** Contact page mobile layout
**Test 7:** Touch interactions work correctly
**Test 8:** No horizontal scroll on any page

---

### Phase 7: Image Optimization Tests (6 tests)

#### File: `tests/integration/components/image-optimization.test.tsx` (6 tests)

**Test 1:** Next.js Image component renders
**Test 2:** Images have proper width/height attributes
**Test 3:** Lazy loading enabled
**Test 4:** Placeholder blur works
**Test 5:** Cloudinary loader generates correct URLs
**Test 6:** Images responsive at different breakpoints

---

### Phase 8: SEO & Policy Tests (12 tests)

#### File: `tests/integration/seo/metadata.test.ts` (8 tests)

**Test 1:** Homepage has title tag
**Test 2:** Homepage has meta description
**Test 3:** Product pages have unique titles
**Test 4:** OpenGraph title present
**Test 5:** OpenGraph description present
**Test 6:** OpenGraph image present
**Test 7:** Twitter Card tags present
**Test 8:** Canonical URL correct

---

#### File: `tests/unit/app/shipping/page.test.tsx` (2 tests)

**Test 1:** Shipping policy page renders
**Test 2:** Contains shipping information

---

#### File: `tests/unit/app/warranty/page.test.tsx` (2 tests)

**Test 1:** Warranty page renders
**Test 2:** Contains 10-year warranty info for Founder Edition

---

## Test Specification Summary

**Total New Tests: 105**

| Phase | Test Type | Count | File(s) |
|-------|-----------|-------|---------|
| 1 | Unit (Schema) | 8 | portfolio-schema.test.ts |
| 2 | Unit (Homepage) | 30 | page.test.tsx, HeroSection.test.tsx, FeaturedProducts.test.tsx |
| 3 | Unit + Integration (Portfolio) | 24 | page.test.tsx, PortfolioCard.test.tsx, route.test.ts |
| 4 | Unit (Contact) | 5 | page.test.tsx |
| 5 | Unit (UX Polish) | 18 | ProductSkeleton, ErrorBoundary, not-found tests |
| 6 | E2E (Responsive) | 8 | responsive.spec.ts |
| 7 | Integration (Images) | 6 | image-optimization.test.tsx |
| 8 | Integration + Unit (SEO) | 12 | metadata.test.ts, policy page tests |
| **Total** | | **103** | **15 test files** |

---

## Implementation Specification

### Database Schema Changes

**Add columns to `products` table:**
```typescript
// db/schema.ts
export const products = pgTable("products", {
  // ... existing fields ...

  // NEW FIELDS (Phase 2.4.7)
  showOnPortfolioPage: boolean("show_on_portfolio_page").default(false).notNull(),
  portfolioCopy: text("portfolio_copy"), // Nullable, markdown support
});
```

### TypeScript Type Updates

**Update `types/product.ts`:**
```typescript
export interface Product {
  // ... existing fields ...

  // NEW FIELDS
  showOnPortfolioPage: boolean;
  portfolioCopy?: string; // Optional, markdown
}
```

### Zod Schema Updates

**Update `config/schema.ts`:**
```typescript
export const ProductConfigSchema = z.object({
  // ... existing fields ...

  // NEW FIELDS
  showOnPortfolioPage: z.boolean().default(false),
  portfolioCopy: z.string().optional(),
});
```

---

## New Files to Create

### Pages
1. `app/page.tsx` - Homepage (update existing)
2. `app/portfolio/page.tsx` - Portfolio page
3. `app/contact/page.tsx` - Contact page
4. `app/shipping/page.tsx` - Shipping policy
5. `app/warranty/page.tsx` - Warranty policy
6. `app/not-found.tsx` - 404 page

### Components
7. `components/home/HeroSection.tsx`
8. `components/home/FeaturedProducts.tsx`
9. `components/portfolio/PortfolioCard.tsx`
10. `components/portfolio/PortfolioGrid.tsx`
11. `components/loading/ProductSkeleton.tsx`
12. `components/error/ErrorBoundary.tsx`

### API Routes
13. `app/api/portfolio/route.ts`

### Content Files
14. `config/content/pages/home.json`
15. `config/content/pages/contact.json`
16. `config/content/pages/shipping.json`
17. `config/content/pages/warranty.json`
18. `config/content/seo.json`

### Test Files (15 files as per Test Summary)

---

## Acceptance Criteria

**Tests:**
- [ ] All 105 new tests passing
- [ ] All existing tests still passing (943 → 1048)
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
- [ ] Test coverage: >95%

**Implementation:**
- [ ] Homepage with hero and featured products
- [ ] Portfolio page showing products with showOnPortfolioPage = true
- [ ] Contact page with info@imajin.ca
- [ ] All pages mobile responsive
- [ ] Loading states on all data fetches
- [ ] Error boundaries catch errors
- [ ] 404 page for invalid routes
- [ ] Images optimized with Next.js Image
- [ ] SEO meta tags on all pages
- [ ] Shipping and warranty policy pages

**Documentation:**
- [ ] IMPLEMENTATION_PLAN.md updated
- [ ] DATABASE_SCHEMA.md updated with portfolio fields
- [ ] JSON_CONFIG_STRUCTURE.md updated

**Quality Gates:**
- [ ] All phase gate criteria met
- [ ] No regressions introduced
- [ ] Mobile tested on real devices
- [ ] Lighthouse score >80 for all pages
- [ ] All pages load in <3 seconds

---

## Deliverables

1. **Portfolio Schema Fields** - showOnPortfolioPage, portfolioCopy (8 tests)
2. **Homepage** - Hero section, featured products (30 tests)
3. **Portfolio Page** - Product showcase with filtering (24 tests)
4. **Contact Page** - Simple info page (5 tests)
5. **UX Polish** - Loading, errors, 404 (18 tests)
6. **Mobile Responsive** - All pages tested (8 E2E tests)
7. **Image Optimization** - Next.js Image integration (6 tests)
8. **SEO & Policies** - Meta tags, shipping, warranty (12 tests)

**Total Lines of Code:**
- Production: ~800 lines
- Tests: ~1,200 lines
- Documentation: ~200 lines
- **Total: ~2,200 lines**

---

## Dependencies

**NPM Packages:**
```bash
# Markdown rendering with XSS protection
npm install react-markdown rehype-sanitize
```

**Rationale:**
- `react-markdown`: Industry-standard markdown renderer for React (33M+ downloads/week)
- `rehype-sanitize`: Sanitizes HTML output to prevent XSS attacks
- Alternative considered: Notepad++ uses Scintilla (C++ library, not JavaScript-compatible)

**Environment Variables:**
```env
# No new environment variables required
# Cloudinary config already exists
# Stripe config already exists
```

**External Services:**
- Next.js Image (built-in)
- Cloudinary (already configured)
- Vercel (to be provisioned before deployment)

---

## Risk Assessment

**High Risk (NOW MITIGATED):**
- ~~**Timeline:** 18-22 hours in 2-3 days is aggressive~~ ✅ RESOLVED: Extended to 5 days (24-30 hours)
- ~~**Mobile Testing:** May discover issues late in process~~ ✅ ACCEPTABLE: Single round at end OK per user

**Medium Risk (NOW MITIGATED):**
- ~~**Portfolio Content:** Need sample portfolioCopy content for products~~ ✅ RESOLVED: Using placeholder content
- ~~**SEO Content:** Need proper meta descriptions~~ ✅ RESOLVED: Placeholder content, copy team fills later
- ~~**Featured Products Logic:** Unclear selection algorithm~~ ✅ RESOLVED: isFeatured flag + heroImage requirement
- ~~**Markdown Library:** Not specified~~ ✅ RESOLVED: react-markdown with rehype-sanitize

**Low Risk:**
- **Image Optimization:** Next.js Image is well-documented ✅
- **Error Boundaries:** Standard React pattern ✅
- **Database Migration:** Additive changes only (safe) ✅
- **Vercel Deployment:** Infrastructure to be provisioned (CTO handling) ✅

---

## Decisions Made

1. **Portfolio Fields:** ✅ Add to products table (not separate portfolio table)
   - Simpler schema, easier queries
   - Products can be both sellable AND portfolio items
   - portfolioCopy optional field for custom descriptions

2. **Contact Page:** ✅ Keep ultra-simple (email only)
   - No contact form initially
   - Just email: info@imajin.ca
   - Can add form later if needed

3. **Homepage Design:** ✅ Minimal MVP approach
   - Hero + Featured Products only
   - Skip newsletter signup for now
   - No portfolio preview on homepage (separate portfolio page)

4. **Mobile Testing:** ✅ Mix of E2E and manual
   - 8 Playwright E2E tests for key flows
   - Manual testing on real devices
   - Target: iPhone SE, iPad, desktop

5. **SEO Approach:** ✅ Basic meta tags, defer advanced SEO
   - Title and description on all pages
   - OpenGraph for social sharing
   - Skip sitemap/robots.txt initially

6. **Image Strategy:** ✅ Use Cloudinary via Next.js Image
   - Automatic optimization
   - Lazy loading
   - Responsive srcset
   - Blur placeholder

## All Decisions Finalized ✅

**No open questions remaining. Ready for grooming.**

---

## Timeline Summary

| Phase | Focus | Duration | Tests | Deliverable |
|-------|-------|----------|-------|-------------|
| 1 | Portfolio Schema | 1-2h | +8 | Database fields added |
| 2 | Homepage | 4-5h | +30 | Hero + Featured Products |
| 3 | Portfolio Page | 3-4h | +24 | Portfolio showcase |
| 4 | Contact Page | 1h | +5 | Contact info page |
| 5 | UX Polish | 2-3h | +18 | Loading, errors, 404 |
| 6 | Mobile Responsive | 1-2h | +8 | Mobile testing |
| 7 | Image Optimization | 1-2h | +6 | Next.js Image |
| 8 | SEO & Policies | 2-3h | +12 | Meta tags, policies |
| **Total** | **Full Implementation** | **18-22h** | **+105** | **Phase 2.4.7 Complete** |

**Estimated: 2-3 days of focused work**

**Test Count Progression:**
- Starting: 943/946 tests passing
- After Phase 2.4.7: 1046/1049 tests passing (+103 new tests, corrected from 105)
  - Unit: 93 tests (current + 73 new)
  - Integration: 36 tests (current + 24 new)
  - E2E: 8 tests (all new)
  - Smoke: 0 tests (defer to Phase 2.6)
- **Note:** Reduced by 2 tests - using media array for hero images instead of separate field

---

## Status: 🟡 Ready for Grooming

**Created:** 2025-10-29
**Grooming Initiated:** TBD
**Grooming Complete:** TBD

---

## Grooming Session

**⚠️ MANDATORY: All Doctors must review and approve before implementation begins.**

See `docs/TASK_GROOMING_PROCESS.md` for complete grooming workflow.

---

### Dr. Testalot (QA Lead) - Testing Review

**Review Date:** TBD

**Test Specification Review:**
- [ ] All 105 tests enumerated before implementation?
- [ ] Test descriptions specific (not vague)?
- [ ] Test count (105) matches summary table?
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
- [ ] Timeline realistic (18-22h in 2-3 days)?
- [ ] Known blockers addressed?
- [ ] External APIs understood?
- [ ] Test data/fixtures planned?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- Timeline is aggressive - is 2-3 days realistic?

**Approval:** ❌ Pending | ✅ Approved

**Approved Date:** [TBD]

---

### Dr. DevOps (Operations) - Deployment Review

**Review Date:** TBD

**Deployment Review:**
- [ ] Infrastructure requirements identified?
- [ ] Environment variables documented?
- [ ] Migration strategy clear (db:push for portfolio fields)?
- [ ] Rollback plan exists?
- [ ] Monitoring/logging adequate?
- [ ] Database changes safe (adding nullable columns)?

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
- [ ] Scope reasonable for single PR?
- [ ] Breaking changes identified?
- [ ] Documentation updates planned?
- [ ] Migration path clear?
- [ ] Commit strategy defined?
- [ ] Merge conflicts anticipated?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- Large scope - consider breaking into multiple PRs?

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
| 2025-10-29 | Dr. Director | Initial draft | N/A |

---

**⚠️ IMPLEMENTATION CANNOT BEGIN UNTIL ALL APPROVALS RECEIVED**
