# Page Specifications

**Purpose:** Detailed specifications for all pages/routes in the Imajin e-commerce platform.

This document bridges the gap between:
- **API_ROUTES.md** - Backend API endpoints
- **COMPONENT_ARCHITECTURE.md** - Component patterns
- **Wireframes** - Visual mockups (`/public/wireframes/`)

---

## Site Map

```
imajin.ca
├── / (Homepage)
├── /products (Product Listing)
├── /products/[id] (Product Detail)
├── /cart (Shopping Cart) - Drawer UI, not separate page
├── /checkout (Checkout Flow)
├── /checkout/success (Order Confirmation)
├── /portfolio (Installation Gallery)
├── /portfolio/[slug] (Case Study Detail)
├── /about (Company Info)
├── /contact (Contact Form)
├── /support
│   ├── /support/faq
│   ├── /support/shipping
│   ├── /support/returns
│   └── /support/warranty
└── /legal
    ├── /legal/terms
    └── /legal/privacy
```

---

## E-commerce Pages

### Homepage: `/`

**Purpose:** Primary landing page, drive visitors to shop

**User Intent:** Understand what Imajin sells, see featured products, navigate to shop

**Wireframe:** `/public/wireframes/01-homepage.html`

**Data Requirements:**
- Featured products (first 4-6 from `/api/products`)
- Portfolio preview (2-3 recent installations)

**API Calls:**
- `GET /api/products` (filtered to featured or first N)

**Components:**
```tsx
- HeroSection
  - Heading (value prop)
  - Text (subheading)
  - Button (CTA: "Shop Pre-Made Fixtures")
  - Button (secondary: "View Portfolio")
- FeaturedProducts
  - ProductGrid (4-6 products)
  - ProductCard (for each)
- PortfolioPreview
  - PortfolioCard (2-3 installations)
- CTASection (newsletter signup, optional)
```

**Key Interactions:**
- Click "Shop Now" → `/products`
- Click product card → `/products/[id]`
- Click "View Portfolio" → `/portfolio`
- Add to cart from featured products

**SEO:**
- Title: "Imajin | Modular LED Lighting Fixtures"
- Description: "Pre-assembled modular LED fixtures. Designed in Toronto. Limited edition Founder units with 10-year warranty."
- OpenGraph image: Hero product image

**Edge Cases:**
- No products available → Show fallback message
- API error → Error boundary, show generic error
- Slow loading → Skeleton screens

---

### Product Listing: `/products`

**Purpose:** Browse all available products with filtering

**User Intent:** Explore product catalog, find specific product type, filter by category/color/price

**Wireframe:** `/public/wireframes/02-product-listing.html`

**URL Parameters:**
- `?category=complete-fixtures|expansion|controllers|accessories|diy-kits`
- `?color=black|white|red`
- `?availability=in-stock|limited-edition`
- `?price=under-500|500-1500|1500-3000|3000-plus`

**Data Requirements:**
- All products with `dev_status = 5` (ready to sell)
- Variants with availability data
- Product categories

**API Calls:**
- `GET /api/products?category={category}`
- Client-side filtering for color, price, availability

**Components:**
```tsx
- PageHeader
  - Heading ("Shop Pre-Made Fixtures")
  - Text (description)
- ProductListingLayout
  - Sidebar
    - CategoryFilter
    - ColorFilter
    - AvailabilityFilter
    - PriceRangeFilter
  - ProductGrid (main content)
    - ProductCard (for each product)
      - Image
      - LimitedEditionBadge (if applicable)
      - ProductTitle
      - ProductDescription
      - Price
      - AddToCartButton
```

**Product Hierarchy (Display Order):**
1. **Founder Edition** - Featured section at top
2. **Expansion Products** - Additional panels, controllers
3. **Accessories** - Diffusion caps, installation services
4. **DIY Kits** - De-emphasized, lower priority

**Key Interactions:**
- Apply filters → Update product grid (client-side)
- Click product card → `/products/[id]`
- Add to cart → Update cart count, show toast notification
- Clear filters → Reset to all products

**SEO:**
- Title: "Shop LED Fixtures | Imajin"
- Description: "Browse pre-made modular LED fixtures. Founder Edition, expansion panels, accessories."
- Canonical: `/products`

**Edge Cases:**
- No products match filters → "No products found" message with "Clear Filters" button
- Product out of stock → "Sold Out" badge, disabled add-to-cart
- Limited edition low stock → "Only X remaining" indicator

---

### Product Detail: `/products/[id]`

