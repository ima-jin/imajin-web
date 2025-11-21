# Incremental Documentation Generation

**Smart, cost-efficient documentation** that only regenerates what changed.

---

## How It Works

```
1. git diff HEAD~1 HEAD
   ↓
   Changed files detected

2. Map files → modules
   lib/services/order-service.ts → services/order-service

3. Filter TypeDoc data
   Only extract data for changed modules

4. Call Claude API
   ✅ Generate docs for: services/order-service ($0.08)
   ⏭️  Skip unchanged: stripe-service, logger, etc.

5. Merge results
   New docs + existing docs = complete documentation

6. Update index
   README.md lists all modules (changed + preserved)
```

---

## Cost Comparison

### Before (Full Regeneration)
```bash
npm run docs:generate

# Every run:
- 10 modules × $0.084 = $0.84 per run
- 20 pushes/month = $16.80/month
```

### After (Incremental)
```bash
npm run docs:generate

# Typical run (1-2 files changed):
- 1-2 modules × $0.084 = $0.08-0.16 per run
- 20 pushes/month = $1.60-3.20/month

# Savings: ~$13-15/month (80-90% reduction!)
```

---

## Usage

### Incremental (Default)
```bash
npm run docs:generate
```

**Behavior:**
- Detects changed files via `git diff HEAD~1 HEAD`
- Only regenerates docs for affected modules
- Preserves existing docs for unchanged modules
- **Cost:** ~$0.08-0.16 per typical push

### Full Regeneration
```bash
npm run docs:generate:full
```

**Use when:**
- First time generating docs
- Brand voice guide changed
- Want fresh docs for everything
- **Cost:** ~$0.84 per run

---

## Smart Triggers

The system automatically does **full regeneration** if:

### Critical Files Changed
```bash
# These files affect ALL docs, so regenerate everything:
docs/BRAND_VOICE_GUIDE.md        # Voice guidelines changed
claude.md                         # Project context changed
scripts/generate-docs-with-claude.ts  # Script logic changed
typedoc.json                      # TypeDoc config changed
```

### No Git History
```bash
# First run or no previous commit
git diff HEAD~1 HEAD  # Returns nothing
# → Full regeneration
```

---

## Examples

### Example 1: Changed One Service File

```bash
# You edited: lib/services/order-service.ts
git diff --name-only HEAD~1 HEAD
# Output: lib/services/order-service.ts

npm run docs:generate
```

**Output:**
```
🔍 Detecting changes...
📝 1 files changed:
   - lib/services/order-service.ts

🔍 Running TypeDoc...
✅ TypeDoc extraction complete

📖 Loading project context...
✅ Context loaded

📦 Incremental regeneration: 1 modules

   Changed modules:
   - services/order-service

   ♻️  Preserving 9 unchanged modules

🤖 Generating documentation with Claude...

   📝 Processing: services/order-service...
   ✅ Generated services/order-service (12,453 chars)

💾 Writing documentation files...
   ✅ services-order-service.md

📚 Generating index...
   ✅ README.md (index)

==================================================
✅ Documentation generation complete!
📂 View docs at: docs/api/generated/README.md

💰 Cost savings: ~90% (regenerated 1/10 modules)
```

**Cost:** ~$0.08 instead of $0.84

---

### Example 2: Changed Brand Voice Guide

```bash
# You edited: docs/BRAND_VOICE_GUIDE.md
git diff --name-only HEAD~1 HEAD
# Output: docs/BRAND_VOICE_GUIDE.md

npm run docs:generate
```

**Output:**
```
🔍 Detecting changes...
📝 1 files changed:
   - docs/BRAND_VOICE_GUIDE.md

⚡ Critical files changed, forcing full regeneration
   (brand voice guide, claude.md, or script itself)

📦 Full regeneration: 10 modules

🤖 Generating documentation with Claude...
   ... (all 10 modules)

💰 Cost savings: 0% (regenerated 10/10 modules)
```

**Why full?** Brand voice affects ALL docs, so everything needs updating.

