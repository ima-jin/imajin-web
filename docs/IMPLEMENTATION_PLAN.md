# Imajin Web Platform - Implementation Plan

## Phase 1: Foundation & Infrastructure Setup

### 1.1 Docker Environment
- [x] Create Docker compose files for each environment:
  - `docker/docker-compose.local.yml` (local development)
  - `docker/docker-compose.dev.yml` (QA/testing)
  - `docker/docker-compose.prod.yml` (production)
- [ ] Configure services with proper naming:
  - Next.js app
  - PostgreSQL database (`imajin-db-local`, `imajin-db-dev`, `imajin-db-prod`)
  - Redis (optional - for sessions/caching)
  - pgAdmin (optional - for local DB management GUI)
- [ ] Create environment-specific Dockerfiles:
  - `docker/Dockerfile.dev`
  - `docker/Dockerfile.prod`
- [ ] Create `.dockerignore` file
- [ ] Configure environment variables template (`.env.example`)
- [ ] Test Docker composition startup for local environment

### 1.2 Next.js Project Initialization
- [x] Initialize Next.js 14+ with App Router
- [x] Configure TypeScript (`tsconfig.json`)
- [x] Install and configure Tailwind CSS
- [x] Set up project folder structure:
  ```
  /app                  # Next.js App Router pages
  /components           # React components
  /lib                  # Utilities, helpers
  /db                   # Database schema, migrations
  /config               # JSON config files (products, etc.)
  /public               # Static assets
  /types                # TypeScript definitions
  ```
- [x] Create basic layout components (header, footer)
- [ ] Configure Cloudflare integration (headers, caching)

### 1.3 Database Setup
- [x] Install Drizzle ORM and dependencies
- [x] Create database schema file (`/db/schema.ts`)
- [x] Define initial tables:
  - `products`
  - `variants`
  - `product_dependencies`
  - `product_specs`
  - `orders`
  - `order_items`
  - `nft_tokens`
  - `portfolio_items`
  - `portfolio_images`
- [x] Set up Drizzle migrations
- [x] Create seed data script (sample products for testing)
- [x] Test database connection from Next.js app

### 1.4 Development Tooling
- [ ] Configure ESLint and Prettier
- [ ] Set up Git repository and `.gitignore`
- [ ] Create development scripts in `package.json`:
  - `dev` - Start development server
  - `build` - Production build
  - `db:push` - Push schema changes
  - `db:seed` - Seed database
  - `db:studio` - Open Drizzle Studio
  - `docker:dev` - Start Docker dev environment
  - `docker:down` - Stop Docker containers

### 1.5 Testing Setup
- [ ] Install testing dependencies:
  - Vitest + React Testing Library
  - Playwright
  - MSW (Mock Service Worker)
  - @faker-js/faker
- [ ] Create test directory structure (`/tests/unit`, `/tests/integration`, `/tests/e2e`, `/tests/smoke`)
- [ ] Configure Vitest (`vitest.config.ts`)
- [ ] Configure Playwright (`playwright.config.ts`)
- [ ] Create test setup files and helpers
- [ ] Add test scripts to `package.json`:
  - `test` - Run unit + integration tests
  - `test:unit` - Unit tests only
  - `test:integration` - Integration tests only
  - `test:e2e` - E2E tests with Playwright
  - `test:smoke` - Smoke test suite
  - `test:coverage` - Generate coverage report

### 1.6 CI/CD Setup (TBD - Future)
- [ ] Create GitHub Actions workflows when servers are ready
- [ ] Configure automated testing in CI
- [ ] Set up deployment automation

### 1.7 Phase 1 Testing Requirements
**Write These Tests:**
- [ ] `tests/integration/db/connection.test.ts` - Database connection
- [ ] `tests/integration/api/health.test.ts` - Health check endpoint
- [ ] `tests/smoke/phase1-foundation.spec.ts` - Foundation smoke tests

**Phase 1 Gate Criteria (Must Pass):**
- [ ] ✅ Database connection test passes
- [ ] ✅ Docker containers start successfully
- [ ] ✅ Health check endpoint returns 200
- [ ] ✅ Environment variables load correctly
- [ ] ✅ Can seed database with sample data
- [ ] ✅ All Phase 1 smoke tests pass

**Run before proceeding to Phase 2:**
```bash
npm run test:smoke -- phase1
```

---

## Phase 2: E-commerce Core

### 2.1 Product Data Management
- [ ] Create JSON config file structure for products (`/config/products.json`)
- [ ] Define product data model (align with Stripe Product IDs)
- [ ] Create script to sync JSON → Database
- [ ] Build product management utilities (CRUD operations)

### 2.2 Product Catalog Pages
- [ ] Homepage with featured products
- [ ] Product listing page (all products)
- [ ] Product detail page (individual product)
  - [ ] Variant selector (colors)
  - [ ] Quantity input
  - [ ] Add to cart button
  - [ ] Product specifications/details
