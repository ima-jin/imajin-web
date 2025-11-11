# Claude Code Context - Imajin Web Platform

This file provides context for AI assistants (Claude Code, Cursor, etc.) working on this project.

---

## Project Status

**Current Phase:** Phase 4 - Polish & Optimization
**Last Updated:** 2025-11-11
**Status:** Phase 1-3 complete | 1,214/1,214 tests passing (100%) ✅

### Progress Tracking

For detailed phase completion status and task breakdowns, see:
- **[IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md)** - Single source of truth for phase completion

**Recent Milestones:**
- ✅ Phase 1: Foundation & Infrastructure (2025-10-24)
- ✅ Phase 2: Core E-commerce Features (2025-10-28)
  - ✅ Phase 2.1-2.4: Products, Cart, Checkout, Design System
  - ✅ Phase 2.4.5-2.4.9: Inventory, Normalization, Launch Injection, Variants
  - ✅ Phase 2.5.1: Stripe Product/Price Architecture
  - ✅ Phase 2.5.2: Pre-Sale Pricing Infrastructure
  - ✅ Phase 2.5.2.1: Deposit Checkout Implementation (48 tests)
  - ✅ Phase 2.5.3: Content Placeholder Cleanup
- ✅ Phase 3: Content Pages (2025-10-28)
  - Implemented in Phase 2.4.7 "Launch Injection"
  - Homepage, Portfolio, About, Contact, Policy Pages (32 tests)

**Next Up:**
- Phase 2.5.4: Stripe Link Integration Testing (manual testing in progress)
- Phase 2.6: E2E & Smoke Tests (comprehensive test suite)
- Phase 4: Polish & Optimization (performance, SEO, UX)

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
- **Founder Edition:** Limited run (1,000 units total) with 10-year warranty and Solana NFT tokens
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

- **Local:** `localhost:30000` - Development workstation (Windows)
- **Dev:** `www-dev.imajin.ca` - QA/Testing (TBD)
- **Live:** `www.imajin.ca` - Production (Linux server, planned)

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

---

## Code Style Rules (Pre-Launch Phase)

**CRITICAL:** We are NOT launched yet. This fundamentally changes how you write code.

### Never Include in Code:

1. ❌ **Phase markers or implementation dates**
   ```typescript
   // ❌ WRONG - Will be blocked by Dr. Clean
   stripePriceId: string; // Phase 2.5.1: New architecture
   // Added in October 2025
   // v1.0: Refactor this

   // ✅ RIGHT - Clean, timeless
   stripePriceId: string; // Stripe Price ID for checkout session
   ```

2. ❌ **Deprecation notices or migration markers**
   ```typescript
   // ❌ WRONG
   stripeProductId?: string; // DEPRECATED: Use stripePriceId instead
   // TODO: Remove after migration
   // Will be removed in v2.0

   // ✅ RIGHT
   stripePriceId: string; // Stripe Price ID for checkout session
   ```

3. ❌ **Backward compatibility code**
   ```typescript
   // ❌ WRONG - We have no users yet, no need for compatibility
   interface CartItem {
     stripeProductId?: string; // Legacy field
     stripePriceId: string;    // New field
   }

   // ✅ RIGHT - Just the correct design
   interface CartItem {
     stripePriceId: string; // Stripe Price ID for checkout session
   }
   ```

4. ❌ **console.log/error/warn in production code**
   ```typescript
   // ❌ WRONG (in app/, components/, lib/ folders)
   console.log('Debug:', data);
   console.error('Error:', error);

   // ✅ RIGHT - Use logger utility
   import { logger } from '@/lib/utils/logger';
   logger.debug('Processing data', { data });
   logger.error('Operation failed', { error });

   // ✅ ALLOWED (in tests/ and scripts/ folders)
   console.log('✅ Test passed:', result);
   ```

### Always Write:

1. ✅ **Clean, timeless code** - Looks like it was always correct
2. ✅ **Comments that explain "why"** - Not "when" or "what"
3. ✅ **Concise technical descriptions** - No timeline context
4. ✅ **Logger utility** - Not console.log in production code

### Why These Rules Exist:

**Pre-launch = Clean Slate**
- No real users → Can break things freely
- No existing data → Can change schemas without migrations
- No backward compatibility → Code should be perfect from day one
- Code should appear as if it was designed correctly from the start

