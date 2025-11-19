# [Phase 6.1] - Trust-Based Support Network: TDD Task Specification

**Type:** Feature
**Priority:** MEDIUM
**Status:** 🟡 Ready for Grooming
**Estimated Effort:** 70-86 hours (2-3 weeks)
**Dependencies:** Phase 4.4 complete (Ory Kratos authentication)
**Grooming Status:** ❌ Not Started

---

## Overview

Implement a **trust-based support network** (mutual aid / gift economy system) where users maintain two lists:

1. **Offers** - What you have capacity to give (tasks, skills, resources, time)
2. **Needs** - What you need help with (tasks, skills, resources, time)

Visibility is controlled by trust circles (family, friends, colleagues, public) - you decide who sees what based on your relationship with them.

This is a **gift economy system** aligned with Imajin's sovereignty philosophy - but it can also function as a personal task manager.

### Use Cases

**Solo Mode (Personal Task Manager):**
- Create a "Private" trust circle (only you)
- Add all your needs there as personal TODOs
- Track completion like any task manager
- Optional: Add offers (your availability/capacity)

**Collaborative Mode (Mutual Aid):**
- Create trust circles (Developer Friends, Close Friends, Colleagues)
- Share specific needs with specific circles
- Browse what people in your network need help with
- Respond: "I can help with that!"
- Post offers: "I have capacity for X"

**Example Flows:**

*Personal TODO:*
```
Need (Private circle): "Fix Stripe webhook bug"
→ Work on it
→ Mark fulfilled
```

*Mutual Aid:*
```
Need (Developer Friends): "Debug checkout flow"
→ Alice sees it
→ Alice: "I can help"
→ You accept
→ Alice helps
→ Mark fulfilled by Alice
```

*Capacity Sharing:*
```
Offer (Friends): "Available for coffee chats on Wednesdays"
→ Bob sees it
→ Bob: "Can we chat this Wednesday about React?"
→ You accept
→ Connection made
```

### Goals

1. Enable users to express what they can offer and what they need
2. Support trust-based visibility (role-based circles: family, friends, colleagues, public)
3. Facilitate mutual aid within trust networks
4. Build in imajin-web (service layer + UI), port to imajin-os later

---

## Problem Statement

**Current State:**
- Team needs and offers scattered across post-it notes, SMS messages, various systems
- No unified way to express capacity to help or needs for support
- Existing platforms (LinkedIn, social media) are public or algorithmic, not trust-based
- No system aligned with Imajin's sovereignty and trust network philosophy

**Issues:**
- Don't know what people in your network need help with
- Don't know what people can offer to help you
- Can't control visibility based on trust levels
- Centralized platforms extract value from connections

**Solution:**
Trust-based support network where:
- Each user maintains their offers (capacity) and needs (requests)
- Users control visibility via trust circles (family, friends, colleagues, public)
- Data stored in Postgres DB (imajin-web for now, imajin-os later)
- Uses Ory Kratos user IDs from users table
- Invite system (creates account if needed)
- Future: Port service layer to imajin-os when ready

---

## Architecture

**Current (Phase 6.1):**
```
imajin-web
├── Service Layer (API routes)
├── UI Layer (React components)
└── Database (Postgres - existing)
```

**Future (Phase 7.0+):**
```
imajin-os (node)
  ↓ service layer
  ↓ Postgres DB on device
  ↓
imajin-web
  ↓ UI layer only
  ↓ calls node API
```

---

## Test-First Approach

**TDD Workflow:**
1. **RED:** Write all tests first (they fail)
2. **GREEN:** Implement minimum code to pass tests
3. **REFACTOR:** Clean up implementation while keeping tests green

---

## Implementation Phases

### Phase 1: Offers & Needs (Core) (20-24 hours)

**Goal:** Users can create and manage their offers (capacity to give) and needs (requests for help)

**Deliverables:**
- 2 database tables (support_offers, support_needs)
- 4 API route files (offers, needs CRUD)
- 3 UI components (offer-card, need-card, support-form)
- 3 pages (my support, new offer, new need)
- 82 tests (18 schema + 36 API + 28 UI)

