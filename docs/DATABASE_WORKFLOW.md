# Database Workflow

## Overview

The application uses **environment-aware database selection** to automatically connect to the correct database based on `NODE_ENV`. No manual switching required!

---

## Database Environments

| Environment | NODE_ENV | Database Name | Purpose |
|-------------|----------|---------------|---------|
| **Development** | `development` (default) | `imajin_local` | Local development work |
| **Test** | `test` | `imajin_test` | Running tests |
| **Production** | `production` | `imajin_prod` | Live production data |

---

## How It Works

### Automatic Selection

The `lib/config/env.ts` file automatically selects the database based on `NODE_ENV`:

```typescript
// Automatically select database based on NODE_ENV
switch (nodeEnv) {
  case "test":
    dbName = "imajin_test";    // ← Tests use this
    break;
  case "production":
    dbName = "imajin_prod";     // ← Production uses this
    break;
  case "development":
  default:
    dbName = "imajin_local";    // ← Development uses this
    break;
}
```

### Configuration Precedence

1. **Explicit DATABASE_URL** (highest priority)
   - If `DATABASE_URL` env var is set, use it as-is
   - Example: `DATABASE_URL=postgresql://user:pass@host:port/custom_db`

2. **Explicit DB_NAME**
   - If `DB_NAME` is set, use that specific database
   - Example: `DB_NAME=imajin_staging`

3. **Auto-selection** (default)
   - If neither above are set, automatically select based on `NODE_ENV`
   - No configuration needed!

---

## Usage Patterns

### Running Tests

Tests **automatically** use `imajin_test`:

```bash
npm test                  # ✅ Uses imajin_test (NODE_ENV=test set in vitest.config.ts)
npm run test:unit         # ✅ Uses imajin_test
npm run test:integration  # ✅ Uses imajin_test
npm run test:e2e          # ✅ Uses imajin_test (set in playwright.config.ts)
```

**How:**
- `vitest.config.ts` sets `env: { NODE_ENV: "test" }`
- Database auto-selects `imajin_test`
- Tests clear/seed their own data using `clearTestData()`

### Development

Development commands **automatically** use `imajin_local`:

```bash
npm run dev               # ✅ Uses imajin_local
npm run sync:products     # ✅ Syncs to imajin_local
npm run db:push           # ✅ Pushes schema to imajin_local
npm run db:studio         # ✅ Opens studio for imajin_local
```

**How:**
- Default `NODE_ENV` is `development`
- Database auto-selects `imajin_local`

### Production

Production deployments use `imajin_prod`:

```bash
NODE_ENV=production npm start  # ✅ Uses imajin_prod
```

**How:**
- Set `NODE_ENV=production` in deployment environment
- Database auto-selects `imajin_prod`

---

## Database Setup

### Initial Setup (One Time)

```bash
# 1. Start Docker database container
npm run docker:dev

# 2. Create test database
npm run test:db:create

# 3. Push schema to all databases
npm run db:push                    # Pushes to imajin_local (development)
DB_NAME=imajin_test npm run db:push  # Pushes to imajin_test (Windows)

# 4. Seed development database
npm run sync:products              # Seeds imajin_local with products
```

### Test Database

The **test database is ephemeral** - tests manage their own data:

```typescript
beforeEach(async () => {
  await clearTestData(db);  // Clear everything

  // Insert only what this test needs
  await db.insert(products).values([...]);
});

afterEach(async () => {
  await clearTestData(db);  // Clean up
});
```