- [ ] Limited Edition badge/indicator
- [ ] Dependency warnings UI (for components)

### 2.3 Shopping Cart
- [ ] Cart state management (React Context or Zustand)
- [ ] Cart storage (localStorage + server sync)
- [ ] Add/remove/update cart items
- [ ] Cart UI component (slide-out or dedicated page)
- [ ] Cart validation (check quantities, dependencies)
- [ ] Cart total calculation

### 2.4 Checkout Flow
- [ ] Checkout page/form
- [ ] Customer information collection
- [ ] Shipping address form
- [ ] Order review/confirmation screen
- [ ] Stripe embedded checkout integration:
  - [ ] Create Stripe Checkout Session API route
  - [ ] Handle product variants in Stripe
  - [ ] Embed Stripe checkout component
- [ ] Stripe webhook handler:
  - [ ] `checkout.session.completed`
  - [ ] Create order record in database
  - [ ] Decrement limited edition quantities
  - [ ] Send confirmation email (future)
- [ ] Order confirmation page
- [ ] Order tracking lookup (by email or order ID)

### 2.5 Inventory Management
- [ ] Limited edition quantity tracking
- [ ] Real-time quantity updates
- [ ] "Sold out" UI states
- [ ] Low stock warnings

### 2.6 Phase 2 Testing Requirements
**Write These Tests:**
- [ ] `tests/integration/api/products.test.ts` - Products API endpoint
- [ ] `tests/unit/lib/cart-calculations.test.ts` - Cart math logic
- [ ] `tests/unit/lib/validation.test.ts` - Product dependency validation
- [ ] `tests/unit/components/ProductCard.test.tsx` - Product card component
- [ ] `tests/unit/components/CartItem.test.tsx` - Cart item component
- [ ] `tests/unit/components/VariantSelector.test.tsx` - Variant selector
- [ ] `tests/integration/db/products-repository.test.ts` - Product data access
- [ ] `tests/smoke/phase2-ecommerce.spec.ts` - E-commerce smoke tests

**Phase 2 Gate Criteria (Must Pass):**
- [ ] ✅ Phase 1 smoke tests still pass (no regressions)
- [ ] ✅ Products API returns expected data
- [ ] ✅ Product listing page renders products correctly
- [ ] ✅ Product detail page loads with all information
- [ ] ✅ Cart add/remove/update operations work
- [ ] ✅ Cart persists correctly in localStorage
- [ ] ✅ Variant selector updates price and availability
- [ ] ✅ Dependency validation catches incompatible items
- [ ] ✅ All Phase 2 smoke tests pass

**Run before proceeding to Phase 3:**
```bash
npm run test:smoke -- phase1 phase2
```

---

## Phase 3: Content Pages

### 3.1 Homepage
- [ ] Hero section with brand messaging
- [ ] Featured products showcase
- [ ] Installation portfolio preview (3-4 featured projects)
- [ ] Call-to-action sections
- [ ] Newsletter signup (optional)

### 3.2 About/Company Info
- [ ] Company story page
- [ ] Team information
- [ ] Mission/values
- [ ] Contact information

### 3.3 Portfolio/Installations
- [ ] Portfolio listing page (grid/masonry layout)
- [ ] Portfolio detail pages (individual installations)
- [ ] Cloudinary integration for image galleries
- [ ] JSON-based content management for portfolio items
- [ ] Case study page template
- [ ] First case study implementation

### 3.4 Supporting Pages
- [ ] Contact page (form or email link)
- [ ] FAQ page
- [ ] Shipping/Returns policy
- [ ] Warranty information (10-year Special Edition warranty)
- [ ] Terms of service
- [ ] Privacy policy

### 3.5 Phase 3 Testing Requirements
**Write These Tests:**
- [ ] `tests/integration/api/portfolio.test.ts` - Portfolio API endpoint
- [ ] `tests/unit/components/PortfolioCard.test.tsx` - Portfolio card
- [ ] `tests/e2e/checkout.spec.ts` - Complete checkout flow E2E
- [ ] `tests/integration/stripe/checkout-session.test.ts` - Stripe session creation
- [ ] `tests/integration/stripe/webhook.test.ts` - Webhook handling
- [ ] `tests/integration/db/orders-repository.test.ts` - Order data access
- [ ] `tests/smoke/phase3-checkout.spec.ts` - Checkout smoke tests

**Phase 3 Gate Criteria (Must Pass):**
- [ ] ✅ Phase 1 & 2 smoke tests still pass
- [ ] ✅ Stripe checkout session creates successfully
- [ ] ✅ Webhook handler processes payment correctly
- [ ] ✅ Order record created in database
- [ ] ✅ Inventory decremented for limited edition items
- [ ] ✅ E2E checkout flow completes (test mode)
- [ ] ✅ Order confirmation page displays correctly
- [ ] ✅ Portfolio pages render without errors
- [ ] ✅ All Phase 3 smoke tests pass

