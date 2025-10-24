# Implementation Plan

## Phase 1: Foundation & Infrastructure ✅ COMPLETE

**Completed:** 2025-10-24

### 1.1 Docker Environment ✅
- [x] `docker/docker-compose.local.yml` (PostgreSQL on port 5435)
- [x] `.env.local.example` template
- [x] Test Docker startup (container running 12+ hours, healthy)
- [ ] `docker-compose.dev.yml`, `docker-compose.prod.yml` - **DEFERRED to Phase 4**
- [ ] Dockerfiles for Next.js, `.dockerignore` - **DEFERRED to Phase 4**

### 1.2 Next.js Initialization ✅
- [x] Next.js 16 with App Router, TypeScript, Tailwind CSS v4
- [x] Project structure (`/app`, `/components`, `/lib`, `/db`, `/config`, `/types`)
- [x] Basic layout components (header, footer)
- [ ] Cloudflare integration - **DEFERRED to Phase 4**

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
- [ ] GitHub Actions - **DEFERRED (servers not ready)**

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
- [x] Seed script (`npm run seed:db`)
- [x] Product CRUD utilities

**Phase 2.2 Improvements:**
- [ ] Rename `sync:products` → `seed:db`
- [ ] Configure separate test database (`imajin_test`)
- [ ] Update tests to use `DATABASE_URL_TEST`
- [ ] Add type mapper/validator layer (Dr. Clean rec)

### 2.2 Product Catalog Pages
**Pre-work:**
- [ ] Create `.env.test` with test database URL
- [ ] Update test config for test database
- [ ] Add `test:db:reset` script
- [ ] Document test DB setup in TESTING_STRATEGY.md

**Type Safety Layer:**
- [ ] Create `lib/mappers/product-mapper.ts`
- [ ] Add Zod validation for all DB queries
- [ ] Handle JSON fields with parsing/validation
- [ ] Create mapper tests

**Pages:**
- [ ] Homepage with featured products
- [ ] Product listing page
- [ ] Product detail page (variants, qty, add to cart, specs)
- [ ] Limited Edition badges
- [ ] Dependency warnings UI

### 2.3 Shopping Cart
- [ ] Cart state (Context or Zustand)
- [ ] Cart storage (localStorage + server sync)
- [ ] Add/remove/update operations
- [ ] Cart UI (slide-out or page)
- [ ] Cart validation
- [ ] Total calculation

### 2.4 Checkout Flow
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

### 2.6 Phase 2 Testing
**Tests:**
- [ ] `tests/integration/api/products.test.ts`
- [ ] `tests/unit/lib/cart-calculations.test.ts`
- [ ] `tests/unit/lib/validation.test.ts`
- [ ] `tests/unit/components/ProductCard.test.tsx`
- [ ] `tests/unit/components/CartItem.test.tsx`
- [ ] `tests/unit/components/VariantSelector.test.tsx`
- [ ] `tests/integration/db/products-repository.test.ts`
- [ ] `tests/smoke/phase2-ecommerce.spec.ts`

**Gate Criteria:**
- [ ] Phase 1 tests still pass
- [ ] Products API returns expected data
- [ ] Product pages render correctly
- [ ] Cart operations work
- [ ] Cart persists in localStorage
- [ ] Variant selector updates correctly
- [ ] Dependency validation works
- [ ] Phase 2 smoke tests pass

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

### 4.1 Performance
- [ ] Image optimization (Next.js Image + Cloudinary)
- [ ] Code splitting, lazy loading
- [ ] Cloudflare caching
- [ ] DB query optimization
- [ ] Lighthouse audit

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
- Self-hosted Linux server
- Docker Compose per environment
- Separate DB containers
- GitHub Actions:
  - `develop` → `www-dev.imajin.ai`
  - `main` → `www.imajin.ai` (manual approval)
- Cloudflare DNS + CDN
- SSL via Cloudflare (auto-managed)
- PostgreSQL backups to Synology NAS
- Env vars in plaintext (600 permissions) → migrate to vault later

---

## Environment Variables

### Local (`.env.local`)
```env
NODE_ENV=development
NEXT_PUBLIC_ENV=local
NEXT_PUBLIC_SITE_URL=https://www-local.imajin.ai
DATABASE_URL=postgresql://imajin:imajin_dev@imajin-db-local:5435/imajin_local
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
CLOUDINARY_CLOUD_NAME=imajin-dev
LOG_LEVEL=debug
```

### Dev (`.env.dev`)
```env
NODE_ENV=production
NEXT_PUBLIC_ENV=dev
NEXT_PUBLIC_SITE_URL=https://www-dev.imajin.ai
DATABASE_URL=postgresql://imajin:SECURE_PASSWORD@imajin-db-dev:5433/imajin_dev
CF_ENABLED=true
```

### Production (`.env.production`)
```env
NODE_ENV=production
NEXT_PUBLIC_ENV=live
NEXT_PUBLIC_SITE_URL=https://www.imajin.ai
DATABASE_URL=postgresql://imajin:VERY_SECURE_PASSWORD@imajin-db-prod:5432/imajin_production
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
CF_ENABLED=true
SESSION_SECRET=CRYPTOGRAPHICALLY_SECURE_RANDOM_STRING
```

See [ENVIRONMENTS.md](./ENVIRONMENTS.md) for complete configuration.

---

## Success Criteria

**Phase 1**: Docker running, DB connected, health endpoint working, tests passing ✅
**Phase 2**: Products display, cart works, checkout creates Stripe session, webhooks record orders
**Phase 3**: All pages navigable, portfolio displays, responsive design
**MVP Launch**: Phases 1-3 complete, Stripe test mode end-to-end, mobile responsive, no console errors

---

**Last Updated:** 2025-10-24
