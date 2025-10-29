# Task Grooming: Quick Start Guide

**For:** Dr. Director and all development team members
**Purpose:** Fast reference for conducting task grooming sessions

---

## What is Grooming?

**Grooming** is a mandatory review process where all specialists (Doctors) review, provide input, and approve task documents before implementation begins.

**Goal:** Unanimous approval from all 5 Doctors before coding starts.

---

## The 3-Phase Workflow

### Phase 1: Draft (Dr. Director) - 1-2 hours

```bash
1. Copy template
2. Fill all sections
3. Enumerate ALL tests
4. Add grooming section (template includes it)
5. Mark status: "Ready for Grooming 🟡"
```

### Phase 2: Grooming (All Doctors) - 24-48 hours

```bash
Dr. Director initiates → All doctors review (parallel) →
Address feedback → Update doc → Re-review → Unanimous approval
```

### Phase 3: Authorization (Dr. Director) - Immediate

```bash
Verify all approvals → Change status → Authorize implementation
```

---

## Grooming Participants (All Required)

| Doctor | Focus | Review Checklist Items |
|--------|-------|----------------------|
| **Dr. Testalot** | Testing | Tests enumerated? Specific? Count matches? TDD workflow clear? |
| **Dr. Clean** | Architecture | Patterns? Complexity? Separation? Security? Performance? |
| **Dr. LeanDev** | Implementation | Approach clear? Dependencies? Timeline? Blockers? APIs? |
| **Dr. DevOps** | Deployment | Infrastructure? Env vars? Migration? Rollback? Monitoring? |
| **Dr. Git** | Version Control | Scope? Breaking changes? Docs? Migration path? Commits? |

---

## For Dr. Director: Initiating Grooming

### 1. Draft Complete?

- [ ] Task doc created from template
- [ ] All required sections filled
- [ ] Tests enumerated (with assertions)
- [ ] Test summary table accurate
- [ ] Grooming section added
- [ ] Status: "Ready for Grooming 🟡"

### 2. Send Grooming Request

**Message Template:**
```
🔔 GROOMING SESSION: Phase X.X - [Feature Name]

Task Document: docs/tasks/Phase X.X - [Feature Name].md
Status: Ready for Grooming 🟡

Please review by: [Date, 24 hours from now]

@Dr. Testalot - Test specifications (lines X-Y)
@Dr. Clean - Architecture (entire doc)
@Dr. LeanDev - Implementation feasibility (entire doc)
@Dr. DevOps - Deployment strategy (lines A-B)
@Dr. Git - Change impact (lines C-D)

Fill out your section in the Grooming Section at bottom of doc.
Mark approval when ready.
```

### 3. Monitor and Address Feedback

**Daily Tasks:**
- [ ] Check task doc for new doctor feedback
- [ ] Address concerns immediately
- [ ] Update task doc based on suggestions
- [ ] Document changes in Revision History
- [ ] Notify doctors when their feedback is addressed
- [ ] Request re-review if significant changes made

### 4. Verify Unanimous Approval

**Before authorizing implementation:**
- [ ] All 5 doctors have ✅ Approved
- [ ] Grooming Summary table shows all approvals
- [ ] All concerns resolved
- [ ] No pending feedback

### 5. Authorize Implementation

```markdown
**Status:** 🟢 Approved for Implementation

**Grooming Complete:** ✅ YES (All approved)
**Implementation Authorized By:** Dr. Director
**Authorization Date:** 2025-10-28
```

---

## For Doctors: Reviewing Task Documents

### Your Responsibilities

1. **Read entire task document** (not just your section)
2. **Fill out your review section** in Grooming Section
3. **Check all checklist items** relevant to your role
4. **Provide specific feedback** (not just "looks good")
5. **List concerns/questions** explicitly
6. **Mark approval status** (❌ Pending or ✅ Approved)
7. **Add review date** when complete

### Review Timeline

- **Target:** 24 hours from grooming request
- **Acceptable:** 48 hours if complex
- **Unacceptable:** >48 hours (blocks entire team)

### When to Approve

✅ **Approve when:**
- All your checklist items checked
- No concerns remaining
- Feedback addressed satisfactorily
- Ready for implementation

❌ **Don't approve when:**
- Checklist items unchecked
- Concerns unresolved
- Unclear requirements
- Significant risks unaddressed

### Providing Feedback

**Bad Feedback:**
```
Looks good to me.
```

**Good Feedback:**
```
**Feedback:**
Overall architecture is sound. Two suggestions:

1. Lines 150-175: Proposed polling fallback adds unnecessary
   complexity. Recommend WebSocket-only for MVP, add polling
   in Phase 2.6 if needed.

2. Lines 220-235: Connection pooling - suggest reusing existing
   Redis connections instead of creating new pool.

**Concerns/Questions:**
1. ✅ RESOLVED: Polling fallback removed from scope
2. ✅ RESOLVED: Using existing Redis pool
```

### Raising Concerns

**Format for concerns:**
```
**Concerns/Questions:**
1. ❌ UNRESOLVED: Missing error handling for API timeout (lines 300-320)
2. ❌ UNRESOLVED: Timeline seems optimistic - 20 hours for 75 tests?
3. ✅ RESOLVED: Test data fixtures - Dr. Director added fixture planning
```

