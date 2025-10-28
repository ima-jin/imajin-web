# Environment Configuration Strategy

## Overview

The project uses **two environments** (Local + Production) with a third (Staging) deployed to cloud infrastructure.

### Environments

1. **Local** - Developer workstation (Docker on Windows)
2. **Staging** - Cloud-hosted testing (Vercel + Neon PostgreSQL)
3. **Production** - Cloud-hosted live site (Vercel + Neon PostgreSQL)

**Note:** "Dev" and "Live" terminology replaced with industry-standard "Staging" and "Production"

---

## Deployment Stack

### Hosting: Vercel
- **Platform:** Managed Next.js hosting
- **Setup time:** <2 hours
- **Cost:** $0 staging (free tier), $20/mo production (Hobby tier)
- **Features:** Auto-deploy, SSL, CDN, environment variables UI

### Database: Neon PostgreSQL
- **Platform:** Managed PostgreSQL
- **Setup time:** <10 minutes
- **Cost:** $0 staging (0.5GB free tier), $19/mo production (Scale tier)
- **Features:** Auto-backups, point-in-time restore, connection pooling

### Version Control: GitHub
- **CI/CD:** GitHub Actions for tests
- **Auto-deploy:** Vercel integration (staging on merge to main)
- **Manual deploy:** Production via Vercel dashboard approval

---

## Configuration Hierarchy

```
.env.local (local development - gitignored)
    ↓
Vercel Environment Variables (staging - Vercel dashboard)
    ↓
Vercel Environment Variables (production - Vercel dashboard)
```

**Key Principle**: Environment variables stored in Vercel dashboard only. Never commit secrets. `.env.local` for local development only.

## Local Environment

**Purpose**: Developer workstation (Windows with Docker Desktop)

**Stack**:
- Docker PostgreSQL container (port 5435)
- Next.js dev server (port 3000)
- Hot reload enabled
- Detailed logging

**Environment Variables** (`.env.local`):

```env
NODE_ENV=development
DATABASE_URL=postgresql://imajin:imajin_dev@localhost:5435/imajin_local

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=imajin
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Start local environment:**
```bash
npm run docker:dev     # Start PostgreSQL container
npm run db:push        # Run migrations
npm run db:sync        # Seed products
npm run dev            # Start Next.js dev server
```

**Stripe webhook testing:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Staging Environment

**Purpose**: Pre-production testing on cloud infrastructure

**Stack**:
- Vercel (free tier)
- Neon PostgreSQL (free tier, 0.5GB)
- Auto-deploy from `main` branch

**URL**: `https://imajin-staging.vercel.app` (or custom domain if configured)

**Environment Variables** (Vercel Dashboard):

```env
NODE_ENV=production
DATABASE_URL=postgresql://...@...neon.tech/imajin_staging

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=imajin
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Deployment**:
- Merge to `main` branch → Automatic deploy
- Takes ~2 minutes
- GitHub Actions runs tests before merge

**Database seeding**:
```bash
DATABASE_URL=<staging-connection-string> npm run db:sync
```

## Production Environment

**Purpose**: Live site serving real customers

**Stack**:
- Vercel (Hobby tier, $20/mo)
- Neon PostgreSQL (Scale tier, $19/mo)
- Manual promotion from staging

**URL**: `https://www.imajin.ai`

**Environment Variables** (Vercel Dashboard):

```env
NODE_ENV=production
DATABASE_URL=postgresql://...@...neon.tech/imajin_production

# Stripe (LIVE MODE - real payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=imajin
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Deployment**:
1. Verify staging works correctly
2. Run smoke tests: `npm run test:smoke:ci`
3. Go to Vercel dashboard
4. Click "Promote to Production" on staging deployment
5. Monitor logs for 10 minutes
6. Check Stripe webhook deliveries

**Database**:
- Automatic daily backups (Neon managed)
- 7-day retention on Scale tier
- Point-in-time restore available
- Connection pooling enabled

**Monitoring**:
- Vercel dashboard (runtime logs, function metrics)
- UptimeRobot (health check every 5 minutes)
- Stripe dashboard (webhook delivery)

## Environment Variables Management

### Storage Location

**Local**: `.env.local` file (gitignored)
**Staging/Production**: Vercel Dashboard → Project Settings → Environment Variables

### Security Rules

**Never commit:**
- `.env.local`
- Any file with real secrets
- Screenshots showing environment variables

**Always use:**
- Vercel dashboard for cloud environments
- Password manager for backup copies
- GPG encryption if exporting

### Required Variables

All environments need:
- `NODE_ENV`
- `DATABASE_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Test vs Live Stripe keys:**
- Staging uses `pk_test_...` and `sk_test_...`
- Production uses `pk_live_...` and `sk_live_...`

---

## CI/CD Pipeline

### GitHub Actions (Tests)

**`.github/workflows/test.yml`:**
```yaml
name: CI
on: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
```

Runs on every PR and push to main.

### Vercel Auto-Deploy

**Staging:**
- Trigger: Merge to `main` branch
- Action: Automatic deployment
- Time: ~2 minutes
- URL: `https://imajin-staging.vercel.app`

**Production:**
- Trigger: Manual promotion via Vercel dashboard
- Action: Click "Promote to Production"
- Time: ~1 minute
- URL: `https://www.imajin.ai`

---

## Domain Configuration

### Current URLs

- **Local**: `http://localhost:3000`
- **Staging**: `https://imajin-staging.vercel.app` (Vercel subdomain)
- **Production**: `https://www.imajin.ai` (custom domain)

### Custom Domain Setup (Production)

1. Vercel dashboard → Domains
2. Add `www.imajin.ai`
3. Follow Vercel DNS instructions
4. Wait for DNS propagation (~1 hour)
5. SSL automatically provisioned

---

## Database Management

### Local Database

**Container**: `imajin-db-local` (Docker)
**Port**: 5435
**Database**: `imajin_local`

**Reset anytime:**
```bash
npm run docker:down
npm run docker:dev
npm run db:push
npm run db:sync
```

### Staging Database

**Provider**: Neon PostgreSQL (free tier)
**Database**: `imajin_staging`
**Backups**: Automatic (7-day retention)

**Seed data:**
```bash
DATABASE_URL=<staging-url> npm run db:sync
```

### Production Database

**Provider**: Neon PostgreSQL (Scale tier, $19/mo)
**Database**: `imajin_production`
**Backups**: Automatic daily, 7-day retention, point-in-time restore

**NEVER run `db:sync` on production** - Data is real customer data

---

## Migration Strategy

### Database Migrations

**Process:**
1. Test migration locally: `npm run db:push`
2. Deploy to staging: `DATABASE_URL=<staging-url> npm run db:push`
3. Test staging manually
4. Deploy to production: `DATABASE_URL=<prod-url> npm run db:push`
5. Promote code to production via Vercel

**Only forward-compatible migrations:**
- ✅ Add columns
- ✅ Add tables
- ❌ Drop columns (requires two-phase deploy)
- ❌ Rename columns (requires two-phase deploy)

### Rollback Procedure

**Code rollback:**
1. Vercel dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Done in <1 minute

**Database rollback:**
1. Neon dashboard → Backups
2. Select restore point
3. Restore to point-in-time
4. Update connection string if needed

---

**Document Last Updated**: 2025-10-27
**Status**: Updated for Vercel + Neon deployment strategy
