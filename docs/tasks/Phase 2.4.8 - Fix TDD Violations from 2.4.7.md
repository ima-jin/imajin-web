# Phase 2.4.8 - Fix TDD Violations from Phase 2.4.7

**Type:** Bugfix - Quality Restoration
**Priority:** CRITICAL
**Status:** 🟡 Ready for Implementation
**Estimated Effort:** 6-8 hours (1 day)
**Dependencies:** Phase 2.4.7 (Launch Injection - partially implemented)
**Grooming Status:** ✅ Approved (User directive)

---

## Overview

Phase 2.4.7 implementation began without following TDD workflow, resulting in 44 failing tests, 98 TypeScript errors, and 16 lint errors. This phase systematically fixes all quality issues using proper TDD methodology: Fix tests FIRST (RED → GREEN → REFACTOR).

### Goals

1. **Restore Quality Baseline:** 0 TypeScript errors, 0 lint errors, all tests passing
2. **Fix TDD Violations:** Address all tests that fail due to implementation mismatches
3. **Complete Schema Propagation:** Update all test fixtures with Phase 2.4.7 schema fields
4. **Document Process:** Prevent future TDD violations by updating DOCTOR_LEANDEV.md

---

## Problem Statement

**Current State:**
- Phase 2.4.7 implementation started WITHOUT writing tests first
- Tests were written AFTER implementation, violating TDD covenant
- Implementation doesn't match test expectations
- Test fixtures missing new schema fields (isLive, showOnPortfolioPage, portfolioCopy, isFeatured)
- Homepage is async Server Component but tests treat it as Client Component

**Issues:**
- 🔴 44 failing tests (997/1,044 passing = 95.8%)
- 🔴 98 TypeScript errors (need 0)
- 🔴 16 lint errors (need 0)
- 🔴 3 skipped tests (must fix or delete)
- 🔴 Baseline quality degraded from Phase 2.4.6 (was 775/778 passing)

**Solution:**
Fix all quality issues using TDD approach: Fix tests FIRST to match actual requirements, THEN adjust implementation to pass tests.

---

## New Schema Properties (Phase 2.4.7)

**Products Table:**
1. `isLive: boolean` - `.default(false).notNull()` (line 38 in db/schema.ts)
2. `showOnPortfolioPage: boolean` - `.default(false).notNull()` (line 47)
3. `portfolioCopy: text` - nullable, max 2000 chars (line 48)
4. `isFeatured: boolean` - `.default(false).notNull()` (line 49)

**MediaItem Changes:**
5. `category` enum - Added "hero" option for featured product hero images (line 42 in types/product.ts)

**Type Signatures:**
```typescript
// types/product.ts additions
export interface Product {
  // ...existing fields...
  isLive: boolean;
  showOnPortfolioPage: boolean;
  portfolioCopy: string | null;
  isFeatured: boolean;
}

export interface MediaItem {
  category: "main" | "detail" | "lifestyle" | "dimension" | "spec" | "hero"; // Added "hero"
}
```

---

## Test-First Approach

**This task fixes existing broken tests BEFORE adjusting implementation.**

**Fix Workflow:**
1. **DIAGNOSE:** Understand why each test fails
2. **FIX TEST:** Update test to match actual requirements (RED if needed)
3. **FIX CODE:** Adjust implementation to pass corrected test (GREEN)
4. **VERIFY:** Run full suite, ensure no regressions

---

## Implementation Phases

### Phase 1: Fix Test Fixtures - Schema Propagation (1-2 hours)

**Goal:** Update ALL test fixtures to include Phase 2.4.7 schema fields

**TDD Approach:** Update fixtures first, verify TypeScript errors reduce

**1.1 Identify All Test Fixtures**
- [ ] `tests/fixtures/product-fixtures.ts`
- [ ] `tests/fixtures/test-products.json`
- [ ] `tests/fixtures/products.ts`
- [ ] All inline test data in `tests/integration/sync-products-enhanced.test.ts` (20+ fixtures)
- [ ] All inline test data in `tests/unit/lib/product-validator.test.ts` (9 fixtures)
- [ ] All inline test data in `tests/unit/lib/mappers/product-mapper.test.ts` (2 fixtures)