**Purpose:** Detailed view of single product with variants, specs, purchase option

**User Intent:** Learn about product, see specifications, select variant (color), add to cart

**Wireframe:** `/public/wireframes/03-product-detail.html`

**URL Structure:**
- `/products/founder-edition-black`
- `/products/material-8x8-v`
- `/products/control-8-24v`

**Data Requirements:**
- Product details (name, description, category, dev_status)
- All variants (colors, SKUs, availability)
- Product specifications (dimensions, power, voltage, etc.)
- Product dependencies (requires, suggests, incompatible_with)
- Related products (for upsell)

**API Calls:**
- `GET /api/products/[id]` (includes variants, specs, dependencies)
- `GET /api/products?category={same-category}` (for related products)

**Components:**
```tsx
- Breadcrumb (Home > Shop > Category > Product)
- ProductDetailLayout
  - ProductGallery (left)
    - MainImage
    - ThumbnailGrid
  - ProductInfo (right)
    - LimitedEditionBadge (if applicable)
    - ProductTitle
    - ProductSubtitle
    - Price
    - AvailabilityStatus ("X of Y remaining" or "In Stock")
    - VariantSelector (color options)
    - QuantitySelector
    - AddToCartButton
    - ProductFeatures (what's included, key features)
  - ProductTabs
    - SpecificationsTab (ProductSpecs component)
    - InstallationTab
    - WarrantyTab
    - ReviewsTab (future)
  - RelatedProducts
    - ProductGrid (upsell items)
```

**Key Interactions:**
- Select variant (color) → Update price, availability, images, SKU
- Adjust quantity → Validate max (5 per order, or available stock)
- Add to cart → Validate dependencies, show warnings if needed, add to cart
- View related product → Navigate to that product detail page
- Click breadcrumb → Navigate to parent page

**Dependency Warnings:**
- "Requires 24v controller" → Show banner with link to controller
- "Cannot mix with 5v components" → Show warning if cart has 5v items
- "Suggests diffusion caps" → Show optional upsell

**SEO:**
- Title: "{Product Name} | Imajin"
- Description: Product description (first 160 chars)
- OpenGraph image: Main product image
- Structured data: Product schema (price, availability, SKU)

**Edge Cases:**
- Product not found → 404 page
- Variant sold out → "Sold Out" for that variant, other variants selectable
- All variants sold out → Disable add-to-cart, show "Out of Stock"
- Limited edition near sellout → Prominent "Only X remaining" message

---

### Shopping Cart: Drawer UI (Not separate page)

**Purpose:** Review cart contents, adjust quantities, proceed to checkout

**User Intent:** See what's in cart, remove items, update quantities, check total

**Wireframe:** `/public/wireframes/04-cart.html`

**Trigger:** Click cart button in header, or after adding item to cart

**Data Requirements:**
- Cart items (from CartContext/localStorage)
- Product details for each item
- Validation results (voltage compatibility, dependency warnings)

**API Calls:**
- `POST /api/cart/validate` (on cart open or item change)

**Components:**
```tsx
- CartDrawer (slide-out from right)
  - CartHeader
    - Heading ("Shopping Cart")
    - CloseButton
  - CartItems
    - CartItem (for each item)
      - ItemImage
      - ItemDetails (name, variant, SKU)
      - QuantityControl
      - Price
      - RemoveButton
  - CartValidation
    - ErrorMessage (voltage incompatibility)
    - WarningMessage (missing dependencies)
  - CartSummary
    - Subtotal
    - Shipping ("Free")
    - Tax (calculated)
    - Total
  - CartActions
    - Button ("Continue Shopping")
    - Button ("Proceed to Checkout", primary)
  - TrustBadges (security, free shipping, returns)
  - Upsells (optional accessories)
```

**Key Interactions:**
- Adjust quantity → Update cart, recalculate total, re-validate
- Remove item → Remove from cart, re-validate remaining items
- Click "Continue Shopping" → Close drawer, return to previous page
- Click "Proceed to Checkout" → Navigate to `/checkout`
- Cart validation error → Disable checkout button, show fix instructions

**Validation Rules:**
- Cannot mix 5v and 24v voltage systems
- Limited edition quantity checks
- Stock availability
- Dependency warnings (missing required components)

**Edge Cases:**
- Empty cart → Show "Your cart is empty" message with "Browse Products" CTA
- Validation errors → Block checkout, show specific error messages
- Item out of stock (added earlier, now unavailable) → Show warning, remove from cart

---

### Checkout: `/checkout`

**Purpose:** Collect shipping info, payment details, complete purchase

