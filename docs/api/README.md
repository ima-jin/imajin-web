# API Documentation System

**AI-powered documentation generation** for the Imajin platform, combining TypeDoc extraction with Claude's natural language generation.

**Primary Use Case:** AI consumption (Claude Code, Cursor, Copilot) and internal team reference. These docs stay in git and are read by AI agents to understand the codebase. No hosting required.

---

## How It Works

```
┌─────────────────┐
│  TypeScript     │
│  Source Code    │ (lib/services, lib/utils, etc.)
│  + JSDoc        │
└────────┬────────┘
         │
         │ 1. Extract
         ▼
┌─────────────────┐
│    TypeDoc      │ Parses JSDoc comments,
│                 │ generates structured JSON
└────────┬────────┘
         │
         │ 2. Analyze
         ▼
┌─────────────────┐
│  Claude API     │ Reads:
│  (Sonnet 4)     │ - TypeDoc JSON
│                 │ - Brand Voice Guide
│                 │ - Project Context (claude.md)
│                 │
│                 │ Generates:
│                 │ - Comprehensive markdown docs
│                 │ - Voice-consistent explanations
│                 │ - Real code examples
└────────┬────────┘
         │
         │ 3. Write
         ▼
┌─────────────────┐
│  Markdown Docs  │ docs/api/generated/*.md
│  (Beautiful)    │ - Services reference
│                 │ - Utilities reference
│                 │ - Usage examples
└─────────────────┘
```

---

## Quick Start

### Prerequisites

1. **ANTHROPIC_API_KEY** environment variable set
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Dependencies installed**
   ```bash
   npm install
   ```

### Generate Documentation Locally

```bash
# Full generation (TypeDoc + Claude)
npm run docs:generate

# Just run TypeDoc (no Claude)
npm run docs:typedoc

# Clean generated files
npm run docs:clean
```

### Output Location

Generated docs will be in:
```
docs/api/generated/
├── README.md                      # Index with navigation
├── services-order-service.md      # Order management docs
├── services-stripe-service.md     # Stripe integration docs
├── utils-logger.md                # Logger utility docs
└── ...                            # More modules
```

---

## Automatic Generation (CI/CD)

Documentation is **automatically generated** when you push to `main`:

### Trigger Conditions
- Changes to `lib/**/*.ts` files
- Changes to `scripts/generate-docs-with-claude.ts`
- Changes to `docs/BRAND_VOICE_GUIDE.md`
- Changes to `claude.md`

### Workflow Steps
1. GitHub Action detects changes
2. Runs TypeDoc to extract API data
3. Calls Claude API to generate docs
4. Commits new docs back to repo (if changed)
5. Pushes to `main` with `[skip ci]` tag

### Manual Trigger
You can also trigger manually from GitHub Actions UI:
- Go to Actions tab
- Select "Generate API Documentation"
- Click "Run workflow"

---

## Configuration

### TypeDoc Settings
**File:** `typedoc.json`

```json
{
  "entryPoints": [
    "lib/services",   // Service layer
    "lib/utils",      // Utility functions
    "lib/mappers",    // Data mappers
    "lib/auth",       // Authentication
    "lib/contacts"    // Contact management
  ],
  "json": "docs/api/typedoc-data.json",  // Structured output for Claude
  "out": "docs/api/typedoc-output"       // HTML output (optional)
}
```

**To add new modules:**
1. Add path to `entryPoints` array
2. Run `npm run docs:generate`

### Brand Voice Guide
**File:** `docs/BRAND_VOICE_GUIDE.md`

Defines Imajin's brand voice for AI-generated content:
- Tone: Professional, maker-friendly, no-nonsense
- Audience: DIY makers, developers, commercial installers
- Principles: Clarity, accuracy, transparency
- Examples: Good vs bad voice samples

**This file is fed to Claude** to ensure voice consistency.

### Claude Generation Script
**File:** `scripts/generate-docs-with-claude.ts`

Main orchestration script:
1. Runs TypeDoc extraction
2. Loads brand voice guide + project context
3. Groups functions by module
4. Calls Claude API for each module
5. Writes markdown files

**Model:** `claude-sonnet-4` (best for technical writing)
**Max tokens:** 8,192 per module
**Context includes:** TypeDoc data, brand voice, CLAUDE.md excerpt

---

## Cost Estimation

### API Usage Per Run

**Typical project structure:**
- 5-10 modules (services, utils, mappers)
- ~3,000 input tokens per module (TypeDoc + context)
- ~5,000 output tokens per module (generated docs)

**Estimated cost per full generation:**
- Input: 10 modules × 3,000 tokens × $0.003/1K = $0.09
- Output: 10 modules × 5,000 tokens × $0.015/1K = $0.75
- **Total: ~$0.84 per run**

**Monthly cost (estimated):**
- ~20 pushes to main per month
- ~50% trigger doc regeneration (code changes in lib/)
- **~$8.40/month**

**Ways to reduce costs:**
1. Only trigger on JSDoc comment changes (not all code changes)
2. Generate docs for changed modules only (incremental)
3. Use `claude-haiku` for smaller modules
4. Cache TypeDoc output between runs

