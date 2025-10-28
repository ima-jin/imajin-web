# Claude Code Context - Imajin Web Platform

This file provides context for AI assistants (Claude Code, Cursor, etc.) working on this project.

---

## Project Status

**Current Phase:** Phase 2 - Core E-commerce Features (In Progress)
**Last Updated:** 2025-10-28
**Status:** Active development - Phase 2.4 complete, Phase 2.5 (Inventory) and 2.6 (E2E Testing) deferred

### Progress Tracking

For detailed phase completion status and task breakdowns, see:
- **[IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md)** - Single source of truth for phase completion

**Recent Milestones:**
- ✅ Phase 1: Foundation & Infrastructure (2025-10-24)
- ✅ Phase 2.1: Product Data Management (2025-10-25)
- ✅ Phase 2.2: Product Catalog Pages (2025-10-25)
- ✅ Phase 2.3: Shopping Cart (2025-10-26)
- ✅ Phase 2.3.5: Design System & Style Architecture (2025-10-26)
- ✅ Phase 2.4: Checkout Flow (2025-10-28) - 649 tests passing

**Next Up:**
- Phase 2.5: Inventory Management (limited edition tracking, real-time updates)
- Phase 2.6: E2E & Smoke Tests (comprehensive test suite for Phase 2)
- Phase 3: Content Pages (homepage, portfolio, about)

---

## Important Context

### Business Background

- **Company:** Imajin - LED fixture design, manufacturing, and installation
- **Product:** Modular LED fixture system (working prototype complete)
- **Goal:** Transform from portfolio site to e-commerce platform
- **Timeline:** 3-month runway for development
- **Founder:** Experienced dev lead (web dev since 90s, recently led 7 teams)

### Key Product Details

- Selling DIY kits, fully assembled units, and individual components
- **Founder Edition:** Limited run (1,000 units total) with 10-year warranty and MJN NFT tokens
  - BLACK: 500 units
  - WHITE: 300 units
  - RED: 200 units
- Component dependencies (voltage matching, compatibility warnings)
- Only showing products with dev_status = 5 (ready to sell)

### Technical Philosophy

- **AI-first development** - Framework agnostic, optimize for AI tooling
- **No subscriptions** - One-time purchases only (strong philosophical stance)
- **Self-hosted** - Full control, no vendor lock-in
- **Lean approach** - Build only what's needed, extend as required
- **Code-based content** - No GUI CMS tools, JSON configs in repo

---

## Tech Stack

### Core

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL (separate containers per environment)
- **ORM:** Drizzle
- **Containerization:** Docker

### Services

- **Payments:** Stripe (embedded checkout, webhooks) - **Products already configured**
- **Images:** Cloudinary (existing account)
- **CDN:** Cloudflare (to be configured during setup)
- **Hosting:** Self-hosted Linux server (hardware in progress)

### Future Integrations

- Solana Pay (MJN token checkout)
- NFT minting for Founder Edition units
- Visual configurator (Fusion 360 Python-style scripting)

---

## Repository Structure

### Multi-repo Organization

```
imajin-ai/                  # Root folder (NOT a git repo)
├── web/                    # This repo - E-commerce platform
└── token/                  # Future - Solana blockchain integration
```

### Monorepo Within web/

The `web/` folder is a **monorepo** containing:

- Frontend (React/Next.js)
- Backend (API routes)
- Database (schema/migrations)
- Config (JSON product definitions)
- Docker (deployment configs)

**Why monorepo for web:**

- Next.js App Router is inherently full-stack
- Shared types across client/server
- Atomic commits spanning frontend/backend/database
- Single deployment artifact

**Why NOT microservices:**

- Overkill for e-commerce site of this scale
- Unnecessary coordination complexity
- Type duplication across repos

---

## Environments

### Configuration Template

- **Default:** `default.json` - Version-controlled base config (no secrets, committed to git)

### Domain Structure (Environments)

- **Local:** `www-local.imajin.ai` - Development workstation (Windows)
- **Dev:** `www-dev.imajin.ai` - QA/Testing (TBD)
- **Live:** `www.imajin.ai` - Production (Linux server, planned)

### Database Containers

- `imajin-db-local` (port 5435) - Local development
- `imajin-db-dev` (port 5433) - Dev environment (TBD)
- `imajin-db-prod` (port 5432) - Production

### CI/CD Strategy

- **Status:** TBD - To be configured after server setup
- **Planned:** GitHub Actions for automated deployment
- Manual deployment initially

### Secrets Management

- **Current:** `.env` files in plaintext on servers (outside web root, 600 permissions)
- **Future TODO:** Migrate to secrets vault (HashiCorp Vault, Doppler, etc.)

