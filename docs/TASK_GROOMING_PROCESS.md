# Task Grooming Process

**Status:** MANDATORY before implementation
**Last Updated:** 2025-10-28

---

## Overview

Every task document must go through a formal **grooming session** where all specialists (Doctors) review, provide input, and approve the plan before implementation begins.

**Goal:** Ensure all perspectives are considered, risks identified, and everyone agrees on the approach.

**Outcome:** Unanimous approval from all Doctors before work starts.

---

## The Grooming Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Draft Creation (Dr. Director)                     │
│ - Create task doc from template                            │
│ - Enumerate all tests                                      │
│ - Define implementation approach                           │
│ - Identify known risks/dependencies                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Grooming Session (All Doctors)                    │
│ - Each Doctor reviews independently                        │
│ - Each Doctor adds feedback section                        │
│ - Concerns, suggestions, requirements added                │
│ - Iterate until all concerns addressed                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Approval Gate (All Doctors Sign-Off)              │
│ - Each Doctor explicitly approves                          │
│ - All signatures required                                  │
│ - No implementation until unanimous approval               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Implementation (Dr. LeanDev / Task Executor)      │
│ - Follow approved plan                                     │
│ - Deviations require re-grooming                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Draft Creation (Dr. Director)

**Owner:** Dr. Director

**Responsibilities:**
1. Create task document from template
2. Complete all required sections:
   - Problem statement
   - Implementation phases
   - **Test specifications** (all tests enumerated)
   - Test summary table
   - Acceptance criteria
   - Risk assessment
   - Dependencies
   - Timeline estimate
3. Add **Grooming Section** at bottom of doc
4. Mark status: `**Status:** Ready for Grooming 🟡`
5. Request grooming session

**Checklist:**
- [ ] Task doc created from template
- [ ] All required sections complete
- [ ] Tests enumerated (not just "write tests")
- [ ] Test summary table accurate
- [ ] Grooming section added (see template below)
- [ ] Status marked: Ready for Grooming

**Grooming Section Template:**
```markdown
---

## Grooming Session

**Status:** 🟡 Ready for Grooming | 🟢 Approved | 🔴 Needs Revision

**Created:** [YYYY-MM-DD]
**Grooming Date:** [TBD]
**Approved:** [TBD]

---

### Dr. Testalot (QA Lead) - Testing Review

**Review Date:** [YYYY-MM-DD or TBD]

**Test Specification Review:**
- [ ] All tests enumerated before implementation?
- [ ] Test descriptions specific (not vague)?
- [ ] Test count matches summary table?
- [ ] TDD workflow clear per phase?
- [ ] Acceptance criteria measurable?

**Feedback:**
[QA Lead provides feedback here]

**Concerns/Questions:**
[List any concerns or questions]

**Approval:** ❌ Pending | ✅ Approved

---

### Dr. Clean (Code Quality) - Architecture Review

**Review Date:** [YYYY-MM-DD or TBD]

**Architecture Review:**
- [ ] Follows existing patterns?
- [ ] No unnecessary complexity?
- [ ] Proper separation of concerns?
- [ ] Security considerations addressed?
- [ ] Performance implications considered?

**Feedback:**
[Code Quality Lead provides feedback here]

**Concerns/Questions:**
[List any concerns or questions]

**Approval:** ❌ Pending | ✅ Approved

---

### Dr. LeanDev (Implementation) - Feasibility Review

**Review Date:** [YYYY-MM-DD or TBD]

**Feasibility Review:**
- [ ] Implementation approach clear?
- [ ] Dependencies identified?
- [ ] Timeline realistic?
- [ ] Known blockers addressed?
- [ ] External APIs understood?

**Feedback:**
[Implementation Lead provides feedback here]

**Concerns/Questions:**
[List any concerns or questions]

**Approval:** ❌ Pending | ✅ Approved

---

### Dr. DevOps (Operations) - Deployment Review

**Review Date:** [YYYY-MM-DD or TBD]

**Deployment Review:**
- [ ] Infrastructure requirements identified?
- [ ] Environment variables documented?
- [ ] Migration strategy clear?
- [ ] Rollback plan exists?
- [ ] Monitoring/logging adequate?

**Feedback:**
[DevOps Lead provides feedback here]

**Concerns/Questions:**
[List any concerns or questions]

**Approval:** ❌ Pending | ✅ Approved

---

### Dr. Git (Version Control) - Change Impact Review

**Review Date:** [YYYY-MM-DD or TBD]

**Change Impact Review:**
- [ ] Scope reasonable for single commit/PR?
- [ ] Breaking changes identified?
- [ ] Documentation updates planned?
- [ ] Migration path clear?
- [ ] Commit strategy defined?

**Feedback:**
[Git Lead provides feedback here]

**Concerns/Questions:**
[List any concerns or questions]

**Approval:** ❌ Pending | ✅ Approved

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

**Implementation Authorized:** ❌ NO | ✅ YES

---

### Revision History

| Date | Revised By | Changes Made | Re-Grooming Required |
|------|------------|--------------|----------------------|
| - | - | - | - |

---
```