### Phase 2: Trust Circles (24-30 hours)

**Goal:** Users can create trust circles and control visibility of their offers/needs

**Deliverables:**
- 2 database tables (trust_circles, trust_circle_members)
- 3 API route files (circles CRUD, members)
- Visibility logic service
- 2 UI components (circle-selector, circle-manager)
- 1 page (circle management)
- 86 tests (16 schema + 32 API + 20 logic + 18 UI)

### Phase 3: Network View & Responses (16-20 hours)

**Goal:** Users can see their network's needs/offers and respond to help

**Deliverables:**
- 1 database table (support_responses)
- 3 API route files (network view, responses)
- 2 UI components (network-grid, respond-modal)
- 1 page (network view)
- 68 tests (24 API network + 4 schema + 24 API responses + 16 UI)

### Phase 4: Invite System (10-12 hours)

**Goal:** Users can invite others to join their trust circles (even if they haven't used imajin.ca yet)

**Deliverables:**
- 1 database table (trust_circle_invites)
- 3 API route files (invite generation, validation, acceptance)
- 1 UI component (invite-modal)
- 1 page (invite acceptance)
- 48 tests (12 schema + 24 API + 12 UI)

---

## Database Schema

**File:** `db/schema-support.ts`

```typescript
import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { users } from './schema-auth';

// What users can offer (capacity to give)
export const support_offers = pgTable('support_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  type: varchar('type', { length: 20 }).notNull(), // task|skill|resource|time
  title: text('title').notNull(),
  description: text('description'),
  trust_circle_id: uuid('trust_circle_id').notNull(),
  capacity: jsonb('capacity'), // { hours_per_week: 5, quantity: 2, etc. }
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// What users need help with
export const support_needs = pgTable('support_needs', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  type: varchar('type', { length: 20 }).notNull(), // task|skill|resource|time
  title: text('title').notNull(),
  description: text('description'),
  trust_circle_id: uuid('trust_circle_id').notNull(),
  urgency: varchar('urgency', { length: 20 }).notNull().default('medium'), // low|medium|high
  status: varchar('status', { length: 20 }).notNull().default('open'), // open|in_progress|fulfilled
  fulfilled_by: varchar('fulfilled_by', { length: 255 }).references(() => users.id),
  fulfilled_at: timestamp('fulfilled_at'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Trust circles (who can see what)
export const trust_circles = pgTable('trust_circles', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // family|friends|colleagues|public|custom
  description: text('description'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Members of trust circles
export const trust_circle_members = pgTable('trust_circle_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  circle_id: uuid('circle_id').notNull().references(() => trust_circles.id, { onDelete: 'cascade' }),
  member_user_id: varchar('member_user_id', { length: 255 }).notNull().references(() => users.id),
  added_at: timestamp('added_at').notNull().defaultNow(),
});

// Responses to needs (offering to help)
export const support_responses = pgTable('support_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  need_id: uuid('need_id').notNull().references(() => support_needs.id, { onDelete: 'cascade' }),
  responder_user_id: varchar('responder_user_id', { length: 255 }).notNull().references(() => users.id),
  message: text('message'),
  accepted: boolean('accepted'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Invite system (invite people to join trust circles)
export const trust_circle_invites = pgTable('trust_circle_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  circle_id: uuid('circle_id').notNull().references(() => trust_circles.id, { onDelete: 'cascade' }),
  invited_by_user_id: varchar('invited_by_user_id', { length: 255 }).notNull().references(() => users.id),
  token: varchar('token', { length: 64 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  expires_at: timestamp('expires_at').notNull(),
  accepted: boolean('accepted').default(false),
  accepted_by_user_id: varchar('accepted_by_user_id', { length: 255 }).references(() => users.id),
  accepted_at: timestamp('accepted_at'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});
```

---

## API Routes Summary

**Offers:**
- GET /api/support/offers - List my offers
- POST /api/support/offers - Create offer
- PATCH /api/support/offers/[id] - Update offer
- DELETE /api/support/offers/[id] - Delete offer

**Needs:**
- GET /api/support/needs - List my needs
- POST /api/support/needs - Create need
- PATCH /api/support/needs/[id] - Update need
- DELETE /api/support/needs/[id] - Delete need

**Trust Circles:**
- GET /api/trust-circles - List my circles
- POST /api/trust-circles - Create circle
- POST /api/trust-circles/[id]/members - Add member
- DELETE /api/trust-circles/[id]/members/[userId] - Remove member

**Network View:**
- GET /api/support/network/offers - Browse offers from my circles
- GET /api/support/network/needs - Browse needs from my circles

**Responses:**
- POST /api/support/needs/[id]/respond - Offer to help
- PATCH /api/support/needs/[id]/responses/[id] - Accept/decline response

**Invites:**
- POST /api/trust-circles/[id]/invite - Generate invite link
- GET /api/invites/[token] - Validate invite
- POST /api/invites/[token]/accept - Accept invite (creates user if needed)

---

## Test Specification Summary

**Total New Tests: 284**

| Phase | Component | Count |
|-------|-----------|-------|
| 1 | Schema (Offers/Needs) | 18 |
| 1 | API (Offers/Needs) | 36 |
| 1 | UI Components | 28 |
| 2 | Schema (Trust Circles) | 16 |
| 2 | API (Trust Circles) | 32 |
| 2 | Visibility Logic | 20 |
| 2 | UI (Trust Circles) | 18 |
| 3 | API (Network View) | 24 |
| 3 | Schema (Responses) | 4 |
| 3 | API (Responses) | 24 |
| 3 | UI (Network) | 16 |
| 4 | Schema (Invites) | 12 |
| 4 | API (Invites) | 24 |
| 4 | UI (Invites) | 12 |
| **Total** | | **284** |

---

## Acceptance Criteria

**Tests:**
- [ ] All 284 new tests passing
- [ ] All existing tests still passing (1,214/1,214)
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
- [ ] Test coverage: >85%

**Implementation:**
- [ ] Users can create, view, update, delete offers
- [ ] Users can create, view, update, delete needs
- [ ] Users can create trust circles with role-based types
- [ ] Users can add members to circles
- [ ] Users can invite others via link (creates account if needed)
- [ ] Visibility controlled by trust circles
- [ ] Users can browse network's offers/needs
- [ ] Users can respond to needs
- [ ] Need owners can accept responses

**Documentation:**
- [ ] API routes documented
- [ ] Trust circle concept explained
- [ ] Invite flow documented

**Quality Gates:**
- [ ] Security review passed (authorization checks)
- [ ] Privacy: users can only see what they're authorized to see
- [ ] Performance acceptable (<200ms API responses)

---

## Deliverables

1. **Database Schema** - 6 tables
2. **API Routes** - 16 endpoints
3. **UI Components** - 8 components
4. **Pages** - 5 pages
5. **Services** - 1 service (visibility logic)
6. **Tests** - 284 tests
7. **Documentation** - API docs, trust circle guide

**Total Lines of Code:**
- Production: ~3,200 lines
- Tests: ~4,500 lines
- Documentation: ~1,000 lines
- **Total: ~8,700 lines**

---

## Dependencies

**NPM Packages:** None (uses existing stack)

**Environment Variables:** None (uses existing Ory Kratos)

**External Services:**
- Ory Kratos (Phase 4.4)
- PostgreSQL (existing)

---

## Risk Assessment

**High Risk:**
- Visibility logic complexity (trust circles, membership checks)
- Privacy leaks (users seeing offers/needs they shouldn't)

**Mitigations:**
- Comprehensive visibility tests (20 tests)
- Security review focused on authorization
- Paranoid authorization checks on all endpoints

**Medium Risk:**
- Invite system complexity (new users vs existing users)

**Mitigations:**
- Detailed invite flow tests (24 tests)

**Low Risk:**
- Schema changes (new tables, no modifications to existing)

---

## Decisions Made

1. **Use Ory Kratos user IDs from users.id field:** ✅ Approved
2. **Four types (task, skill, resource, time):** ✅ Approved
3. **Role-based trust circles:** ✅ Approved (family, friends, colleagues, public, custom)
4. **Capacity stored as JSONB:** ✅ Approved
5. **Invite creates account if needed:** ✅ Approved
6. **Build in imajin-web, port to imajin-os later:** ✅ Approved
7. **Phase numbering: 6.1 (6.0 = OS applications):** ✅ Approved

## All Decisions Finalized ✅

---

## Future: Port to imajin-os (Phase 7.0+)

When imajin-os is ready:
- Extract API routes to standalone service
- Deploy service layer to imajin-os devices
- imajin-web becomes UI-only (calls node API)
- Data lives on device's Postgres

---

## Timeline Summary

| Phase | Focus | Duration | Tests |
|-------|-------|----------|-------|
| 1 | Offers & Needs (Core) | 20-24h | +82 |
| 2 | Trust Circles | 24-30h | +86 |
| 3 | Network View & Responses | 16-20h | +68 |
| 4 | Invite System | 10-12h | +48 |
| **Total** | | **70-86h** | **+284** |

**Estimated: 2-3 weeks of focused work**

**Test Count Progression:**
- Starting: 1,214/1,214 (100%)
- After Phase 6.1: 1,498/1,498 (+284)

---

## Future Enhancements

- **Phase 6.2:** Matching algorithm (auto-suggest)
- **Phase 6.3:** Reputation system (track fulfillments)
- **Phase 6.4:** Time banking (track hours given/received)
- **Phase 7.0:** Port service layer to imajin-os
- **Phase 7.1:** Multi-device sync
- **Phase 7.2:** Federation (discover across nodes)

---

## Status: Planning

**Ready for:** Grooming Session

---

## Grooming Session

**⚠️ MANDATORY: All Doctors must review and approve before implementation begins.**

**Status:** 🟡 Ready for Grooming
**Created:** 2025-11-17
**Grooming Initiated:** TBD
**Grooming Complete:** TBD

---

### Dr. Testalot (QA Lead) - Testing Review

**Review Date:** TBD

**Test Specification Review:**
- [ ] All tests enumerated before implementation?
- [ ] Test descriptions specific?
- [ ] Test count matches summary table?
- [ ] TDD workflow clear per phase?
- [ ] Edge cases covered?

**Approval:** ❌ Pending

---

### Dr. Clean (Code Quality) - Architecture Review

**Review Date:** TBD

**Architecture Review:**
- [ ] Follows existing patterns?
- [ ] No unnecessary complexity?
- [ ] Security considerations addressed?
- [ ] Privacy implications considered?

**Approval:** ❌ Pending

---

### Dr. LeanDev (Implementation) - Feasibility Review

**Review Date:** TBD

**Feasibility Review:**
- [ ] Implementation approach clear?
- [ ] Dependencies identified?
- [ ] Timeline realistic?
- [ ] Migration to imajin-os feasible?

**Approval:** ❌ Pending

---

### Dr. DevOps (Operations) - Deployment Review

**Review Date:** TBD

**Deployment Review:**
- [ ] Database changes safe?
- [ ] Migration strategy clear?
- [ ] Performance implications considered?

**Approval:** ❌ Pending

---

### Dr. Git (Version Control) - Change Impact Review

**Review Date:** TBD

**Change Impact Review:**
- [ ] Scope reasonable?
- [ ] Breaking changes identified?
- [ ] Commit strategy defined?

**Approval:** ❌ Pending

---

### Grooming Summary

| Doctor | Status | Date |
|--------|--------|------|
| Dr. Testalot (QA) | ❌ Pending | - |
| Dr. Clean (Quality) | ❌ Pending | - |
| Dr. LeanDev (Implementation) | ❌ Pending | - |
| Dr. DevOps (Operations) | ❌ Pending | - |
| Dr. Git (Version Control) | ❌ Pending | - |

**Grooming Complete:** ❌ NO

---

**⚠️ IMPLEMENTATION CANNOT BEGIN UNTIL ALL APPROVALS RECEIVED**
