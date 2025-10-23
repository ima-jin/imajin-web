# Imajin Web Platform - Project Overview

## Business Context

### Company Background

- **Imajin**: Partner-run business specializing in LED fixtures and installations
- **Legacy work**: Event organization, visual installations, custom LED fixtures
- **Current focus**: New modular fixture system (working prototype with dev/maker team)
- **Existing installations**: Multiple venues around Toronto (not showcased on current site)
- **Current site (imajin.ca)**: Outdated portfolio site, no logo update, no shopping cart

### New Direction

- Transform from portfolio site to product ordering platform
- Sell modular LED fixture in multiple configurations:
  - DIY kits
  - Fully assembled units (limited "Special Editions" with 10-year warranty)
  - Individual components for custom builds
- Integrate into ongoing installation work (3-month runway + side gigs)

### Future Vision

- Launch Solana-based token (MJN coin)
- NFT token IDs for fully assembled fixtures (printed on units)
- Solflare wallet checkout integration
- Visual configurator for fixtures (out of scope for v1)
- Automated fixture scoping tool (size/voltage/power requirements)

---

## Technical Stack

### Core Framework

- **Frontend/Backend**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Containerization**: Docker (full stack in containers)
- **Hosting**: Self-hosted (Linux server, RAID, Synology)

### Third-Party Services

- **Payments**: Stripe (embedded checkout) - Product IDs already configured
- **Images**: Cloudinary (existing account, familiar with service)
- **CDN/Edge**: Cloudflare integration
- **Future**: Solana Pay integration for MJN token checkout

### Content Management

- **Approach**: JSON-based configuration files in repository
- **Portfolio**: Manually managed (no CMS GUI needed)
- **Rationale**: Simple, code-based, AI-friendly, no subscription services
- **Note**: Has Contentful account but prefers custom lightweight solution

---

## Product Structure

### Product Types

1. **DIY Kits**: Unassembled fixture components
2. **Fully Assembled**: Special Edition units (limited quantities, 10-year warranty, NFT-coded)
3. **Individual Components**: User can order any parts to build custom configurations

### Variants & Constraints