---

## Database Design Philosophy

### What We Store

- Product metadata (dev status, dependencies, specs)
- Variant information (colors, limited edition quantities)
- Order records (fulfillment, NFT tracking)
- Portfolio content (installations, case studies)

### What Stripe Handles

- Product names/descriptions
- Pricing
- Payment processing
- Checkout sessions
- Invoices/receipts

### Key Tables

1. **products** - Core product info
2. **variants** - Color options with auto-calculated availability
3. **product_dependencies** - Compatibility rules (requires/suggests/incompatible/voltage_match)
4. **product_specs** - Technical specifications
5. **orders** - Order tracking with shipping info
6. **order_items** - Line items with snapshot data
7. **nft_tokens** - Founder Edition NFT tracking
8. **portfolio_items** - Installation work
9. **portfolio_images** - Gallery images

### Schema Principles

- **Lean:** Only store what's necessary
- **Snapshot pattern:** Preserve historical data (product names in orders)
- **Flexible:** JSONB metadata fields for future needs
- **Auto-calculated:** Use generated columns where possible
- **Stripe-integrated:** Store Stripe IDs, use webhooks for order creation

---

## Design Direction

### Visual Style

- **Content/Info pages:** Black backgrounds
- **Product/Ordering pages:** White backgrounds
- **Aesthetic:** Clean, modern, product-focused
- **Approach:** No designs yet - build iteratively, keep it simple

### Brand Assets

- New logo exists (not yet incorporated)
- Portfolio of installation work (not yet showcased)
- One case study ready to publish

---

## Development Workflow

### Current Session Rules

1. **Documentation first** - We are NOT rushing into code
2. **Get it perfect** - Foundation is paramount
3. **Ask questions** - Clarify before documenting
4. **Be thorough** - Cover all edge cases and future considerations

### When Development Starts

1. **Write tests first** - TDD approach (see TESTING_STRATEGY.md)
2. Use TodoWrite tool for multi-step tasks
3. Mark tasks completed immediately when done
4. Run test suite before committing (unit, integration, smoke tests)
5. Test manually in Docker environment
6. Commit only when all tests pass
7. Update implementation plan checkboxes

### Tools to Use

- **TodoWrite** - Track progress on complex tasks
- **Parallel tool calls** - Run independent operations simultaneously
- **Read before Write/Edit** - Always read files before modifying

---

## Key Decisions & Rationale

### Why Next.js App Router?

