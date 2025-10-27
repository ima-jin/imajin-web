# Database Setup

This directory contains the database schema, migrations, and seed data for the Imajin web platform.

## Quick Start

```bash
# Push schema to database (creates/updates tables)
npm run db:push

# Seed/sync database from products.json (upsert - safe to run multiple times)
npm run db:seed
# or
npm run db:sync   # Same thing!

# Test database connection and run sanity checks
npm run db:test

# Verify database contents (debugging)
npm run db:verify

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Database Schema

The database is configured to connect to PostgreSQL at `localhost:5435` (as specified in `.env.local`).

### Tables

1. **products** - Core product information
   - Stores product metadata (dev status, category, pricing)
   - Only products with `dev_status = 5` are shown to customers

2. **variants** - Product variants (colors, options)
   - Supports limited edition tracking with auto-calculated availability
   - Used for Founder Edition color variants (BLACK/WHITE/RED)

3. **product_dependencies** - Compatibility rules
   - Types: `requires`, `suggests`, `incompatible`, `voltage_match`
   - Ensures proper component compatibility (e.g., 5v vs 24v)

4. **product_specs** - Technical specifications
   - Flexible key-value storage for product specs
   - Displayed on product detail pages

5. **orders** - Order tracking
   - Created via Stripe webhook on successful payment
   - Includes shipping information and status tracking

6. **order_items** - Line items for orders
   - Snapshots product names (preserves history if products change)

7. **nft_tokens** - Founder Edition NFT tracking
   - Links physical units to blockchain tokens
   - Tracks warranty and serial numbers

8. **portfolio_items** - Installation work and case studies
   - Used for portfolio/gallery pages

9. **portfolio_images** - Gallery images for portfolio items
   - Multiple images per portfolio item

## Files in this Directory

### `schema.ts`

Defines all database tables using Drizzle ORM syntax.

### `index.ts`

Database connection configuration. Exports `db` instance for queries.

## Operational Scripts

Database operational scripts are located in `/scripts/`:

- **`sync-products.ts`** - Seeds/syncs database from `config/products.json` (UPSERT)
- **`verify-products.ts`** - Display database contents for debugging
- **`test-connection.ts`** - Test connectivity and run sanity checks
- **`reset-test-db.ts`** - Reset test database

Run these via npm scripts (see Quick Start above or `package.json`).

## Configuration

Database connection settings are in `.env.local`:

```env
DATABASE_URL=postgresql://imajin:imajin_dev@localhost:5435/imajin_local
DB_HOST=localhost
DB_PORT=5435
DB_NAME=imajin_local
DB_USER=imajin
DB_PASSWORD=imajin_dev
```

## Migrations

Drizzle Kit is configured via `drizzle.config.ts` in the root directory.

To generate migrations (when schema changes):

```bash
npm run db:generate
```

To apply migrations:

```bash
npm run db:migrate
```

For local development, `npm run db:push` is simpler (directly syncs schema without migration files).

## Drizzle Studio

Open a web-based database GUI:

```bash
npm run db:studio
```

This will open `https://local.drizzle.studio` where you can browse tables, run queries, and edit data.

## Notes

- Schema matches the design in `/docs/DATABASE_SCHEMA.md`
- Generated columns (`available_quantity`, `is_available`) are calculated automatically by PostgreSQL
- JSONB `metadata` fields on tables allow flexible future extensions
- Foreign keys use appropriate `ON DELETE` actions (cascade, set null)
- Indexes are created for common query patterns
