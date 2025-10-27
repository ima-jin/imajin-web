# Style Guide

**Version:** 1.0
**Last Updated:** 2025-10-26
**Audience:** Developers, Content Creators, Designers

---

## Purpose

This style guide defines standards for visual design, brand voice, content creation, and UI patterns across the Imajin e-commerce platform. Consistency in these areas creates a professional, cohesive user experience.

---

## Brand Voice & Tone

### Brand Personality

**Imajin** is:
- **Innovative** - Cutting-edge LED technology, modular design
- **Professional** - High-quality products, reliable engineering
- **Accessible** - DIY-friendly kits, clear documentation
- **Authentic** - Real installations, genuine expertise

**Not:**
- Overly corporate or stuffy
- Gimmicky or sales-heavy
- Too technical (unless in specs section)
- Cutesy or informal

### Voice Guidelines

#### Writing Principles

1. **Clear and Direct**
   - Use simple language
   - Avoid jargon unless necessary
   - Get to the point quickly

2. **Confident but Not Arrogant**
   - "Our modular system makes installation easy"
   - Not: "We're the BEST lighting company EVER!"

3. **Helpful and Informative**
   - Anticipate questions
   - Provide context
   - Explain technical details when needed

4. **Professional but Approachable**
   - Use contractions when natural ("we're", "it's")
   - Address the user as "you"
   - Avoid overly formal language

#### Tone by Context

**Product Pages**
- Informative, descriptive
- Focus on benefits and specifications
- Technical details welcome
- Example: "The Founder Edition includes our Control-8-24v controller, capable of driving up to 64 panels at full brightness."

**Marketing/Hero Sections**
- Inspirational, aspirational
- Emphasize possibilities
- Shorter sentences
- Example: "Light up your space. Your way."

**Error Messages**
- Apologetic but solution-focused
- Never blame the user
- Provide next steps
- Example: "We couldn't process your payment. Please check your card details and try again."

**Help/Documentation**
- Instructional, step-by-step
- Patient and thorough
- Anticipate confusion
- Example: "First, connect the spine connector to the back of each panel. Make sure the arrows align."

---

## Writing Style

### Grammar & Mechanics

#### Capitalization

**Page Titles:** Title Case
- "Product Catalog"
- "Founder Edition Details"

**Headings:** Sentence case
- "Technical specifications"
- "What's included in the kit"

**Product Names:** As branded
- "Founder Edition Cube" (proper name)
- "Material-8x8-V" (SKU-based name)
- "Control-8-24v" (technical name)

**UI Elements:** Sentence case
- "Add to cart" (button)
- "View details" (link)

#### Numbers

- Spell out zero through nine: "three panels", "five years"
- Use numerals for 10+: "24 panels", "100 units"
- Always use numerals for measurements: "8mm thick", "5v system"
- Use numerals in UI/specs: "Quantity: 3"

#### Abbreviations

Spell out on first use, then abbreviate:
- "Light Emitting Diode (LED)"
- "Founder Edition (FE)"

Common tech abbreviations can be used directly:
- USB, RGB, AC, DC

#### Punctuation

**Serial Comma:** Yes, always use Oxford comma
- "Black, White, and Red" ✅
- "Black, White and Red" ❌

**Periods in UI:**
- Buttons: No periods
- Form labels: No periods
- Help text: Use periods for complete sentences
- Error messages: Use periods

**Exclamation Marks:**
Use sparingly, only for genuine excitement:
- "Order placed!" ✅
- "Check out our products!" ❌

### Content Patterns

#### Product Descriptions

