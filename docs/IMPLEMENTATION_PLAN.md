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
- [x] Type mapper/validator layer (product-mapper, variant-mapper)
- [x] Seed/sync scripts (`db:seed`, `db:sync`, `db:verify`)
- [x] Separate test database (`imajin_test`)

### 2.2 Product Catalog Pages ✅
- [x] API Routes: GET /api/products, GET /api/products/[id]
- [x] Components: ProductCard, ProductGrid, CategoryFilter, LimitedEditionBadge, ProductSpecs, HeroSection
- [x] Pages: Homepage, Product listing, Product detail
- [x] Type safety with Zod validation
- [x] 47 integration tests, 44 unit tests

### 2.3 Shopping Cart ✅
- [x] Cart state management (Context API with localStorage)
- [x] Components: CartProvider, CartDrawer, CartItem, CartButton, AddToCartButton, CartSummary, CartValidation
- [x] Services: cart-validator, /api/cart/validate
- [x] Business rules: Voltage compatibility, limited edition tracking, dependency validation
- [x] 100 tests (80 unit + 20 integration)

### 2.3.5 Design System & Style Architecture ✅
- [x] Design token system (`app/globals.css`)
- [x] UI component library: Button, Card, Badge, Heading, Text, Price, Container, Section
- [x] Form components: Label, Input, Select, Textarea, Checkbox (119 tests)
- [x] Refactored all existing components to use UI library
- [x] Documentation: DESIGN_SYSTEM.md, STYLE_GUIDE.md
- [x] 94 UI library tests, 365 total tests passing

### 2.4 Checkout Flow ✅
- [x] Checkout page with shipping address form (all 50 US states)
- [x] Stripe embedded checkout integration
- [x] Webhook handling (checkout.session.completed)
- [x] Order creation with atomic transactions
- [x] Order confirmation and tracking
- [x] Services: stripe-service, order-service
- [x] Validation schemas (Zod)
- [x] 126 Phase 2.4 tests + 119 form tests = 245 new tests
- [x] 775/778 tests passing (99.6%)

### 2.4.5 Product-Level Inventory Tracking ✅
- [x] Schema: Products table with max_quantity, sold_quantity, available_quantity, is_available
- [x] Generated columns for auto-calculated availability
- [x] Dual-level inventory (product + variant sold quantities)
- [x] Order service: Increment both levels atomically
- [x] NULL max_quantity = unlimited inventory
- [x] Updated all test fixtures and mocks
- [x] 775/778 tests passing (99.6%)

### 2.4.6 Product Data Normalization & Multi-System Sync ✅
- [x] Structured logging (logger.ts, 15 tests)
- [x] Cloudinary + Stripe service integration (25 tests)
- [x] Schema migration (is_live, sell_status, media fields)
- [x] Enhanced sync script (Media → Stripe → DB)
- [x] Product display logic (badges, filtering, 25 tests)
- [x] 943/946 tests passing (99.7%)

**See:** `/docs/tasks/Phase 2.4.6 - Product Data Normalization.md`

### 2.4.7 Launch Injection (Homepage, Portfolio, Contact) ✅
- [x] Homepage with hero section and featured products
- [x] Portfolio page (showOnPortfolioPage field)
- [x] Contact page (info@imajin.ca)
- [x] UX polish (loading states, error boundaries, 404, mobile responsive)
- [x] SEO meta tags and policy pages

**See:** `/docs/tasks/Phase 2.4.7 - Launch Injection.md`

### 2.4.8 Fix TDD Violations from 2.4.7 ✅
- [x] Wrote tests retroactively for 2.4.7 code
- [x] Verified test coverage for all new components
- [x] All quality gates passing

**See:** `/docs/tasks/Phase 2.4.8 - Fix TDD Violations from 2.4.7.md`

### 2.4.9 Dynamic Founder Edition Variant Display ✅
- [x] Variant selection UI on product detail page
- [x] Stock tracking per variant (BLACK/WHITE/RED)
- [x] Dynamic pricing display

