# Phase 2.5.3 - Content Placeholder Cleanup

**Status:** 🟡 Ready to Start
**Priority:** MEDIUM - Required for professional launch
**Started:** Not Started
**Target Completion:** TBD
**Estimated Duration:** 2-4 hours

---

## Overview

Before public launch, all placeholder content must be replaced with production-ready copy or removed. This includes placeholder text, temporary images, lorem ipsum, "Coming Soon" notices, and any development/testing artifacts visible to customers.

**Goal:** Ensure every public-facing page presents a polished, professional experience.

---

## Scope

### In Scope
- Review all public-facing pages
- Identify placeholder content
- Replace with final content or proper messaging
- Verify all product descriptions are complete
- Check all media assets are production-quality
- Remove development/testing notices

### Out of Scope
- Admin/internal pages (can have placeholders)
- Error pages (unless placeholder content exists)
- Analytics/tracking setup
- SEO optimization (separate phase)

---

## Content Audit Checklist

### 1. Product Pages

**Product Catalog (`/products`)**
- [ ] Page title and heading
- [ ] Product card descriptions
- [ ] Category filters/labels
- [ ] Empty state messaging
- [ ] Loading states

**Product Detail Pages (`/products/[id]`)**
- [ ] Product names are production-ready
- [ ] Product descriptions are complete and accurate
- [ ] Long descriptions have proper formatting
- [ ] Specifications are complete
- [ ] Pricing displays correctly
- [ ] Availability messaging is clear
- [ ] "Add to Cart" copy is final
- [ ] Variant labels (colors) are capitalized properly
- [ ] Assembly notices are accurate
- [ ] Warranty information is present (if applicable)

---

### 2. Checkout Flow

**Cart (`/cart` or Cart Drawer)**
- [ ] Empty cart messaging
- [ ] Line item descriptions
- [ ] Pricing labels (Subtotal, Tax, Total)
- [ ] Remove item confirmations
- [ ] Checkout button text

**Checkout Page (`/checkout`)**
- [ ] Page heading and instructions
- [ ] Form field labels
- [ ] Helper text is helpful (not placeholder)
- [ ] Payment notice messaging
- [ ] Button text ("Continue to Payment")
- [ ] Shipping address labels

**Checkout Success (`/checkout/success`)**
- [ ] Success message is clear
- [ ] Order confirmation details
- [ ] Next steps messaging
- [ ] Contact/support information

---

### 3. Content Pages

**Homepage (`/`)**
- [ ] Hero section copy
- [ ] Feature descriptions
- [ ] Call-to-action buttons
- [ ] Footer content
- [ ] Navigation labels

**Portfolio (`/portfolio`)**
- [ ] Portfolio item descriptions
- [ ] Project names and copy
- [ ] Featured product copy
- [ ] Case study content (if present)

**About Page (`/about`)** (if exists)
- [ ] Company description
- [ ] Mission/vision statements
- [ ] Team information
- [ ] Contact details

---

### 4. UI Components

**Navigation**
- [ ] Menu items are final
- [ ] Breadcrumb labels
- [ ] Mobile menu text

**Badges & Labels**
- [ ] Limited Edition badges
- [ ] Pre-Order badges
- [ ] Sold Out messaging
- [ ] New Product badges (if used)

**Buttons**
- [ ] All CTAs have clear, action-oriented text
- [ ] No "Click Here" or generic placeholders

**Forms**
- [ ] Input field labels are descriptive
- [ ] Error messages are helpful
- [ ] Success messages are clear

---

### 5. Media Assets

**Product Images**
- [ ] All products have high-quality images
- [ ] Alt text is descriptive (not "image 1")
- [ ] No watermarks or "test" labels
- [ ] Consistent image quality/style

**Videos**
- [ ] Video descriptions are present
- [ ] Thumbnails are high-quality
- [ ] No test/placeholder videos

---

### 6. Error States & Edge Cases

**Empty States**
- [ ] No products found messaging
- [ ] Empty cart messaging
- [ ] No search results messaging

**Loading States**
- [ ] Loading spinners have accessible labels
- [ ] Skeleton screens are generic (no placeholder text)

**Error Messages**
- [ ] API errors have user-friendly messages
- [ ] 404 page has helpful content
- [ ] Form validation errors are clear

---

## Known Placeholders to Address

Based on current codebase review:

### Product Descriptions

**Check these files:**
- `config/content/products.json` - All product descriptions
- Product detail pages - Long descriptions

**Look for:**
- Lorem ipsum text
- "Description coming soon"
- Incomplete specifications
- Missing warranty information

### Content Files

**Check these files:**
- `config/content/en/pages/*.json` - All page content
- Navigation labels
- Footer text
- Homepage hero copy

### UI Components

**Check these components:**
- Limited edition badges (hardcoded quantities?)
- Pre-order messaging
- Sold out states
- Product availability notices