- **PCB Colors**: Black, White, Red (Stripe doesn't handle variants well - managing in DB)
- **Limited Editions**: Quantity limits on fully assembled units (not supported by Stripe - custom DB logic)
- **Dependencies**: Component compatibility warnings (user can override and order anyway)
- **Stripe Products**: Product IDs already set up in Stripe dashboard

### Future Features (Out of Scope for v1)

- Visual configurator showing fixture as user builds it
- Automated scoping tool calculating size/voltage/power requirements

---

## Database Schema (Preliminary)

### Core Tables

- `products` - Base product information
- `variants` - Product variants (colors, options) with Stripe Product IDs
- `limited_editions` - Track quantities, NFT token IDs, warranty info
- `orders` - Purchase tracking, NFT minting links
- `portfolio_items` - Installation work, case studies

---

## Design Direction

### Visual Style

- **Content/Info Pages**: Black backgrounds
- **Product/Ordering Pages**: White backgrounds
- **Aesthetic**: Clean, modern, product-focused
- **Current State**: No designs/mockups - building iteratively

### Brand Assets

- New logo exists (not yet incorporated into old site)
- Existing portfolio of installation work (not yet showcased)
- One case study ready to publish

---

## Development Priorities

### Phase 1: Foundation

1. Configure tech stack
2. Set up Docker containerization
3. Initialize Next.js project with TypeScript + Tailwind
4. Configure PostgreSQL in Docker
5. Set up Drizzle ORM
6. Create project structure and stubs

### Phase 2: E-commerce Core

1. Design and implement database schema
2. Product catalog pages
3. Shopping cart functionality
4. Stripe embedded checkout integration
5. Order management
6. Component dependency warnings

### Phase 3: Content Pages

1. Homepage
2. About/company info
3. Portfolio/installations gallery
4. Case study pages
5. Contact/support

### Phase 4: Future Enhancements

- Solana Pay integration (MJN token)
- NFT minting/tracking for assembled units
- Visual configurator
- Automated fixture scoping tool

---

## Technical Philosophy

### Developer Background

- Web dev since the 90s
- Recently led 7 dev teams for luxury travel company ($1B in sales)
- Previous stack: Blazor/C#/.NET, React/Next.js team leadership
- Current approach: AI-first development, framework agnostic
- Strong preference for optimal, current best practices over legacy patterns

### Key Principles

- **No subscriptions**: One-time purchases only (strong philosophical stance)
- **Self-hosted**: Full control, no vendor lock-in where possible
- **AI-optimized**: Choose tools that work well with generative AI workflows
- **Lightweight**: Build custom solutions for simple problems (vs. SaaS bloat)
- **Code-based**: Comfortable managing content/config in code vs. GUI tools

---

## Repository Structure

### Root Folder Organization

```
imajin-ai/                          # Root folder (NOT a git repository)
├── web/                            # Git repo - Main e-commerce website
│   ├── app/                        # Next.js App Router
│   ├── components/                 # React components
│   ├── db/                         # Drizzle ORM schema & migrations
│   ├── lib/                        # Utilities, helpers
│   ├── config/                     # JSON configs (products, etc.)
│   ├── public/                     # Static assets
│   ├── docker/                     # Docker configurations
│   ├── .github/workflows/          # CI/CD pipelines
│   ├── docs/                       # Project documentation
│   ├── package.json
│   └── README.md
│
└── token/                          # Git repo - Solana MJN token
    ├── contracts/                  # Smart contracts
    ├── scripts/                    # Deployment, minting, management
    ├── tests/
    └── README.md
```

### Current Repositories

1. **web** - Full-stack Next.js application
   - E-commerce frontend
   - API routes (Stripe, orders, etc.)
   - Database schema and migrations
   - Product configurations
   - Portfolio/content management
   - Docker deployment configs

2. **token** - Solana blockchain integration
   - MJN token smart contract
   - NFT minting for assembled fixtures
   - Wallet integration utilities
   - Token management scripts

### Future Repository Expansion

As the platform grows, additional concerns can be split into separate repositories within the `imajin-ai/` root folder:

#### Potential Future Repositories:

**admin/** - Administrative dashboard (if complex enough to warrant separation)

- Inventory management
- Order processing and fulfillment
- Limited edition tracking
- Analytics and reporting
- User management

**portal/** - Customer account portal (if building robust customer features)

- Order history
- Saved configurations
- Warranty registration
- Support ticket system
- Personal fixture library

**api/** - Standalone API service (only if separating from Next.js)

- RESTful or GraphQL API
- Microservices architecture
- Third-party integrations
- Webhook handlers

**configurator/** - Visual fixture builder tool

- Potentially scriptable/generative (similar to Fusion 360 Python scripting approach)
- Could be web-based, desktop app, or both
- Real-time 3D/2D visualization
- Voltage/power calculation engine
- BOM generation
- Export capabilities (CAD, wiring diagrams, specs)
- May integrate with web app or function as standalone tool

**mobile/** - Mobile application (iOS/Android)

- React Native or Flutter
- Fixture configuration on-the-go
- Installation project management
- AR visualization of fixtures

**integrations/** - Third-party platform integrations

- Lighting control systems (DMX, Art-Net, sACN)
- Home automation platforms
- Installation management tools
- ERP/inventory systems for commercial clients

**design-system/** - Shared component library (if building multiple apps)

- Reusable UI components
- Brand guidelines and tokens
- Shared utilities
- Documentation site (Storybook)

### Repository Guidelines

**When to create a new repository:**

- ✅ Distinct deployment lifecycle from other components
- ✅ Different technology stack
- ✅ Potential for reuse across multiple applications
- ✅ Large enough to warrant independent versioning
- ✅ Separate team ownership (future consideration)

**When to keep code in existing repository:**

- ✅ Tightly coupled to main application
- ✅ Shares core business logic
- ✅ Requires frequent coordinated changes
- ✅ Small feature or module
- ✅ Same deployment pipeline

### Monorepo Philosophy

While the `imajin-ai/` root folder contains **multiple repositories**, the **web/** repository itself is a **monorepo** that follows monorepo best practices:

**What makes web/ a monorepo:**

- All concerns for the web platform in a single repository
- Frontend (React components) + Backend (API routes) + Database (schema/migrations)
- Shared TypeScript types across all layers
- Single `package.json` with unified dependency management
- One CI/CD pipeline for the entire stack
- Atomic commits that span frontend, backend, and database changes

**Why monorepo works for Next.js:**

- Next.js App Router is inherently full-stack (server components + API routes)
- Type sharing between client/server is trivial
- Database queries can happen in server components
- No network boundary between "frontend" and "backend"
- Single deployment artifact

**Why NOT a traditional microservices approach:**

- Would require duplicating types across repos
- Complex coordination of deployments
- API versioning overhead
- Network latency between services
- Overkill for e-commerce site of this scale

**Tools we're NOT using (but could consider later):**

- Turborepo, Nx, Lerna - Overkill for single application
- Yarn/pnpm workspaces - Not needed without multiple packages
- Microservices architecture - Unnecessary complexity

**The multi-repo structure exists at the platform level** (web vs token vs future services) because those have genuinely different:

- Technology stacks (Next.js/TypeScript vs Rust/Solana)
- Deployment lifecycles (web app vs blockchain contracts)
- Development workflows (web development vs smart contract development)
- Security models (centralized app vs decentralized blockchain)

### Configurator Vision

Inspired by parametric CAD scripting (Fusion 360 Python approach):

- Script-driven fixture generation
- Parameters: length, LED density, power requirements, mounting style
- Real-time calculation of electrical requirements
- Automatic component compatibility validation
- Generate cut lists, wiring diagrams, assembly instructions
- Potential integration with manufacturing/ordering system
- Could output files for CNC, 3D printing, laser cutting

**Implementation approach TBD:**

- Web-based with Three.js/Babylon.js for visualization?
- Desktop application with more compute power?
- Hybrid: heavy computation on server, visualization in browser?
- Scripting language: Python backend, TypeScript frontend, or Lua/scripting language?

---

## Open Questions / Future Decisions

- Exact Docker composition (Next.js + PostgreSQL + Redis?)
- Image optimization strategy (Cloudinary vs. custom solution)
- Session/auth management approach (for order tracking, future account system?)
- Solana wallet integration architecture
- NFT minting service/flow

---

## Notes

- 3-month runway for full focus
- Concurrent lighting installation work ongoing
- Opportunity to integrate new fixtures into installation projects
- Existing inventory of older LED fixtures still being sold

---

**Document Created**: 2025-10-22
**Project Status**: Pre-development - Documentation Phase
