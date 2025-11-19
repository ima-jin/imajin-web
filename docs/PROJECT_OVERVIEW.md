# Project Overview

## Context
- **Company**: Imajin - LED fixture design/manufacturing
- **Product**: Modular LED system (working prototype complete)
- **Goal**: Portfolio → e-commerce platform
- **Timeline**: 3-month dev runway
- **Founder**: Experienced dev lead (web since 90s, led 7 teams)

## Tech Stack
**Core**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, PostgreSQL, Drizzle ORM, Docker
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
**What we store**: Product metadata, variants, dependencies, orders, NFT tracking, portfolio, users, collectives, trust hubs
**What Stripe handles**: Pricing, payment processing, checkout, receipts
**What Ory Kratos handles**: Passwords, sessions, MFA credentials, email verification

**Core tables**:
- **E-commerce**: products, variants, product_dependencies, product_specs, orders, order_items, nft_tokens, portfolio_items
- **Auth & Federation**: users (shadow of Ory), trust_hubs, user_collectives, user_collective_memberships

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
- **True ownership** (users own hardware, data, identity, creations)

## Decentralized Architecture Vision

### Today (Phase 4.4): Centralized Bootstrap
- Single hub (imajin.ca)
- Ory Kratos for authentication
- Users table shadows Ory identities
- Products attributed to "Imajin" collective

### Phase 5+: Federated Marketplace
- **Every device is a hub** - Imajin units can run hub software
- **Trust hub federation** - Hubs explicitly trust each other
- **Collectives** - Organizational entities for creator attribution
- **Hub scales**: Personal (1 user) → Family (household) → Community (artist collective) → Organization (company)

### Future: Full Decentralization
- **DID-based identity** (W3C DIDs, portable across hubs)
- **Wallet authentication** (Solana wallet sign-in)
- **Federated commerce** (buy/sell across hubs)
- **Data portability** (collectives can migrate between hubs)
- **Peer-to-peer** (units federate directly)

**Key Principle**: Every user CAN operate a hub. Some choose to join existing hubs for convenience. Architecture supports all scales without breaking changes.

**Business Model Alignment**:
- Founder Edition NFT = Hub license
- Hardware sales (not SaaS subscriptions)
- User owns hardware, data, identity
- No vendor lock-in

## Future Enhancements
- **Solana**: MJN token, NFT minting for Founder Edition units
- **Configurator**: Script-driven fixture builder (Fusion 360 Python-style approach)
- **Scoping tool**: Automated voltage/power/BOM generation
