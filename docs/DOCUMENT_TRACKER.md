# Document Tracker - Documentation Relationship Map

**Purpose:** Map dependencies between code changes and documentation that needs updating. Used by Dr. Clean for targeted documentation consistency scans.

**Last Updated:** 2025-10-27

---

## How to Use This File

### For Developers
When you make changes, check this tracker to see which docs might need updating. Add a note in your commit/PR about doc updates.

### For Dr. Clean (QA Agent)
When validating a phase:
1. Check what code changed
2. Look up related docs in this tracker
3. Scan those docs for consistency drift
4. Flag outdated sections in your QA report

---

## Core Documentation Hierarchy

### Tier 1: Project Foundation (Update Rarely, High Impact)
These define "what we're building" and "how we work"

- **`CLAUDE.md`** - AI assistant context (update when philosophy/stack changes)
- **`README.md`** - Project overview for humans (update when setup changes)
- **`docs/PROJECT_OVERVIEW.md`** - Business context, tech stack, philosophy
- **`docs/IMPLEMENTATION_PLAN.md`** - Master roadmap with phase checkboxes

### Tier 2: Technical Architecture (Update When Patterns Change)
These define "how it's built"

- **`docs/DATABASE_SCHEMA.md`** - Table definitions, relationships, rationale
- **`docs/API_ROUTES.md`** - Endpoint specs with examples
- **`docs/COMPONENT_ARCHITECTURE.md`** - React patterns, server/client boundaries
- **`docs/DESIGN_SYSTEM.md`** - UI component library, theme tokens
- **`docs/STYLE_GUIDE.md`** - Visual design patterns, copy guidelines
- **`docs/TESTING_STRATEGY.md`** - Test patterns, coverage targets

### Tier 3: Operational Guides (Update When Processes Change)
These define "how to work with it"

- **`docs/DATABASE_WORKFLOW.md`** - How to manage migrations, seed data
- **`docs/ENVIRONMENTS.md`** - Environment configs, deployment strategy
- **`docs/TYPE_SAFETY_LAYER.md`** - TypeScript patterns, validation
- **`docs/JSON_CONFIG_STRUCTURE.md`** - Product/portfolio config format

### Tier 4: Living Documentation (Update Frequently)
These track "what's happening now"

- **`docs/tasks/Phase X.X - [Feature].md`** - Per-phase task breakdowns
- **`docs/agents/DOCTOR_*.md`** - Agent role definitions
- **`docs/SITEMAP.md`** - Page structure and routes
- **`docs/PAGE_SPECIFICATIONS.md`** - Individual page details

### Tier 5: Module-Specific READMEs (Update With Module)
These explain "how this part works"

- **`db/README.md`** - Database scripts and usage
- **`tests/README.md`** - Testing setup and conventions
- **`docker/README.md`** - Docker environment usage
- **`docker/init-scripts/README.md`** - Database initialization scripts

---

## Change Impact Matrix

### When Database Schema Changes
**Code:** `db/schema.ts`, migrations
**Docs to Update:**
- ✅ `docs/DATABASE_SCHEMA.md` - Table definitions, column specs
- ✅ `docs/DATABASE_WORKFLOW.md` - If migration process changes
- ✅ `docs/API_ROUTES.md` - If endpoints affected by schema changes
- ✅ `CLAUDE.md` - If fundamental data model changes
- 🔍 **Dr. Clean Check:** Verify examples in API_ROUTES.md still match schema

### When API Routes Added/Changed
**Code:** `app/api/**/*.ts`
**Docs to Update:**
- ✅ `docs/API_ROUTES.md` - Add/update endpoint documentation
- ✅ `docs/COMPONENT_ARCHITECTURE.md` - If new data fetching patterns introduced
- ✅ `docs/SITEMAP.md` - If API affects page structure
- 🔍 **Dr. Clean Check:** Ensure request/response examples are accurate

### When Components Added/Refactored
**Code:** `components/**/*.tsx`, `app/**/*.tsx`
**Docs to Update:**
- ✅ `docs/COMPONENT_ARCHITECTURE.md` - If new patterns introduced
- ✅ `docs/DESIGN_SYSTEM.md` - If UI components added/changed
- ✅ `docs/STYLE_GUIDE.md` - If visual patterns change
- ✅ `docs/SITEMAP.md` - If page structure changes
- ✅ `docs/PAGE_SPECIFICATIONS.md` - If specific pages change
- 🔍 **Dr. Clean Check:** Component examples still work, imports correct