**Cost:** ~$0.84 (full regeneration)

---

### Example 3: Changed Non-Library File

```bash
# You edited: app/page.tsx (Next.js page, not lib/)
git diff --name-only HEAD~1 HEAD
# Output: app/page.tsx

npm run docs:generate
```

**Output:**
```
🔍 Detecting changes...
📝 1 files changed:
   - app/page.tsx

ℹ️  No module source files changed (only non-lib/ files)
   Skipping documentation generation

✅ No regeneration needed
```

**Why skip?** Only `lib/` files are documented, so no docs need updating.

**Cost:** $0.00 (no API calls)

---

### Example 4: Multiple Services Changed

```bash
# You edited:
# - lib/services/order-service.ts
# - lib/services/stripe-service.ts
# - lib/utils/logger.ts

npm run docs:generate
```

**Output:**
```
🔍 Detecting changes...
📝 3 files changed:
   - lib/services/order-service.ts
   - lib/services/stripe-service.ts
   - lib/utils/logger.ts

📦 Incremental regeneration: 3 modules

   Changed modules:
   - services/order-service
   - services/stripe-service
   - utils/logger

   ♻️  Preserving 7 unchanged modules

🤖 Generating documentation with Claude...
   (3 modules)

💰 Cost savings: ~70% (regenerated 3/10 modules)
```

**Cost:** ~$0.25 instead of $0.84

---

## File-to-Module Mapping

The system maps changed files to TypeDoc modules:

```bash
lib/services/order-service.ts       → services/order-service
lib/services/stripe-service.ts      → services/stripe-service
lib/utils/logger.ts                 → utils/logger
lib/mappers/product-mapper.ts       → mappers/product-mapper
lib/auth/session.ts                 → auth/session
lib/auth/guards.ts                  → auth/guards
lib/contacts/subscribe.ts           → contacts/subscribe
```

**Parent directory changes:**
```bash
# If you change: lib/services/order-service.ts
# Affected modules:
#   - services/order-service (exact match)
#
# If TypeDoc groups functions differently:
#   - services/order-service/createOrder
#   - services/order-service/getOrder
# Both regenerated (parent match)
```

---

## GitHub Actions Integration

The workflow automatically uses incremental generation:

```yaml
# .github/workflows/generate-docs.yml
- name: Generate documentation with Claude
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: npm run docs:generate  # ← Incremental by default
```

**Behavior:**
- Detects changed files in push
- Only regenerates affected modules
- Commits back to repo (if docs changed)

**Force full regeneration (if needed):**
```yaml
run: npm run docs:generate:full  # Or FORCE_FULL=true npm run docs:generate
```

---

## Preserving Existing Docs

### How It Works

1. **Before generation:** Read existing doc files
   ```bash
   ls docs/api/generated/
   # services-order-service.md
   # services-stripe-service.md
   # utils-logger.md
   # ... (10 files)
   ```

2. **During generation:** Only regenerate changed modules
   ```bash
   # Changed: services/order-service.ts
   # Generate: services-order-service.md (new)
   # Preserve: stripe-service.md, logger.md, etc. (unchanged)
   ```

3. **After generation:** Merge new + existing
   ```bash
   ls docs/api/generated/
   # services-order-service.md       ← NEW (regenerated)
   # services-stripe-service.md      ← PRESERVED
   # utils-logger.md                 ← PRESERVED
   # ... (10 files total)
   ```

4. **Update index:** README.md lists all modules
   ```markdown
   ## Modules by Category

   ### Services
   - [services/order-service](./services-order-service.md)  ← NEW
   - [services/stripe-service](./services-stripe-service.md)  ← PRESERVED

   ### Utils
   - [utils/logger](./utils-logger.md)  ← PRESERVED
   ```

---

## Edge Cases Handled

### First Run (No Existing Docs)
```bash
# No docs/api/generated/ folder exists
npm run docs:generate

# → Full regeneration (nothing to preserve)
```

