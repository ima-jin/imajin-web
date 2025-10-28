# Implementation Plan

## Phase 1: Foundation & Infrastructure ✅ COMPLETE

**Completed:** 2025-10-24

### 1.1 Local Development Environment ✅
- [x] `docker/docker-compose.local.yml` (PostgreSQL on port 5435)
- [x] `.env.local.example` template
- [x] Test Docker startup (container running 12+ hours, healthy)
- [x] Cloud deployment strategy documented (Vercel + Neon) - **No Docker compose needed for cloud**

### 1.2 Next.js Initialization ✅
- [x] Next.js 16 with App Router, TypeScript, Tailwind CSS v4
- [x] Project structure (`/app`, `/components`, `/lib`, `/db`, `/config`, `/types`)
- [x] Basic layout components (header, footer)
- [x] Cloudflare integration - **Not needed (Vercel includes CDN)**

### 1.3 Database Setup ✅
- [x] Drizzle ORM with schema (`/db/schema.ts`)
- [x] All tables: products, variants, product_dependencies, product_specs, orders, order_items, nft_tokens, portfolio_items, portfolio_images
- [x] Migrations and seed script
- [x] Database connection test

### 1.4 Development Tooling ✅
- [x] ESLint, Prettier
- [x] Git repo with `.gitignore`
- [x] Scripts: `dev`, `build`, `db:push`, `db:seed`, `db:studio`, `docker:dev`, `docker:down`

### 1.5 Testing Setup ✅
- [x] Vitest + RTL, Playwright, MSW, @faker-js/faker
- [x] Test structure (`/tests/unit`, `/integration`, `/e2e`, `/smoke`)
- [x] Config files: `vitest.config.ts`, `playwright.config.ts`
- [x] Test scripts: `test`, `test:unit`, `test:integration`, `test:e2e`, `test:smoke`, `test:coverage`

### 1.6 CI/CD Setup
- [ ] GitHub Actions workflow for tests - **Ready to implement (`.github/workflows/test.yml`)**
- [ ] Vercel project setup - **Ready to implement (connect GitHub repo)**
- [ ] Neon PostgreSQL databases - **Ready to provision (staging + production)**

### 1.7 Phase 1 Testing ✅
- [x] `tests/integration/db/connection.test.ts`
- [x] `tests/integration/api/health.test.ts`
- [x] `tests/smoke/phase1-foundation.spec.ts`

**Gate Criteria:** ✅ All passed
- [x] Database connection working
- [x] Docker containers healthy
- [x] Health endpoint returns 200
- [x] Environment variables load
- [x] Seed script works
- [x] Phase 1 smoke tests pass

---

## Phase 2: E-commerce Core

### 2.1 Product Data Management ✅
- [x] JSON config structure (`/config/products.json`)
- [x] Product data model (aligned with Stripe)
- [x] Seed script (`npm run db:seed`)
- [x] Product CRUD utilities

**Phase 2.2 Improvements:**
- [x] Scripts reorganized: `db:seed`, `db:sync`, `db:verify`
- [x] Configure separate test database (`imajin_test`)
- [x] Update tests to use test database
- [x] Add type mapper/validator layer (Dr. Clean rec)

### 2.2 Product Catalog Pages ✅
**Pre-work:**
- [x] Create `.env.test` with test database URL
- [x] Update test config for test database
- [x] Add `test:db:reset` script
- [x] Document test DB setup in TESTING_STRATEGY.md

**Type Safety Layer:**
- [x] Create `lib/mappers/product-mapper.ts`
- [x] Create `lib/mappers/variant-mapper.ts`
- [x] Add Zod validation for all DB queries
- [x] Handle JSON fields with parsing/validation
- [x] Create mapper tests (13 tests for product-mapper, 7 tests for variant-mapper)

**API Routes:**
- [x] GET /api/products (with category filtering)
- [x] GET /api/products/[id] (with variants and specs)
- [x] Integration tests for both endpoints (47 tests total)

**Shared Components:**
- [x] ProductCard component (12 tests)
- [x] ProductGrid component (6 tests)
- [x] CategoryFilter component (9 tests)
- [x] LimitedEditionBadge component (9 tests)
- [x] ProductSpecs component (8 tests)
- [x] HeroSection component