**See:** `/docs/tasks/Phase 2.4.9 - Dynamic Founder Edition Variant Display.md`

### 2.5 Products & Inventory Completion ✅
- [x] Product catalog feature-complete
- [x] Inventory tracking functional
- [x] Ready for checkout integration

**See:** `/docs/tasks/Phase 2.5 - Products & Inventory Completion.md`

### 2.5.1 Stripe Product/Price Architecture Refactor ✅
- [x] Refactored Stripe sync: 1 Product with multiple Prices (not multiple Products)
- [x] Variant metadata in Price objects
- [x] Clean Stripe dashboard structure
- [x] Proper industry-standard architecture

**See:** `/docs/tasks/Phase 2.5.1 - Stripe Product Price Architecture.md`

### 2.5.2 Pre-Sale vs Pre-Order Pricing Infrastructure ✅
- [x] Schema: presale_deposit_price, wholesale_price, cogs_price fields
- [x] Database migration
- [x] Pre-sale deposit checkout flow (Phase 2.5.2.1)
- [x] Deposit holder tracking (Phase 2.5.2.1)
- [x] Wholesale price display logic (Phase 2.5.2.1)

**Status:** ✅ Complete (including Phase 2.5.2.1)

**See:** `/docs/tasks/Phase 2.5.2 - Pre-Sale vs Pre-Order Schema.md` (full spec with business logic)

### 2.5.2.1 Pre-Sale Deposit Checkout Implementation ✅
- [x] Phase 1: Deposit checkout flow (DepositButton, API route, 14 tests)
- [x] Phase 2: Deposit holder tracking (lookup functions, API, 9 tests)
- [x] Phase 3: Wholesale price display (ProductPrice updates, 13 tests)
- [x] Phase 4: Deposit application at checkout (session adjustment, 12 tests)

**Status:** ✅ Complete | **Tests:** 48 passing

**See:** `/docs/tasks/Phase 2.5.2.1 - Pre-Sale Deposit Checkout Implementation.md`

### 2.5.3 Content Placeholder Cleanup ✅
- [x] Automated searches for placeholder patterns (TODO, FIXME, lorem ipsum)
- [x] Audit products.json for placeholder descriptions
- [x] Review all page content files (home, about, contact, products)
- [x] Verify product images have descriptive alt text
- [x] Check UI components for generic/placeholder text
- [x] **Result:** Zero placeholder content found - production ready

**Status:** Complete - No changes required, codebase already production-ready

**See:** `/docs/tasks/Phase 2.5.3 - Content Placeholder Cleanup.md`

### 2.5.4 Stripe Link Integration Testing (IN PROGRESS)
- [x] Code already updated: `payment_method_types: ['card', 'link']`
- [ ] Verify Link appears in Stripe Checkout
- [ ] Test first-time Link user signup flow
- [ ] Test returning Link user autofill
- [ ] Verify order creation with Link payments
- [ ] Test webhook processing
- [ ] Mobile device testing
- [ ] Error handling scenarios

**Status:** Testing in progress

**See:** `/docs/tasks/Phase 2.5.4 - Stripe Link Integration Testing.md`

### 2.5.5 Real-Time Inventory Management (DEFERRED)
- [ ] Inventory service and API endpoint (GET /api/inventory/:productId)
- [ ] Polling hook (useInventory with 10s intervals)
- [ ] Stock indicator components (StockIndicator, LowStockWarning, SoldOutBadge)
- [ ] Update ProductCard and ProductAddToCart with real-time availability
- [ ] 60+ tests

**Note:** Deferred - not blocking launch

**See:** `/docs/tasks/Phase 2.5.5 - Real-Time Inventory Management.md`

### 2.6 E2E & Smoke Tests
- [ ] E2E tests: checkout.spec.ts, product-browsing.spec.ts, shopping-cart.spec.ts
- [ ] Smoke test: phase2-ecommerce.spec.ts
- [ ] Validate no Phase 1 regressions
- [ ] Full Phase 2 coverage verification

