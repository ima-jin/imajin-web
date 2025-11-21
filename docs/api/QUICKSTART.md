# Quick Start: AI-Powered Documentation

**5-minute setup** to start generating beautiful, voice-consistent API documentation.

---

## Step 1: Set API Key (Local Development)

### Get Your Claude API Key
1. Go to https://console.anthropic.com/
2. Navigate to API Keys
3. Create a new key (starts with `sk-ant-api03-...`)

### Set Environment Variable

**macOS/Linux:**
```bash
export ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-api03-YOUR_KEY_HERE"
```

**Windows (CMD):**
```cmd
set ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

**Permanent (add to your shell profile):**
```bash
# ~/.bashrc, ~/.zshrc, or ~/.profile
export ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

---

## Step 2: Generate Documentation

```bash
# Generate docs for all modules
npm run docs:generate
```

**What happens:**
1. ⏳ TypeDoc extracts JSDoc comments from your code
2. 🤖 Claude reads TypeDoc data + brand voice guide
3. ✍️ Claude writes comprehensive, voice-consistent markdown docs
4. 💾 Files saved to `docs/api/generated/*.md`

**Expected output:**
```
🚀 Imajin Documentation Generator
==================================================

🔍 Running TypeDoc to extract API data...
✅ TypeDoc extraction complete

📖 Loading project context...
✅ Context loaded

📦 Found 5 modules to document:
   - services/order-service
   - services/stripe-service
   - utils/logger
   - mappers/product-mapper
   - auth/session

🤖 Generating documentation with Claude...

   📝 Processing: services/order-service...
   ✅ Generated services/order-service (12,453 chars)

   📝 Processing: services/stripe-service...
   ✅ Generated services/stripe-service (10,827 chars)

   ... (etc)

💾 Writing documentation files...

   ✅ services-order-service.md
   ✅ services-stripe-service.md
   ✅ utils-logger.md
   ✅ mappers-product-mapper.md
   ✅ auth-session.md

📚 Generating index...
   ✅ README.md (index)

==================================================
✅ Documentation generation complete!
📂 View docs at: docs/api/generated/README.md
```

---

## Step 3: Review Generated Docs

```bash
# Open the index in your browser or editor
code docs/api/generated/README.md

# Or navigate to the generated folder
cd docs/api/generated
ls -la
```

**Files created:**
```
docs/api/generated/
├── README.md                      # Index with navigation links
├── services-order-service.md      # Order management API docs
├── services-stripe-service.md     # Stripe integration docs
├── utils-logger.md                # Logger utility docs
├── mappers-product-mapper.md      # Product mapper docs
└── auth-session.md                # Auth session docs
```

**Each file includes:**
- Module overview (what/why/when)
- Function reference (params, returns, examples)
- Real code examples
- Error handling guidance
- Implementation notes
- Common patterns & best practices

---

## Step 4: Verify Voice Consistency

Check if generated docs match Imajin's brand voice:

### ✅ Good Signs (Imajin Voice)
- [ ] Professional but accessible tone
- [ ] Technical accuracy without jargon
- [ ] Real, runnable code examples
- [ ] Maker-friendly explanations
- [ ] Clear "why" context (not just "what")
- [ ] No marketing fluff or hype

### ❌ Red Flags (Generic Tech Voice)
- [ ] Excessive adjectives ("revolutionary", "cutting-edge")
- [ ] Vague value props ("best-in-class")
- [ ] Patronizing tone (over-explaining basics)
- [ ] Missing code examples
- [ ] Jargon without explanation