**Run before proceeding to Phase 4:**
```bash
npm run test:smoke -- phase1 phase2 phase3
npm run test:e2e
```

---

## Phase 4: Polish & Optimization

### 4.1 Performance
- [ ] Image optimization (Next.js Image component + Cloudinary)
- [ ] Code splitting and lazy loading
- [ ] Cloudflare caching configuration
- [ ] Database query optimization
- [ ] Lighthouse audit and fixes

### 4.2 SEO
- [ ] Meta tags for all pages
- [ ] OpenGraph images
- [ ] Sitemap generation
- [ ] robots.txt configuration
- [ ] Structured data markup (products, organization)

### 4.3 UX Enhancements
- [ ] Loading states and skeletons
- [ ] Error boundaries and user-friendly error pages
- [ ] 404 page
- [ ] Accessibility audit (WCAG compliance)
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing

### 4.4 Admin Tools
- [ ] Simple admin interface for:
  - [ ] Viewing orders
  - [ ] Managing limited edition quantities
  - [ ] Viewing inventory levels
- [ ] Basic authentication for admin routes

### 4.5 Phase 4 Testing Requirements
**Write These Tests:**
- [ ] `tests/integration/api/admin/orders.test.ts` - Admin orders API
- [ ] `tests/unit/components/admin/OrdersList.test.tsx` - Orders list component
- [ ] `tests/e2e/admin-order-management.spec.ts` - Admin workflow E2E
- [ ] `tests/unit/lib/performance.test.ts` - Performance utilities
- [ ] `tests/smoke/phase4-polish.spec.ts` - Polish smoke tests

**Phase 4 Gate Criteria (Must Pass):**
- [ ] ✅ All previous phase smoke tests still pass
- [ ] ✅ Admin authentication works
- [ ] ✅ Order management CRUD operations functional
- [ ] ✅ NFT tracking works (if implemented)
- [ ] ✅ Lighthouse score >90 for performance
- [ ] ✅ No accessibility errors
- [ ] ✅ All Phase 4 smoke tests pass

**Run before launch:**
```bash
npm run test:smoke
npm run test:e2e
npm run test:coverage
```

---

## Phase 5: Future Enhancements (Post-Launch)

### 5.1 Solana/Web3 Integration
- [ ] Research Solana Pay integration
- [ ] Set up MJN token smart contract
- [ ] Solflare wallet connection
- [ ] Alternative checkout flow (crypto payment)
- [ ] NFT minting service for assembled fixtures
- [ ] NFT token ID → physical unit association
- [ ] Customer NFT delivery system

### 5.2 Visual Configurator
- [ ] 3D model or 2D representation of fixture
- [ ] Interactive component selection
- [ ] Real-time visual updates
- [ ] Drag-and-drop configuration
- [ ] Export/save configurations

### 5.3 Fixture Scoping Tool
- [ ] Input fixture dimensions/configuration
- [ ] Calculate voltage requirements
- [ ] Calculate power consumption
- [ ] Generate wiring diagrams (optional)
- [ ] BOM (Bill of Materials) generation
- [ ] Export specifications as PDF

### 5.4 Additional Features
- [ ] Customer accounts (order history, saved configurations)
- [ ] Bulk ordering for commercial clients
- [ ] Quote request system for custom installations
- [ ] Email marketing integration
- [ ] Analytics and conversion tracking
- [ ] A/B testing framework

---

## Development Workflow

### Testing-First Approach

**For Each Feature:**
1. **Write Failing Test** - Start with a test that defines expected behavior
2. **Implement Feature** - Write code to make the test pass
3. **Verify Tests Pass** - Run unit/integration tests
4. **Manual Testing** - Verify in browser/Docker environment
5. **Run Smoke Suite** - Ensure no regressions in previous phases
6. **Commit** - Only commit when all tests pass

### Daily Process
1. Pick next task from plan
2. Create todo list for multi-step tasks (TodoWrite tool)
3. **Write test(s) first** for the feature
4. Implement feature until tests pass
5. Run relevant test suites:
   ```bash
   npm test                    # Unit + integration tests
   npm run test:smoke          # Smoke tests for all phases
   ```
6. Test manually in Docker environment
7. Commit with clear message (include which tests were added)
8. Update this plan (mark completed checkboxes)