**Pages:**
- [x] Homepage with featured products (app/page.tsx)
- [x] Product listing page (app/products/page.tsx)
- [x] Product detail page with variants, specs, badges (app/products/[id]/page.tsx)
- [x] Limited Edition badges
- [ ] Dependency warnings UI - **DEFERRED to Phase 2.3**

### 2.3 Shopping Cart ✅ COMPLETE

**Technical Debt Identified:** Styling architecture needs refactoring. See Phase 2.3.5 below.


- [x] Cart state (Context API with CartProvider)
- [x] Cart storage (localStorage + server sync)
- [x] Add/remove/update operations
- [x] Cart UI (slide-out drawer with CartDrawer)
- [x] Cart validation (including voltage compatibility - 5v/24v cannot mix)
- [x] Total calculation (CartSummary component)
- [x] Dependency warnings UI (CartValidation component)

**Components Built:**
- CartProvider (18 tests) - State management with localStorage
- CartSummary (6 tests) - Displays totals and item count
- CartValidation (9 tests) - Shows errors and warnings
- CartItem (16 tests) - Individual cart item display with quantity controls
- CartButton (9 tests) - Cart icon with item count badge
- CartDrawer (12 tests) - Slide-out cart panel
- AddToCartButton (10 tests) - Product add-to-cart button
- ProductAddToCart - Product page integration component
- Header - Navigation with cart button

**Services:**
- cart-validator.ts (13 tests) - Business logic validation
- /api/cart/validate (7 tests) - Validation API endpoint
- formatCurrency utility - Price formatting

**Business Rules Implemented:**
- ✅ Voltage compatibility (cannot mix 5v and 24v)
- ✅ Limited edition quantity tracking
- ✅ Product dependency validation (requires/suggests)
- ✅ Stock availability checking
- ✅ Cart persistence across sessions

**Test Coverage:** 100 tests passing (80 unit + 20 integration)
**Total Project Tests:** 271 passing

**Dr. Clean Reminders:**
- ⚠️ Keep mapper pattern consistent (create `cart-mapper.ts` if needed)
- ⚠️ Be cautious with localStorage + server sync (race conditions, stale data)
- ⚠️ Validate dependency rules carefully (voltage matching: cannot mix 5v/24v)
- ⚠️ Maintain test coverage ratio (1.5:1)

### 2.3.5 Design System & Style Architecture ✅ COMPLETE

**Type:** Architecture refactoring
**Priority:** HIGH - Should complete BEFORE Phase 2.4
**Reason:** Styling tightly coupled via inline Tailwind classes. No design system or theme variables.

**Tasks:**
- [x] Create design token system in `app/globals.css` (colors, typography, spacing, etc.)
- [x] Build UI component library: `/components/ui/`
  - [x] Button (variants: primary, secondary, ghost, link, danger)
  - [x] Card (with CardHeader, CardContent, CardFooter)
  - [x] Badge (variants: default, limited, warning, error, success, voltage, danger)
  - [ ] Input, Select, Textarea (consistent form styling) - **DEFERRED to Phase 2.4**
  - [x] Heading, Text (semantic typography components)
  - [x] Price (consistent price formatting)
  - [x] Container, Section (layout components)
- [x] Refactor existing components to use UI library:
  - [x] All product components (ProductCard, ProductGrid, ProductSpecs, LimitedEditionBadge)
  - [x] All cart components (CartDrawer, CartItem, CartButton, AddToCartButton)
  - [x] Layout components (Header, HeroSection)
  - [x] All pages (Homepage, Product Listing, Product Detail)
- [x] Write tests for UI library (~80 new tests) - 94 tests written
- [x] Create documentation:
  - [x] `/docs/DESIGN_SYSTEM.md` - Component usage, theme variables
  - [x] `/docs/STYLE_GUIDE.md` - Brand guidelines, UI patterns
- [x] Validation:
  - [x] All existing tests pass (no regressions) - 365/365 passing
  - [x] No visual regressions (pages look the same)
  - [x] Theme variables easily changeable
  - [x] Consistent UI patterns across all pages