**Gate Criteria (Phase 2 Complete):**
- [ ] 810+ tests passing
- [ ] E2E checkout flow works end-to-end
- [ ] All smoke tests pass
- [ ] TypeScript: 0 errors, Lint: 0 errors

---

## Phase 3: Content Pages ✅ COMPLETE

**Note:** Phase 3 content was implemented in Phase 2.4.7 "Launch Injection"

### 3.1 Homepage ✅
- [x] Hero section
- [x] Featured products
- [x] Portfolio preview (via featured products)
- [x] CTAs
- [x] SEO meta tags

### 3.2 About/Company ✅
- [x] Company story
- [x] Mission/values
- [x] Contact info
- [x] JSON-based content management

### 3.3 Portfolio/Installations ✅
- [x] Portfolio listing (grid/masonry)
- [x] Portfolio detail pages (via product pages with showOnPortfolioPage)
- [x] Cloudinary integration
- [x] JSON-based content management

### 3.4 Supporting Pages ✅
- [x] Contact page
- [x] FAQ
- [x] Shipping/returns policy
- [x] Warranty info (10-year Founder Edition)
- [x] Terms of service
- [x] Privacy policy

### 3.5 Phase 3 Testing ✅
**Tests:**
- [x] `tests/integration/api/portfolio/route.test.ts` (5 tests)
- [x] `tests/unit/components/portfolio/PortfolioCard.test.tsx` (11 tests)
- [x] `tests/unit/components/home/HeroSection.test.tsx` (8 tests)
- [x] `tests/unit/components/home/FeaturedProducts.test.tsx` (8 tests)
- [x] `tests/integration/stripe/checkout-session.test.ts` (passing)
- [x] `tests/integration/stripe/webhook.test.ts` (passing)
- [x] `tests/integration/checkout/deposit-flow.test.ts` (12 tests)

**Gate Criteria:**
- [x] Phase 1 & 2 tests pass (1,214 tests passing)
- [x] Stripe checkout session creates
- [x] Webhook processes payment
- [x] Order created in DB
- [x] Inventory decremented
- [x] Order confirmation displays
- [x] Portfolio pages render
- [x] All content pages accessible

**Status:** ✅ Complete - Implemented in Phase 2.4.7

---

## Phase 4: Polish & Optimization

### 4.1 Performance Optimization
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

### 4.4 Authentication & User Management

**Strategy:** Ory Kratos (self-hosted identity provider) with email/password, DID-ready schema with trust hub federation for future decentralization

**See:** `docs/AUTH_STRATEGY.md` and `docs/tasks/Phase 4.4 - Authentication.md`

**Architecture:** Local shadow pattern + federated trust hubs
- Users table shadows Ory Kratos identities (Ory manages passwords/sessions/MFA)
- Trust hubs enable federation (every device can be a hub)
- Collectives for marketplace/creator attribution
- Phase 5+: Wallet auth, federated hubs, full decentralization

#### 4.4.1 Database Schema (2 hours)
- [ ] Auth tables: users (shadow), trust_hubs, user_collectives, user_collective_memberships
- [ ] DID-ready fields (nullable: did, wallet_address, public_key)
- [ ] Hub federation fields (hosted_on_hub_id, origin_hub_id, is_cached)
- [ ] Add user_id to orders, nft_tokens
- [ ] Add created_by_collective_id to products, portfolio_items (NON-NULLABLE)
- [ ] Migration + indexes
- [ ] Seed script: local hub, Imajin collective, admin user

**Files:**
- `db/schema-auth.ts`
- `db/migrations/XXXX_add_auth_tables.sql`
- `scripts/seed-users.ts`

#### 4.4.2 Ory Kratos Setup (4 hours)
- [ ] Docker compose for Kratos + PostgreSQL
- [ ] Identity schema with email + wallet/DID fields
- [ ] SendGrid SMTP configuration (via Ory Courier)
- [ ] Webhook configuration (identity sync)
- [ ] Ory SDK integration (@ory/client)

