# TDD Documentation Standard

**Status:** ENFORCED by Dr. Testalot (QA Lead)
**Last Updated:** 2025-10-28

---

## The Problem We Solved

**Issue:** Task documents were being created without complete test specifications, leading to:
- Tests written AFTER implementation (not TDD)
- Vague test descriptions that don't guide implementation
- Missing test counts and unclear acceptance criteria
- Dr. Testalot (QA Lead) rejecting incomplete task docs

**Root Cause:** No standardized template or enforcement mechanism

**Solution:** Mandatory TDD specification template + QA Lead approval gate

---

## The Standard

### Every Task Document Must Include:

#### 1. Detailed Test Specifications
Enumerate ALL tests BEFORE implementation begins.

**Format:**
```markdown
### Phase [N]: [Component] Tests ([M] tests)

#### File: `tests/[path]/[filename].test.ts`

##### 1. [Test Category] ([X] tests)

**Test 1.1:** [Description]
```typescript
it('should [expected behavior]', () => {
  // Arrange
  const input = [data];

  // Act
  const result = functionName(input);

  // Assert
  expect(result).toBe(expected);
});
```

**Test 1.2:** [Description]
...
```

**Requirements:**
- Every test numbered (Test 1.1, 1.2, etc.)
- Specific assertions shown in code
- Expected behavior clearly stated
- Organized by file and category

#### 2. Test Specification Summary
Count tests per phase/type in a table.

**Format:**
```markdown
| Phase | Test Type | Count | File(s) |
|-------|-----------|-------|---------|
| 1 | Unit | 20 | cloudinary-service.test.ts |
| 2 | Integration | 15 | sync-script.test.ts |
| **Total** | | **35** | **2 test files** |
```

#### 3. TDD Workflow Per Phase
Each implementation phase must follow RED-GREEN-REFACTOR.

**Format:**
```markdown
### Phase 1: [Component Name] (3-4 hours)

**1.1 Write [Component] Tests (RED)**
- [ ] Create test file
- [ ] Write all tests (see Test Specification section)
- [ ] Run tests: `npm test` - **EXPECT FAILURES**

**1.2 Implement [Component] (GREEN)**
- [ ] Create component file
- [ ] Implement minimum code to pass tests
- [ ] Run tests: `npm test` - **EXPECT PASSING**

**1.3 Refactor [Component] (REFACTOR)**
- [ ] Clean up code
- [ ] Extract reusable logic
- [ ] Run tests: `npm test` - **MUST STAY GREEN**

**Phase 1 Gate Criteria:**
- [ ] All [N] tests passing
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
```

#### 4. Clear Acceptance Criteria
Measurable gates for phase completion.

**Format:**
```markdown
## Acceptance Criteria

**Tests:**
- [ ] All [N] new tests passing
- [ ] All existing tests still passing ([X]/[Y])
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Implementation:**
- [ ] [Feature 1] implemented
- [ ] [Feature 2] working
- [ ] Error handling comprehensive
```

---

## The Template

**Location:** `docs/templates/TASK_DOCUMENT_TEMPLATE.md`

**Usage:**
1. Copy template to `docs/tasks/Phase [X.X] - [Feature].md`
2. Fill all sections completely
3. Enumerate ALL tests with specific assertions
4. Create test summary table
5. Define TDD workflow per phase
6. Get Dr. Testalot approval BEFORE starting implementation

---

## Enforcement

### Dr. Testalot (QA Lead) Will REJECT Task Docs That:

❌ **Don't enumerate tests before implementation**
```markdown
## Bad Example
**Phase 1:** Write tests for logger
- Write some tests
- Test logging functionality
```

✅ **Good Example**
```markdown
### Phase 1: Logger Tests (15 tests)

**Test 1.1:** logger.debug() formats log entry with correct level
**Test 1.2:** logger.debug() includes timestamp in ISO format
**Test 1.3:** logger.debug() includes metadata when provided
...
[All 15 tests enumerated with specific assertions]
```

---

❌ **Have vague test descriptions**
```markdown
**Test 1:** Test it works
**Test 2:** Verify behavior
**Test 3:** Check edge cases
```

✅ **Good Example**
```markdown
**Test 1:** Returns true when is_live=true and sell_status="for-sale"
**Test 2:** Returns false when is_live=false
**Test 3:** Handles null sell_status (defaults to "internal")
```

---

❌ **Missing test count summary**
```markdown
We'll write tests for the sync script.
```

✅ **Good Example**
```markdown
| Phase | Test Type | Count | File(s) |
|-------|-----------|-------|---------|
| 5 | Integration | 30 | sync-products-enhanced.test.ts |
```

---

❌ **No TDD workflow**
```markdown
**Phase 1:** Implement cloudinary service
- Create service file
- Add upload function
- Test it
```

✅ **Good Example**
```markdown
**1.1 Write Cloudinary Service Tests (RED)**
- [ ] Create `tests/unit/lib/services/cloudinary-service.test.ts`
- [ ] Write 20 tests (see Test Specification)
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (service doesn't exist yet)

**1.2 Implement Cloudinary Service (GREEN)**
- [ ] Create `lib/services/cloudinary-service.ts`
- [ ] Implement uploadMedia(), checkMediaExists(), deleteMedia()
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 20 tests green)

**1.3 Refactor (REFACTOR)**
- [ ] Extract reusable logic
- [ ] Run tests: `npm test` - **MUST STAY GREEN**
```

---

### Dr. Director Will Block Implementation Without:

- [ ] Task doc created from template
- [ ] All tests enumerated with specific assertions
- [ ] Test count summary table completed
- [ ] TDD workflow (RED-GREEN-REFACTOR) defined
- [ ] Dr. Testalot approval

---

## Examples of Compliant Documents

### ✅ Excellent Examples:

1. **Phase 2.4.6 - Product Data Normalization**
   - Location: `docs/tasks/Phase 2.4.6 - Product Data Normalization.md`
   - Test specifications: Lines 1785-2133
   - All 180 tests enumerated before implementation
   - Test summary table with counts
   - Clear TDD workflow per phase

2. **Phase 0 - Structured Logging TDD Spec**
   - Location: `docs/tasks/Phase 0 - Structured Logging TDD Spec.md`
   - All 26 tests enumerated with code examples
   - Test categories clearly organized
   - Specific assertions shown
   - Complete acceptance criteria

### 🔍 What Makes Them Great:

**Phase 2.4.6 Example:**
```markdown
### Phase 1: Service Tests (45 tests)

**File:** `tests/unit/lib/services/cloudinary-service.test.ts` (20 tests)

**uploadMedia() - 7 tests:**
1. **test:** uploadMedia() successfully uploads image and returns publicId
2. **test:** uploadMedia() respects overwrite:false (doesn't re-upload existing)
3. **test:** uploadMedia() handles resource_type='image'
...

[Continues with all 180 tests enumerated]

## Test Specification Summary

| Phase | Test Type | Count | File(s) |
|-------|-----------|-------|---------|
| 0 | Unit | 15 | logger.test.ts |
| 1 | Unit | 45 | cloudinary-service.test.ts (20), stripe-sync-service.test.ts (25) |
...
```

**Phase 0 Example:**
```markdown
**Test 1.1:** Logger class exports singleton instance
```typescript
it('should export logger singleton instance', () => {
  expect(logger).toBeDefined();
  expect(logger).toBeInstanceOf(Logger);
});
```

**Test 1.2:** formatLog() returns valid LogEntry structure
```typescript
it('should format log entry with required fields', () => {
  const entry = logger['formatLog']('info', 'test message');
  expect(entry).toHaveProperty('level', 'info');
  expect(entry).toHaveProperty('message', 'test message');
  expect(entry).toHaveProperty('timestamp');
});
```
```

---

## Benefits

### For Development:
1. **Clear roadmap** - Know exactly what to build
2. **Prevents scope creep** - Tests define boundaries
3. **Faster implementation** - No ambiguity about requirements
4. **Better estimates** - Test count = complexity indicator

### For Quality:
1. **True TDD** - Tests written before implementation
2. **Complete coverage** - All scenarios enumerated upfront
3. **Regression prevention** - Tests document expected behavior
4. **Living documentation** - Tests serve as specs

### For Team:
1. **Onboarding** - New devs see exactly what's expected
2. **Code review** - Compare implementation against spec
3. **Accountability** - Clear definition of "done"
4. **Consistency** - All tasks follow same pattern

---

## Quick Reference

### Creating a New Task Document:

1. **Copy template**
   ```bash
   cp docs/templates/TASK_DOCUMENT_TEMPLATE.md \
      docs/tasks/"Phase X.X - Feature Name.md"
   ```

2. **Fill sections in order:**
   - [ ] Overview (problem, goals, solution)
   - [ ] Implementation phases
   - [ ] **Detailed Test Specifications** ⚠️ CRITICAL
   - [ ] Test Specification Summary table
   - [ ] Implementation specification
   - [ ] Acceptance criteria
   - [ ] Risk assessment
   - [ ] Timeline

3. **Enumerate ALL tests:**
   - Number every test (Test 1.1, 1.2, etc.)
   - Show specific assertions
   - Organize by file and category
   - State expected behavior clearly

4. **Create test summary table:**
   - Phase breakdown
   - Test type (Unit/Integration/E2E/Smoke)
   - Count per phase
   - File names

5. **Get Dr. Testalot approval:**
   - Review checklist (see template)
   - Ensure all tests enumerated
   - Verify TDD workflow clear
   - Confirm acceptance criteria measurable

6. **Start implementation:**
   - Follow TDD: RED → GREEN → REFACTOR
   - Track progress with TodoWrite
   - Update IMPLEMENTATION_PLAN.md checkboxes
   - Run tests frequently

---

## FAQ

**Q: Do I really need to enumerate EVERY test before starting?**
A: Yes. This is non-negotiable. If you don't know what tests you need, you don't understand the requirements yet.

**Q: What if requirements change during implementation?**
A: Update the task document AND test specifications. Document the change and get Dr. Testalot approval for the updated tests.

**Q: Can I write "TODO: Add tests for X" and come back later?**
A: No. All tests must be specified before implementation begins. If you discover new test scenarios, add them to the spec immediately.

**Q: What if I'm just fixing a small bug?**
A: Small bugfixes don't need a full task document, but DO need:
- Test case that reproduces the bug (RED)
- Fix implementation (GREEN)
- Refactor if needed (REFACTOR)

**Q: How detailed should test descriptions be?**
A: Detailed enough that someone else could implement the test without asking questions. Include:
- What's being tested
- Expected behavior
- Specific assertions

**Q: What if I have 100+ tests?**
A: That's fine! Phase 2.4.6 has 180 tests. Use clear organization:
- Group by test file
- Group by test category within files
- Use numbered lists (Test 1.1, 1.2, etc.)

---

## Related Documents

- **Template:** `docs/templates/TASK_DOCUMENT_TEMPLATE.md`
- **Dr. Testalot:** `docs/agents/DOCTOR_TESTALOT.md` (QA Lead)
- **Dr. Director:** `docs/agents/DOCTOR_DIRECTOR.md` (Task doc creation)
- **Testing Strategy:** `docs/TESTING_STRATEGY.md`
- **CLAUDE.md:** Main project context (see "During Active Development")

---

**This is the standard. No exceptions.**

If you're unsure whether your task document meets the standard, ask Dr. Testalot to review it BEFORE starting implementation.