### Test Command Reference
```bash
# During development (fast feedback)
npm run test:watch              # Watch mode for unit tests

# Before committing
npm test                        # All unit + integration tests
npm run test:smoke              # Smoke test suite

# Before moving to next phase (Phase Gate)
npm run test:smoke -- phase1    # Validate Phase 1
npm run test:smoke -- phase1 phase2  # Validate Phase 1 & 2
npm run test:e2e                # E2E tests (slower)

# Before deploying
npm run test:coverage           # Check test coverage
npm run test:smoke              # All smoke tests
npm run test:e2e                # All E2E tests
```

### Testing Strategy
- **Unit tests** for all business logic and utilities
- **Integration tests** for API routes and database operations
- **Component tests** for complex UI components
- **E2E tests** for critical user flows (checkout, admin)
- **Smoke tests** run before each phase transition
- Test Stripe integration with test mode keys
- Validate webhooks with Stripe CLI
- **See TESTING_STRATEGY.md** for detailed patterns and examples

### Deployment Strategy
- Self-hosted on Linux server
- Docker Compose for each environment (local, dev, prod)
- Separate database containers per environment
- GitHub Actions for automated deployment:
  - `develop` branch → `www-dev.imajin.ai`
  - `main` branch → `www.imajin.ai` (manual approval)
- Nginx reverse proxy (optional, for additional routing/load balancing)
- Cloudflare DNS + CDN
- SSL/TLS certificates via Cloudflare (auto-managed)
- PostgreSQL backups to Synology NAS
- Environment variables stored in plaintext on servers (600 permissions)
  - Future: Migrate to secrets vault

---

## Dependencies & Tools

### Core Dependencies
```json
{
  "next": "^14.x",
  "react": "^18.x",
  "typescript": "^5.x",
  "tailwindcss": "^3.x",
  "drizzle-orm": "latest",
  "postgres": "latest",
  "stripe": "latest",
  "zustand": "latest (optional for state)",
  "zod": "latest (validation)"
}
```

### Dev Dependencies
```json
{
  "eslint": "latest",
  "prettier": "latest",
  "drizzle-kit": "latest"
}
```

### Docker Services
- `node:20-alpine` (Next.js)
- `postgres:16-alpine` (Database)
- `redis:alpine` (Optional - caching)

---

## Environment Variables Needed

### Local Environment (.env.local)
```env
# Environment
NODE_ENV=development
NEXT_PUBLIC_ENV=local
NEXT_PUBLIC_SITE_URL=https://www-local.imajin.ai

# Database
DATABASE_URL=postgresql://imajin:imajin_dev@imajin-db-local:5435/imajin_local
DB_HOST=imajin-db-local
DB_PORT=5435
DB_NAME=imajin_local
DB_USER=imajin
DB_PASSWORD=imajin_dev

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=imajin-dev
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Cloudflare (disabled locally)
CF_ENABLED=false

# Debug
LOG_LEVEL=debug
ENABLE_QUERY_LOGGING=true

# Admin
ADMIN_PASSWORD=local_admin_pass
```

### Dev Environment (.env.dev)
```env
# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=dev
NEXT_PUBLIC_SITE_URL=https://www-dev.imajin.ai

# Database
DATABASE_URL=postgresql://imajin:SECURE_PASSWORD@imajin-db-dev:5433/imajin_dev

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=imajin-staging

# Cloudflare
CF_ENABLED=true
CF_ZONE_ID=...
CF_API_TOKEN=...
```

### Production Environment (.env.production)
```env
# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=live
NEXT_PUBLIC_SITE_URL=https://www.imajin.ai

# Database
DATABASE_URL=postgresql://imajin:VERY_SECURE_PASSWORD@imajin-db-prod:5432/imajin_production

# Stripe (LIVE MODE)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Cloudinary (Production)
CLOUDINARY_CLOUD_NAME=imajin

# Cloudflare
CF_ENABLED=true

# Security
SESSION_SECRET=CRYPTOGRAPHICALLY_SECURE_RANDOM_STRING
```

See [ENVIRONMENTS.md](./ENVIRONMENTS.md) for complete configuration details.

---

## Success Criteria

### Phase 1 Complete When:
- Docker environment runs successfully (local)
- Next.js app loads at `https://www-local.imajin.ai`
- Database connection established to `imajin-db-local`
- Can create/read sample data
- Drizzle migrations working
- Seed script populates test data

### Phase 2 Complete When:
- Products display on catalog page
- Cart adds/removes items correctly
- Checkout creates Stripe session
- Webhook records order in database
- Limited edition quantities decrement

### Phase 3 Complete When:
- All main pages exist and are navigable
- Portfolio items display from JSON config
- Case study page is live
- Site is fully responsive

### MVP Launch Criteria:
- All Phase 1-3 tasks complete
- Stripe test mode working end-to-end
- All critical pages functional
- Mobile responsive
- No console errors
- Basic SEO implemented

---

**Document Created**: 2025-10-22
**Last Updated**: 2025-10-22
