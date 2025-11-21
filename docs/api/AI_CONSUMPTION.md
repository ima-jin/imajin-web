# AI Consumption Guide

**These docs exist for AI agents to understand your codebase.**

---

## Quick Facts

**Location:** `docs/api/generated/*.md`
**Format:** Markdown (AI-friendly)
**Committed to:** Git (always in sync)
**Hosted:** Not hosted (no need - AI reads from repo)
**Cost:** ~$2-4/month (incremental generation)

---

## How AI Uses These Docs

### **Claude Code (This Tool)**
```
You: "How do I create an order?"

Claude Code:
1. Reads docs/api/generated/services-order-service.md
2. Sees function signature, params, examples
3. Answers: "Use createOrder() with these params..."
4. Shows real code example from docs
```

### **Cursor / Copilot**
```
You type: "createOrder("

IDE:
1. Scans docs/api/generated/
2. Finds createOrder function
3. Autocompletes with correct types
4. Shows inline documentation
```

### **Future CLI Tool**
```bash
imajin-cli docs search "order"
# → Searches generated markdown files
# → Returns: createOrder, getOrder, updateOrderStatus

imajin-cli ai "How do I refund an order?"
# → AI reads docs + code
# → Returns: Step-by-step guide with code examples
```

---

## What Gets Generated

### **Module Overview**
- What the module does
- Why it exists (problem it solves)
- When to use it

### **Function Documentation**
- Clear signature with types
- Parameter descriptions
- Return value explanation
- **Real, runnable code examples**
- Error handling guidance
- Implementation notes (why, not just what)

### **Context & Architecture**
- How it fits into the system
- Related modules
- Best practices
- Common patterns

---

## Why This Approach Works

### **For AI:**
- ✅ Structured markdown (easy to parse)
- ✅ Real code examples (copy-pasteable)
- ✅ Always in sync with code
- ✅ Voice-consistent (sounds like Imajin)
- ✅ Architecture context (not just API reference)

### **For You:**
- ✅ No hosting complexity
- ✅ No website to maintain
- ✅ Auto-updates on code changes
- ✅ Works with all AI tools
- ✅ Cost-efficient (~$2-4/month)

---

## File Structure

```
docs/api/generated/
├── README.md                       # Index (AI reads this first)
│   ├── Links to all modules
│   └── Last updated timestamp
│
├── services-order-service.md       # Order management
│   ├── createOrder()
│   ├── getOrder()
│   └── updateOrderStatus()
│
├── services-stripe-service.md      # Stripe integration
│   ├── createCheckoutSession()
│   ├── getCheckoutSession()
│   └── verifyWebhookSignature()
│
├── utils-logger.md                 # Logging utility
│   ├── logger.info()
│   ├── logger.error()
│   └── logger.syncStart()
│
└── ...                             # More modules
```

---

## When Docs Regenerate

### **Auto-triggered (GitHub Actions):**
```
Push to main with lib/ changes
  ↓
GitHub Actions runs docs:generate
  ↓
Incremental generation (only changed modules)
  ↓
Commits updated markdown back to repo
  ↓
AI has fresh context
```

### **Manual:**
```bash
npm run docs:generate        # Incremental
npm run docs:generate:full   # Full regeneration
```

---

## AI Reading Workflow

```
┌─────────────────────────────────────────────┐
│  User Question                              │
│  "How do I create an order?"                │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  AI Agent (Claude / Cursor / etc.)          │
│  1. Parse question                          │
│  2. Identify relevant modules               │
│     → "order" keyword → order-service       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Read Generated Docs                        │
│  docs/api/generated/services-order-service.md│
│  - Function signature                       │
│  - Parameters + types                       │
│  - Real code example                        │
│  - Architecture context                     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  AI Response                                │
│  "Use the createOrder() function:           │
│                                             │
│  const order = await createOrder({          │
│    sessionId: 'cs_...',                     │
│    items: [...],                            │
│    customerEmail: 'user@example.com'        │
│  });                                        │
│                                             │
│  This runs in a transaction to ensure       │
│  atomic inventory updates..."               │
└─────────────────────────────────────────────┘
```

---

## Why Not Host on Website?

**You asked:** "where do the docs end up? in git? and hosted somewhere?"

**Answer:** Just in git, not hosted.

**Why this is better for AI:**
1. **No hosting complexity** - AI reads from repo directly
2. **Always fresh** - AI gets latest on every pull
3. **No latency** - Local filesystem access
4. **No deployment** - Just commit and push
5. **Cost-efficient** - No hosting fees

**AI doesn't need a website:**
- AI can read markdown natively
- AI doesn't need fancy UI
- AI wants structured content (markdown is perfect)

---

## Future: imajin-cli

When this moves to the CLI tool:

```bash
# Generate docs
imajin-cli docs generate

# Search docs
imajin-cli docs search "checkout"

# View specific module
imajin-cli docs show services/order-service

# AI-powered help
imajin-cli ai "How do I handle deposits?"
# → AI reads docs + code, answers question
```

**The markdown files are already CLI-ready:**
- Easy to parse (structured markdown)
- Terminal-friendly (no HTML/CSS)
- Code examples copy-pasteable

---

## Cost Efficiency

### **Incremental Generation (Default):**
```
Typical push: 1-2 files changed
              1-2 modules regenerated
              $0.08-0.16 per run
              ~$2-4/month
```

### **Full Regeneration:**
```
Brand voice changed: All modules regenerated
                     $0.84 per run
                     Used rarely (1-2x/month)
```

**Total monthly cost:** ~$2-4 for always-fresh AI context

---

## Key Takeaway

```
┌───────────────────────────────────────────────┐
│  AI-First Documentation System                │
├───────────────────────────────────────────────┤
│                                               │
│  📝 Generated by: TypeDoc + Claude            │
│  📂 Stored in: Git (docs/api/generated/)      │
│  🤖 Consumed by: AI agents                    │
│  🌐 Hosted: Not hosted (AI reads from repo)   │
│  💰 Cost: ~$2-4/month                          │
│  🔄 Updates: Auto (on code changes)           │
│  🚀 Future: Moves to imajin-cli               │
│                                               │
│  Result: AI always has accurate, fresh        │
│          context about your codebase          │
└───────────────────────────────────────────────┘
```

---

**Questions?** See:
- [Full System Docs](./README.md)
- [Incremental Generation](./INCREMENTAL_GENERATION.md)
- [Quick Start](./QUICKSTART.md)