**If red flags appear:**
1. Refine JSDoc comments (Claude's input quality)
2. Update `docs/BRAND_VOICE_GUIDE.md` (Claude's instructions)
3. Adjust prompt in `scripts/generate-docs-with-claude.ts`
4. Regenerate: `npm run docs:generate`

---

## Step 5: Set Up GitHub Actions (Automatic Generation)

### Add API Key as GitHub Secret

1. Go to your repo: https://github.com/ima-jin/imajin-web
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `ANTHROPIC_API_KEY`
5. Value: `sk-ant-api03-YOUR_KEY_HERE`
6. Click "Add secret"

### Test the Workflow

1. Push a change to `lib/**/*.ts` files
2. Go to Actions tab on GitHub
3. Watch "Generate API Documentation" workflow run
4. Docs automatically committed back to repo

**Workflow triggers:**
- Push to `main` with changes in `lib/`
- Changes to brand voice guide
- Manual trigger from Actions UI

---

## Troubleshooting

### "ANTHROPIC_API_KEY environment variable not set"

**Solution:** Set the API key (see Step 1)

```bash
# Verify it's set
echo $ANTHROPIC_API_KEY  # Should print your key
```

### "TypeDoc failed" or "TSC errors"

**Solution:** Fix TypeScript compilation errors first

```bash
npm run type-check  # Check for TS errors
```

### Generated docs have wrong voice

**Solution:** Review and refine brand voice guide

```bash
code docs/BRAND_VOICE_GUIDE.md  # Edit voice guidelines
npm run docs:generate           # Regenerate with new guide
```

### API rate limit errors

**Solution:** Wait a few minutes, Claude has generous limits

If hitting limits frequently:
- Generate fewer modules per run
- Use `claude-haiku` for cheaper/faster generation (edit script)
- Increase delay between API calls

### No changes detected in GitHub Actions

**Solution:** Docs only regenerate if they actually change

- Make substantive JSDoc edits
- Update brand voice guide
- Manually trigger workflow from Actions UI

---

## Cost Management

### Typical Costs

**Per generation run:**
- ~$0.84 for 10 modules (5K tokens each)

**Monthly (estimated):**
- ~$8.40 (10 pushes triggering regeneration)

**Ways to reduce:**
1. Only trigger on JSDoc changes (not all code)
2. Generate docs for changed modules only (incremental)
3. Use `claude-haiku` for simple modules
4. Cache TypeDoc output between runs

### Monitor Usage

Check your API usage at:
https://console.anthropic.com/settings/usage

---

## Next Steps

### Improve Your JSDoc Comments

Better input = better output. For each function:

```typescript
/**
 * One-sentence summary of what this does
 *
 * 2-3 sentences explaining:
 * - Why this function exists (problem it solves)
 * - When to use it (use cases)
 * - Important context (architecture, trade-offs)
 *
 * @param userId - User's database ID (not email)
 * @param options - Configuration options (optional)
 * @returns User object with populated fields, or null if not found
 * @throws {DatabaseError} If connection fails
 * @throws {ValidationError} If userId is invalid
 *
 * @example
 * const user = await getUser('user_123');
 * if (user) {
 *   console.log(user.email);
 * }
 */
export async function getUser(
  userId: string,
  options?: GetUserOptions
): Promise<User | null> {
  // Implementation
}
```

### Add More Modules

Edit `typedoc.json` to include more code:

```json
{
  "entryPoints": [
    "lib/services",
    "lib/utils",
    "lib/mappers",
    "lib/auth",
    "lib/contacts",
    "lib/validation",  // ← Add new modules here
    "components/ui"    // ← Even React components!
  ]
}
```

### Customize the Prompt

Edit `scripts/generate-docs-with-claude.ts` to:
- Change tone (more casual, more formal)
- Add specific sections (security notes, performance tips)
- Generate different formats (OpenAPI, Swagger)
- Include diagrams (Mermaid syntax)

---

## What You've Built

```
┌───────────────────────────────────────────────┐
│  AI-Powered Documentation System              │
├───────────────────────────────────────────────┤
│                                               │
│  📝 TypeDoc         → Extracts JSDoc          │
│  🤖 Claude API      → Writes beautiful prose  │
│  📖 Brand Voice     → Ensures consistency     │
│  ⚙️ GitHub Actions  → Automates everything    │
│                                               │
│  Result: Docs that stay in sync with code    │
│          and sound authentically "Imajin"     │
└───────────────────────────────────────────────┘
```

**You now have:**
- ✅ TypeDoc configured for your codebase
- ✅ Brand voice guide for AI generation
- ✅ Claude integration script
- ✅ npm scripts for easy use
- ✅ GitHub Actions workflow for automation
- ✅ Comprehensive documentation

**Run it:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run docs:generate
```

🎉 **You're done!** Check `docs/api/generated/` for your docs.

---

**Questions?** See:
- [Full docs](./README.md) - Complete system documentation
- [Brand voice guide](../BRAND_VOICE_GUIDE.md) - Voice guidelines
- [Project context](../../claude.md) - Imajin philosophy & architecture
