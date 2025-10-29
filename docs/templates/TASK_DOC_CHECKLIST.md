# Task Document Checklist

Use this checklist when creating a new task document to ensure it meets Dr. Testalot's (QA Lead) standards.

---

## Before Creating Task Document

- [ ] Understand the problem completely
- [ ] Know what needs to be built
- [ ] Have clear success criteria
- [ ] Identified all dependencies
- [ ] Estimated complexity/timeline

---

## Task Document Sections

### ✅ Required Sections (Must Complete)

- [ ] **Overview** - Problem, goals, solution (2-3 sentences)
- [ ] **Problem Statement** - Current state, issues, solution approach
- [ ] **Implementation Phases** - Break work into testable chunks
- [ ] **Detailed Test Specifications** - ALL tests enumerated ⚠️ CRITICAL
- [ ] **Test Specification Summary** - Table with counts per phase
- [ ] **Implementation Specification** - Types, functions, requirements
- [ ] **Acceptance Criteria** - Clear, measurable gates
- [ ] **Dependencies** - NPM packages, env vars, services
- [ ] **Risk Assessment** - High/medium/low with mitigations
- [ ] **Decisions Made** - Architecture, approach, trade-offs
- [ ] **Timeline Summary** - Phase breakdown with test counts

### 📝 Optional Sections (If Applicable)

- [ ] **Schema Changes** - Database, TypeScript, Zod updates
- [ ] **Migration Plan** - Before/after code examples
- [ ] **Future Enhancements** - What comes later

---

## Test Specifications Quality Check

### ✅ Test Enumeration

- [ ] ALL tests numbered (Test 1.1, 1.2, 1.3, etc.)
- [ ] Organized by test file
- [ ] Grouped by test category within files
- [ ] Total count matches summary table
- [ ] No vague descriptions ("test it works")

### ✅ Test Details

- [ ] Each test shows expected behavior
- [ ] Specific assertions included (with code examples)
- [ ] Arrange-Act-Assert pattern clear
- [ ] Edge cases identified
- [ ] Error scenarios covered

### ✅ Test Summary Table

- [ ] Phase column populated
- [ ] Test type specified (Unit/Integration/E2E/Smoke/Performance)
- [ ] Count per phase accurate
- [ ] File names specified
- [ ] Total row calculated correctly

**Example:**
```markdown
| Phase | Test Type | Count | File(s) |
|-------|-----------|-------|---------|
| 1 | Unit | 20 | cloudinary-service.test.ts |
| 2 | Integration | 30 | sync-script.test.ts |
| **Total** | | **50** | **2 test files** |
```

---

## TDD Workflow Per Phase

### ✅ Each Implementation Phase Must Have:

- [ ] **RED section** - Write tests first
  - [ ] Create test file path specified
  - [ ] Test count referenced (see Test Specification)
  - [ ] Run command: `npm test`
  - [ ] Expected result: **EXPECT FAILURES**

- [ ] **GREEN section** - Implement to pass
  - [ ] Create implementation file path specified
  - [ ] Functions/classes to implement listed
  - [ ] Run command: `npm test`
  - [ ] Expected result: **EXPECT PASSING**

- [ ] **REFACTOR section** - Clean up
  - [ ] Refactor steps listed
  - [ ] Run command: `npm test`
  - [ ] Expected result: **MUST STAY GREEN**

- [ ] **Phase Gate Criteria**
  - [ ] Test count (N/M passing)
  - [ ] TypeScript: 0 errors
  - [ ] Lint: 0 errors
  - [ ] Other relevant gates

**Example:**
```markdown
### Phase 1: Cloudinary Service (3-4 hours)

**1.1 Write Cloudinary Tests (RED)**
- [ ] Create `tests/unit/lib/services/cloudinary-service.test.ts`
- [ ] Write 20 tests (see Test Specification section)
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**1.2 Implement Cloudinary Service (GREEN)**
- [ ] Create `lib/services/cloudinary-service.ts`
- [ ] Implement uploadMedia(), checkMediaExists(), deleteMedia()
- [ ] Run tests: `npm test` - **EXPECT PASSING**

**1.3 Refactor (REFACTOR)**
- [ ] Extract reusable logic
- [ ] Add JSDoc comments
- [ ] Run tests: `npm test` - **MUST STAY GREEN**

**Phase 1 Gate Criteria:**
- [ ] All 20 tests passing
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
```

---

## Acceptance Criteria

### ✅ Must Be Measurable

- [ ] Test counts specific (not "most tests pass")
- [ ] Quality gates binary (0 errors, not "few errors")
- [ ] Features enumerated clearly
- [ ] No vague terms ("mostly done", "pretty good")

**Bad Example:**
```markdown
- [ ] Tests mostly pass
- [ ] Code quality is good
- [ ] Feature works well
```

