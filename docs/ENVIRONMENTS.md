# Environment Configuration Strategy

## Overview

The project uses a cascading configuration system with three environments and one base configuration template:

### Configuration Template

- **Default** - Base configuration template (version controlled, no secrets)

### Environments

1. **Local** - Developer workstation (Windows environment)
2. **Dev** - QA/Testing environment (TBD - future deployment)
3. **Live** - Production environment (Linux server, Docker deployment)

---

## Configuration Hierarchy

```
default.json (base template - committed to git, no secrets)
    ↓
local.json (local overrides - .gitignored)
    ↓
dev.json (dev overrides - TBD, future)
    ↓
live.json (production overrides - .gitignored, secrets separate)
```

**Key Principle**: `default.json` contains placeholder values and feature flags. It's committed to version control and contains NO secrets or environment-specific values. Each environment overlays its specific configuration on top of default.

---

## Default Configuration Template

**Purpose**: Version-controlled baseline template with NO secrets or environment-specific values

**Contains**:

- Feature flags (defaults)
- Pagination limits
- Timeout values
- Cache TTLs
- Default product settings
- Rate limiting thresholds
- Image sizing/quality defaults
- Session duration
- API request retry logic
- Error reporting levels

**Location**: `/config/default.json` or `/config/default.ts`

**Example Structure**:

```json
{
  "app": {
    "name": "Imajin",
    "maxCartItems": 100,
    "sessionTimeout": 3600000,
    "defaultPageSize": 20
  },
  "features": {
    "solanaCheckout": false,
    "visualConfigurator": false,
    "customerAccounts": false,
    "newsletter": false
  },
  "images": {
    "quality": 85,
    "formats": ["webp", "jpg"],
    "maxUploadSize": 10485760
  },
  "cache": {
    "productsTTL": 300,
    "portfolioTTL": 600
  }
}
```

---

## Local Configuration

**Purpose**: Developer workstation setup (Windows environment only)

**Characteristics**:

- Docker Desktop for Windows running all services
- Local PostgreSQL database with seed data
- Stripe test mode
- Cloudinary test/dev account
- Hot reload enabled (Next.js Fast Refresh)
- Detailed logging/debugging
- No CDN (direct asset serving)
- Local DNS resolution for `www-local.imajin.ai`

**Environment Variables** (`.env.local`):

```env
# Environment
NODE_ENV=development
NEXT_PUBLIC_ENV=local
NEXT_PUBLIC_SITE_URL=https://www-local.imajin.ai

# Database (Docker)
DATABASE_URL=postgresql://imajin:imajin_dev@imajin-db-local:5435/imajin_local
DB_HOST=imajin-db-local
DB_PORT=5435
DB_NAME=imajin_local
DB_USER=imajin
DB_PASSWORD=imajin_dev

# Redis (optional - Docker)
REDIS_URL=redis://localhost:6379

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

# Debug/Logging
LOG_LEVEL=debug
ENABLE_QUERY_LOGGING=true
PRETTY_PRINT_LOGS=true

# Admin
ADMIN_PASSWORD=local_admin_pass
```

**Docker Compose Services** (`docker/docker-compose.local.yml`):

- Next.js app (port 3000)
- PostgreSQL (`imajin-db-local`, port 5435)

**Notes**:

- Seed database with sample products and test data
- Use Stripe CLI for webhook testing (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- All emails/notifications logged to console (no actual sending)

---

## Dev Configuration (QA/Testing)

**Status**: TBD - Future deployment

**Purpose**: Shared testing environment for QA, staging, client review (when needed)

**Planned Characteristics**:

- Self-hosted server deployment (separate from production)
- Docker Compose configuration
- Separate database from production
- Stripe test mode
- Accessible via `www-dev.imajin.ai`

**Environment Variables** (`.env.dev`):

```env
# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=dev
NEXT_PUBLIC_SITE_URL=https://www-dev.imajin.ai

# Database (Docker or dedicated container)
DATABASE_URL=postgresql://imajin:SECURE_PASSWORD@imajin-db-dev:5433/imajin_dev
DB_HOST=imajin-db-dev
DB_PORT=5433
DB_NAME=imajin_dev
DB_USER=imajin
DB_PASSWORD=SECURE_PASSWORD

# Redis (optional)
REDIS_URL=redis://localhost:6380

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_dev_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=imajin-staging
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Cloudflare
CF_ENABLED=true
CF_ZONE_ID=...
CF_API_TOKEN=...

# Debug/Logging
LOG_LEVEL=info
ENABLE_QUERY_LOGGING=false
PRETTY_PRINT_LOGS=false

# Admin
ADMIN_PASSWORD=SECURE_DEV_PASSWORD

# Emails (test mode - log or test service)
EMAIL_PROVIDER=console # or test service like Mailtrap
```

**Notes**:

- Configuration to be finalized when dev server is provisioned
- Will use similar Docker Compose setup as production
- Database: `imajin-db-dev` (port 5433)

---

## Live Configuration (Production)

**Status**: In planning - Linux server deployment upcoming

**Purpose**: Public-facing production site serving real customers

**Planned Characteristics**:

- Self-hosted Linux server (hardware to be provisioned)
- Docker Compose deployment
- Production PostgreSQL database with backups
- Stripe live mode (real payments)
- Cloudinary production account
- Accessible via `www.imajin.ai`
- SSL/TLS configuration
- Security hardening

**Environment Variables** (`.env.production` or `.env`):

```env
# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=live
NEXT_PUBLIC_SITE_URL=https://www.imajin.ai

# Database (Docker with persistent volumes)
DATABASE_URL=postgresql://imajin:VERY_SECURE_PASSWORD@imajin-db-prod:5432/imajin_production
DB_HOST=imajin-db-prod
DB_PORT=5432
DB_NAME=imajin_production
DB_USER=imajin
DB_PASSWORD=VERY_SECURE_PASSWORD

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Stripe (LIVE MODE)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Cloudinary (Production)
CLOUDINARY_CLOUD_NAME=imajin
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Cloudflare
CF_ENABLED=true
CF_ZONE_ID=...
CF_API_TOKEN=...

# Security
ADMIN_PASSWORD=VERY_SECURE_ADMIN_PASSWORD
SESSION_SECRET=CRYPTOGRAPHICALLY_SECURE_RANDOM_STRING
CSRF_SECRET=ANOTHER_SECURE_RANDOM_STRING

# Logging
LOG_LEVEL=warn
ENABLE_QUERY_LOGGING=false
PRETTY_PRINT_LOGS=false
SENTRY_DSN=... (optional error tracking)

# Emails (production service)
EMAIL_PROVIDER=sendgrid # or similar
EMAIL_API_KEY=...
EMAIL_FROM=orders@imajin.ca

# Monitoring (optional)
UPTIME_MONITOR_URL=...
ANALYTICS_ID=...
```

**Notes**:

- Server hardware to be configured in coming days
- Will deploy old server as Linux host
- Production configuration to be finalized during server setup
- Database: `imajin-db-prod` (port 5432)
- Backup strategy to be implemented post-deployment

---

## Configuration File Structure

### Recommended Organization

```
/config
  ├── default.json          # Base configuration
  ├── local.json            # Local overrides (gitignored)
  ├── dev.json              # Dev environment overrides
  ├── live.json             # Production overrides (gitignored)
  └── schema.ts             # TypeScript types for config

/
  ├── .env.example          # Template for environment variables
  ├── .env.local            # Local env vars (gitignored)
  ├── .env.dev              # Dev env vars (gitignored)
  ├── .env.production       # Production env vars (gitignored)
  └── .gitignore            # Ensures env files not committed
```

### Loading Strategy

```typescript
// lib/config.ts
import defaultConfig from "@/config/default.json";
import localConfig from "@/config/local.json";
import devConfig from "@/config/dev.json";
import liveConfig from "@/config/live.json";

const configs = {
  local: localConfig,
  dev: devConfig,
  live: liveConfig,
};

const env = process.env.NEXT_PUBLIC_ENV || "local";
const envConfig = configs[env] || {};

export const config = {
  ...defaultConfig,
  ...envConfig,
  env,
};
```

---

## Environment-Specific Behaviors

### Feature Flags by Environment

| Feature             | Local        | Dev               | Live            |
| ------------------- | ------------ | ----------------- | --------------- |
| Solana Checkout     | ❌           | ❌                | ❌ (future)     |
| Visual Configurator | ❌           | ❌                | ❌ (future)     |
| Customer Accounts   | ❌           | ✅ (testing)      | ❌ (future)     |
| Rate Limiting       | ❌           | ✅                | ✅              |
| Error Tracking      | ❌           | ✅                | ✅              |
| Analytics           | ❌           | ❌                | ✅              |
| Email Sending       | ❌ (console) | ✅ (test service) | ✅ (production) |
| Database Seeding    | ✅           | ✅                | ❌              |

### Debug/Development Tools

| Tool           | Local | Dev | Live |
| -------------- | ----- | --- | ---- |
| Hot Reload     | ✅    | ❌  | ❌   |
| Source Maps    | ✅    | ✅  | ❌   |
| Query Logging  | ✅    | ❌  | ❌   |
| React DevTools | ✅    | ✅  | ❌   |
| Pretty Logs    | ✅    | ❌  | ❌   |
| pgAdmin Access | ✅    | ✅  | ❌   |

---

## Deployment Process

### Local → Dev

1. Commit and push changes to git repository
2. SSH into dev server
3. Pull latest changes
4. Run `docker-compose -f docker-compose.dev.yml up --build -d`
5. Run database migrations if needed
6. Verify deployment at `dev.imajin.ca`
7. Run smoke tests

### Dev → Live

1. Verify all features working in dev environment
2. Create git tag for release (e.g., `v1.0.0`)
3. SSH into production server
4. Pull tagged release
5. Backup production database
6. Run `docker-compose -f docker-compose.prod.yml up --build -d`
7. Run database migrations if needed
8. Verify deployment at `imajin.ca`
9. Monitor logs for errors
10. Purge Cloudflare cache if needed

---

## Environment Variable Security

### Never Commit:

- `.env.local`
- `.env.dev`
- `.env.production`
- Any file containing real API keys or passwords

### Version Control:

- `.env.example` (template with placeholder values)
- `config/default.json` (no secrets)
- `config/dev.json` (no secrets, only non-sensitive overrides)

### Secure Storage:

- Production secrets stored in password manager
- Backup of `.env.production` stored encrypted on NAS
- Team members only get access to environments they need

---

## Configuration Decisions

### 1. Domain Structure

- **Local**: `www-local.imajin.ai` (local DNS resolution)
- **Dev**: `www-dev.imajin.ai` (TBD)
- **Live**: `www.imajin.ai` (production)

All environments use consistent subdomain naming convention under `imajin.ai` domain.

### 2. Database Strategy

Separate PostgreSQL containers per environment using naming convention:

- `imajin-db-local` → Local development (`www-local.imajin.ai`, port 5435)
- `imajin-db-dev` → Dev environment (TBD, port 5433)
- `imajin-db-prod` → Production (`www.imajin.ai`, port 5432)

Each container runs on different ports to avoid conflicts and enable running multiple environments simultaneously if needed.

### 3. Cloudflare Setup

**Status**: To be configured during implementation (first-time setup)
**Approach**:

- Single Cloudflare zone for `imajin.ai` domain
- All subdomains managed within same zone
- DNS records for each environment subdomain
- CDN/caching rules configured per subdomain
- SSL/TLS certificates via Cloudflare

**Note**: Cloudflare configuration documentation will be created during setup process.

### 4. CI/CD Pipeline

**Status**: TBD - To be configured post-server setup

**Planned Strategy**:

- Git repository hosted on GitHub
- Manual deployment initially
- Automated CI/CD workflows to be added later

### 5. Secrets Management

**Current Approach**:

- `.env` files stored in plaintext on servers (outside web root)
- Located in `/opt/imajin/config/` or similar secure directory
- File permissions set to `600` (owner read/write only)
- Not accessible via web server
- Backed up encrypted to NAS

**Future Enhancement** (TODO):

- [ ] Migrate to secrets vault solution (HashiCorp Vault, Doppler, or similar)
- [ ] Rotate all secrets after migration
- [ ] Implement automated secret rotation
- [ ] Add audit logging for secret access

---

**Document Created**: 2025-10-22
**Last Updated**: 2025-10-22
**Status**: Complete - Ready for implementation