---

## Replacement Strategy

### Option 1: Final Content
Replace placeholder with production-ready copy.

**Example:**
```diff
- description: "Product description coming soon"
+ description: "8×8 addressable LED panel with 64 RGB LEDs, 31.6mm spacing, precision-cut negative space design for enhanced visual depth."
```

### Option 2: "Coming Soon" Messaging
If final content isn't ready, use professional placeholder.

**Example:**
```diff
- description: "TODO: Add description"
+ description: "Detailed specifications coming soon. Contact us for more information."
```

### Option 3: Remove Feature
If content won't be ready for launch, hide the feature.

**Example:**
```tsx
{/* Portfolio section - remove until content ready */}
{false && <PortfolioSection />}
```

---

## Implementation Steps

### Step 1: Content Audit (30-60 min)

Create spreadsheet tracking all placeholders:

| Page/Component | Location | Current Text | Replacement | Priority | Status |
|---|---|---|---|---|---|
| Product Detail | Unit-8x8x8-Founder | "Description TBD" | [Final copy] | High | Pending |
| Homepage Hero | `/` | "Welcome" | [Final headline] | High | Pending |

### Step 2: Gather Final Content (varies)

Work with stakeholders to get:
- Final product descriptions
- Marketing copy for homepage
- Portfolio project descriptions
- About page content

### Step 3: Update Files (1-2 hours)

**Files to update:**
- `config/content/products.json`
- `config/content/en/pages/*.json`
- Individual page components (if hardcoded text exists)

### Step 4: Visual QA (30-60 min)

**Manual testing:**
1. Browse every public page
2. Check all text for placeholders
3. Verify images load correctly
4. Test empty states
5. Trigger error states (disconnect network, submit invalid forms)

### Step 5: Accessibility Check (30 min)

- [ ] Image alt text is descriptive
- [ ] Button labels are clear
- [ ] Form labels are present
- [ ] Error messages are announced by screen readers

---

## Testing Strategy

### Manual Testing Checklist

**Pages to Review:**
- [ ] Homepage
- [ ] Product catalog
- [ ] Each individual product detail page
- [ ] Cart (empty and with items)
- [ ] Checkout page
- [ ] Checkout success page
- [ ] Portfolio page
- [ ] About page (if exists)
- [ ] 404 error page

**For Each Page:**
- [ ] Read all visible text
- [ ] Check all images have alt text
- [ ] Verify button labels are action-oriented
- [ ] Check empty states
- [ ] Test error states (if applicable)

### Automated Testing

**Grep for common placeholders:**

```bash
# Search for placeholder text
grep -r "TODO" config/content/
grep -r "FIXME" config/content/
grep -r "placeholder" config/content/
grep -r "Lorem ipsum" config/content/
grep -r "coming soon" config/content/ -i
grep -r "TBD" config/content/

# Search for test/placeholder alt text
grep -r "alt=\"image" components/
grep -r "alt=\"test" components/
grep -r "alt=\"placeholder" components/
```

---

## Acceptance Criteria

- [ ] All product descriptions are complete and accurate
- [ ] No "Lorem ipsum" or "TODO" text on any public page
- [ ] All images have descriptive alt text
- [ ] All buttons have clear, action-oriented labels
- [ ] Empty states have helpful messaging
- [ ] Error messages are user-friendly
- [ ] Homepage has final marketing copy
- [ ] Portfolio has real project descriptions (or section removed)
- [ ] About page has company information (or page not linked)
- [ ] Manual QA completed on all public pages
- [ ] No development/testing notices visible to customers

---

## Deliverables

1. **Content Audit Spreadsheet** - Tracking all placeholders and their status
2. **Updated Content Files** - All JSON configs updated with final copy
3. **QA Report** - Document confirming all placeholders addressed
4. **Screenshot Gallery** - Before/after comparison of key pages

---

## Rollback Plan

If launch needs to happen before all content is final:
1. Use professional "Coming Soon" placeholders
2. Hide incomplete sections (portfolio, about)
3. Ensure minimum viable content for product pages
4. Mark incomplete areas in internal docs for post-launch update

---

## Dependencies

**Requires:**
- Final product descriptions from product team
- Marketing copy for homepage
- Brand voice/tone guidelines (if established)

**Blocks:**
- Public launch
- Marketing campaigns
- SEO optimization

---

## Notes

- Start with high-priority pages (homepage, product catalog, checkout)
- Low-priority pages (about, portfolio) can use "Coming Soon" if needed
- Focus on accuracy over polish - correct information is critical
- Can iterate on copy after launch, but no placeholders allowed

---

## Related Documents

- [Phase 2.5 - Products & Inventory Completion](./Phase%202.5%20-%20Products%20&%20Inventory%20Completion.md)
- [PRODUCT_CATALOG.md](../PRODUCT_CATALOG.md)
- Content files: `config/content/`
