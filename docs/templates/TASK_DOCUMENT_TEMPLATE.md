# [Phase X.X] - [Feature Name]: TDD Task Specification

**Type:** [Infrastructure/Feature/Enhancement/Bugfix]
**Priority:** [CRITICAL/HIGH/MEDIUM/LOW]
**Status:** 🟡 Ready for Grooming | 🟢 Approved for Implementation | 🔴 Needs Revision | ✅ Complete
**Estimated Effort:** [X-Y hours/days]
**Dependencies:** [List phases/features that must complete first]
**Grooming Status:** ❌ Not Started | 🟡 In Progress | ✅ Approved

---

## Overview

[2-3 sentence summary of what this task accomplishes and why it matters]

### Goals

1. [Primary goal]
2. [Secondary goal]
3. [Tertiary goal]

---

## Problem Statement

**Current State:**
[Describe what exists today and what's wrong/missing]

**Issues:**
- [Issue 1]
- [Issue 2]
- [Issue 3]

**Solution:**
[High-level approach to solving the problem]

---

## Test-First Approach

**This document enumerates ALL test scenarios BEFORE implementation begins.**

**TDD Workflow:**
1. **RED:** Write all tests first (they fail)
2. **GREEN:** Implement minimum code to pass tests
3. **REFACTOR:** Clean up implementation while keeping tests green

---

## Implementation Phases

### Phase 1: [Phase Name] ([X-Y hours])

**Goal:** [What this phase accomplishes]

**TDD Approach:** [Brief description of test-first workflow for this phase]

**1.1 Write [Component] Tests (RED)**
- [ ] Create `tests/[path]/[filename].test.ts`
- [ ] Test [scenario 1]
- [ ] Test [scenario 2]
- [ ] Test [scenario 3]
- [ ] ~[N] tests total (see Test Specification section below)
- [ ] Run tests: `npm test` - **EXPECT FAILURES** ([component] doesn't exist yet)

**1.2 Implement [Component] (GREEN)**
- [ ] Create `[path]/[filename].ts`
- [ ] Implement [function/class/component]
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all [N] tests green)

**1.3 Refactor [Component] (REFACTOR)**
- [ ] Review code for clarity and maintainability
- [ ] Extract reusable logic
- [ ] Add JSDoc comments
- [ ] Run tests: `npm test` - **MUST STAY GREEN**

**1.4 Update Existing Code**
- [ ] Update [related file 1]
- [ ] Update [related file 2]
- [ ] Run tests: `npm test` - **MUST STAY GREEN** (verify no regressions)

**Phase 1 Gate Criteria:**
- [ ] All [N] new tests passing
- [ ] All existing tests still passing ([current count]/[total])
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Deliverables:**
- [Component] implemented with [N] tests
- [Related components] updated
- Total new tests: [N]

---

### Phase 2: [Phase Name] ([X-Y hours])

[Repeat Phase 1 structure for each implementation phase]

---

## Detailed Test Specifications

**This section enumerates ALL [total] test scenarios BEFORE implementation begins.**

### Phase 1: [Component] Tests ([N] tests)

#### File: `tests/[path]/[filename].test.ts`

##### 1. [Test Category Name] ([M] tests)

**Test 1.1:** [Test description]
```typescript
it('should [expected behavior]', () => {
  // Arrange
  const [setup] = [data];

  // Act
  const result = [function]([input]);

  // Assert
  expect(result).toBe([expected]);
  expect(result).toHaveProperty('[property]');
});
```

**Test 1.2:** [Test description]
```typescript
it('should [expected behavior]', () => {
  // ... test code
});
```

[Continue enumerating all tests with specific assertions]

---

##### 2. [Test Category Name] ([M] tests)

[Continue enumerating all test categories]

---

### Phase 2: [Component] Tests ([N] tests)

[Repeat test specification structure for each phase]

---

## Test Specification Summary

**Total New Tests: [N]**

| Phase | Test Type | Count | File(s) |
|-------|-----------|-------|---------|
| 1 | Unit | [N] | [filename].test.ts |
| 2 | Unit | [N] | [filename].test.ts |
| 3 | Integration | [N] | [filename].test.ts |
| 4 | E2E | [N] | [filename].spec.ts |
| 5 | Smoke | [N] | [filename].spec.ts |
| **Total** | | **[N]** | **[M] test files** |

---

## Implementation Specification

### File: `[path]/[filename].ts`

**Requirements:**
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

**Types:**
```typescript
type [TypeName] = [definition];

interface [InterfaceName] {
  [property]: [type];
}
```

**Functions/Classes:**
- `[functionName]([params]): [return]` - [Description]
- `[functionName]([params]): [return]` - [Description]

**Error Handling:**
- [Scenario 1] → [Error type/message]
- [Scenario 2] → [Error type/message]

---

## Schema Changes (if applicable)

### Database Schema Updates

**Add columns to `[table_name]` table:**
```typescript
export const [tableName] = pgTable("[table_name]", {
  // ... existing fields ...

  // NEW FIELDS
  [fieldName]: [type]("[field_name]").[constraints],
  [fieldName]: [type]("[field_name]").[constraints],
});
```

**Migration:**
```bash
npx drizzle-kit generate:pg
npm run db:push
```

### TypeScript Type Updates

**Update `types/[filename].ts`:**
```typescript
export interface [InterfaceName] {
  // ... existing fields ...

  // NEW FIELDS
  [fieldName]: [type];
  [fieldName]: [type];
}
```

### Zod Schema Updates

**Update `[path]/schema.ts`:**
```typescript
const [SchemaName] = z.object({
  // ... existing fields ...

  // NEW FIELDS
  [field_name]: z.[type]().[modifiers],
  [field_name]: z.[type]().[modifiers],
});
```

---

## Migration Plan (if applicable)

### Files to Update

**1. [filename].ts** ([N] changes)
```typescript
// BEFORE
[old code]

// AFTER
[new code]
```

**2. [filename].ts** ([N] changes)
[Continue for all files]

---

## Acceptance Criteria

**Tests:**
- [ ] All [N] new tests passing
- [ ] All existing tests still passing ([current]/[total])
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
- [ ] Test coverage: >[X]%

**Implementation:**
- [ ] [Feature 1] implemented
- [ ] [Feature 2] implemented
- [ ] [Integration 1] working
- [ ] Error handling comprehensive

**Documentation:**
- [ ] [Doc file 1] updated
- [ ] [Doc file 2] created
- [ ] Inline code comments added
- [ ] Usage examples provided

**Quality Gates:**
- [ ] All phase gate criteria met
- [ ] No regressions introduced
- [ ] Performance benchmarks met (if applicable)
- [ ] Security review passed (if applicable)

---

## Deliverables

1. **[Component/Feature 1]** - [Description] ([LOC])
2. **[Test Suite 1]** - [Description] ([N] tests)
3. **[Documentation 1]** - [Description] ([LOC])
4. **[Updated files]** - [List]

**Total Lines of Code:**
- Production: ~[N] lines
- Tests: ~[N] lines
- Documentation: ~[N] lines
- **Total: ~[N] lines**

---

## Dependencies

**NPM Packages:**
```bash
npm install [package1] [package2]
npm install --save-dev [dev-package1] [dev-package2]
```

**Environment Variables:**
```env
[VAR_NAME]=[description]
[VAR_NAME]=[description]
```

**External Services:**
- [Service 1] - [Configuration needed]
- [Service 2] - [Configuration needed]

---

## Risk Assessment

**High Risk:**
- [Risk 1 description]
- [Risk 2 description]

**Mitigations:**
- [Mitigation 1]
- [Mitigation 2]

**Medium Risk:**
- [Risk 1 description]

**Mitigations:**
- [Mitigation 1]

**Low Risk:**
- [Risk 1 description]

---

## Decisions Made

1. **[Decision topic]:** ✅ [Decision made]
   - [Rationale/details]
   - [Additional context]

2. **[Decision topic]:** ✅ [Decision made]
   - [Rationale/details]

## All Decisions Finalized ✅

**No open questions remaining. Ready for implementation.**

---

## Timeline Summary

| Phase | Focus | Duration | Tests | Deliverable |
|-------|-------|----------|-------|-------------|
| 1 | [Focus] | [X-Y]h | +[N] | [Deliverable] |
| 2 | [Focus] | [X-Y]h | +[N] | [Deliverable] |
| 3 | [Focus] | [X-Y]h | +[N] | [Deliverable] |
| **Total** | **Full Implementation** | **[X-Y]h** | **+[N]** | **Phase [X.X] Complete** |

**Estimated: [X-Y] days of focused work**

**Test Count Progression:**
- Starting: [N]/[M] tests passing
- After Phase [X.X]: [N]/[M] tests passing (+[N] new tests)
  - Unit: [N] tests ([current] + [new] new)
  - Integration: [N] tests ([all new/existing])
  - E2E: [N] tests ([all new/existing])
  - Smoke: [N] tests ([all new/existing])

---

## Test Results (Actual - Fill After Completion)

**Achieved:** [N]/[N] tests passing ✅

**Test execution time:** ~[N]ms/s

**Coverage:**
- [Category 1]: [N]/[N] ✅
- [Category 2]: [N]/[N] ✅
- [Category 3]: [N]/[N] ✅

**Files updated:**
1. [filename] ✅
2. [filename] ✅

---

## Future Enhancements

- **Phase [X]+:** [Enhancement 1 description]
- **Phase [X]+:** [Enhancement 2 description]
- **Phase [X]+:** [Enhancement 3 description]

---

## Status: [Planning/In Progress/Complete]

**Completion Date:** [YYYY-MM-DD or TBD]
**Duration:** [Actual hours/days or TBD]
**Quality Gates:** [Status]

**Ready for:** [Next phase or "Production deployment"]

---

## Template Usage Instructions

**When creating a new task document:**

1. **Copy this template** to `docs/tasks/Phase [X.X] - [Feature Name].md`
2. **Fill Overview section** - Problem, goals, solution approach
3. **Define implementation phases** - Break work into testable chunks
4. **Enumerate ALL tests first** - Complete "Detailed Test Specifications" section
5. **Create test summary table** - Count tests per phase/type
6. **Specify implementation** - Types, functions, requirements
7. **List acceptance criteria** - Clear gates for completion
8. **Document decisions** - Architecture, approach, trade-offs
9. **Assess risks** - High/medium/low with mitigations
10. **Estimate timeline** - Realistic hours/days per phase

**Review checklist before starting implementation:**
- [ ] All tests enumerated with specific assertions
- [ ] Test count matches summary table
- [ ] Each phase has RED-GREEN-REFACTOR structure
- [ ] Acceptance criteria clear and measurable
- [ ] Dependencies identified
- [ ] Risks assessed with mitigations
- [ ] No open questions remaining

**Dr. Testalot (QA Lead) will reject task docs that:**
- ❌ Don't enumerate tests before implementation
- ❌ Have vague test descriptions ("test it works")
- ❌ Missing test count summary
- ❌ No TDD workflow per phase
- ❌ Unclear acceptance criteria

**Dr. Director will use this doc to:**
- Track progress via TodoWrite
- Update IMPLEMENTATION_PLAN.md checkboxes
- Validate phase gate criteria
- Coordinate with specialists
- **Initiate and manage grooming sessions**

---

## Grooming Session

**⚠️ MANDATORY: All Doctors must review and approve before implementation begins.**

See `docs/TASK_GROOMING_PROCESS.md` for complete grooming workflow.

---

**Status:** 🟡 Ready for Grooming

**Created:** [YYYY-MM-DD]
**Grooming Initiated:** [TBD]
**Grooming Complete:** [TBD]

---

### Dr. Testalot (QA Lead) - Testing Review

**Review Date:** TBD

**Test Specification Review:**
- [ ] All tests enumerated before implementation?
- [ ] Test descriptions specific (not vague)?
- [ ] Test count matches summary table?
- [ ] TDD workflow clear per phase?
- [ ] Acceptance criteria measurable?
- [ ] Edge cases and error scenarios covered?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending | ✅ Approved

**Approved Date:** [TBD]

---

### Dr. Clean (Code Quality) - Architecture Review

**Review Date:** TBD

**Architecture Review:**
- [ ] Follows existing patterns?
- [ ] No unnecessary complexity?
- [ ] Proper separation of concerns?
- [ ] Security considerations addressed?
- [ ] Performance implications considered?
- [ ] Documentation updates planned?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending | ✅ Approved

**Approved Date:** [TBD]

---

### Dr. LeanDev (Implementation) - Feasibility Review

**Review Date:** TBD

**Feasibility Review:**
- [ ] Implementation approach clear?
- [ ] Dependencies identified?
- [ ] Timeline realistic?
- [ ] Known blockers addressed?
- [ ] External APIs understood?
- [ ] Test data/fixtures planned?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending | ✅ Approved

**Approved Date:** [TBD]

---

### Dr. DevOps (Operations) - Deployment Review

**Review Date:** TBD

**Deployment Review:**
- [ ] Infrastructure requirements identified?
- [ ] Environment variables documented?
- [ ] Migration strategy clear?
- [ ] Rollback plan exists?
- [ ] Monitoring/logging adequate?
- [ ] Database changes safe?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending | ✅ Approved

**Approved Date:** [TBD]

---

### Dr. Git (Version Control) - Change Impact Review

**Review Date:** TBD

**Change Impact Review:**
- [ ] Scope reasonable for single commit/PR?
- [ ] Breaking changes identified?
- [ ] Documentation updates planned?
- [ ] Migration path clear?
- [ ] Commit strategy defined?
- [ ] Merge conflicts anticipated?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending | ✅ Approved

**Approved Date:** [TBD]

---

### Grooming Summary

**All Approvals Required Before Implementation:**

| Doctor | Status | Date |
|--------|--------|------|
| Dr. Testalot (QA) | ❌ Pending | - |
| Dr. Clean (Quality) | ❌ Pending | - |
| Dr. LeanDev (Implementation) | ❌ Pending | - |
| Dr. DevOps (Operations) | ❌ Pending | - |
| Dr. Git (Version Control) | ❌ Pending | - |

**Grooming Complete:** ❌ NO | ✅ YES (All approved)

**Implementation Authorized By:** [Dr. Director Name]

**Authorization Date:** [TBD]

---

### Revision History

| Date | Revised By | Changes Made | Re-Grooming Required |
|------|------------|--------------|----------------------|
| [YYYY-MM-DD] | Dr. Director | Initial draft | N/A |

---

**⚠️ IMPLEMENTATION CANNOT BEGIN UNTIL ALL APPROVALS RECEIVED**