**Files:**
- `docker/docker-compose.auth.yml`
- `config/kratos/kratos.yml`
- `config/kratos/identity.schema.json`
- `lib/auth/kratos.ts`

#### 4.4.3 Auth UI Components (2.5 hours)
- [ ] Reusable OryFlowForm component (dynamic form renderer)
- [ ] Sign in page (Ory login flow)
- [ ] Sign up page (Ory registration flow)
- [ ] Recovery page (password reset flow)
- [ ] Verification page (email verification flow)
- [ ] Settings page (MFA setup flow)
- [ ] MFA required page (admin enforcement)
- [ ] User navigation dropdown

**Files:**
- `app/auth/signin/page.tsx`
- `app/auth/signup/page.tsx`
- `app/auth/recovery/page.tsx`
- `app/auth/verification/page.tsx`
- `app/auth/settings/page.tsx`
- `components/auth/OryFlowForm.tsx`
- `components/auth/UserNav.tsx`

#### 4.4.4 Protected Routes & Middleware (3 hours)
- [ ] Middleware with Ory session validation
- [ ] Guard functions (requireAuth, requireAdmin, requireAdminWithMFA)
- [ ] Session helpers (getSession, getLocalUserId)
- [ ] Role-based access control
- [ ] MFA enforcement for admin routes (AAL2)

**Files:**
- `middleware.ts`
- `lib/auth/guards.ts`
- `lib/auth/session.ts`

#### 4.4.5 Integration with Existing Features (1.5 hours)
- [ ] Link orders to users (user_id field)
- [ ] Order history page (my orders)
- [ ] Account page (profile, settings)
- [ ] Pre-fill checkout with user info
- [ ] Backfill existing orders by email
- [ ] Backfill products/portfolio to Imajin collective

**Files:**
- `app/account/page.tsx`
- `app/account/orders/page.tsx`
- Update `app/api/checkout/session/route.ts`

#### 4.4.6 SendGrid Email Integration (2 hours)
- [ ] Ory Courier SMTP configuration (SendGrid)
- [ ] Email templates (verification, recovery) - Go template syntax
- [ ] Branded email styling
- [ ] SendGrid sender verification

**Files:**
- `config/kratos/email-templates/` (*.gotmpl files)
- Update `config/kratos/kratos.yml` (SMTP section)

#### 4.4.7 Testing (3 hours)
- [ ] Unit tests: session helpers, guards
- [ ] Integration tests: webhook sync, middleware
- [ ] E2E tests: Ory self-service flows (registration, login, recovery, settings)
- [ ] Test helpers: Ory identity creation
- [ ] MFA enforcement tests
- [ ] Test coverage >70%

**Files:**
- `tests/unit/lib/auth/session.test.ts`
- `tests/unit/lib/auth/guards.test.ts`
- `tests/integration/auth/webhook-sync.test.ts`
- `tests/integration/auth/middleware.test.ts`
- `tests/e2e/auth/registration-flow.spec.ts`
- `tests/e2e/auth/login-flow.spec.ts`
- `tests/e2e/auth/mfa-flow.spec.ts`

**Total Estimated:** 13 hours (vs 20-25 hours with DIY NextAuth)

**Why Ory Kratos:**
- Self-hosted, open-source (Apache 2.0)
- Built-in MFA (TOTP), email verification, password reset
- Security hardening (rate limiting, brute force protection)
- Saves 7-12 hours vs building from scratch
- No vendor lock-in

**Gate Criteria:**
- [ ] Ory Kratos running in Docker
- [ ] Users can sign up with email/password
- [ ] Users can sign in and sign out
- [ ] Users can reset forgotten passwords
- [ ] Email verification works (SendGrid via Ory)
- [ ] Users can enable optional MFA (TOTP)
- [ ] Admin accounts require MFA (enforced in middleware)
- [ ] Users can view order history
- [ ] Admin routes protected by role + MFA check
- [ ] Local users table synced via webhooks
- [ ] Trust hub + Imajin collective created
- [ ] All tests passing (unit, integration, E2E)