**Good Example:**
```markdown
- [ ] All 50 new tests passing
- [ ] All existing tests still passing (775/778)
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
- [ ] Feature X implemented and working
```

---

## Common Mistakes to Avoid

### ❌ Vague Test Descriptions

**Bad:**
```markdown
**Test 1:** Test the function
**Test 2:** Verify it works
**Test 3:** Check edge cases
```

**Good:**
```markdown
**Test 1:** Returns true when is_live=true and sell_status="for-sale"
**Test 2:** Returns false when is_live=false
**Test 3:** Handles null sell_status (defaults to "internal")
```

---

### ❌ Missing Test Count Summary

**Bad:**
```markdown
We'll write tests for the sync script and Cloudinary service.
```

**Good:**
```markdown
| Phase | Test Type | Count | File(s) |
|-------|-----------|-------|---------|
| 1 | Unit | 20 | cloudinary-service.test.ts |
| 2 | Integration | 30 | sync-script.test.ts |
| **Total** | | **50** | **2 test files** |
```

---

### ❌ No TDD Workflow

**Bad:**
```markdown
**Phase 1:** Build the Cloudinary service
- Create service file
- Add upload function
- Test it
```

**Good:**
```markdown
**Phase 1:** Cloudinary Service (3-4 hours)

**1.1 Write Tests (RED)** - [detailed steps]
**1.2 Implement (GREEN)** - [detailed steps]
**1.3 Refactor (REFACTOR)** - [detailed steps]
**Phase 1 Gate Criteria** - [measurable gates]
```

---

### ❌ Unmeasurable Acceptance Criteria

**Bad:**
```markdown
- [ ] Code quality is good
- [ ] Tests mostly pass
- [ ] Feature works reasonably well
```

**Good:**
```markdown
- [ ] All 50 new tests passing
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
- [ ] Cloudinary upload success rate: 100%
```

---

## Pre-Submission Checklist

### ✅ Before Asking Dr. Testalot to Review:

- [ ] All required sections completed
- [ ] ALL tests enumerated (not just "write tests")
- [ ] Test summary table matches test specifications
- [ ] Each phase has RED-GREEN-REFACTOR workflow
- [ ] Acceptance criteria are measurable
- [ ] No TODOs or placeholders remaining
- [ ] Dependencies identified (packages, env vars)
- [ ] Risk assessment completed
- [ ] Timeline estimated per phase

### ✅ Self-Review Questions:

- [ ] Could someone else implement this without asking questions?
- [ ] Are test descriptions specific enough to guide implementation?
- [ ] Would I understand what "done" means from the acceptance criteria?
- [ ] Have I identified all edge cases and error scenarios?
- [ ] Is the TDD workflow clear (RED → GREEN → REFACTOR)?

---

## Getting Dr. Testalot Approval

### Submit for Review:

1. Complete checklist above
2. Reference this checklist in your request
3. Point to specific examples that demonstrate quality:
   - "Test specifications: Lines X-Y"
   - "Test summary table: Line Z"
   - "TDD workflow: Lines A-B"

**Example Request:**
```
@Dr. Testalot - Ready for review: Phase X.X task document

✅ Checklist complete
✅ All 50 tests enumerated (lines 100-250)
✅ Test summary table (line 260)
✅ TDD workflow per phase (lines 50-90)
✅ Measurable acceptance criteria (lines 270-290)

Please review and approve before implementation begins.
```

### Dr. Testalot Will Check:

1. ✅ All tests enumerated BEFORE implementation?
2. ✅ Test descriptions specific (not vague)?
3. ✅ Test count matches summary table?
4. ✅ Each phase has RED-GREEN-REFACTOR workflow?
5. ✅ Acceptance criteria measurable?
6. ✅ Test files and locations specified?

---

## After Approval

- [ ] Update IMPLEMENTATION_PLAN.md with phase checkboxes
- [ ] Create TodoWrite tasks for tracking
- [ ] Follow TDD workflow (RED → GREEN → REFACTOR)
- [ ] Update task doc if requirements change
- [ ] Get re-approval if tests change significantly

---

## Reference Documents

- **Template:** `docs/templates/TASK_DOCUMENT_TEMPLATE.md`
- **Standard:** `docs/TDD_DOCUMENTATION_STANDARD.md`
- **Examples:**
  - `docs/tasks/Phase 2.4.6 - Product Data Normalization.md` (lines 1785-2133)
  - `docs/tasks/Phase 0 - Structured Logging TDD Spec.md`
- **Dr. Testalot:** `docs/agents/DOCTOR_TESTALOT.md`

---

**Use this checklist for EVERY new task document.**

If anything is unclear, refer to the examples above or ask Dr. Testalot for clarification BEFORE starting implementation.