---

## Phase 2: Grooming Session (All Doctors Review)

**Process:**

### Step 1: Dr. Director Initiates Grooming

**Command:**
```
🔔 Grooming Session: Phase X.X - [Feature Name]

Task Document: docs/tasks/Phase X.X - [Feature Name].md
Status: Ready for Grooming 🟡

Please review and provide feedback:
@Dr. Testalot - Test specifications
@Dr. Clean - Architecture/quality
@Dr. LeanDev - Implementation feasibility
@Dr. DevOps - Deployment/infrastructure
@Dr. Git - Change impact

Review deadline: [Date/Time]
```

### Step 2: Each Doctor Reviews Independently

**Each Doctor:**
1. Read entire task document thoroughly
2. Fill out their review section in the Grooming Section
3. Check all review checklist items
4. Provide specific feedback
5. List concerns/questions
6. Mark approval status (❌ Pending or ✅ Approved)

**Review Timeline:**
- **Target:** 24 hours per doctor
- **Parallel Reviews:** All doctors review simultaneously
- **Updates:** Doctors update their section as they complete review

### Step 3: Address Feedback (Iterative)

**Dr. Director responsibilities:**
1. Monitor feedback as it comes in
2. Address concerns immediately
3. Update task document based on feedback
4. Document changes in Revision History
5. Notify doctors of updates
6. Request re-review if significant changes

**Iteration Process:**
```
WHILE (Any Doctor has concerns) {
  1. Dr. Director addresses feedback
  2. Updates task document
  3. Documents changes in Revision History
  4. Notifies affected doctors
  5. Doctors re-review changed sections
  6. Doctors update approval status
}
```

### Step 4: Common Feedback Patterns

**Dr. Testalot (QA) typically flags:**
- Vague test descriptions
- Missing edge case tests
- Incomplete test count
- Unclear acceptance criteria
- Missing error scenario tests

**Dr. Clean (Quality) typically flags:**
- Unnecessary complexity
- Pattern inconsistencies
- Security vulnerabilities
- Performance concerns
- Architectural debt

**Dr. LeanDev (Implementation) typically flags:**
- Unclear requirements
- Missing dependencies
- Unrealistic timeline
- API misunderstandings
- Scope creep

**Dr. DevOps (Operations) typically flags:**
- Missing environment variables
- Unclear migration strategy
- No rollback plan
- Infrastructure requirements missing
- Monitoring gaps

**Dr. Git (Version Control) typically flags:**
- Scope too large for single PR
- Breaking changes not documented
- Migration path unclear
- Documentation updates missing

---

## Phase 3: Approval Gate (Unanimous Sign-Off)

**Approval Criteria:**

### All Doctors Must:
1. ✅ Complete their review checklist
2. ✅ Provide feedback (or state "No concerns")
3. ✅ Mark approval status: **✅ Approved**
4. ✅ Sign off with date

