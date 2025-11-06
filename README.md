# Imajin Web Platform

E-commerce platform for modular LED fixtures. Full-stack monorepo with Next.js 16, TypeScript, PostgreSQL, and Stripe.

**Status:** Active Development - Phase 2.3.6 Complete

## Tech Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- PostgreSQL + Drizzle ORM
- Stripe (payments) + Cloudinary (images)
- Docker + Self-hosted

## Project Structure

```
web/
├── app/                 # Next.js pages and API routes
├── components/          # React components (ui/, cart/, products/, etc.)
├── lib/                 # Utilities, services, Stripe, DB client
├── db/                  # Drizzle schema, migrations, seed scripts
├── config/              # JSON configs (products, content, env overrides)
│   ├── products.json
│   └── content/         # UI strings, navigation, page content
├── tests/               # Vitest unit/integration tests
├── docs/                # Architecture docs and implementation plan
├── docker/              # Docker configs for local/dev/prod
└── scripts/             # Utility scripts (seed, validate, reset)
```

**Monorepo Rationale:** Next.js App Router is inherently full-stack (React + API routes + server components). Splitting frontend/backend creates unnecessary complexity.

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Development Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd web
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your database/Stripe/Cloudinary credentials

# 3. Start database
docker-compose -f docker/docker-compose.local.yml up -d

# 4. Initialize database
npm run db:push
npm run db:seed

# 5. Start dev server
npm run dev

# 6. Open https://localhost:3000
```

## Key Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # TypeScript check
npm test                 # Run tests (Vitest)

# Database
npm run db:push          # Push schema to DB
npm run db:seed          # Seed with products
npm run db:studio        # Open Drizzle Studio

# Content
npm run validate:content # Validate JSON configs
```

## Environments

- **Local** (`localhost:3000`) - Development on Windows
- **Dev** (`www-dev.imajin.ca`) - QA/Testing (planned)
- **Live** (`www.imajin.ca`) - Production (planned)

Config: `config/default.json` + environment-specific overrides. See [ENVIRONMENTS.md](./docs/ENVIRONMENTS.md).

## Documentation

**Architecture & Planning:**
- [Project Overview](./docs/PROJECT_OVERVIEW.md) - Business context and philosophy
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) - Roadmap and phase tracking
- [Component Architecture](./docs/COMPONENT_ARCHITECTURE.md) - React patterns
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Data models

**Configuration:**
- [JSON Config Structure](./docs/JSON_CONFIG_STRUCTURE.md) - Products and content configs
- [Content Management](./docs/CONTENT_MANAGEMENT.md) - Editing UI copy without code
- [Environments](./docs/ENVIRONMENTS.md) - Environment setup

**Testing:**
- [Testing Strategy](./docs/TESTING_STRATEGY.md) - TDD patterns and coverage

---

**Last Updated:** 2025-10-27 | **Phase:** 2.3.6 Complete
See [IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) for detailed progress.