---

## Maintenance

### Updating Brand Voice

1. Edit `docs/BRAND_VOICE_GUIDE.md`
2. Push to `main`
3. Docs regenerate automatically with new voice guidelines

### Adding New Modules

1. Write code with JSDoc comments
2. Add module path to `typedoc.json`
3. Run `npm run docs:generate`

### Quality Check

Before committing generated docs:
1. **Voice consistency:** Does it sound like Imajin?
2. **Technical accuracy:** Match code behavior?
3. **Completeness:** All functions documented?
4. **Examples:** Code samples work?

If quality issues:
- Refine JSDoc comments (Claude's input)
- Update brand voice guide (Claude's instructions)
- Adjust prompt in `generate-docs-with-claude.ts`

---

## Troubleshooting

### "ANTHROPIC_API_KEY not set"
```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

### "TypeDoc failed"
Check TypeScript compilation errors:
```bash
npm run type-check
```

### "Module not found"
Ensure module exists in `typedoc.json` entryPoints.

### Generated docs have wrong voice
1. Review `docs/BRAND_VOICE_GUIDE.md`
2. Check examples (Good vs Bad)
3. Refine prompt in `scripts/generate-docs-with-claude.ts`

### API rate limits
Claude API has generous limits, but if hit:
- Wait a few minutes
- Use `claude-haiku` for faster/cheaper generation
- Generate fewer modules per run

---

## Architecture Decisions

### Why TypeDoc + Claude?

**TypeDoc alone:**
- ✅ Parses JSDoc perfectly
- ❌ Generates mechanical, dry docs
- ❌ No context, no storytelling
- ❌ No brand voice consistency

**Claude alone:**
- ✅ Beautiful prose, great voice
- ❌ May hallucinate function signatures
- ❌ Hard to keep in sync with code

**TypeDoc + Claude (hybrid):**
- ✅ TypeDoc ensures technical accuracy
- ✅ Claude adds context, examples, voice
- ✅ Best of both worlds

### Why Not Just TypeDoc?

Traditional doc generators (TypeDoc, JSDoc, Doxygen) produce **reference documentation**, which is:
- Accurate but mechanical
- Lists parameters without explaining *why*
- No usage examples or narratives
- Generic voice, no brand personality

Imajin needs **developer advocacy documentation**:
- Explains *why* functions exist
- Shows real-world usage patterns
- Captures maker-friendly tone
- Progressive complexity (beginner → advanced)

### Why Not Manual Docs?

Manual documentation:
- ✅ Full control
- ❌ Always outdated (code changes faster)
- ❌ Inconsistent voice (multiple writers)
- ❌ Time-consuming (hours per module)

AI-generated docs:
- ✅ Stay in sync with code (regenerate on change)
- ✅ Consistent voice (same prompt/guide)
- ✅ Fast (minutes for entire project)
- ⚠️ Requires good JSDoc input

---

## AI Consumption

These docs are designed for **AI agents to read and understand the codebase**.

### How AI Uses These Docs

**Claude Code / Cursor / Copilot:**
1. User asks: "How do I create an order?"
2. AI reads: `docs/api/generated/services-order-service.md`
3. AI responds with accurate, context-aware answer
4. Code examples are copy-pasteable

**Benefits:**
- ✅ Always in sync with code (auto-regenerated)
- ✅ Voice-consistent explanations
- ✅ Real code examples (not pseudo-code)
- ✅ Architecture context (why, not just what)

### File Locations

```
docs/api/generated/
├── README.md                      # Index (AI reads this first)
├── services-order-service.md      # Order management
├── services-stripe-service.md     # Stripe integration
├── utils-logger.md                # Logging utility
└── ...                            # More modules
```

**AI reads from:**
- Local filesystem (during development)
- GitHub repo (in CI/CD or remote sessions)

---

## Future: imajin-cli Integration

**Planned migration:**
- Move documentation system to `imajin-cli` tool
- CLI can generate/update docs
- CLI can query docs (e.g., `imajin-cli docs search "order"`)
- CLI can use AI to answer questions about codebase

**Current markdown format is CLI-ready:**
- Structured, parseable
- Terminal-friendly
- Code examples copy-pasteable

---

## Future Enhancements

### Planned
- [x] Incremental generation (only changed modules) - **DONE**
- [ ] JSON index for faster AI parsing
- [ ] API changelog generation (from git diff)
- [ ] Migration to imajin-cli tool

### Experimental
- [ ] Mermaid diagrams (architecture visualization)
- [ ] OpenAPI spec generation (REST API docs)
- [ ] Multi-audience docs (dev vs business)
- [ ] Tutorial series (multi-part guides)

---

## Credits

**Documentation System:**
- **TypeDoc** - JSDoc extraction
- **Claude Sonnet 4** - Content generation
- **Dr. Wordsmith** - Brand voice consistency
- **GitHub Actions** - Automation

**Maintained by:** Imajin Platform Team
**Last Updated:** 2025-11-21

---

**Questions?** See the [main project README](../../README.md) or [CLAUDE.md](../../claude.md) for context.
