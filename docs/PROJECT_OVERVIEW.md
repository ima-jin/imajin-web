# Project Overview

## Context
- **Company**: Imajin - LED fixture design/manufacturing
- **Product**: Modular LED system (working prototype complete)
- **Goal**: Portfolio → e-commerce platform
- **Timeline**: 3-month dev runway
- **Founder**: Experienced dev lead (web since 90s, led 7 teams)

## Tech Stack
**Core**: Next.js 16 (App Router), TypeScript, Tailwind CSS, PostgreSQL, Drizzle ORM, Docker
**Services**: Stripe (payments), Cloudinary (images), Cloudflare (CDN)
**Future**: Solana Pay, NFT minting, visual configurator

## Product Types
1. **DIY Kits** - Unassembled components
2. **Founder Edition** - Limited quantities (500 BLACK, 300 WHITE, 200 RED), 10-year warranty, NFT-coded
3. **Components** - Individual parts for custom builds

**Key Features**:
- Color variants (BLACK/WHITE/RED for Founder Edition)
- Limited edition tracking (DB-managed, not Stripe)
- Component dependencies (voltage matching, compatibility warnings)
- Stripe Product IDs already configured

## Database Design
**What we store**: Product metadata, variants, dependencies, orders, NFT tracking, portfolio
**What Stripe handles**: Pricing, payment processing, checkout, receipts

**Core tables**: products, variants, product_dependencies, product_specs, orders, order_items, nft_tokens, portfolio_items

## Repository Structure
```
imajin-ai/                  # Root (NOT a git repo)
├── web/                    # This repo - Monorepo for e-commerce
└── token/                  # Future - Solana integration
```

**Monorepo rationale**: Next.js is full-stack (server components + API routes), shared types, single deployment, no network boundary between "frontend" and "backend"

## Design Direction
- **Content pages**: Black backgrounds
- **Product pages**: White backgrounds
- **Approach**: Iterative, no mockups yet
- **Assets**: New logo exists, installation portfolio ready

## Development Phases
1. **Foundation** (✅ Complete): Docker, Next.js, DB, testing framework
2. **E-commerce Core** (In Progress): Product catalog, cart, checkout, inventory
3. **Content Pages**: Homepage, about, portfolio, case studies
4. **Polish**: Performance, SEO, UX, admin tools
5. **Future**: Solana Pay, NFT minting, visual configurator

## Philosophy
- **No subscriptions** (one-time purchases only)
- **Self-hosted** (full control)
- **AI-first development** (optimize for AI tooling)
- **Lean approach** (build only what's needed)
- **Code-based content** (JSON configs, no GUI CMS)

## Future Enhancements
- **Solana**: MJN token, NFT minting for Founder Edition units
- **Configurator**: Script-driven fixture builder (Fusion 360 Python-style approach)
- **Scoping tool**: Automated voltage/power/BOM generation
