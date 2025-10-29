# Developer Tools

Manual validation and testing scripts for development and setup.

These scripts interact with **real external services** and are meant for manual execution by developers, not automated CI/CD pipelines.

---

## Available Tools

### test-cloudinary.ts

**Purpose:** Manually validate Cloudinary integration

**What it does:**
1. Uploads a test image to Cloudinary
2. Checks if the image exists
3. Deletes the test image
4. Verifies deletion

**Usage:**
```bash
npx tsx scripts/tools/test-cloudinary.ts
```

**Prerequisites:**
- `.env.local` with valid Cloudinary credentials:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

**When to use:**
- First-time Cloudinary setup
- After changing Cloudinary configuration
- Troubleshooting media upload issues
- Verifying credentials are correct

---

### test-stripe.ts

**Purpose:** Manually validate Stripe integration

**What it does:**
1. Creates a test product in Stripe
2. Updates the product name
3. Changes the product price (creates new Price object)
4. Archives the product
5. Provides Stripe dashboard link for verification

**Usage:**
```bash
npx tsx scripts/tools/test-stripe.ts
```

**Prerequisites:**
- `.env.local` with Stripe **test mode** key:
  - `STRIPE_SECRET_KEY=sk_test_...`

**When to use:**
- First-time Stripe setup
- After changing Stripe configuration
- Troubleshooting product sync issues
- Verifying test mode credentials

**Important:**
- ⚠️ Uses **real Stripe API** (test mode)
- Leaves archived product in Stripe (manual cleanup needed)
- Script will abort if you try to use production keys

---

## Difference from Automated Tests

| Aspect | Manual Tools (here) | Automated Tests (`tests/`) |
|--------|---------------------|---------------------------|
| **Location** | `scripts/tools/` | `tests/unit/`, `tests/integration/` |
| **Purpose** | Manual validation | Automated verification |
| **API Calls** | Real external services | Mocked/stubbed services |
| **When Run** | Manually by developer | CI/CD pipeline, pre-commit |
| **Framework** | Plain TypeScript | Vitest |
| **Exit Codes** | process.exit(0/1) | test assertions |

---

## Adding New Tools

When creating new manual validation scripts:

1. **Name clearly:** `test-<service>.ts` or `verify-<service>.ts`
2. **Add to this README**
3. **Include prerequisites section**
4. **Add safety checks** (e.g., prevent production API usage)
5. **Clean up test data** when possible
6. **Use logger** for error tracking
7. **Console.log is OK** for terminal output (these are CLI tools)

---

## Notes

- These scripts are **excluded** from the console.log ban (Dr. Clean rule line 82)
- They should use `logger.*` for structured logging alongside `console.log` for user output
- Keep them simple and focused on one service/feature
- Provide clear success/failure messages with emojis for readability