**Benefits:**
- Separation of concerns (presentation vs markup)
- Maintainability (change design once, not 50 files)
- Consistency (all buttons/cards/etc look/behave the same)
- Velocity (build new pages faster from component library)
- Flexibility (rebrand/redesign = update theme tokens)

**Timeline:** 2-3 days (Completed: 2025-10-26)

**See:** `/docs/tasks/Phase 2.3.5 - Design System & Decoupling.md` for full specification

**Gate Criteria:**
- [x] Design token system implemented
- [x] Core UI library built and tested (8 components, 94 tests)
- [x] All existing components refactored (29 UI component imports)
- [x] All tests passing (365/365)
- [x] Documentation complete

### 2.4 Checkout Flow

**Pre-requisite:** Build form UI components from design system (Input, Select, Textarea) - deferred from Phase 2.3.5

- [ ] Build form UI components:
  - [ ] `/components/ui/Input.tsx` (with error states, helper text)
  - [ ] `/components/ui/Select.tsx` (consistent styling)
  - [ ] `/components/ui/Textarea.tsx` (with character count)
  - [ ] Tests for form components (~12 tests each)
- [ ] Checkout page/form
- [ ] Customer info collection
- [ ] Shipping address form
- [ ] Order review screen
- [ ] Stripe embedded checkout:
  - [ ] Create Checkout Session API route
  - [ ] Handle variants in Stripe
  - [ ] Embed Stripe component
- [ ] Stripe webhooks:
  - [ ] `checkout.session.completed`
  - [ ] Create order in DB
  - [ ] Decrement limited edition quantities
- [ ] Order confirmation page
- [ ] Order tracking lookup

### 2.5 Inventory Management
- [ ] Limited edition quantity tracking
- [ ] Real-time updates
- [ ] "Sold out" UI states
- [ ] Low stock warnings

### 2.6 Phase 2 Testing & Smoke Test Generation

**Purpose:** Create comprehensive smoke test suite that validates entire Phase 2 after all sub-phases complete.

**Tasks:**
- [ ] Write `tests/smoke/phase2-ecommerce.spec.ts` - Phase 2 smoke test suite
- [ ] Verify all Phase 2 unit/integration tests passing
- [ ] Run smoke tests against all Phase 2 features
- [ ] Validate no regressions in Phase 1 smoke tests

**Smoke Test Coverage (phase2-ecommerce.spec.ts):**
```typescript
// Product browsing
- Products API returns data
- Product listing page loads
- Product detail page renders
- Category filtering works

// Shopping cart
- Add to cart functionality
- Cart persists in localStorage
- Update quantities
- Remove items
- Cart total calculation

// Variants & dependencies
- Variant selector works
- Limited edition badges display
- Dependency warnings show
- Voltage compatibility validation
```

**Existing Tests (from sub-phases):**
- [x] `tests/integration/api/products.test.ts` (10 tests) - Phase 2.1/2.2
- [x] `tests/integration/api/products-id.test.ts` (10 tests) - Phase 2.2
- [x] `tests/unit/lib/mappers/product-mapper.test.ts` (13 tests) - Phase 2.2
- [x] `tests/unit/lib/mappers/variant-mapper.test.ts` (7 tests) - Phase 2.2
- [x] `tests/unit/components/ProductCard.test.tsx` (12 tests) - Phase 2.2
- [x] `tests/unit/components/ProductGrid.test.tsx` (6 tests) - Phase 2.2
- [x] `tests/unit/components/CategoryFilter.test.tsx` (9 tests) - Phase 2.2
- [x] `tests/unit/components/LimitedEditionBadge.test.tsx` (9 tests) - Phase 2.2
- [x] `tests/unit/components/ProductSpecs.test.tsx` (8 tests) - Phase 2.2
- [ ] `tests/unit/lib/cart-calculations.test.ts` - **Phase 2.3**
- [ ] `tests/unit/lib/validation.test.ts` - **Phase 2.3**
- [ ] `tests/unit/components/CartItem.test.tsx` - **Phase 2.3**
- [ ] `tests/unit/components/VariantSelector.test.tsx` - **Phase 2.3**
- [ ] `tests/integration/db/products-repository.test.ts` - **Phase 2.3**
- [ ] `tests/smoke/phase2-ecommerce.spec.ts` - **This phase (2.6)**