### When Design System Changes
**Code:** `components/ui/**/*.tsx`, `app/globals.css`
**Docs to Update:**
- ✅ `docs/DESIGN_SYSTEM.md` - Component API, theme tokens
- ✅ `docs/STYLE_GUIDE.md` - Visual patterns, usage guidelines
- ✅ `CLAUDE.md` - If design philosophy changes
- 🔍 **Dr. Clean Check:** All component examples render correctly

### When Product Catalog Changes
**Code:** `config/products/*.json`, product-related components
**Docs to Update:**
- ✅ `docs/PRODUCT_CATALOG.md` - Product specs, SKUs, variants
- ✅ `docs/JSON_CONFIG_STRUCTURE.md` - If config format changes
- ✅ `CLAUDE.md` - If product strategy changes (limited editions, etc.)
- ✅ `docs/DATABASE_SCHEMA.md` - If product data model changes
- 🔍 **Dr. Clean Check:** JSON examples valid, product counts accurate

### When Testing Strategy Changes
**Code:** `tests/**/*.test.ts`, `vitest.config.ts`, `playwright.config.ts`
**Docs to Update:**
- ✅ `docs/TESTING_STRATEGY.md` - Patterns, coverage targets, conventions
- ✅ `tests/README.md` - Running tests, writing new tests
- ✅ `CLAUDE.md` - If test-first workflow changes
- 🔍 **Dr. Clean Check:** Test commands in docs still work

### When Environment/Deployment Changes
**Code:** `docker/**/*`, `.env.*`, deployment scripts
**Docs to Update:**
- ✅ `docs/ENVIRONMENTS.md` - Environment configs, deployment process
- ✅ `docker/README.md` - Docker usage instructions
- ✅ `README.md` - Setup instructions
- ✅ `CLAUDE.md` - If environment strategy changes
- 🔍 **Dr. Clean Check:** Docker commands work, port numbers correct

### When Phase Completed
**Code:** All changes in that phase
**Docs to Update:**
- ✅ `docs/IMPLEMENTATION_PLAN.md` - Mark checkboxes, update status
- ✅ `docs/tasks/Phase X.X - [Feature].md` - Mark status as COMPLETE
- ✅ `CLAUDE.md` - Update "Current Phase" and "What We've Completed"
- ✅ All related docs above based on what changed in the phase
- 🔍 **Dr. Clean Check:** Phase checklist accurate, no missing completions

### When Tech Stack Changes
**Code:** `package.json`, framework upgrades, new libraries
**Docs to Update:**
- ✅ `docs/PROJECT_OVERVIEW.md` - Tech stack section
- ✅ `CLAUDE.md` - Tech stack, rationale for choices
- ✅ `README.md` - Dependencies, setup instructions
- 🔍 **Dr. Clean Check:** Version numbers consistent, rationale still valid

---

## Dr. Clean Documentation Scan Checklist

Run this checklist at end of each phase:

### 1. Phase Completion Accuracy
- [ ] `docs/IMPLEMENTATION_PLAN.md` checkboxes reflect actual completion
- [ ] `docs/tasks/Phase X.X - [Feature].md` status accurate
- [ ] `CLAUDE.md` "Current Phase" and "What We've Completed" updated

### 2. Code-Documentation Consistency
- [ ] Examples in docs actually work (copy-paste test)
- [ ] File paths in docs point to real files
- [ ] Import statements in examples are correct
- [ ] Type definitions match actual code

### 3. Architectural Drift Detection
- [ ] Component patterns in `COMPONENT_ARCHITECTURE.md` match actual code
- [ ] Database schema in `DATABASE_SCHEMA.md` matches `db/schema.ts`
- [ ] API routes in `API_ROUTES.md` match `app/api/**/*.ts`
- [ ] Design tokens in `DESIGN_SYSTEM.md` match `app/globals.css`

### 4. Stale Information Audit
- [ ] Version numbers consistent across docs
- [ ] "Last Updated" dates accurate
- [ ] "TODO" or "TBD" sections addressed or still valid
- [ ] Deferred items noted consistently

### 5. Missing Documentation
- [ ] New components have entries in `DESIGN_SYSTEM.md` if UI components
- [ ] New API routes documented in `API_ROUTES.md`
- [ ] New patterns documented in `COMPONENT_ARCHITECTURE.md`
- [ ] Breaking changes noted in relevant docs

