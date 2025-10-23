# Imajin Web Platform

Full-stack e-commerce platform for modular LED fixtures built with Next.js 14+.

## Overview

This is a monorepo containing the complete web application including:
- 🎨 Frontend (React/Next.js App Router)
- 🔌 Backend API routes
- 🗄️ Database schema and migrations (Drizzle ORM)
- 📦 Product configurations
- 🎭 Portfolio/content management
- 🐳 Docker deployment configurations

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Payments**: Stripe (embedded checkout)
- **Images**: Cloudinary
- **CDN**: Cloudflare
- **Containerization**: Docker
- **Hosting**: Self-hosted

## Monorepo Structure

```
web/
├── app/                        # Next.js App Router
│   ├── (routes)/              # Page routes
│   ├── api/                   # API routes
│   └── layout.tsx             # Root layout
├── components/                # React components
│   ├── ui/                    # UI primitives
│   ├── cart/                  # Shopping cart
│   ├── products/              # Product displays
│   └── ...
├── lib/                       # Utilities and helpers
│   ├── stripe.ts              # Stripe integration
│   ├── db.ts                  # Database client
│   └── utils.ts               # Shared utilities
├── db/                        # Database concerns
│   ├── schema.ts              # Drizzle schema definitions
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed data script
├── config/                    # JSON configurations
│   ├── products/              # Product definitions
│   ├── default.json           # Default config
│   ├── dev.json               # Dev overrides
│   └── live.json              # Production overrides
├── public/                    # Static assets
│   ├── images/
│   └── fonts/
├── docker/                    # Docker configurations
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── docker-compose.local.yml
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
├── docs/                      # Project documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── ENVIRONMENTS.md
│   └── DATABASE_SCHEMA.md
├── scripts/                   # Utility scripts
│   ├── seed-db.ts
│   └── deploy.sh
├── types/                     # TypeScript type definitions
├── .env.example               # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── drizzle.config.ts
└── README.md
```

## Monorepo Philosophy

This repository follows monorepo best practices:

✅ **Single source of truth** - All web platform code in one place
✅ **Unified tooling** - One `package.json`, one set of dependencies
✅ **Shared types** - Type safety across frontend/backend boundary
✅ **Atomic changes** - Frontend + backend + DB changes in single commit
✅ **Simplified development** - One `npm install`, one dev server

### Why Monorepo for Web?

Next.js App Router is **inherently full-stack**:
- Frontend (React components) and backend (API routes) in same codebase
- Server components blur the line between frontend/backend
- Database calls can happen directly in server components
- Type sharing between client and server is trivial

Splitting these into separate repos would create unnecessary complexity with:
- Syncing types across repos
- Coordinating deployments
- Managing dependencies
- Cross-repo testing

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   cd D:\Projects\imajin\imajin-ai\web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Start Docker services**
   ```bash
   docker-compose -f docker/docker-compose.local.yml up -d
   ```

5. **Run database migrations**
   ```bash
   npm run db:push
   ```

6. **Seed the database** (optional)
   ```bash
   npm run db:seed
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Open browser**
   ```
   https://www-local.imajin.ai:3000
   ```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Database
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Drizzle Studio

# Docker
npm run docker:dev   # Start dev environment
npm run docker:prod  # Start production environment
npm run docker:down  # Stop all containers
```

## Environments

The application uses a configuration template plus three environments:

### Configuration Template
- **default.json** - Base configuration (version controlled, no secrets)

### Environments
- **Local** (`www-local.imajin.ai`) - Development workstation (Windows)
- **Dev** (`www-dev.imajin.ai`) - QA/Testing (TBD)
- **Live** (`www.imajin.ai`) - Production (Linux server, planned)

See [docs/ENVIRONMENTS.md](./docs/ENVIRONMENTS.md) for detailed configuration.

## Documentation

- 📋 [Project Overview](./docs/PROJECT_OVERVIEW.md) - Business context, architecture, philosophy
- 🗺️ [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) - Detailed roadmap and tasks
- 🌍 [Environment Configuration](./docs/ENVIRONMENTS.md) - Environment setup and variables
- 🗄️ [Database Schema](./docs/DATABASE_SCHEMA.md) - Data models and relationships

## Deployment

**Status**: TBD - To be configured after server setup

**Planned approach**:
- Manual deployment initially
- Automated CI/CD (GitHub Actions) to be added later
- Self-hosted Linux server (hardware in progress)

Deployment workflow will be documented once infrastructure is ready.

## Contributing

(To be added when open sourced)

## License

(To be determined)

---

**Status**: Pre-development - Documentation Phase
**Last Updated**: 2025-10-22
