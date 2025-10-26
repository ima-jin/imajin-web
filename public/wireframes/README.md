# Imajin Website Wireframes

HTML wireframes for the Imajin e-commerce platform, created October 26, 2025.

## Files

### Navigation
- **index.html** - Overview and navigation to all wireframes

### Customer Journey
1. **01-homepage.html** - Landing page with hero and Founder Edition showcase
2. **02-product-listing.html** - Shop page with product hierarchy
3. **03-product-detail.html** - Founder Edition Black detail page
4. **04-cart.html** - Shopping cart with order summary
5. **05-checkout.html** - Checkout flow with Stripe embedded payment

### Styling
- **base.css** - Shared wireframe styles

## How to View

1. Open `index.html` in any web browser
2. Click through the wireframe cards to view each page
3. Navigate between pages using header links and CTAs

## Key Features

### Homepage
- Hero section with lifestyle photography placeholder
- Founder Edition showcase (Black, White, Red variants)
- "Ready to Install" messaging
- De-emphasized DIY section

### Product Listing
- Founder Edition featured prominently at top
- Sidebar filters (product type, color, price)
- Limited edition counters ("487 remaining")
- DIY kits appear last with reduced prominence

### Product Detail
- Large lifestyle image gallery
- Scarcity messaging
- Pre-assembled emphasized
- Related product upsells (installation, warranty, expansions)

### Shopping Cart
- Clean, minimal layout
- Product images for quality reminder
- Tax shown upfront
- Trust badges (security, free shipping, returns)
- Subtle upsells sidebar

### Checkout
- Stripe embedded checkout (PCI compliant)
- Progress indicator (Information → Shipping → Payment)
- Sticky order summary
- Conditional fields (installation service scheduling if added)
- Trust signals throughout

## Design Notes

### Target Audience
- High-budget residential customers
- Interior designers and design-conscious homeowners
- Not maker community or DIY enthusiasts

### Visual Direction
- White backgrounds for product/shopping pages
- Black backgrounds for content/info pages (future)
- Professional lifestyle photography in residential settings
- Clean, modern aesthetic (Restoration Hardware / Room & Board)
- Prominent pricing (transparency for luxury market)

### Conversion Optimization
- 6-second clarity on homepage
- Scarcity messaging (limited units remaining)
- Free shipping emphasized
- Trust signals throughout journey
- No surprises at checkout (tax shown in cart)
- Easy navigation and back buttons

## Technical Implementation Notes

### Stripe Integration
- Using Stripe embedded checkout component
- Handles payment form, PCI compliance, security
- We only collect shipping info and special instructions
- Webhook for order creation after successful payment

### Product Hierarchy
1. **Founder Edition** (pre-made, premium) - Primary offering
2. **Expansion Products** - For existing customers
3. **Accessories & Services** - High-margin add-ons
4. **DIY Kits** - De-emphasized, tertiary market

### Responsive Design
- Desktop-first wireframes
- Mobile layouts would stack single-column
- Sticky sidebar elements become fixed bottom on mobile

## Next Steps

### Pre-Development
1. **Review:** Share with business development director for approval
2. **Content:** Professional photography in residential settings
3. **Design:** High-fidelity mockups with brand assets, colors, typography

### Development
Follow **IMPLEMENTATION_PLAN.md** phases:
- Phase 1: Foundation (Next.js, Docker, database)
- Phase 2.1: Product data management
- Phase 2.2: Product catalog pages
- Phase 2.3: Shopping cart (use these wireframes as spec)
- Phase 2.4: Checkout integration

## Annotations

Each wireframe includes yellow annotation boxes with:
- 📝 Design rationale
- 💡 Strategic notes
- 🎯 Target customer considerations
- ⚠️ Important implementation notes

These annotations explain WHY certain design decisions were made and should inform development.

## Feedback & Iteration

These are low-fidelity wireframes (structure, not styling). Expect:
- Typography refinement
- Color palette application
- Real photography
- Micro-interactions
- Animation/transitions
- Mobile-specific layouts

But the core user flow and information architecture should remain consistent.

---

**Created:** 2025-10-26
**Format:** HTML wireframes (editable, version-controllable)
**Status:** Ready for review