**Structure:**
1. One-line summary (what it is)
2. Key benefits (why you'd want it)
3. Technical specs (how it works)
4. Compatibility notes (what it works with)

**Example:**
```
Modular LED panel with customizable brightness and color temperature.

Perfect for accent lighting, art installations, and workspace illumination.
The 8x8 grid provides even light distribution with zero hotspots.

Specifications:
- 64 addressable LEDs per panel
- 5v or 24v compatible (requires matching connectors)
- Dimensions: 200mm x 200mm x 8mm

Compatible with all Control series controllers and spine connectors.
```

#### Call-to-Action (CTA) Copy

Keep CTAs short, action-oriented:
- "Add to cart" (not "Add this item to your shopping cart")
- "View details" (not "Click here for more information")
- "Shop now" (not "Browse our selection")
- "Get started" (not "Begin your journey")

#### Error Messages

**Pattern:** [What happened] + [Why] + [What to do]

**Examples:**
- "Payment declined. Your card was not charged. Please check your card details or try a different payment method."
- "Product unavailable. This item is currently sold out. Sign up for restock notifications."
- "Invalid configuration. 5v and 24v components cannot be mixed. Please adjust your cart."

---

## Visual Design Standards

### Page Backgrounds

**Rule:** Background color reflects page purpose

- **Product/Ordering Pages:** White background (`--color-bg-light`)
  - Product listings
  - Product details
  - Shopping cart
  - Checkout

- **Content/Info Pages:** Black background (`--color-bg-dark`)
  - About us
  - Portfolio
  - Case studies
  - Installation guides

- **Neutral Sections:** Gray background (`--color-bg-neutral`)
  - Alternate sections on same page
  - Secondary content areas

### Typography

#### Hierarchy

Use heading levels semantically (not just for size):

- **H1:** One per page, page title
- **H2:** Major sections
- **H3:** Subsections
- **H4:** Card titles, grouped content
- **H5-H6:** Rare, for deeply nested content

#### Line Length

Optimal reading: **60-75 characters** per line

Use `Container` component to maintain readable line length:
```tsx
<Container>
  <Text>
    Paragraph text automatically wraps at readable width...
  </Text>
</Container>
```

#### Emphasis

- **Bold:** Important terms, key points
- *Italic:* Not used (avoid in UI, use semantic color instead)
- `Code:` Technical terms, SKUs, commands

### Color Usage

#### Semantic Color Meaning

- **Blue (Primary):** Actions, links, interactive elements
- **Green:** Success, available, in stock
- **Amber:** Warnings, low stock, caution
- **Red:** Errors, sold out, destructive actions
- **Purple:** Limited editions, special status
- **Gray:** Secondary information, muted content

#### Contrast Requirements

All text must meet WCAG 2.1 AA standards:
- **Normal text:** 4.5:1 contrast ratio
- **Large text (18px+):** 3:1 contrast ratio

Design tokens are pre-validated for contrast.

### Spacing

#### Consistency

Use spacing scale from design tokens:
- Related items: `--spacing-sm` to `--spacing-md`
- Grouped sections: `--spacing-lg` to `--spacing-xl`
- Major sections: `--spacing-3xl` to `--spacing-5xl`

#### Visual Rhythm

Create rhythm through consistent spacing:
```tsx
<Section> {/* Vertical padding: py-8 sm:py-12 lg:py-16 */}
  <Container>
    <Heading level={2} className="mb-6"> {/* Bottom margin */}
      Section Title
    </Heading>
    <div className="space-y-4"> {/* Vertical gap between children */}
      <Card>...</Card>
      <Card>...</Card>
    </div>
  </Container>
</Section>
```

---

## UI Patterns

### Buttons

#### Primary vs Secondary

**Primary Button:** Single primary action per screen/section
```tsx
<Button variant="primary">Add to Cart</Button>
```

**Secondary Button:** Alternative or cancel actions
```tsx
<Button variant="secondary">View Details</Button>
```

**Ghost Button:** Tertiary actions, less emphasis
```tsx
<Button variant="ghost">Learn More</Button>
```

#### Button Placement

- **Forms:** Primary on right, secondary on left
- **Modals:** Primary on right, cancel on left
- **Cards:** Center or stretch full width
- **Mobile:** Usually full width

**Example:**
```tsx
<CardFooter className="flex justify-between">
  <Button variant="secondary">Cancel</Button>
  <Button variant="primary">Continue</Button>
</CardFooter>
```

### Cards

#### When to Use Cards

✅ **Use cards for:**
- Product listings
- Feature highlights
- Grouped related information
- Interactive containers (hover states)

❌ **Don't use cards for:**
- Full-page layouts
- Simple lists
- Hero sections
- Single paragraphs

#### Card Hover States

Use `hover` prop for interactive cards:
```tsx
// Product card (clickable)
<Card hover>
  <Link href={`/products/${id}`}>
    {/* Card content */}
  </Link>
</Card>

// Info card (not clickable)
<Card>
  {/* Card content */}
</Card>
```

### Badges

#### Badge Context

Always provide context for badges:

**Good:**
```tsx
<div>
  <Heading level={4}>Founder Edition Cube</Heading>
  <Badge variant="limited">Limited Edition</Badge>
  <Text color="secondary">Only 1,000 units available</Text>
</div>
```

**Bad:**
```tsx
<Badge variant="limited">Limited</Badge>
{/* User doesn't know what's limited or why it matters */}
```

#### Badge Placement

- **Product cards:** Near title, top-right corner
- **Cart items:** Next to quantity/price
- **Status indicators:** Inline with relevant content

### Forms

#### Field Labels

Always visible, positioned above input:
```tsx
<label htmlFor="email" className="block mb-2">
  Email address
</label>
<input
  id="email"
  type="email"
  className="..."
/>
```

Never use placeholder-only labels (accessibility issue).

#### Error States

Show errors inline, below the field:
```tsx
<input
  aria-invalid="true"
  aria-describedby="email-error"
  className="border-red-500"
/>
<Text id="email-error" size="sm" color="error">
  Please enter a valid email address.
</Text>
```

#### Required Fields

Mark optional fields, not required:
- "Phone number (optional)" ✅
- "Email address *" ❌

Most fields should be required; exceptions are noteworthy.

### Loading States

#### Buttons
```tsx
<Button loading loadingText="Adding to cart...">
  Add to Cart
</Button>
```

#### Page/Section Loading
Show skeleton screens or spinners while data loads.

**Don't show:**
- Empty states while loading
- "Loading..." text alone (inaccessible)

### Empty States

Provide helpful guidance when content is empty:

**Example: Empty Cart**
```tsx
<Card>
  <CardContent className="text-center py-12">
    <Heading level={3} color="secondary">
      Your cart is empty
    </Heading>
    <Text color="muted" className="mt-2">
      Start building your custom LED setup
    </Text>
    <Button variant="primary" className="mt-6">
      Browse Products
    </Button>
  </CardContent>
</Card>
```

---

## Photography & Imagery

### Product Photos

**Style Guidelines:**
- Clean, white or neutral backgrounds
- Well-lit, no harsh shadows
- Multiple angles (front, back, side, detail)
- Consistent lighting across products
- High resolution (min 1200px wide)

**Photo Types:**
1. **Hero shot:** Full product, eye-level
2. **Detail shots:** Close-ups of connectors, LEDs
3. **Scale reference:** Product with hand or common object
4. **In use:** Installed, powered on

### Installation Photos

**Content:**
- Real customer installations
- Professional portfolio work
- Behind-the-scenes build photos
- Before/after comparisons

**Technical:**
- Natural or ambient lighting (show product in use)
- Wide shots and detail shots
- Annotated diagrams if helpful

**Privacy:**
- Get permission for customer photos
- Blur faces if not explicitly approved
- No sensitive information visible

### Image Alt Text

Always provide descriptive alt text:

**Good:**
```tsx
<img
  src="founder-edition-black.jpg"
  alt="Founder Edition Cube in matte black, showing 8x8 LED grid illuminated"
/>
```

**Bad:**
```tsx
<img src="product.jpg" alt="product" />
```

**Decorative images:** Use empty alt (`alt=""`)

---

## Responsive Design

### Breakpoints

Design system uses Tailwind's default breakpoints:
- **Mobile:** < 640px (default styles)
- **Tablet:** 640px+ (`sm:`)
- **Laptop:** 1024px+ (`lg:`)
- **Desktop:** 1280px+ (`xl:`)

### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx
// Mobile: Stack vertically
// Tablet+: Two columns
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### Touch Targets

Minimum tap target size: **44x44px** (WCAG guideline)

Buttons meet this automatically via padding. For custom interactive elements, ensure adequate size.

---

## Accessibility Standards

### Keyboard Navigation

All interactive elements must be keyboard accessible:
- **Tab:** Navigate forward
- **Shift+Tab:** Navigate backward
- **Enter/Space:** Activate buttons/links
- **Escape:** Close modals/drawers

Test: Can you complete all tasks without a mouse?

### Focus Indicators

Never remove focus outlines without replacing them:

**Bad:**
```css
button:focus {
  outline: none; /* Inaccessible */
}
```

**Good:**
```css
button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); /* Custom ring */
}
```

Design system components have built-in focus styles.

### Screen Readers

- Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- Provide `aria-label` for icon-only buttons
- Use `aria-live` for dynamic content updates
- Don't rely solely on color to convey information

### Color Contrast

All design tokens meet WCAG AA contrast requirements. When using custom colors, verify contrast:

**Tool:** WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)