### All Files Changed
```bash
# Git shows: 15 files changed in lib/
npm run docs:generate

# → Regenerates all affected modules
# (Still uses incremental logic, just happens to be all of them)
```

### Deleted Module
```bash
# You deleted: lib/services/old-service.ts
npm run docs:generate

# → old-service.md remains in docs/api/generated/
# (Manual cleanup needed, or run docs:clean)
```

**To clean up deleted modules:**
```bash
npm run docs:clean        # Delete all generated docs
npm run docs:generate:full  # Regenerate from scratch
```

---

## Troubleshooting

### "No module source files changed"

**Cause:** You only changed files outside `lib/`

**Solution:** This is correct behavior! Only `lib/` files are documented.

### Incremental generation looks wrong

**Force full regeneration:**
```bash
npm run docs:generate:full
```

### Want to see what changed?

**Check git diff manually:**
```bash
git diff --name-only HEAD~1 HEAD
```

### Cost still seems high

**Check your git commit history:**
```bash
git log --oneline -10

# Are you committing lots of files at once?
# Consider smaller, focused commits
```

---

## Monitoring Costs

### Per-Run Cost Report

Every run shows cost savings:
```
💰 Cost savings: ~90% (regenerated 1/10 modules)
```

### Monthly Tracking

Track costs in Anthropic Console:
https://console.anthropic.com/settings/usage

**Expected monthly usage (incremental):**
- ~20 pushes/month
- ~50% trigger doc regeneration (only lib/ changes)
- ~1-2 modules per run on average
- **Total: ~$2-4/month**

Compare to full regeneration: **~$17/month**

**Savings: ~$13-15/month (80-90% reduction)**

---

## Best Practices

### 1. Commit Smaller Changes
```bash
# ✅ Good: Focused commit
git add lib/services/order-service.ts
git commit -m "feat: add order cancellation"

# ❌ Bad: Kitchen sink commit
git add lib/services/*.ts lib/utils/*.ts
git commit -m "feat: various updates"
```

**Why:** Smaller commits = fewer modules regenerated = lower costs

### 2. Group Related Changes
```bash
# If editing multiple files for same feature:
git add lib/services/order-service.ts lib/utils/order-helpers.ts
git commit -m "feat: order cancellation flow"

# Both modules regenerated in one run (still cheaper than full)
```

### 3. Separate JSDoc Updates
```bash
# If improving docs without code changes:
git add lib/services/order-service.ts
git commit -m "docs: improve order-service JSDoc comments"

# Only order-service docs regenerated
```

### 4. Use Full Regeneration Sparingly
```bash
# Only use --full when:
# - First time setup
# - Major refactor across many modules
# - Brand voice guide changed
# - Want to verify everything is fresh

npm run docs:generate:full
```

---

## Architecture Benefits

### 1. **Pay for What You Use**
Only regenerate docs that need updating.

### 2. **Faster Execution**
1-2 modules: ~30 seconds
10 modules: ~3 minutes

### 3. **Lower GitHub Actions Usage**
Shorter workflow runs = more free minutes

### 4. **Same Quality**
Incremental docs are identical to full regeneration.

### 5. **Smart Fallbacks**
Auto-detects when full regeneration is needed.

---

## Summary

```
┌─────────────────────────────────────────────────┐
│  Incremental Documentation Generation           │
├─────────────────────────────────────────────────┤
│                                                 │
│  Default:  npm run docs:generate                │
│  → Detects changed files                        │
│  → Only regenerates affected modules            │
│  → Preserves existing docs                      │
│  → 80-90% cost savings                          │
│                                                 │
│  Full:     npm run docs:generate:full           │
│  → Regenerates everything                       │
│  → Use for major changes                        │
│                                                 │
│  Auto-triggers full regeneration when:          │
│  - Brand voice guide changed                    │
│  - Script or config changed                     │
│  - No git history (first run)                   │
└─────────────────────────────────────────────────┘
```

**Result:** Documentation that stays in sync with code, efficiently. 🎉