**1.2 Add Required Fields to All Product Fixtures**
- [ ] Add `isLive: boolean` (default: `false` or `true` based on test scenario)
- [ ] Add `showOnPortfolioPage: boolean` (default: `false`)
- [ ] Add `portfolioCopy: string | null` (default: `null`)
- [ ] Add `isFeatured: boolean` (default: `false`)
- [ ] Update any `media` arrays to include `"hero"` category where needed

**1.3 Run Type Check (Expect Improvement)**
- [ ] Run: `npm run type-check`
- [ ] Expected: Errors reduce from 98 to ~40-50 (fixture errors fixed)
- [ ] Document remaining errors

**Phase 1 Gate Criteria:**
- [ ] All test fixtures updated with new schema fields
- [ ] TypeScript errors reduced by ~50%
- [ ] No new test failures introduced

**Deliverables:**
- 25+ test fixtures updated
- TypeScript errors: 98 → ~40-50

---

### Phase 2: Fix TypeScript Errors - Type Safety (1-2 hours)

**Goal:** Fix all remaining TypeScript errors (null checks, missing exports, type mismatches)

**TDD Approach:** Fix type errors BEFORE running tests (tests won't compile otherwise)

**2.1 Fix Null Safety Errors (20 errors)**
**Files:** `tests/integration/seo/metadata.test.ts`, `tests/unit/lib/mappers/product-mapper.test.ts`
- [ ] Add null checks for `metadata.title` (lines 18, 27)
- [ ] Add null checks for `metadata.description` (lines 27-28)
- [ ] Add null checks for `metadata.openGraph` (lines 55, 63, 73-74)
- [ ] Add null checks for `metadata.twitter` (line 85)
- [ ] Fix null assignments in product-mapper tests (lines 81-83, 101-102)

**2.2 Fix Missing Exports (10 errors)**
**Files:** `app/products/[id]/page.tsx`, `scripts/sync-from-stripe.ts`
- [ ] Export `generateMetadata` function from product detail page
- [ ] Fix missing `@/lib/config/loader` import (or remove if unused)

**2.3 Fix Badge Variant Type Mismatches (2 errors)**
**Files:** `components/portfolio/PortfolioFeaturedCard.tsx`, `components/products/ProductCard.tsx`
- [ ] Fix Badge variant: `"primary"` → use valid variant from Badge component
- [ ] Fix Badge variant: `"info"` → use valid variant from Badge component
- [ ] Check Badge component definition for allowed variants

**2.4 Fix Product Validator Test Errors (9 errors)**
**Files:** `tests/unit/lib/product-validator.test.ts`
- [ ] Add missing `id` and `productId` fields to variant test fixtures (lines 66, 76, 87, 99, 110, 122, 136, 148, 159)

**2.5 Fix Sync Script Errors (15 errors)**
**Files:** `scripts/sync-products-enhanced.ts`
- [ ] Add `data.variants` null checks before accessing (lines 104, 115, 165, 238)
- [ ] Fix `productSpecs` insert - remove invalid `label` field (lines 655, 657)
- [ ] Fix spec property name: `order` → `displayOrder` (line 659)
- [ ] Fix spec label reference (line 666)
- [ ] Add null checks for `data.dependencies` (lines 677, 679)
- [ ] Fix `rowCount` property access (line 721)

**2.6 Fix Image Optimization Test Errors (1 error)**
**Files:** `tests/integration/components/image-optimization.test.tsx`
- [ ] Fix `getByAlt` → use correct query method from Testing Library (line 37)

**2.7 Fix Logger Test Errors (4 errors)**
**Files:** `tests/unit/lib/utils/logger.test.ts`
- [ ] Fix `unknown` to `string` type assertions (lines 33, 46, 55, 70)

**2.8 Fix MediaItem.deleted Error (1 error)**
**Files:** `components/portfolio/PortfolioFeaturedCard.tsx`
- [ ] Remove invalid `deleted` property from MediaItem filter (line 27)

**2.9 Run Type Check (Expect Clean)**
- [ ] Run: `npm run type-check`
- [ ] Expected: 0 errors
- [ ] Document any remaining issues

**Phase 2 Gate Criteria:**
- [ ] TypeScript: 0 errors (down from 98)
- [ ] All files compile successfully
- [ ] No type safety regressions

**Deliverables:**
- 98 TypeScript errors fixed
- Type safety restored

---

### Phase 3: Fix Lint Errors (30 minutes)

**Goal:** Fix all 16 lint errors (type definitions, unused vars)

**TDD Approach:** Fix linter issues BEFORE running tests

**3.1 Fix Lint Errors**
- [ ] Review all 16 lint errors from `npm run lint`
- [ ] Fix or suppress test-related `any` types (acceptable in tests)
- [ ] Remove unused imports/variables
- [ ] Fix any actual code quality issues

**3.2 Run Lint Check (Expect Clean)**
- [ ] Run: `npm run lint`
- [ ] Expected: 0 errors, acceptable warnings in tests
- [ ] Document remaining warnings (140 `any` warnings in tests are acceptable)

**Phase 3 Gate Criteria:**
- [ ] Lint: 0 errors
- [ ] Only acceptable warnings remain (test `any` types)

**Deliverables:**
- 16 lint errors fixed
- Lint clean

---

### Phase 4: Fix Homepage Tests - Async Server Component (1 hour)

**Goal:** Fix homepage tests to properly handle async Server Component

**TDD Approach:** Fix tests to match Next.js 16 async component patterns

**4.1 Diagnose Homepage Test Failures (7 failures)**
**File:** `tests/unit/app/page.test.tsx`
**Error:** "HomePage is an async Client Component. Only Server Components can be async."
**Root Cause:** Tests using `render(<HomePage />)` for async Server Component

**4.2 Fix Approach Options**
**Option A: Mock async data fetching**
```typescript
// Mock the async data dependencies
vi.mock('@/hooks/usePageContent', () => ({
  getHomePageContent: vi.fn().mockResolvedValue(mockContent),
}));

vi.mock('@/lib/utils/api-client', () => ({
  apiGet: vi.fn().mockResolvedValue(mockProducts),
}));

// Then render with mocks
render(<HomePage />);
```

**Option B: Test component structure only (simpler)**
```typescript
// Test the exported metadata
test('should export metadata', () => {
  expect(metadata).toBeDefined();
  expect(metadata.title).toBe('Imajin - Modular LED Fixtures');
});

// Test that page is a valid async component
test('should be an async function', () => {
  expect(HomePage.constructor.name).toBe('AsyncFunction');
});
```

**4.3 Implement Test Fixes**
- [ ] Choose fix approach (recommend Option A for comprehensive testing)
- [ ] Update all 7 homepage tests to use async component mocking
- [ ] Run tests: `npm test tests/unit/app/page.test.tsx` - **EXPECT PASSING**

**Phase 4 Gate Criteria:**
- [ ] All 7 homepage tests passing
- [ ] Tests properly handle async Server Component
- [ ] No new failures introduced

**Deliverables:**
- 7 homepage tests fixed
- Proper async component testing pattern established

---

### Phase 5: Fix Portfolio Page Tests (1 hour)

**Goal:** Fix portfolio page implementation and tests

**TDD Approach:** Fix tests first to match actual requirements

**5.1 Diagnose Portfolio Test Failures (10+ failures)**
**File:** `tests/unit/app/portfolio/page.test.tsx`
**Failures:**
- "should render portfolio page" - Component not rendering
- "should fetch portfolio products from API" - API not being called
- "should handle API error gracefully" - Error handling broken
- "should handle network errors" - Network error handling broken
- "should show empty state when no portfolio products" - Empty state not rendering

**5.2 Review Portfolio Page Implementation**
- [ ] Read `app/portfolio/page.tsx` to understand actual implementation
- [ ] Identify gaps between tests and implementation
- [ ] Decide: Fix tests to match implementation OR fix implementation to match tests

**5.3 Implement Fixes (tests first)**
- [ ] Update portfolio page tests to match actual implementation
- [ ] If implementation missing, add minimal implementation to pass tests
- [ ] Ensure async Server Component handled correctly (same as Phase 4)
- [ ] Run tests: `npm test tests/unit/app/portfolio/page.test.tsx` - **EXPECT PASSING**

**Phase 5 Gate Criteria:**
- [ ] All 10 portfolio tests passing
- [ ] Portfolio page renders correctly
- [ ] API calls working as expected

**Deliverables:**
- 10 portfolio tests fixed
- Portfolio page implementation corrected

---

### Phase 6: Fix SEO Metadata Tests (1 hour)

**Goal:** Fix SEO metadata tests and exports

**TDD Approach:** Fix tests to handle nullable metadata, fix missing exports

**6.1 Diagnose SEO Test Failures (8 failures)**
**File:** `tests/integration/seo/metadata.test.ts`
**Errors:**
- Missing `generateMetadata` export from product detail page
- Null safety issues with metadata.title, description, openGraph, twitter
- Type mismatches with Twitter Card schema

**6.2 Fix Product Detail Page**
**File:** `app/products/[id]/page.tsx`
- [ ] Add `export` to `generateMetadata` function (if not already exported)
- [ ] Verify metadata structure matches Next.js Metadata type

**6.3 Fix SEO Tests**
- [ ] Add proper null checks for all metadata fields
- [ ] Fix Twitter Card type assertions
- [ ] Update test expectations to match actual metadata structure
- [ ] Run tests: `npm test tests/integration/seo/metadata.test.ts` - **EXPECT PASSING**

**Phase 6 Gate Criteria:**
- [ ] All 8 SEO tests passing
- [ ] Product detail page exports metadata correctly
- [ ] Tests handle nullable metadata fields

**Deliverables:**
- 8 SEO tests fixed
- Product detail page metadata export fixed

---

### Phase 7: Fix Component Tests (1 hour)

**Goal:** Fix remaining component tests (HeroSection, FeaturedProducts, PortfolioCard, Image optimization)

**TDD Approach:** Fix tests to match actual component implementations

**7.1 Review Component Implementations**
- [ ] `components/home/HeroSection.tsx` - Does it exist? Match test expectations?
- [ ] `components/home/FeaturedProducts.tsx` - Does it exist? Match test expectations?
- [ ] `components/portfolio/PortfolioCard.tsx` - Does it exist? Match test expectations?

**7.2 Fix Component Tests**
- [ ] Update tests to match actual component props/structure
- [ ] If components incomplete, add minimal implementation to pass tests
- [ ] Fix image optimization test query methods
- [ ] Run tests: `npm test tests/unit/components/` - **EXPECT PASSING**

**Phase 7 Gate Criteria:**
- [ ] All component tests passing
- [ ] Components render correctly
- [ ] No prop mismatches

**Deliverables:**
- ~8 component tests fixed
- Component implementations corrected

---

### Phase 8: Fix Integration Tests (1 hour)

**Goal:** Fix sync-products-enhanced integration tests

**TDD Approach:** Tests already passing after Phase 1 fixture updates

**8.1 Verify Integration Tests**
- [ ] Run: `npm test tests/integration/sync-products-enhanced.test.ts`
- [ ] Verify all tests passing after fixture updates from Phase 1
- [ ] If failures remain, diagnose and fix

**8.2 Fix Any Remaining Failures**
- [ ] Update test expectations if needed
- [ ] Ensure variant specs no longer expected (removed from schema)
- [ ] Run tests: **EXPECT PASSING**

**Phase 8 Gate Criteria:**
- [ ] All integration tests passing
- [ ] No schema mismatch errors

**Deliverables:**
- ~5+ integration tests fixed

---

### Phase 9: Fix Skipped Tests (30 minutes)

**Goal:** Fix or delete 3 skipped tests in ToastProvider

**TDD Approach:** Investigate why skipped, fix if possible, delete if not needed

**9.1 Review Skipped Tests**
**File:** `tests/unit/components/toast/ToastProvider.test.tsx`
- [ ] Line 68: "should auto-dismiss toast after duration" (timer issue?)
- [ ] Line 92: "should allow manual dismissal" (interaction issue?)
- [ ] Line 114: "should show multiple toasts" (race condition?)

**9.2 Fix or Delete**
- [ ] Attempt to fix timer-based tests (use vi.useFakeTimers correctly)
- [ ] If tests are flaky/unreliable, DELETE them (better than skipped per Testing Covenant)
- [ ] Run tests: `npm test tests/unit/components/toast/` - **EXPECT PASSING or DELETED**

**Phase 9 Gate Criteria:**
- [ ] 0 skipped tests (either fixed or deleted)
- [ ] All remaining tests passing

**Deliverables:**
- 3 skipped tests addressed (fixed or deleted)

---

### Phase 10: Full Suite Validation & Documentation (30 minutes)

**Goal:** Verify all quality gates pass, update documentation

**TDD Approach:** Run full test suite, verify baseline restored

**10.1 Run Full Test Suite**
- [ ] Run: `npm test`
- [ ] Expected: 1,044/1,044 tests passing (or 1,041 if 3 skipped tests deleted)
- [ ] Duration: <120 seconds
- [ ] No failures, no skips

**10.2 Verify Quality Gates**
- [ ] Run: `npm run type-check` → 0 errors
- [ ] Run: `npm run lint` → 0 errors
- [ ] Test pass rate: 100%

**10.3 Update Documentation**
- [ ] Update `docs/IMPLEMENTATION_PLAN.md` - Mark Phase 2.4.8 complete
- [ ] Update `CLAUDE.md` - Note: Phase 2.4.8 quality restoration complete
- [ ] Document lessons learned

**Phase 10 Gate Criteria:**
- [ ] All tests passing: 1,041-1,044/1,044 (100%)
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
- [ ] Documentation updated

**Deliverables:**
- Quality baseline restored
- Documentation updated
- Ready to proceed with Phase 2.4.7 implementation (following TDD correctly)

---

## Acceptance Criteria

**Tests:**
- [ ] All tests passing: 1,041-1,044/1,044 (100%)
- [ ] 0 skipped tests
- [ ] 0 failing tests
- [ ] Test suite runs in <120 seconds

**TypeScript:**
- [ ] 0 TypeScript errors (down from 98)
- [ ] All files compile successfully

**Linting:**
- [ ] 0 lint errors (down from 16)
- [ ] Only acceptable warnings in test files

**Quality Baseline:**
- [ ] Baseline restored to pre-Phase 2.4.7 quality
- [ ] All Phase 2.4.7 schema fields propagated to test fixtures
- [ ] No regressions in existing functionality

**Documentation:**
- [ ] IMPLEMENTATION_PLAN.md updated
- [ ] DOCTOR_LEANDEV.md updated with TDD-first enforcement
- [ ] Lessons learned documented

---

## Test Specification Summary

**Total Fixes: 161 items**

| Phase | Fix Type | Count | Files |
|-------|----------|-------|-------|
| 1 | Test Fixtures | 25+ | product-fixtures.ts, test-products.json, inline fixtures |
| 2 | TypeScript Errors | 98 | 10+ files |
| 3 | Lint Errors | 16 | Various |
| 4 | Homepage Tests | 7 | page.test.tsx |
| 5 | Portfolio Tests | 10 | portfolio/page.test.tsx |
| 6 | SEO Tests | 8 | seo/metadata.test.ts |
| 7 | Component Tests | 8 | HeroSection, FeaturedProducts, PortfolioCard, etc. |
| 8 | Integration Tests | 5+ | sync-products-enhanced.test.ts |
| 9 | Skipped Tests | 3 | ToastProvider.test.tsx |
| 10 | Validation | 1 | Full suite |
| **Total** | | **161** | **25+ files** |

---

## Deliverables

1. **Test Fixtures Updated** - All fixtures include Phase 2.4.7 schema fields (25+ fixtures)
2. **TypeScript Errors Fixed** - 0 errors (down from 98)
3. **Lint Errors Fixed** - 0 errors (down from 16)
4. **Homepage Tests Fixed** - 7 tests passing (async Server Component handling)
5. **Portfolio Tests Fixed** - 10 tests passing
6. **SEO Tests Fixed** - 8 tests passing
7. **Component Tests Fixed** - 8 tests passing
8. **Integration Tests Fixed** - 5+ tests passing
9. **Skipped Tests Addressed** - 0 skipped (fixed or deleted)
10. **Documentation Updated** - IMPLEMENTATION_PLAN.md, DOCTOR_LEANDEV.md

**Total Lines Changed:**
- Test fixtures: ~200 lines
- Test fixes: ~150 lines
- Type fixes: ~100 lines
- Documentation: ~50 lines
- **Total: ~500 lines**

---

## Risk Assessment

**Low Risk:**
- ✅ All fixes are to existing code (no new features)
- ✅ TDD approach ensures no regressions
- ✅ Quality gates prevent incomplete fixes

**Medium Risk:**
- ⚠️ Homepage async Server Component testing pattern may need iteration
- ⚠️ Some tests may need significant rewrites if implementation doesn't match expectations

**High Risk:**
- None (this is a bugfix phase, not new development)

---

## Timeline Summary

| Phase | Focus | Duration | Fixes |
|-------|-------|----------|-------|
| 1 | Test Fixtures | 1-2h | 25+ fixtures |
| 2 | TypeScript Errors | 1-2h | 98 errors |
| 3 | Lint Errors | 30m | 16 errors |
| 4 | Homepage Tests | 1h | 7 tests |
| 5 | Portfolio Tests | 1h | 10 tests |
| 6 | SEO Tests | 1h | 8 tests |
| 7 | Component Tests | 1h | 8 tests |
| 8 | Integration Tests | 1h | 5+ tests |
| 9 | Skipped Tests | 30m | 3 tests |
| 10 | Validation | 30m | Full suite |
| **Total** | **Quality Restoration** | **6-8h** | **161 fixes** |

**Estimated: 1 day of focused work**

**Quality Progression:**
- Starting: 997/1,044 tests passing (95.8%), 98 TS errors, 16 lint errors
- After Phase 2.4.8: 1,041-1,044/1,044 tests passing (100%), 0 TS errors, 0 lint errors
- Baseline RESTORED ✅

---

## Status: 🟡 Ready for Implementation

**Created:** 2025-10-30
**User Approved:** 2025-10-30 (Directive: "Let's fix everything in place rn")

---

## DOCTOR_LEANDEV Update Required

**File:** `docs/agents/DOCTOR_LEANDEV.md`

**Change Required:** Enforce TDD-first approach as PRIMARY impulse

**Problem:** Dr. LeanDev currently jumps straight to implementation without writing tests first.

**Solution:** Update profile to make TDD the AUTOMATIC first response to any change request.

**New Behavior:**
- ANY request for code change → Write test FIRST
- Implementation only AFTER test written and failing
- No exceptions (even for "quick fixes")

---

## Revision History

| Date | Revised By | Changes Made | Re-Grooming Required |
|------|------------|--------------|----------------------|
| 2025-10-30 | Dr. Testalot | Initial draft | No (user approved) |

---

**⚠️ USER DIRECTIVE: FIX EVERYTHING IN PLACE - APPROVED FOR IMMEDIATE IMPLEMENTATION**