**Mark concerns as resolved when:**
- Dr. Director addresses the concern
- Task doc updated
- You're satisfied with the resolution

---

## Common Grooming Scenarios

### Scenario 1: Doctor Has Concerns

```
Doctor reviews → Lists concerns → Marks ❌ Pending
↓
Dr. Director addresses → Updates task doc → Documents in Revision History
↓
Doctor re-reviews → Concerns resolved → Marks ✅ Approved
```

### Scenario 2: Two Doctors Disagree

```
Dr. Clean: "Too complex, simplify"
Dr. LeanDev: "Need this complexity for flexibility"
↓
Dr. Director facilitates discussion
↓
Document both perspectives in task doc
↓
Make decision with rationale
↓
Both doctors re-review and approve
```

### Scenario 3: Requirements Change During Grooming

```
During review, team realizes API misunderstood
↓
Dr. Director updates task doc (major revision)
↓
Documents change in Revision History
↓
Marks "Re-Grooming Required: YES"
↓
All doctors re-review entire doc
↓
Unanimous approval required again
```

### Scenario 4: Timeline Concerns

```
Dr. LeanDev: "Timeline unrealistic - 20h for 75 tests is tight"
↓
Dr. Director adjusts estimate to 30-35 hours
↓
Updates task doc and timeline summary
↓
Dr. LeanDev reviews, approves ✅
```

---

## Grooming Checklist

### For Dr. Director

**Before Initiating:**
- [ ] Draft complete
- [ ] Tests enumerated
- [ ] Grooming section added
- [ ] Status marked

**During Grooming:**
- [ ] Request sent to all doctors
- [ ] Deadline set (24 hours)
- [ ] Monitoring feedback daily
- [ ] Addressing concerns immediately
- [ ] Updating Revision History
- [ ] Notifying doctors of updates

**Before Authorization:**
- [ ] All 5 approvals received ✅
- [ ] All concerns resolved
- [ ] Grooming Summary updated
- [ ] Status changed to approved

### For Each Doctor

**During Review:**
- [ ] Read entire task document
- [ ] Complete review checklist
- [ ] Provide specific feedback
- [ ] List concerns explicitly
- [ ] Mark approval status
- [ ] Add review date

**After Feedback Addressed:**
- [ ] Re-review changes
- [ ] Verify concerns resolved
- [ ] Update approval status
- [ ] Add approval date

---

## Timeline Estimates

| Phase | Duration | Notes |
|-------|----------|-------|
| Draft Creation | 1-2 hours | Dr. Director |
| Doctor Reviews | 24 hours | Parallel |
| Feedback Iteration | 2-8 hours | As needed |
| Authorization | <1 hour | Dr. Director |
| **Total Grooming Time** | **1-2 days** | Mostly waiting |

**Benefits worth the delay:**
- Fewer surprises
- Better design decisions
- Reduced rework
- Higher quality outcomes
- Team alignment

---

## When to Skip Grooming

**Full grooming NOT required for:**
- Small bugfixes (<50 LOC, single file, no schema changes)
- Documentation-only changes
- Test-only additions (no production code changes)
- Hotfixes (but get Dr. Testalot + Dr. Clean quick review)

**Still need for small changes:**
- Test case that reproduces bug (if bugfix)
- Dr. Testalot quick approval
- Dr. Clean quick review

---

## Red Flags

**Dr. Director should watch for:**
- ❌ Doctor hasn't reviewed in >48 hours (escalate)
- ❌ Doctor approved without checklist complete
- ❌ Concerns marked resolved but not actually addressed
- ❌ Significant scope changes without re-grooming

**Doctors should flag:**
- ❌ Vague test descriptions
- ❌ Missing dependencies
- ❌ Unrealistic timelines
- ❌ Security vulnerabilities
- ❌ Architectural debt
- ❌ Unclear requirements

---

## FAQ

**Q: Do all 5 doctors REALLY need to approve?**
A: Yes. Unanimous approval ensures no critical perspectives are missed.

**Q: What if a doctor is unavailable?**
A: Wait or find substitute doctor in same role. No exceptions to unanimous approval.

**Q: Can we start implementation while waiting for approvals?**
A: NO. Implementation cannot begin until all approvals received.

**Q: What if timeline is urgent?**
A: Communicate urgency upfront. Doctors prioritize urgent reviews. But still need unanimous approval - no shortcuts.

**Q: How long should doctor reviews take?**
A: Target 24 hours. Complex tasks may need 48 hours. >48 hours is blocking the team.

**Q: Can we do partial approvals?**
A: No. All 5 doctors must approve before implementation starts.

---

## Resources

- **Full Process:** `docs/TASK_GROOMING_PROCESS.md`
- **Task Template:** `docs/templates/TASK_DOCUMENT_TEMPLATE.md`
- **Task Checklist:** `docs/templates/TASK_DOC_CHECKLIST.md`
- **TDD Standard:** `docs/TDD_DOCUMENTATION_STANDARD.md`
- **Doctor Roles:** `docs/agents/DOCTOR_*.md`

---

**Grooming ensures quality. Take the time to do it right.**