**Grooming Summary Table must show:**
```markdown
| Doctor | Status | Date |
|--------|--------|------|
| Dr. Testalot (QA) | ✅ Approved | 2025-10-28 |
| Dr. Clean (Quality) | ✅ Approved | 2025-10-28 |
| Dr. LeanDev (Implementation) | ✅ Approved | 2025-10-28 |
| Dr. DevOps (Operations) | ✅ Approved | 2025-10-28 |
| Dr. Git (Version Control) | ✅ Approved | 2025-10-28 |

**Grooming Complete:** ✅ YES (All approved)
**Implementation Authorized:** ✅ YES
```

### Final Sign-Off

**Dr. Director:**
1. Verify all approvals present
2. Update task doc status: `**Status:** ✅ Approved for Implementation`
3. Update IMPLEMENTATION_PLAN.md with phase checkboxes
4. Create TodoWrite tasks
5. Authorize implementation

**Implementation cannot begin until:**
- [ ] All 5 doctors approved (✅)
- [ ] All concerns addressed
- [ ] Status changed to "Approved for Implementation"
- [ ] Dr. Director authorizes work to begin

---

## Phase 4: Implementation (Following Approved Plan)

**Rules During Implementation:**

### Must Follow Approved Plan
- Implement exactly as specified in task doc
- Follow TDD workflow (RED → GREEN → REFACTOR)
- Adhere to test specifications
- Meet acceptance criteria

### Deviations Require Re-Grooming

**Minor deviations** (notify only):
- Implementation detail changes that don't affect API
- Test assertion adjustments (same scenario)
- Code organization improvements

**Major deviations** (require re-grooming):
- API changes
- Schema changes
- New dependencies
- Timeline changes >20%
- Scope additions
- Architecture changes

**Re-Grooming Process:**
1. Dr. Director updates task doc with changes
2. Documents changes in Revision History
3. Marks "Re-Grooming Required: YES"
4. Notifies affected doctors
5. Doctors re-review changed sections only
6. Doctors update approval (maintain previous approval if unaffected)
7. Wait for unanimous approval before continuing

---

## Integration with Existing Workflow

### Updated Task Creation Workflow

**OLD (Without Grooming):**
```
1. Create task doc
2. Get Dr. Testalot approval
3. Start implementation
```

**NEW (With Grooming):**
```
1. Dr. Director: Create task doc draft
2. Dr. Director: Add Grooming Section
3. Dr. Director: Request grooming session (all doctors)
4. All Doctors: Review and provide feedback (parallel)
5. Dr. Director: Address feedback (iterative)
6. All Doctors: Approve (unanimous)
7. Dr. Director: Authorize implementation
8. Dr. LeanDev: Begin implementation
```

### Timeline Impact

**Grooming Phase Duration:**
- Draft Creation: 1-2 hours (Dr. Director)
- Doctor Reviews: 24 hours (parallel)
- Feedback Iteration: 2-8 hours (as needed)
- **Total Grooming Time: 1-2 days**

**Benefits Outweigh Delay:**
- Fewer surprises during implementation
- Better design decisions upfront
- Reduced rework
- Higher quality outcomes
- Team alignment

---

## Grooming Session Template (For Task Docs)

**Add this section to every task document BEFORE requesting grooming:**