**After launch (future state):**
- Then we'll need deprecation notices
- Then we'll need migration paths
- Then we'll need backward compatibility
- Then phase markers might make sense

**Right now:** Write code that looks timeless and perfect.

### Before Writing ANY Code:

Quick checklist to avoid Dr. Clean blocking your commit:
- [ ] No phase markers (Phase 2.5.1, etc.)
- [ ] No DEPRECATED comments
- [ ] No backward compatibility fields
- [ ] No console.log in production code
- [ ] Comments explain "why", not "when"
- [ ] Code looks like it was always correct

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

### Documentation Philosophy

**IMPLEMENTATION_PLAN.md is a progress tracker, not a detailed specification.**

- **High-level summaries only**: Phase objectives, key deliverables, completion status
- **Checkbox-driven**: Quick visual scan of what's done and what's next
- **Test counts**: Brief summary (e.g., "775/778 passing")
- **Links to detailed specs**: Reference `/docs/tasks/` files for deep dives

**Detailed specifications belong in `/docs/tasks/` files:**

- Phase task files (e.g., `Phase 2.4 - Checkout Flow.md`)
- Step-by-step implementation details
- Technical rationale and decision logs
- Comprehensive acceptance criteria
- Detailed test coverage breakdowns

**Why this separation?**

- Prevents IMPLEMENTATION_PLAN.md from becoming bloated and unreadable
- Reduces duplication (don't maintain same details in two places)
- Makes it easy to scan overall project progress
- Detailed specs remain available when needed for deep work

**When updating progress:**

1. Mark checkboxes in IMPLEMENTATION_PLAN.md
2. Update test counts (concise)
3. Keep detailed notes in corresponding task file
4. Link to task file if extensive details exist

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

**Before Starting ANY New Phase/Feature:**

**Step 1: Draft Task Document (1-2 hours)**
- [ ] Create task document from `docs/templates/TASK_DOCUMENT_TEMPLATE.md`
- [ ] Enumerate ALL tests in "Detailed Test Specifications" section
- [ ] Create test summary table with counts per phase
- [ ] Define TDD workflow (RED-GREEN-REFACTOR) for each phase
- [ ] Mark status: "Ready for Grooming 🟡"

**Step 2: Grooming Session (24-48 hours)**
- [ ] Initiate grooming with all 5 doctors (see `TASK_GROOMING_PROCESS.md`)
- [ ] Wait for all doctor reviews (parallel)
- [ ] Address feedback and concerns
- [ ] Update task doc based on feedback
- [ ] Get unanimous approval from all doctors ✅

**Step 3: Authorization (before coding)**
- [ ] Verify all 5 doctors approved
- [ ] Change status to "Approved for Implementation 🟢"
- [ ] **DO NOT START CODING** until all approvals received ⚠️

**Grooming participants (all required):**
- Dr. Testalot (QA) - Testing review
- Dr. Clean (Quality) - Architecture review
- Dr. LeanDev (Implementation) - Feasibility review
- Dr. DevOps (Operations) - Deployment review
- Dr. Git (Version Control) - Change impact review

**During Implementation:**
- Review all docs in `/docs` folder first
- Use TodoWrite for complex tasks
- Follow implementation plan phases (see IMPLEMENTATION_PLAN.md)
- Follow TDD: RED (write tests) → GREEN (implement) → REFACTOR (clean up)
- Test in Docker environment
- Commit frequently with clear messages
- Update IMPLEMENTATION_PLAN.md checkboxes as tasks complete
- Run full test suite before phase sign-off
- Invoke Dr. Clean for QA validation at end of each phase

**Task Document Requirements:**
- All tests enumerated BEFORE implementation
- Specific assertions with code examples
- Test count summary table
- Clear acceptance criteria
- See Phase 2.4.6 (lines 1785-2133) or Phase 0 TDD Spec for examples

### If Debugging/Maintenance Phase

- Check DATABASE_SCHEMA.md for table structures
- Check PRODUCT_CATALOG.md for business rules
- Check ENVIRONMENTS.md for config
- Maintain the same coding style and patterns

---

**This file should be updated as context evolves. Keep it current!**

Last Updated: 2025-10-28