- Best documented for AI code generation
- Server components = simpler data fetching
- Built-in API routes (no separate backend needed)
- Vercel deployment option (though we're self-hosting)

### Why Drizzle over Prisma?

- Lighter weight
- More AI-friendly
- Less magic, more explicit SQL

### Why not using Turborepo/Nx?

- Overkill for single Next.js application
- Adds unnecessary complexity
- Not needed without multiple packages

### Why separate databases per environment?

- Complete isolation (no accidental prod data access)
- Can reset dev/local without affecting others
- Easier to manage backups and retention policies

### Why Cloudinary over custom image service?

- Already familiar with it
- Works great with Next.js
- Not worth building custom solution right now
- May reconsider later if needs change

---

## Product Specifics

### Variants Strategy

- **Current:** Only Founder Edition has color variants (BLACK/WHITE/RED)
- **Future:** Can add color variants to Material-8x8-V and spine connectors
- **Schema:** Built to support adding variants later without changes

### Limited Edition Tracking

- Quantities tracked in `variants` table
- Auto-calculated `available_quantity` and `is_available` columns
- Decrement on successful payment (webhook), not cart addition
- Display "X remaining" or "Sold Out" on product pages

### Voltage Systems

- **5v system:** Material-8x8-V + 5v connectors + Control-2-5v (max 8-10 panels)
- **24v system:** Material-8x8-V + 24v connectors + Control-8/16-24v (scalable to 64-80 panels)
- **Rule:** Cannot mix 5v and 24v components in same fixture
- **Implementation:** `product_dependencies` table with `voltage_match` type

### Kit Contents

- Both DIY and Founder kits include round diffusion caps
- Founder Edition includes Control-8-24v (arrives with 2 of 8 outputs used)
- Founder Edition is designed to be expanded later

### Warranty

- Warranty terms are stored as product properties in the database
- Different products/variants can have different warranty terms
- Schema supports warranty_years field and warranty-related metadata

---

## Open Questions (Track Here)

### Product Questions

- [ ] Exact contents of DIY kit (how many spine connectors, caps, etc.?)
- [ ] Return/refund policy for individual components
- [ ] Shipping cost calculation strategy
- [ ] International shipping support?

### Technical Questions

- [ ] Cloudflare configuration approach (first-time setup)
- [ ] Image storage: Cloudinary URLs in DB or separate table?
- [ ] Session management for cart (localStorage + server sync?)
- [ ] Error tracking service? (Sentry, LogRocket, custom?)

### Business Questions

- [ ] Tax calculation (Stripe Tax or manual?)
- [ ] Email service for confirmations (SendGrid, Resend, other?)
- [ ] Customer support system (email, ticket system, chat?)
- [ ] Analytics platform (GA4, Plausible, custom?)

---

## Communication Guidelines

### When Working with This Project

**DO:**

- Ask clarifying questions before making assumptions
- Document decisions and rationale
- Keep solutions lean and practical
- Consider future extensibility without over-engineering
- Use the existing docs as source of truth
- Update this file when context changes

**DON'T:**

- Rush into code without understanding requirements
- Over-engineer solutions
- Create documentation files proactively (only when explicitly requested)
- Use emojis unless explicitly requested
- Add unnecessary abstractions or patterns
- Create subscription-based features (philosophical no-go)

### Tone & Style

- Concise and direct
- Technical accuracy over validation
- Professional objectivity
- No unnecessary superlatives or praise
- Focus on facts and problem-solving

---

## File References

### Core Documentation

- [PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md) - Business context, architecture, philosophy
- [IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) - Detailed roadmap with checkboxes
- [TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md) - Comprehensive testing approach and patterns
- [ENVIRONMENTS.md](./docs/ENVIRONMENTS.md) - Environment config and deployment strategy
- [PRODUCT_CATALOG.md](./docs/PRODUCT_CATALOG.md) - Complete product lineup with specs
- [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) - Database design and rationale
- [API_ROUTES.md](./docs/API_ROUTES.md) - API endpoints with request/response examples
- [COMPONENT_ARCHITECTURE.md](./docs/COMPONENT_ARCHITECTURE.md) - React component structure and patterns
- [JSON_CONFIG_STRUCTURE.md](./docs/JSON_CONFIG_STRUCTURE.md) - Product/portfolio config format

### Repository Files

- [../README.md](../README.md) - Multi-repo structure explanation
- [README.md](./README.md) - Web platform monorepo overview

---

## Future Repositories

As platform grows, may add:

- `admin/` - Administrative dashboard
- `portal/` - Customer account portal
- `configurator/` - Visual fixture builder (Fusion 360 Python-style)
- `mobile/` - React Native / Flutter apps
- `integrations/` - Third-party platform integrations
- `design-system/` - Shared component library

### Guidelines for New Repos

Create new repo when:

- Distinct deployment lifecycle
- Different technology stack
- Potential for reuse across apps
- Large enough for independent versioning

Keep in existing repo when:

- Tightly coupled to main app
- Shares core business logic
- Requires frequent coordinated changes
- Small feature/module

---

## Configurator Vision (Future)

Inspired by Fusion 360 Python scripting:

- Script-driven fixture generation
- Real-time electrical requirement calculations
- Component compatibility validation
- Generate cut lists, wiring diagrams, assembly instructions
- Integration with manufacturing/ordering

**Implementation TBD:**

- Web-based (Three.js/Babylon.js)?
- Desktop application?
- Hybrid (server computation + browser visualization)?
- Language: Python backend? TypeScript? Lua?

---

## NFT/Blockchain Integration (Future)

### MJN Token

- Solana-based token (MJN coin)
- Founder Edition units include NFT (RWA token)
- Token hash printed on physical unit
- 10-year warranty tied to NFT

### Workflow

1. Order placed → `nft_tokens` record created with `token_hash`
2. Unit manufactured → `serial_number` added, hash printed on unit
3. Unit shipped → NFT minted on Solana
4. Customer receives physical unit + NFT in wallet (future feature)

### Future Checkout Options

- Solana Pay integration
- Solflare wallet (+ others later)
- Pay with MJN tokens

---

## Notes for Future AI Sessions

### During Active Development (Current)

- Review all docs in `/docs` folder first
- Use TodoWrite for complex tasks
- Follow implementation plan phases (see IMPLEMENTATION_PLAN.md)
- Test in Docker environment
- Commit frequently with clear messages
- Update IMPLEMENTATION_PLAN.md checkboxes as tasks complete
- Run full test suite before phase sign-off
- Invoke Dr. Clean for QA validation at end of each phase

### If Debugging/Maintenance Phase

- Check DATABASE_SCHEMA.md for table structures
- Check PRODUCT_CATALOG.md for business rules
- Check ENVIRONMENTS.md for config
- Maintain the same coding style and patterns

---

**This file should be updated as context evolves. Keep it current!**

Last Updated: 2025-10-27