```markdown
---

## Grooming Session

**Status:** 🟡 Ready for Grooming

**Created:** [YYYY-MM-DD]
**Grooming Date:** [TBD]
**Approved:** [TBD]

---

### Dr. Testalot (QA Lead) - Testing Review

**Review Date:** TBD

**Test Specification Review:**
- [ ] All tests enumerated before implementation?
- [ ] Test descriptions specific (not vague)?
- [ ] Test count matches summary table?
- [ ] TDD workflow clear per phase?
- [ ] Acceptance criteria measurable?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending

---

### Dr. Clean (Code Quality) - Architecture Review

**Review Date:** TBD

**Architecture Review:**
- [ ] Follows existing patterns?
- [ ] No unnecessary complexity?
- [ ] Proper separation of concerns?
- [ ] Security considerations addressed?
- [ ] Performance implications considered?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending

---

### Dr. LeanDev (Implementation) - Feasibility Review

**Review Date:** TBD

**Feasibility Review:**
- [ ] Implementation approach clear?
- [ ] Dependencies identified?
- [ ] Timeline realistic?
- [ ] Known blockers addressed?
- [ ] External APIs understood?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending

---

### Dr. DevOps (Operations) - Deployment Review

**Review Date:** TBD

**Deployment Review:**
- [ ] Infrastructure requirements identified?
- [ ] Environment variables documented?
- [ ] Migration strategy clear?
- [ ] Rollback plan exists?
- [ ] Monitoring/logging adequate?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending

---

### Dr. Git (Version Control) - Change Impact Review

**Review Date:** TBD

**Change Impact Review:**
- [ ] Scope reasonable for single commit/PR?
- [ ] Breaking changes identified?
- [ ] Documentation updates planned?
- [ ] Migration path clear?
- [ ] Commit strategy defined?

**Feedback:**
[Awaiting review]

**Concerns/Questions:**
- None yet

**Approval:** ❌ Pending

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

**Grooming Complete:** ❌ NO

**Implementation Authorized:** ❌ NO

---

### Revision History

| Date | Revised By | Changes Made | Re-Grooming Required |
|------|------------|--------------|----------------------|
| [Initial] | Dr. Director | Initial draft | N/A |

---
```

---

## Benefits of Grooming

### For Quality:
- Multiple perspectives catch issues early
- Architectural concerns identified before coding
- Security vulnerabilities spotted in design phase
- Performance issues addressed upfront

### For Team:
- Everyone understands the plan
- Buy-in from all stakeholders
- Reduced surprises during implementation
- Clear ownership and accountability

### For Timeline:
- Fewer mid-implementation pivots
- Reduced rework
- Better estimates (reviewed by implementation lead)
- Dependencies identified early

### For Documentation:
- Feedback captured in task doc
- Design decisions documented with rationale
- Revision history tracks changes
- Future reference for similar tasks

---

## Enforcement

### Dr. Director Cannot:
- ❌ Start implementation without grooming
- ❌ Skip any doctor's review
- ❌ Override a doctor's concerns without addressing
- ❌ Begin work with pending approvals

### Doctors Cannot:
- ❌ Approve without completing review checklist
- ❌ Approve with unresolved concerns
- ❌ Skip providing feedback (must state "No concerns" explicitly)

### Implementation Team Cannot:
- ❌ Start coding before unanimous approval
- ❌ Deviate from approved plan without re-grooming
- ❌ Skip sections marked as required

---

## FAQs

**Q: What if a doctor is unavailable for 24 hours?**
A: Dr. Director can request another doctor in the same role to review, or wait. No exceptions to unanimous approval rule.

**Q: What if two doctors disagree on approach?**
A: Dr. Director facilitates discussion, documents both perspectives, makes decision with team input, gets re-approval from both doctors.

**Q: Can we skip grooming for small bugfixes?**
A: Small bugfixes (<50 LOC, single file, no schema changes) don't need full grooming. But still need:
- Test case that reproduces bug
- Dr. Testalot approval on test
- Dr. Clean quick review

**Q: What if requirements change during grooming?**
A: Dr. Director updates task doc, documents in Revision History, restarts grooming timer (24 hours). Better to get it right than rush.

**Q: How long should grooming take?**
A: Target 1-2 days:
- Draft: 1-2 hours
- Reviews: 24 hours (parallel)
- Iteration: 2-8 hours
- Total: 26-34 hours elapsed (mostly waiting)

**Q: Can we do partial approvals?**
A: No. All doctors must approve before implementation starts. This ensures no critical perspectives are missed.

---

## Example: Good Grooming Session

**Phase 2.5 - Real-Time Inventory Management**

