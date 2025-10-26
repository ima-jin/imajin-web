# Phase 2.3.5: Design System & Style Architecture

**Type:** Technical Debt Paydown
**Priority:** HIGH - Should complete BEFORE Phase 2.4 (Checkout)
**Reason:** Foundational architecture missing. Building more features without this = accumulating technical debt.

---

## Context

### The Problem
Styling is tightly coupled via inline Tailwind classes throughout components:
```tsx
<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
```

**Issue:**
- No centralized design tokens
- No reusable UI component library
- Presentation logic scattered across 20+ component files
- Changing design = editing every component
- Inconsistent styling patterns emerging
- Poor separation of concerns

### What We Should Have Built (Phase 1.2)
This is fundamental architecture that should have existed from project start:
1. Design token system (theme variables)
2. UI component library (Button, Card, Input, etc.)
3. Clear separation between presentation and markup

### Why We're Doing This Now
We caught the architectural gap early (Phase 2.3). Better to fix now than after building 10 more features.

---

## Objectives

1. **Create Design System** - Reusable UI component library
2. **Decouple Styling** - Separate presentation from markup
3. **Theme Variables** - Centralized design tokens
4. **Refactor Existing** - Update Phase 2.2/2.3 components to use design system
5. **Document Patterns** - Style guide for future development

---

## Tasks

### 1. Audit Current Styling
- [ ] List all components with inline Tailwind classes
- [ ] Identify repeated style patterns (buttons, cards, badges, inputs)
- [ ] Document current color palette vs wireframe palette
- [ ] Identify components that need redesign vs just restyle

**Files to Audit:**
- `/components/products/*` (ProductCard, ProductGrid, ProductSpecs, etc.)
- `/components/cart/*` (CartDrawer, CartItem, CartButton, etc.)
- `/components/home/HeroSection.tsx`
- `/components/layout/Header.tsx`
- `/app/page.tsx`, `/app/products/page.tsx`, `/app/products/[id]/page.tsx`

### 2. Create Design Token System

Create `/app/globals.css` theme variables:

```css
@theme {
  /* ===== COLOR PALETTE ===== */
  /* Primary */
  --color-primary: #000000;
  --color-secondary: #ffffff;

  /* Backgrounds */
  --color-bg-light: #ffffff;
  --color-bg-dark: #000000;
  --color-bg-neutral: #f8f8f8;

  /* Text */
  --color-text-primary: #171717;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;
  --color-text-inverse: #ffffff;

  /* Accents */
  --color-accent-success: #4caf50;
  --color-accent-warning: #ff9800;
  --color-accent-error: #d32f2f;
  --color-accent-limited: #d32f2f;

  /* Borders */
  --color-border-light: #eeeeee;
  --color-border-medium: #dddddd;
  --color-border-dark: #000000;

  /* ===== TYPOGRAPHY ===== */
  --font-heading: var(--font-geist-sans);
  --font-body: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  /* Font Sizes */
  --text-hero: 3.5rem;              /* 56px */
  --text-h1: 3rem;                  /* 48px */
  --text-h2: 2.25rem;               /* 36px */
  --text-h3: 1.5rem;                /* 24px */
  --text-h4: 1.25rem;               /* 20px */
  --text-body-lg: 1.125rem;         /* 18px */
  --text-body: 1rem;                /* 16px */
  --text-body-sm: 0.875rem;         /* 14px */
  --text-caption: 0.75rem;          /* 12px */

  /* Font Weights */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* ===== SPACING ===== */
  --spacing-xs: 0.5rem;             /* 8px */
  --spacing-sm: 0.75rem;            /* 12px */
  --spacing-md: 1rem;               /* 16px */
  --spacing-lg: 1.5rem;             /* 24px */
  --spacing-xl: 2rem;               /* 32px */
  --spacing-2xl: 2.5rem;            /* 40px */
  --spacing-3xl: 3rem;              /* 48px */
  --spacing-4xl: 4rem;              /* 64px */
  --spacing-5xl: 5rem;              /* 80px */

  /* Semantic Spacing */
  --spacing-section: var(--spacing-5xl);
  --spacing-card-padding: var(--spacing-2xl);
  --spacing-card-gap: var(--spacing-xl);

  /* ===== LAYOUT ===== */
  --container-max-width: 1400px;
  --container-padding: var(--spacing-2xl);

  /* ===== SHADOWS ===== */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.15);

  /* ===== TRANSITIONS ===== */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;

  /* ===== BORDER RADIUS ===== */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

### 3. Create UI Component Library

Build `/components/ui/` directory with reusable, styled components:

#### Button Component
- [ ] `/components/ui/Button.tsx`
  - Variants: primary, secondary, ghost, link
  - Sizes: sm, md, lg
  - States: default, hover, active, disabled, loading
  - Tests: 15+ tests

```tsx
// Example usage after implementation:
<Button variant="primary" size="lg">Shop Now</Button>
<Button variant="secondary">View Details</Button>
```

#### Card Component
- [ ] `/components/ui/Card.tsx`
  - Base card structure
  - CardHeader, CardContent, CardFooter sub-components
  - Hover states
  - Tests: 10+ tests

#### Badge Component
- [ ] `/components/ui/Badge.tsx`
  - Variants: default, limited, new, success, warning, error
  - Sizes: sm, md, lg
  - Tests: 8+ tests

#### Input Components
- [ ] `/components/ui/Input.tsx`
- [ ] `/components/ui/Select.tsx`
- [ ] `/components/ui/Textarea.tsx`
  - Consistent styling across form elements
  - Error states
  - Helper text
  - Tests: 12+ tests each

#### Typography Components
- [ ] `/components/ui/Heading.tsx`
  - H1, H2, H3, H4, H5, H6 semantic components
  - Consistent sizing with theme
  - Tests: 6+ tests

- [ ] `/components/ui/Text.tsx`
  - Body, caption, label variants
  - Color options: primary, secondary, muted, inverse
  - Tests: 8+ tests

#### Layout Components
- [ ] `/components/ui/Container.tsx`
  - Max-width container with padding
  - Tests: 4+ tests

- [ ] `/components/ui/Section.tsx`
  - Semantic section wrapper with spacing
  - Background variants: light, dark, neutral
  - Tests: 6+ tests

#### Price Component
- [ ] `/components/ui/Price.tsx`
  - Consistent price formatting
  - Size variants
  - Tests: 8+ tests

### 4. Refactor Existing Components

Update all Phase 2.2/2.3 components to use design system:

#### Product Components
- [ ] Refactor `/components/products/ProductCard.tsx`
  - Use Card, Badge, Price, Button from /ui
  - Update tests (should still pass with new styling)

- [ ] Refactor `/components/products/ProductGrid.tsx`
  - Use Container from /ui
  - Update layout spacing to use theme variables

- [ ] Refactor `/components/products/LimitedEditionBadge.tsx`
  - Replace with Badge component from /ui
  - Update tests

- [ ] Refactor `/components/products/ProductSpecs.tsx`
  - Use Card, Heading, Text from /ui
  - Update tests

#### Cart Components
- [ ] Refactor `/components/cart/CartDrawer.tsx`
  - Use Button, Heading from /ui
  - Update tests

- [ ] Refactor `/components/cart/CartItem.tsx`
  - Use Card, Button, Price from /ui
  - Update tests

- [ ] Refactor `/components/cart/CartButton.tsx`
  - Use Badge for count indicator
  - Update tests

- [ ] Refactor `/components/cart/AddToCartButton.tsx`
  - Use Button from /ui
  - Update tests

#### Layout Components
- [ ] Refactor `/components/layout/Header.tsx`
  - Use Container, Button from /ui
  - Maintain existing functionality

- [ ] Refactor `/components/home/HeroSection.tsx`
  - Use Heading, Text, Button, Container, Section from /ui
  - Maintain existing functionality

#### Pages
- [ ] Refactor `/app/page.tsx` (Homepage)
  - Use design system components
  - Maintain existing functionality

- [ ] Refactor `/app/products/page.tsx` (Product Listing)
  - Use design system components
  - Maintain existing functionality

- [ ] Refactor `/app/products/[id]/page.tsx` (Product Detail)
  - Use design system components
  - Maintain existing functionality

### 5. Documentation

- [ ] Create `/docs/DESIGN_SYSTEM.md`
  - Component usage examples
  - Theme variable reference
  - Color palette with accessibility notes
  - Typography scale
  - Spacing system
  - When to create new components vs use existing

- [ ] Create `/docs/STYLE_GUIDE.md`
  - Brand voice and tone
  - Photography guidelines
  - Copy guidelines
  - UI patterns (buttons, cards, forms, etc.)

### 6. Testing

- [ ] All existing tests still pass after refactoring
- [ ] Add tests for new UI components (Button, Card, Badge, etc.)
- [ ] Visual regression testing (optional - Storybook + Chromatic)
- [ ] Accessibility testing (color contrast, ARIA attributes)

**Test Coverage Target:** Maintain 1.5:1 test-to-code ratio

### 7. Validation

- [ ] All components use design system (no more scattered inline styles)
- [ ] Theme variables easily changeable (test by tweaking colors)
- [ ] Consistent UI patterns across all pages
- [ ] Mobile responsive
- [ ] No visual regressions (pages look the same, just refactored)

---

## Acceptance Criteria

### Must Have:
- ✅ Design token system in `globals.css`
- ✅ Core UI library: Button, Card, Badge, Input, Heading, Text, Price, Container, Section
- ✅ All existing Phase 2.2/2.3 components refactored to use UI library
- ✅ All tests passing (no regressions)
- ✅ No visual regressions (site looks the same, just properly architected)
- ✅ Documentation: DESIGN_SYSTEM.md and STYLE_GUIDE.md

### Nice to Have:
- 📝 Storybook for component documentation
- 📝 Visual regression tests
- 📝 Dark mode support
- 📝 Animation/transition utilities

---

## Testing Strategy

### Unit Tests (New Components)
```bash
tests/unit/components/ui/Button.test.tsx
tests/unit/components/ui/Card.test.tsx
tests/unit/components/ui/Badge.test.tsx
tests/unit/components/ui/Input.test.tsx
tests/unit/components/ui/Heading.test.tsx
tests/unit/components/ui/Text.test.tsx
tests/unit/components/ui/Price.test.tsx
tests/unit/components/ui/Container.test.tsx
tests/unit/components/ui/Section.test.tsx
```

**Coverage:** ~80 new tests for UI library

### Integration Tests (Refactored Components)
```bash
# These should STILL PASS after refactoring
tests/unit/components/products/ProductCard.test.tsx
tests/unit/components/products/ProductGrid.test.tsx
tests/unit/components/cart/CartDrawer.test.tsx
tests/unit/components/cart/CartItem.test.tsx
# ... etc (all existing tests)
```

### Manual Testing Checklist
- [ ] Homepage displays properly (no visual regressions)
- [ ] Product cards render correctly
- [ ] Limited edition badges display
- [ ] Cart drawer functions properly
- [ ] Buttons have proper hover/active states
- [ ] Typography is readable and hierarchical
- [ ] Spacing is consistent
- [ ] Mobile layout is still responsive

---

## Gate Criteria (Before Phase 2.4)

- [ ] Design token system implemented and documented
- [ ] Core UI library components built and tested (9 components, ~80 tests)
- [ ] All existing components refactored (no scattered inline styles)
- [ ] All existing tests pass (no regressions)
- [ ] No visual regressions (pages look the same)
- [ ] DESIGN_SYSTEM.md and STYLE_GUIDE.md complete
- [ ] Architecture properly decoupled (presentation separated from markup)

**Run:** `npm test && npm run test:smoke`

---

## Timeline Estimate

**Effort:** 2-3 days for experienced dev, 4-5 days if learning

**Breakdown:**
- Design tokens: 2 hours
- UI library (9 components): 1.5 days
- Refactor existing (12+ components): 1 day
- Documentation: 0.5 days
- Testing & validation: 0.5 days

**Recommendation:** Complete this BEFORE building checkout (Phase 2.4). Otherwise checkout will have scattered inline styles and need refactoring later.

---

## Related Files

- `/docs/IMPLEMENTATION_PLAN.md` - Main project plan (update after completion)
- `/app/globals.css` - Where design tokens will live
- `/components/ui/` - New directory for design system components
- `/docs/DESIGN_SYSTEM.md` - To be created
- `/docs/STYLE_GUIDE.md` - To be created

---

**Created:** 2025-10-26
**Type:** Technical Debt Paydown
**Priority:** HIGH - Should complete before Phase 2.4
**Status:** Not started