**Why:**
- Tests are isolated (one test doesn't affect another)
- Tests are predictable (always start from known state)
- Tests are fast (minimal data setup)

**No need to manually seed test database!** Tests create their own data.

---

## Common Tasks

### Resetting Databases

**Reset development database:**
```bash
npm run test:db:drop DB_NAME=imajin_local
npm run test:db:create
DB_NAME=imajin_local npm run db:push
npm run sync:products
```

**Reset test database:**
```bash
npm run test:db:drop
npm run test:db:create
DB_NAME=imajin_test npm run db:push
```

**Note:** No need to seed test database - tests manage their own data.

### Viewing Database Contents

**Development database:**
```bash
npm run db:studio  # Opens Drizzle Studio for imajin_local
```

**Test database:**
```bash
DB_NAME=imajin_test npm run db:studio  # Opens studio for imajin_test
```

**Raw SQL:**
```bash
docker exec imajin-db-local psql -U imajin -d imajin_local -c "SELECT * FROM products;"
docker exec imajin-db-local psql -U imajin -d imajin_test -c "SELECT * FROM products;"
```

### Syncing Product Data

**To development database:**
```bash
npm run sync:products  # Syncs config/products.json → imajin_local
```

**To test database:**
```bash
# Usually not needed! Tests create their own data.
# But if you need to:
DB_NAME=imajin_test tsx scripts/sync-products.ts
```

---

## Troubleshooting

### "Database does not exist"

**Problem:** Trying to connect to database that doesn't exist.

**Solution:**
```bash
# For test database
npm run test:db:create

# For custom database
docker exec imajin-db-local psql -U imajin -d postgres -c "CREATE DATABASE your_db_name;"
```

### "Tests are failing with database errors"

**Problem:** Test database schema is out of date.

**Solution:**
```bash
DB_NAME=imajin_test npm run db:push  # Push latest schema to test DB
```

### "Development database has test data"

**Problem:** Manually ran tests against development database.

**Solution:** Don't worry! The env config now prevents this automatically. Tests always use `imajin_test`.

### "Want to use a different database temporarily"

**Solution:**
```bash
# Override with explicit DB_NAME
DB_NAME=imajin_staging npm run sync:products

# Or with full DATABASE_URL
DATABASE_URL=postgresql://user:pass@host:port/custom_db npm run sync:products
```

---

## Best Practices

### ✅ DO

- Let the automatic database selection work (don't override unless needed)
- Run tests frequently - they use separate database
- Seed development database with real product data
- Let tests manage their own test data
- Use `clearTestData()` in test setup/teardown

### ❌ DON'T

- Manually switch database connections in code
- Seed the test database manually (tests do this)
- Run tests against development database
- Share test data between test files
- Rely on test database having specific data

---

## Configuration Files

### `lib/config/env.ts`

Automatic database selection logic.

### `vitest.config.ts`

Sets `NODE_ENV=test` for all Vitest tests.

### `playwright.config.ts`

Sets `NODE_ENV=test` for E2E tests.

### `tests/helpers/db-helpers.ts`

Test database utilities (`clearTestData`, `createTestDbConnection`).

---

## Environment Variables

### Required (with defaults)

```bash
# Database connection (defaults work for local Docker)
DB_HOST=localhost         # default: localhost
DB_PORT=5435              # default: 5435
DB_USER=imajin            # default: imajin
DB_PASSWORD=imajin_dev    # default: imajin_dev
```

### Optional

```bash
# Override automatic selection
DB_NAME=custom_db_name                           # Use specific database
DATABASE_URL=postgresql://user:pass@host/db      # Full connection string

# Node environment (automatically set by tools)
NODE_ENV=development|test|production
```

### Where to Set

- **Tests:** Set in `vitest.config.ts` and `playwright.config.ts` (already done)
- **Development:** Use defaults (no env vars needed!)
- **Production:** Set in deployment environment (Vercel, Docker, etc.)

---

## Architecture Benefits

### Before (Manual Switching)

```typescript
// ❌ Manual, error-prone
const dbUrl = process.env.NODE_ENV === 'test'
  ? 'postgresql://...imajin_test'
  : 'postgresql://...imajin_local';
```

Problems:
- Easy to forget
- Duplicated logic
- Tests might accidentally use wrong database
- Hard to add new environments

### After (Automatic Selection)

```typescript
// ✅ Automatic, centralized
import { getDatabaseConnectionString } from '@/lib/config/database';
const dbUrl = getDatabaseConnectionString();  // Auto-selects based on NODE_ENV
```

Benefits:
- Single source of truth
- Can't forget to set it
- Easy to add new environments
- Consistent across entire codebase
- Override available when needed

---

## Summary

**You don't need to think about database selection anymore!**

- Running tests? → Uses `imajin_test` automatically
- Doing development? → Uses `imajin_local` automatically
- Deploying to production? → Uses `imajin_prod` automatically

The system "just works" and does the right thing based on context.

---

**Last Updated:** 2025-10-24
**Applies to:** Phase 2.1+