```markdown
### Dr. Testalot (QA Lead) - Testing Review

**Review Date:** 2025-10-28

**Test Specification Review:**
- [x] All tests enumerated before implementation? YES - 75 tests specified
- [x] Test descriptions specific (not vague)? YES - Assertions shown
- [x] Test count matches summary table? YES - 75 matches
- [x] TDD workflow clear per phase? YES - RED-GREEN-REFACTOR per phase
- [x] Acceptance criteria measurable? YES - Specific test counts

**Feedback:**
Test specifications are excellent. Added 3 edge case tests for WebSocket disconnection scenarios (lines 450-475). Updated test count to 78.

**Concerns/Questions:**
1. ✅ RESOLVED: WebSocket reconnection logic - Added tests 76-78
2. ✅ RESOLVED: Concurrent inventory updates - Added locking tests

**Approval:** ✅ Approved (2025-10-28)

---

### Dr. Clean (Code Quality) - Architecture Review

**Review Date:** 2025-10-28

**Architecture Review:**
- [x] Follows existing patterns? YES - Uses existing WebSocket setup
- [x] No unnecessary complexity? CONCERN - See feedback
- [x] Proper separation of concerns? YES - Service layer separated
- [x] Security considerations addressed? YES - Auth on WS connection
- [x] Performance implications considered? YES - Throttling added

**Feedback:**
Excellent architecture overall. One concern: Proposed polling fallback adds complexity. Suggest WebSocket-only for MVP, add polling in Phase 2.6 if needed.

**Concerns/Questions:**
1. ✅ RESOLVED: Polling fallback removed from Phase 2.5 scope
2. ✅ RESOLVED: Connection pooling - Reusing existing Redis connections

**Approval:** ✅ Approved (2025-10-28)

---

[... Other doctors' reviews ...]

### Grooming Summary

| Doctor | Status | Date |
|--------|--------|------|
| Dr. Testalot (QA) | ✅ Approved | 2025-10-28 |
| Dr. Clean (Quality) | ✅ Approved | 2025-10-28 |
| Dr. LeanDev (Implementation) | ✅ Approved | 2025-10-28 |
| Dr. DevOps (Operations) | ✅ Approved | 2025-10-28 |
| Dr. Git (Version Control) | ✅ Approved | 2025-10-28 |

**Grooming Complete:** ✅ YES (All approved)
**Implementation Authorized:** ✅ YES (2025-10-28)

---

### Revision History

| Date | Revised By | Changes Made | Re-Grooming Required |
|------|------------|--------------|----------------------|
| 2025-10-28 | Dr. Director | Added 3 WebSocket tests per Dr. Testalot | NO (minor) |
| 2025-10-28 | Dr. Director | Removed polling fallback per Dr. Clean | NO (simplification) |
```

---

## Checklist: Dr. Director (Initiating Grooming)

- [ ] Task doc created with all required sections
- [ ] Tests enumerated completely
- [ ] Grooming section added to task doc
- [ ] Status marked: "Ready for Grooming 🟡"
- [ ] Grooming request sent to all doctors
- [ ] Review deadline set (24 hours)
- [ ] Monitoring feedback as it comes in
- [ ] Addressing concerns immediately
- [ ] Updating Revision History for all changes
- [ ] Notifying doctors of updates
- [ ] Verifying all approvals before authorization
- [ ] Updating status: "Approved for Implementation ✅"

---

## Related Documents

- **Task Template:** `docs/templates/TASK_DOCUMENT_TEMPLATE.md`
- **Task Checklist:** `docs/templates/TASK_DOC_CHECKLIST.md`
- **TDD Standard:** `docs/TDD_DOCUMENTATION_STANDARD.md`
- **Dr. Director:** `docs/agents/DOCTOR_DIRECTOR.md`
- **Dr. Testalot:** `docs/agents/DOCTOR_TESTALOT.md`
- **Dr. Clean:** `docs/agents/DOCTOR_CLEAN.md`
- **Dr. LeanDev:** `docs/agents/DOCTOR_LEANDEV.md`
- **Dr. DevOps:** `docs/agents/DOCTOR_DEVOPS.md`
- **Dr. Git:** `docs/agents/DOCTOR_GIT.md`

---

**Grooming is mandatory. No exceptions.**

Skipping grooming leads to:
- Design flaws discovered mid-implementation
- Rework and wasted effort
- Team misalignment
- Quality issues
- Technical debt

**Take the time to groom properly. The team will thank you later.**