**User Intent:** Enter shipping address, pay for order, receive confirmation

**Wireframe:** `/public/wireframes/05-checkout.html`

**Flow:**
1. Contact Information
2. Shipping Address
3. Payment (Stripe embedded)
4. Order Review
5. Submit

**Data Requirements:**
- Cart items (from CartContext)
- Cart validation results
- Tax calculation
- Stripe checkout session

**API Calls:**
- `POST /api/checkout/session` (create Stripe checkout session)
- `POST /api/cart/validate` (final validation before payment)

**Components:**
```tsx
- CheckoutHeader
  - Logo
  - ProgressSteps (Information → Shipping → Payment)
  - BackToCartButton
- CheckoutLayout
  - CheckoutForm (left)
    - ContactInformation
      - EmailInput
      - NewsletterCheckbox
    - ShippingAddress
      - FirstName, LastName
      - Company (optional)
      - Address, Apartment
      - City, Province, PostalCode
      - Phone
    - InstallationServiceDetails (if in cart)
      - PreferredDateInput
      - SpecialInstructions
    - DeliveryNotes
      - SpecialInstructions (optional)
    - PaymentInformation
      - StripeEmbeddedCheckout (iframe/component)
  - OrderSummary (right, sticky)
    - SummaryItems (mini cart display)
    - SummaryTotals
    - TrustSignals (warranty, returns, security)
    - SupportLink
```

**Key Interactions:**
- Fill form → Validate fields in real-time
- Submit form → Create Stripe checkout session, redirect to Stripe or embed payment
- Complete payment → Stripe webhook triggers order creation
- Back to cart → Return to cart with data preserved

**Validation:**
- Email format validation
- Required fields (first name, last name, address, city, province, postal code, phone)
- Canadian postal code format (A1A 1A1)
- Phone number format

**Stripe Integration:**
- Embedded Stripe Checkout component (handles payment form)
- Webhook: `checkout.session.completed`
  - Create order in database
  - Decrement limited edition quantities
  - Send confirmation email (future)
  - Generate NFT token hash (Founder Edition)