---

## Content Checklist

Before publishing any page or component:

### Copy
- [ ] Grammar and spelling checked
- [ ] Brand voice consistent
- [ ] Tone appropriate for context
- [ ] No jargon without explanation
- [ ] Contractions used naturally
- [ ] Serial commas used
- [ ] Numbers formatted consistently

### Design
- [ ] Correct background color (white/black/neutral)
- [ ] Heading hierarchy semantic and logical
- [ ] Line length readable (60-75 characters)
- [ ] Spacing consistent with design tokens
- [ ] Typography sizes appropriate for content

### UI Components
- [ ] Using design system components (not inline styles)
- [ ] Button variants correct (primary/secondary/ghost)
- [ ] Cards used appropriately
- [ ] Badges provide context
- [ ] Loading states implemented

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Alt text for all images
- [ ] Form labels present and visible
- [ ] Error messages helpful and accessible

### Mobile
- [ ] Responsive on small screens
- [ ] Touch targets large enough (44x44px)
- [ ] Text readable without zooming
- [ ] Buttons full-width on mobile (where appropriate)

---

## Common Mistakes

### Don't Do This

❌ Inline styles instead of components:
```tsx
<button style={{ backgroundColor: 'blue', padding: '10px' }}>
  Click me
</button>
```

✅ Use design system:
```tsx
<Button variant="primary">Click me</Button>
```