**Gate Criteria (Phase 2.2):**
- [x] Phase 1 tests still pass (153 total tests passing)
- [x] Products API returns expected data
- [x] Product pages render correctly
- [x] Limited Edition badges display correctly
- [ ] Cart operations work - **Phase 2.3**
- [ ] Cart persists in localStorage - **Phase 2.3**
- [ ] Variant selector updates correctly - **Phase 2.3**
- [ ] Dependency validation works - **Phase 2.3**
- [ ] Phase 2 smoke tests pass - **After Phase 2 complete**

**Run:** `npm run test:smoke -- phase1 phase2`

---

## Phase 3: Content Pages

### 3.1 Homepage
- [ ] Hero section
- [ ] Featured products
- [ ] Portfolio preview (3-4 projects)
- [ ] CTAs
- [ ] Newsletter signup (optional)

### 3.2 About/Company
- [ ] Company story
- [ ] Team info
- [ ] Mission/values
- [ ] Contact info

### 3.3 Portfolio/Installations
- [ ] Portfolio listing (grid/masonry)
- [ ] Portfolio detail pages
- [ ] Cloudinary integration
- [ ] JSON-based content management
- [ ] Case study template
- [ ] First case study

### 3.4 Supporting Pages
- [ ] Contact page
- [ ] FAQ
- [ ] Shipping/returns policy
- [ ] Warranty info (10-year Founder Edition)
- [ ] Terms of service
- [ ] Privacy policy

### 3.5 Phase 3 Testing
**Tests:**
- [ ] `tests/integration/api/portfolio.test.ts`
- [ ] `tests/unit/components/PortfolioCard.test.tsx`
- [ ] `tests/e2e/checkout.spec.ts`
- [ ] `tests/integration/stripe/checkout-session.test.ts`
- [ ] `tests/integration/stripe/webhook.test.ts`
- [ ] `tests/integration/db/orders-repository.test.ts`
- [ ] `tests/smoke/phase3-checkout.spec.ts`

**Gate Criteria:**
- [ ] Phase 1 & 2 tests pass
- [ ] Stripe checkout session creates
- [ ] Webhook processes payment
- [ ] Order created in DB
- [ ] Inventory decremented
- [ ] E2E checkout completes (test mode)
- [ ] Order confirmation displays
- [ ] Portfolio pages render
- [ ] Phase 3 smoke tests pass

**Run:** `npm run test:smoke -- phase1 phase2 phase3 && npm run test:e2e`

---

## Phase 4: Polish & Optimization

### 4.1 Performance & Monitoring
- [ ] Image optimization (Next.js Image + Cloudinary)
  - [ ] Replace `<img>` with `<Image />` in Header component (header logo)
  - [ ] Optimize product images with Next.js Image
  - [ ] Configure Cloudinary loader for automatic optimization
- [ ] Code splitting, lazy loading
- [ ] Cloudflare caching
- [ ] DB query optimization
- [ ] Lighthouse audit (target: >90 all categories)
- [ ] Structured logging system (replace console.error) - **Dr. Clean rec**
- [ ] Bundle size monitoring (@next/bundle-analyzer) - **Dr. Clean rec**
- [ ] Lighthouse CI checks in GitHub Actions - **Dr. Clean rec**
- [ ] Error tracking service (Sentry, LogRocket, or similar) - **Dr. Clean rec**

### 4.2 SEO
- [ ] Meta tags
- [ ] OpenGraph images
- [ ] Sitemap
- [ ] robots.txt
- [ ] Structured data (products, organization)

### 4.3 UX
- [ ] Loading states/skeletons
- [ ] Error boundaries
- [ ] 404 page
- [ ] Accessibility audit (WCAG)
- [ ] Mobile responsiveness
- [ ] Cross-browser testing

### 4.4 Admin Tools
- [ ] Admin interface:
  - [ ] View orders
  - [ ] Manage limited edition quantities
  - [ ] View inventory
- [ ] Admin authentication

### 4.5 Phase 4 Testing
**Tests:**
- [ ] `tests/integration/api/admin/orders.test.ts`
- [ ] `tests/unit/components/admin/OrdersList.test.tsx`
- [ ] `tests/e2e/admin-order-management.spec.ts`
- [ ] `tests/unit/lib/performance.test.ts`
- [ ] `tests/smoke/phase4-polish.spec.ts`

