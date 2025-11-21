# Brand Voice Guide for AI-Generated Documentation

**Project:** Imajin LED Platform
**Purpose:** Ensure consistent brand voice across all AI-generated documentation

---

## Core Brand Voice

### Tone
- **Professional** - Technically accurate, reliable, authoritative
- **Confident** - Know our stuff, not apologetic
- **Innovative but accessible** - Cutting-edge tech explained clearly
- **No-nonsense** - Direct communication, no fluff

### Personality
- **Maker-friendly** - Respect DIY audience intelligence
- **Technically competent** - Don't dumb down, don't over-explain basics
- **Transparent** - Honest about limitations, trade-offs, architecture decisions
- **Empowering** - Users own their hardware, data, and creations

---

## Philosophy (Critical Context)

### Self-Hosted & True Ownership
- **No subscriptions** - Strong philosophical stance, one-time purchases only
- **Self-hosted** - Full control, no vendor lock-in
- **Decentralization-ready** - Every device can be a hub
- **User ownership** - Hardware, data, identity, creations all belong to user

### Trust Hub Federation
- Vision: Decentralized marketplace where every Imajin unit can run as a hub
- Today: Centralized (imajin.ca)
- Future: Federated, P2P, DID-based identity
- Architecture supports all scales without breaking changes

---

## Writing Guidelines

### Do ✅
- **Simple language** beats clever wordplay
- **Active voice, present tense** - "The function creates an order" not "An order is created"
- **Scannable structure** - Headers, bullets, short paragraphs
- **Technical accuracy** - Cite actual code, types, behaviors
- **Benefit-driven explanations** - Why this matters, not just what it does
- **Progressive disclosure** - Start simple, layer in complexity
- **Real code examples** - Runnable code, not pseudo-code

### Don't ❌
- **Marketing fluff** - No "revolutionary", "game-changing", "cutting-edge"
- **Hype language** - No excessive adjectives, superlatives
- **Jargon without explanation** - Define terms on first use
- **Patronizing tone** - Don't over-explain basics to DIY/maker audience
- **Vague value props** - Be specific about benefits
- **Subscription mentions** - Philosophical no-go

---

## Audience Profiles

### Primary: DIY Makers & Developers
- **Skill level:** Intermediate to advanced
- **Mindset:** Self-reliant, curious, values control and transparency
- **Needs:** Technical accuracy, real examples, architectural context
- **Respect their intelligence:** Don't over-explain basics

### Secondary: Commercial Installers
- **Skill level:** Professional, time-sensitive
- **Mindset:** Efficiency-focused, ROI-driven
- **Needs:** Specs, compatibility, scalability info
- **Get to the point:** Scannable, actionable content

### Tertiary: Business Stakeholders
- **Skill level:** Non-technical
- **Mindset:** Outcome-focused, risk-aware
- **Needs:** Value propositions, use cases, measurable benefits
- **Bridge the gap:** Technical concepts in business terms

---

## Voice Examples

### ✅ Good (Imajin Voice)
```markdown
## Creating Orders

The `createOrder` function runs in a database transaction to ensure atomic inventory updates. If any step fails, the entire order creation rolls back—no partial orders, no overselling limited editions.

**Parameters:**
- `sessionId` - Stripe Checkout Session ID (doubles as order ID)
- `items` - Cart items with snapshot data (preserves historical pricing)

**Transaction flow:**
1. Insert order record
2. Insert order items
3. Decrement variant inventory (limited editions only)

**Error handling:**
If inventory is insufficient, the transaction fails before payment processing. Customers never pay for out-of-stock items.
```

### ❌ Bad (Generic Tech Voice)
```markdown
## Orders API - Revolutionary Ordering System

Our cutting-edge order management solution provides industry-leading reliability and unmatched performance! Experience seamless order creation with our advanced transactional architecture.

The createOrder function is an innovative approach to e-commerce that leverages best-in-class database transactions for ultimate consistency. This game-changing API endpoint will transform your ordering workflow!
```

---

## Documentation Structure Patterns

### Function Documentation Template
```markdown
## Function Name

**One-sentence summary** - What it does, why it exists

### Purpose
[2-3 sentences explaining the problem this solves]

### Parameters
- `paramName` (Type) - Concise description with context

### Returns
Type - What you get back, what it means

### Example
[Real, runnable code]

### Error Handling
- What can go wrong
- How errors are communicated
- How to handle them

### Implementation Notes
[Architectural decisions, trade-offs, gotchas]
```

### API Endpoint Template
```markdown
## POST /api/endpoint

**One-sentence summary**

### Request
```json
{
  "field": "value"
}
```

### Response (Success)
```json
{
  "success": true,
  "data": { ... }
}
```

### Response (Error)
```json
{
  "success": false,
  "error": { ... }
}
```

### Business Logic
[What happens behind the scenes]

### Edge Cases
[Scenarios to be aware of]
```

---

## Technical Writing Principles

### Clarity First
- Can a non-expert understand this?
- Are technical terms defined on first use?
- Is the structure scannable (headers, bullets)?
- Does each sentence serve a purpose?

### Accuracy Matters
- Match code behavior exactly
- Cite actual types from codebase
- Include version/deprecation info if relevant
- Don't promise features that don't exist yet

### Context is Key
- Why does this exist? (Problem it solves)
- When should you use it? (Use cases)
- What are the trade-offs? (Limitations)
- How does it fit the bigger picture? (Architecture)

---

## Project-Specific Terminology

### Products & Variants
- **Product** - Base item (e.g., Material-8x8-V LED panel)
- **Variant** - Color/configuration option (BLACK, WHITE, RED)
- **Founder Edition** - Limited run with 10-year warranty + NFT
- **DIY Kit** - Unassembled, maker-friendly packaging
- **5v vs 24v** - Incompatible voltage systems (cannot mix)

### Commerce Terms
- **Stripe Price ID** - Primary pricing identifier (not Product ID)
- **Pre-sale deposit** - Refundable, secures wholesale pricing
- **Pre-order** - Pay remaining balance after deposit
- **Snapshot data** - Historical pricing preserved in orders

### Authentication & Federation
- **Ory Kratos** - Self-hosted identity provider
- **Trust hub** - Hosting node (imajin.ca, user devices)
- **Collective** - Organizational entity (Imajin, artist groups)
- **DID** - Decentralized identifier (W3C standard, future)

---

## When in Doubt

**Ask yourself:**
1. Would a DIY maker respect this explanation?
2. Is this technically accurate without being patronizing?
3. Does this sound like Imajin, or generic tech marketing?
4. Would I want to read this documentation?

**If no to any:** Revise for clarity, accuracy, and authentic voice.

---

**Last Updated:** 2025-11-21
**Maintained by:** Dr. Wordsmith (AI content specialist)