---

❌ Inconsistent spacing:
```tsx
<div className="mt-3">
  <div className="mt-5">
    <div className="mt-4">
```

✅ Use consistent scale:
```tsx
<div className="space-y-4"> {/* Consistent gap */}
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

---

❌ Overly promotional copy:
```
"Check out our AMAZING products! You won't believe the INCREDIBLE quality!!!"
```

✅ Confident and clear:
```
"Explore our modular LED systems, designed for easy installation and lasting quality."
```

---

❌ Placeholder-only labels:
```tsx
<input type="email" placeholder="Email address" />
```

✅ Visible labels:
```tsx
<label htmlFor="email">Email address</label>
<input id="email" type="email" />
```

---

❌ Vague error messages:
```
"Error occurred."
```

✅ Helpful error messages:
```
"Payment declined. Please check your card details or try a different payment method."
```

---

## Resources

### Internal Documentation
- **Design System:** `DESIGN_SYSTEM.md` - Component usage and API
- **Testing Strategy:** `TESTING_STRATEGY.md` - How to test components
- **Product Catalog:** `PRODUCT_CATALOG.md` - Product names and details

### External Resources
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **React Accessibility:** https://react.dev/learn/accessibility

---

## Changelog

### Version 1.0 (2025-10-26)
- Initial style guide created
- Brand voice and tone defined
- UI patterns documented
- Accessibility standards established

---

**Questions or Suggestions?**

This is a living document. If you encounter scenarios not covered here or have suggestions for improvements, please discuss with the team and update this guide accordingly.

**Last Updated:** 2025-10-26
**Maintainer:** Development Team