### 4.5 Admin Tools
- [ ] Admin interface:
  - [ ] View orders
  - [ ] Manage limited edition quantities
  - [ ] View inventory
  - [ ] Manage pre-sale deposits
  - [ ] User management
- [ ] Admin authentication (protected routes via 4.4.4)

### 4.6 Email Notifications (Orders)

**Status:** Not Started (Needs SendGrid Update)
**Estimated Duration:** 6-10 hours
**Dependencies:** Phase 4.4.6 (SendGrid integration)

**Scope:** Order-related transactional emails (separate from auth emails in 4.4.6)

- [ ] Order confirmation email template
- [ ] Deposit confirmation email template
- [ ] Pre-order ready notification template
- [ ] Refund confirmation email template
- [ ] Bulk email sending with rate limiting
- [ ] Email delivery tracking (optional)
- [ ] Integration with webhook handler
- [ ] Integration with admin notification API

**See:** `docs/tasks/Phase 4.6 - Email Notifications (Orders).md`

**Note:** Document originally used Resend but needs updating to use SendGrid (project standard).

### 4.7 Phase 4 Testing

**Tests:**
- [ ] `tests/integration/api/admin/orders.test.ts`
- [ ] `tests/unit/components/admin/OrdersList.test.tsx`
- [ ] `tests/e2e/admin-order-management.spec.ts`
- [ ] `tests/unit/lib/performance.test.ts`
- [ ] `tests/smoke/phase4-polish.spec.ts`

**Gate Criteria:**
- [ ] All previous tests pass
- [ ] User auth works (sign up, sign in, sign out)
- [ ] Email verification works (SendGrid)
- [ ] Password reset works
- [ ] Admin auth works (role-based access)
- [ ] Order management functional
- [ ] Users can view order history
- [ ] Order confirmation emails sent
- [ ] Lighthouse >90
- [ ] No accessibility errors
- [ ] Phase 4 smoke tests pass

**Run:** `npm run test:smoke && npm run test:e2e && npm run test:coverage`

---

## Phase 5: Future Enhancements

### 5.1 Wallet Authentication & DID Integration

**Status:** Future Enhancement (Post-Launch)
**Estimated Duration:** 4-6 days
**Dependencies:** Phase 4.4 complete (email/password auth with DID-ready schema)

**Scope:** Add Solana wallet authentication as primary login method, migrate to DID-first identity

- [ ] Solana wallet adapter integration (@solana/wallet-adapter-react)
- [ ] Wallet signature verification (nacl, bs58)
- [ ] DID generation and storage (did:sol:...)
- [ ] Link wallet to existing email accounts
- [ ] Wallet login API routes
- [ ] Wallet login UI components
- [ ] Protected routes support wallet auth
- [ ] Testing (unit, integration, E2E)

**See:** `docs/tasks/Phase 5.1 - Wallet Authentication & DID Integration.md`

**Note:** Database schema already supports this (nullable wallet fields from Phase 4.4.1). No breaking changes required.

### 5.2 Solana/Web3 (NFT & Payments)
- [ ] Solana Pay integration
- [ ] MJN token smart contract
- [ ] Crypto payment flow
- [ ] NFT minting service
- [ ] NFT → physical unit association
- [ ] Customer NFT delivery

### 5.3 Visual Configurator
- [ ] 3D/2D fixture model
- [ ] Interactive component selection
- [ ] Real-time visual updates
- [ ] Drag-and-drop
- [ ] Export/save configurations

### 5.4 Fixture Scoping Tool
- [ ] Input fixture dimensions
- [ ] Calculate voltage/power
- [ ] Generate wiring diagrams
- [ ] BOM generation
- [ ] Export specs as PDF

### 5.5 Additional Features
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

**Domain**: `www.imajin.ca` (custom domain in Vercel)

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