**SEO:**
- Title: "Checkout | Imajin"
- Meta: noindex, nofollow (don't index checkout pages)

**Edge Cases:**
- Empty cart → Redirect to `/products`
- Validation errors → Block checkout, show specific errors
- Payment failure → Show error message from Stripe, allow retry
- Stripe webhook fails → Manual reconciliation required (log error)
- Network error → Show error, preserve form data, allow retry

---

### Order Confirmation: `/checkout/success?session_id={id}`

**Purpose:** Confirm successful order, provide order details

**User Intent:** See order confirmation, receive order number, know next steps

**Data Requirements:**
- Stripe session ID (from URL parameter)
- Order details (from database via session ID)

**API Calls:**
- `GET /api/orders/confirm?session_id={id}`

**Components:**
```tsx
- SuccessHeader
  - SuccessIcon (checkmark)
  - Heading ("Order Confirmed!")
  - Text ("Thank you for your order")
- OrderDetails
  - OrderNumber
  - OrderDate
  - EstimatedDelivery (7-10 business days)
- OrderSummary
  - Items purchased (with images)
  - Shipping address
  - Total paid
- NextSteps
  - "Confirmation email sent to {email}"
  - "Track your order" (future)
  - "Return to shop" button
- FounderEditionNote (if applicable)
  - "Your NFT ownership certificate will be minted and delivered when your unit ships"
```

**Key Interactions:**
- Click "Return to Shop" → Navigate to `/products`
- Click "Track Order" → Navigate to order tracking (future)

**SEO:**
- Title: "Order Confirmed | Imajin"
- Meta: noindex, nofollow

**Edge Cases:**
- Invalid session ID → Show error, redirect to homepage
- Order not found → Show error (may be webhook delay), provide support link
- Webhook still processing → Show "Processing..." state, poll for order

---

## Content Pages

### Portfolio: `/portfolio`

**Purpose:** Showcase installation work, build credibility

**User Intent:** See real-world installations, get inspiration, view case studies

**Data Requirements:**
- Portfolio items from database (`portfolio_items` table)
- Images from Cloudinary
- JSON config (`/config/portfolio.json`)

**API Calls:**
- `GET /api/portfolio`

**Components:**
```tsx
- PageHeader
  - Heading ("Our Work")
  - Text ("Installations and custom projects")
- PortfolioGrid (masonry or grid layout)
  - PortfolioCard (for each project)
    - Image (featured image)
    - ProjectTitle
    - ProjectCategory (residential, commercial, custom)
    - ProjectDescription (excerpt)
    - ReadMoreLink
- FilterBar (optional)
  - CategoryFilter (all, residential, commercial, custom)
```

**Key Interactions:**
- Click portfolio card → Navigate to `/portfolio/[slug]`
- Filter by category → Update grid (client-side)

**SEO:**
- Title: "Portfolio | Imajin"
- Description: "Real-world LED fixture installations. Residential and commercial projects."

**Edge Cases:**
- No portfolio items → Show "Coming soon" message
- Image load error → Show placeholder

---

### Case Study: `/portfolio/[slug]`

**Purpose:** Detailed view of single installation project

**User Intent:** See project details, photos, learn about installation

**Data Requirements:**
- Portfolio item details
- Multiple images (gallery)
- Project specs (optional: size, panels used, installation notes)

**API Calls:**
- `GET /api/portfolio/[slug]`

**Components:**
```tsx
- Breadcrumb (Home > Portfolio > Project Name)
- CaseStudyHeader
  - ProjectTitle
  - ProjectCategory
  - ProjectDate
  - ProjectLocation
- ImageGallery
  - MainImage
  - ThumbnailGrid
- ProjectDetails
  - Description (long-form)
  - Specifications (size, panels, configuration)
  - InstallationNotes
- RelatedProducts (if applicable)
  - "Products used in this project"
  - ProductCard (for each)
- RelatedProjects
  - PortfolioCard (similar projects)
```

**Key Interactions:**
- Click image → Open lightbox/fullscreen view
- Click related product → Navigate to product detail
- Click related project → Navigate to that case study

**SEO:**
- Title: "{Project Name} | Portfolio | Imajin"
- Description: Project description (first 160 chars)
- OpenGraph image: Featured project image

**Edge Cases:**
- Project not found → 404 page
- No images → Show placeholder

---

### About: `/about`

**Purpose:** Company story, team, mission

**User Intent:** Learn about Imajin, founder background, company values

**Data Requirements:**
- Static content (can be JSON or hardcoded)

**Components:**
```tsx
- PageHeader
  - Heading ("About Imajin")
- CompanyStory
  - Heading, Text (paragraphs)
  - Image (founder photo or workshop)
- TeamSection (optional)
  - TeamMember (for each)
- MissionValues
  - Heading
  - ValueCard (for each value)
- ContactCTA
  - Button ("Get in Touch")
```

**Key Interactions:**
- Click "Get in Touch" → Navigate to `/contact`

**SEO:**
- Title: "About | Imajin"
- Description: "Toronto-based LED fixture design and manufacturing. Modular lighting systems."

---

### Contact: `/contact`

**Purpose:** Contact form for inquiries

**User Intent:** Ask questions, request custom quote, general inquiry

**Data Requirements:**
- None (form submission only)

**API Calls:**
- `POST /api/contact` (send email or save inquiry to database)

**Components:**
```tsx
- PageHeader
  - Heading ("Contact Us")
- ContactForm
  - NameInput
  - EmailInput
  - SubjectInput
  - MessageTextarea
  - SubmitButton
- ContactInfo
  - Email: info@imajin.ca
  - Location: Toronto, Canada
  - Social links (Instagram, etc.)
```

**Key Interactions:**
- Submit form → Validate, send email, show success message
- Form error → Show validation errors inline

**SEO:**
- Title: "Contact | Imajin"
- Description: "Get in touch with Imajin. Toronto-based LED fixture manufacturer."

**Edge Cases:**
- Form submission error → Show error message, preserve form data
- Spam prevention → Add honeypot field or reCAPTCHA

---

### FAQ: `/support/faq`

**Purpose:** Answer common questions

**User Intent:** Find answers without contacting support

**Data Requirements:**
- FAQ content (JSON or hardcoded)

**Components:**
```tsx
- PageHeader
  - Heading ("Frequently Asked Questions")
- FAQList
  - FAQItem (for each question)
    - Question (collapsible)
    - Answer
- ContactCTA
  - "Didn't find what you're looking for?"
  - Button ("Contact Support")
```

**Key Interactions:**
- Click question → Expand/collapse answer

**SEO:**
- Title: "FAQ | Imajin"
- Structured data: FAQPage schema

---

### Shipping & Returns: `/support/shipping`

**Purpose:** Shipping policy, return policy, timelines

**User Intent:** Understand shipping costs, delivery times, return process

**Data Requirements:**
- Static policy content

**Components:**
```tsx
- PageHeader
  - Heading ("Shipping & Returns")
- PolicyContent
  - Section (Shipping Policy)
  - Section (Return Policy)
  - Section (Refund Process)
```

**SEO:**
- Title: "Shipping & Returns | Imajin"

---

### Warranty: `/support/warranty`

**Purpose:** Warranty terms, coverage details

**User Intent:** Understand warranty coverage, claim process

**Data Requirements:**
- Warranty terms (varies by product)

**Components:**
```tsx
- PageHeader
  - Heading ("Warranty Information")
- WarrantyContent
  - Section (Founder Edition: 10 years)
  - Section (Standard Products: 2 years)
  - Section (Claim Process)
  - Section (What's Covered)
  - Section (Exclusions)
```

**SEO:**
- Title: "Warranty | Imajin"

---

### Terms of Service: `/legal/terms`

**Purpose:** Legal terms for using the site and purchasing

**User Intent:** Understand legal obligations

**Data Requirements:**
- Legal content (consult lawyer)

**Components:**
```tsx
- PageHeader
  - Heading ("Terms of Service")
- LegalContent
  - Section (for each terms section)
```

**SEO:**
- Title: "Terms of Service | Imajin"
- Meta: noindex (don't index legal pages)

---

### Privacy Policy: `/legal/privacy`

**Purpose:** Privacy policy, data handling

**User Intent:** Understand how personal data is used

**Data Requirements:**
- Privacy policy content (consult lawyer)

**Components:**
```tsx
- PageHeader
  - Heading ("Privacy Policy")
- LegalContent
  - Section (for each privacy section)
```

**SEO:**
- Title: "Privacy Policy | Imajin"
- Meta: noindex

---

## Future Pages (Phase 5+)

### Customer Account: `/account` (Future)
- Order history
- Saved configurations
- Account settings

### Admin Dashboard: `/admin` (Future)
- Order management
- Inventory tracking
- Customer inquiries

### Visual Configurator: `/configure` (Future)
- Interactive fixture builder
- Real-time preview
- Save/export configurations

---

## Global Components (All Pages)

### Header
- Logo (links to homepage)
- Navigation: Home, Shop, Portfolio, About, Contact
- Search (future)
- Cart button (with count badge)

### Footer
- Company links (About, Portfolio, Contact)
- Support links (FAQ, Shipping, Returns, Warranty)
- Legal links (Terms, Privacy)
- Social media links
- Copyright notice

### Not Found: `/404`
- "Page not found" message
- Link to homepage
- Search bar (future)

---

## Common Patterns Across Pages

### Loading States
- Skeleton screens for data-fetching pages
- Spinner for button actions (add to cart, form submit)

### Error States
- Error boundary for uncaught errors
- Inline validation errors for forms
- API error messages (user-friendly)

### Empty States
- "No products found" (product listing)
- "Your cart is empty" (cart drawer)
- "No results" (search, future)

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Mobile nav (hamburger menu)
- Sticky cart button on mobile

### Accessibility
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus states on all interactive elements
- Alt text for all images
- Color contrast WCAG AA compliant

---

## Page-to-Page Navigation Flow

### Primary User Journeys

**Browse → Purchase:**
1. Homepage → Click "Shop Now"
2. Product Listing → Filter/browse
3. Product Detail → Select variant, add to cart
4. Cart Drawer → Review, proceed to checkout
5. Checkout → Enter info, pay
6. Order Confirmation → Success

**Portfolio → Purchase:**
1. Homepage → Click "View Portfolio"
2. Portfolio → Browse installations
3. Case Study → See products used
4. Product Detail → Add to cart
5. (Continue checkout flow)

**Direct Product Access:**
1. Google search → Product Detail (SEO)
2. Product Detail → Add to cart
3. (Continue checkout flow)

---

## Notes for Implementation

### Phase 2 (Current): E-commerce Core
- ✅ Homepage (basic)
- ✅ Product Listing
- ✅ Product Detail
- ✅ Cart Drawer
- 🚧 Checkout (next)
- 🚧 Order Confirmation (next)

### Phase 3: Content Pages
- Portfolio
- Portfolio Detail
- About
- Contact
- FAQ
- Shipping/Returns
- Warranty
- Terms/Privacy

### Phase 4: Polish
- 404 page
- Error boundaries
- Loading states
- SEO optimization
- Performance optimization

### Phase 5: Future Enhancements
- Customer accounts
- Admin dashboard
- Visual configurator
- Order tracking

---

**Last Updated:** 2025-10-26
**Status:** Living document - update as pages are built and requirements change