**Gate Criteria:**
- [ ] All previous tests pass
- [ ] Admin auth works
- [ ] Order management functional
- [ ] NFT tracking works
- [ ] Lighthouse >90
- [ ] No accessibility errors
- [ ] Phase 4 smoke tests pass

**Run:** `npm run test:smoke && npm run test:e2e && npm run test:coverage`

---

## Phase 5: Future Enhancements

### 5.1 Solana/Web3
- [ ] Solana Pay integration
- [ ] MJN token smart contract
- [ ] Solflare wallet connection
- [ ] Crypto payment flow
- [ ] NFT minting service
- [ ] NFT → physical unit association
- [ ] Customer NFT delivery

### 5.2 Visual Configurator
- [ ] 3D/2D fixture model
- [ ] Interactive component selection
- [ ] Real-time visual updates
- [ ] Drag-and-drop
- [ ] Export/save configurations

### 5.3 Fixture Scoping Tool
- [ ] Input fixture dimensions
- [ ] Calculate voltage/power
- [ ] Generate wiring diagrams
- [ ] BOM generation
- [ ] Export specs as PDF

### 5.4 Additional Features
- [ ] Customer accounts (order history, saved configs)
- [ ] Bulk ordering (commercial clients)
- [ ] Quote requests (custom installations)
- [ ] Email marketing
- [ ] Analytics/conversion tracking
- [ ] A/B testing framework

---

## Workflow

### Testing-First Approach
1. Write failing test
2. Implement feature
3. Verify tests pass
4. Manual testing in browser/Docker
5. Run smoke suite (no regressions)
6. Commit (only when tests pass)

### Daily Process
1. Pick next task
2. Create TodoWrite list (multi-step tasks)
3. **Write test(s) first**
4. Implement until tests pass
5. Run: `npm test && npm run test:smoke`
6. Manual test in Docker
7. Commit with clear message
8. Update plan checkboxes

### Test Commands
```bash
# Development
npm run test:watch              # Watch mode

# Before committing
npm test                        # Unit + integration
npm run test:smoke              # Smoke tests

# Phase gates
npm run test:smoke -- phase1
npm run test:e2e

# Before deploying
npm run test:coverage
npm run test:smoke
npm run test:e2e
```

### Deployment

**Platform**: Vercel + Neon PostgreSQL
**Cost**: ~$40/month (Vercel Hobby $20 + Neon Scale $19)

**Environments**:
- **Local**: Docker PostgreSQL + Next.js dev server
- **Staging**: Vercel (free tier) + Neon (free tier) - Auto-deploy from `main`
- **Production**: Vercel (Hobby) + Neon (Scale) - Manual promotion

**CI/CD**:
- GitHub Actions: Run tests on every PR/push
- Vercel: Auto-deploy staging on merge to `main`
- Production: Manual promotion via Vercel dashboard

**Domain**: `www.imajin.ai` (custom domain in Vercel)

**Backups**: Neon automatic daily backups (7-day retention)

**See [ENVIRONMENTS.md](./ENVIRONMENTS.md) and [DOCTOR_DEVOPS.md](./agents/DOCTOR_DEVOPS.md) for complete setup.**

---

## Environment Variables

**Storage**:
- **Local**: `.env.local` file (gitignored)
- **Staging/Production**: Vercel Dashboard → Environment Variables

**Required Variables**:
```env
NODE_ENV=development|production
DATABASE_URL=postgresql://...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...|pk_live_...
STRIPE_SECRET_KEY=sk_test_...|sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=imajin
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**See [ENVIRONMENTS.md](./ENVIRONMENTS.md) for detailed configuration.**

---

## Success Criteria

**Phase 1**: Docker running, DB connected, health endpoint working, tests passing ✅
**Phase 2**: Products display, cart works, checkout creates Stripe session, webhooks record orders
**Phase 3**: All pages navigable, portfolio displays, responsive design
**MVP Launch**: Phases 1-3 complete, Stripe test mode end-to-end, mobile responsive, no console errors

---

**Last Updated:** 2025-10-24