---

## Documentation Ownership

### Who Updates What

| Document | Primary Owner | Update Trigger |
|----------|--------------|----------------|
| `CLAUDE.md` | Dr. Director | Major philosophy/stack changes |
| `IMPLEMENTATION_PLAN.md` | Dr. Director + All | Phase start/completion |
| `DATABASE_SCHEMA.md` | Developer + Dr. Clean | Schema migrations |
| `API_ROUTES.md` | Developer + Dr. Clean | New/changed endpoints |
| `COMPONENT_ARCHITECTURE.md` | Dr. LeanDev + Dr. Clean | New patterns introduced |
| `DESIGN_SYSTEM.md` | Developer + Dr. Clean | UI component changes |
| `TESTING_STRATEGY.md` | Dr. Testalot + Dr. Clean | Test pattern changes |
| Phase task docs | Developer + Dr. Clean | During/after phase |
| Agent docs | Dr. Director | Role definition changes |

### Dr. Clean's Documentation Role
- **Validate:** Ensure docs match code reality
- **Flag:** Identify drift, stale info, broken examples
- **Enforce:** Docs updated before phase sign-off
- **Report:** Document issues in QA reports with severity

---

## Known Drift Areas (As of 2025-10-27)

### 🔴 High Priority Drift
None currently identified

### 🟡 Medium Priority Drift
None currently identified

### 🔵 Low Priority Drift
- [ ] Module-specific READMEs (`db/`, `tests/`, `docker/`) may need expansion as features grow

### Recently Resolved (2025-10-27)
- [x] `CLAUDE.md` "Current Phase" updated to Phase 2 (was "Documentation Phase")
- [x] `CLAUDE.md` eliminated duplication by pointing to IMPLEMENTATION_PLAN.md as single source of truth
- [x] `README.md` status updated to "Active Development"
- [x] Next.js version corrected (14 → 16) in CLAUDE.md, README.md, COMPONENT_ARCHITECTURE.md, PROJECT_OVERVIEW.md
- [x] Tailwind CSS version specified (v4) in all docs

---

## Future Enhancements

### Automated Drift Detection
- Script to check if file paths in docs exist
- Script to validate JSON examples against schemas
- Script to check if imports in doc examples are valid
- Git hook to remind about doc updates based on changed files

### Documentation Quality Metrics
- Percentage of components documented
- Percentage of API routes documented
- Last-updated dates for all docs
- Broken link detection

### Integration with Development Workflow
- Pull request template with "Documentation Updated" checkbox
- Commit message conventions that trigger doc update reminders
- CI/CD check that fails if docs not updated when certain files change

---

## Usage Examples

### Example 1: Validating Phase 2.4 (Checkout Flow)
**Dr. Clean Process:**
1. See checkout forms added (`app/checkout/**/*.tsx`)
2. Check Change Impact Matrix → "When Components Added/Refactored"
3. Verify updates to:
   - `docs/COMPONENT_ARCHITECTURE.md` (new form patterns?)
   - `docs/DESIGN_SYSTEM.md` (Input/Select/Textarea components added)
   - `docs/SITEMAP.md` (checkout route added)
   - `docs/PAGE_SPECIFICATIONS.md` (checkout page spec added)
   - `docs/API_ROUTES.md` (order creation endpoint)
4. Run Documentation Scan Checklist
5. Report any drift in QA validation

### Example 2: Developer Adding New Feature
**Developer Process:**
1. Start work on user account system
2. Check DOCUMENT_TRACKER.md for related docs
3. Update `docs/DATABASE_SCHEMA.md` (users table)
4. Update `docs/API_ROUTES.md` (auth endpoints)
5. Update `docs/COMPONENT_ARCHITECTURE.md` (auth context pattern)
6. Update `docs/IMPLEMENTATION_PLAN.md` (mark tasks complete)
7. Commit with note: "Updated DATABASE_SCHEMA.md, API_ROUTES.md, COMPONENT_ARCHITECTURE.md"

---

## Maintenance

This document itself should be updated when:
- New doc types added to the project
- New documentation patterns emerge
- Change impact relationships discovered
- Documentation processes evolve

**Maintainer:** Dr. Clean + Dr. Director
**Review Frequency:** Every 2-3 phases or when documentation structure changes

---

**This is a living document. Keep it current!**
