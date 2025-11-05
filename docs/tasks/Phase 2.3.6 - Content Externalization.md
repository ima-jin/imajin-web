# Phase 2.3.6: Content Externalization

**Type:** Architecture Refactoring
**Priority:** HIGH - Should complete BEFORE Phase 2.4 (Checkout)
**Reason:** Extensive hardcoding (80+ strings) creating maintenance burden and blocking content flexibility.

---

## Context

### The Problem

Content, UI copy, and messaging are hardcoded throughout the application:

```tsx
// Example: app/page.tsx
<h3>Ready to Install</h3>
<p>Pre-assembled fixtures arrive ready to hang...</p>

// Example: components/cart/CartDrawer.tsx
<h2>Shopping Cart</h2>
<p>Your cart is empty</p>

// Example: lib/services/cart-validator.ts
return { type: 'error', message: 'Cannot mix 5v and 24v components...' }
```

**Impact:**
- **80+ hardcoded strings** across 24 files
- Every copy change requires code changes and redeployment
- No content management capability for non-developers
- Cannot A/B test copy variations
- Internationalization impossible
- Inconsistent messaging (duplicated strings)
- SEO metadata still says "Create Next App" (CRITICAL)

### Current State

**What we externalized:**
- ✅ Product data (`/config/products.json`)
- ✅ Design tokens (CSS variables in `globals.css`)
- ✅ UI component patterns (`/components/ui/*`)

**What's still hardcoded:**
- ❌ Navigation items (Header, Footer - 22 strings)
- ❌ Marketing copy (Homepage, product pages - 30+ strings)
- ❌ UI labels (buttons, forms - 15+ strings)
- ❌ Error/validation messages (7+ strings)
- ❌ Page metadata (site title, descriptions)
- ❌ Social media URLs and labels
- ❌ Filter options (product types, price ranges)

### Why Now?

1. **Phase 2.4 (Checkout) will add significant copy** - Form labels, validation messages, confirmation screens
2. **Established pattern** - We already externalized product data successfully
3. **Caught early** - Better to fix now than refactor 10 features later
4. **Maintenance velocity** - Content changes shouldn't require developer involvement

---

## Objectives

1. **Create JSON config structure** for all UI copy, messaging, and content
2. **Build runtime loader utilities** with TypeScript type safety
3. **Create React hooks** for accessing content in components
4. **Refactor existing components** to use externalized content
5. **Establish validation schema** (Zod) for content integrity
6. **Document the pattern** for future development

---

## Scope

### Files Requiring Refactoring (24 files)

**High Priority (Critical/High Impact):**
1. `/app/layout.tsx` - Site metadata (CRITICAL - still says "Create Next App")
2. `/app/page.tsx` - Homepage copy (13+ strings)
3. `/app/products/page.tsx` - Product listing, filters (25+ strings)
4. `/components/layout/Footer.tsx` - Navigation, social media URLs (18+ strings)
5. `/components/layout/Header.tsx` - Navigation items (4 strings)
6. `/lib/services/cart-validator.ts` - Error messages (7+ strings)

**Medium Priority:**
7. `/app/products/[id]/page.tsx` - Product detail page copy (6+ strings)
8. `/components/home/HeroSection.tsx` - Hero section copy (4 strings)
9. `/components/products/ProductAddToCart.tsx` - Form labels (6+ strings)
10. `/components/cart/CartDrawer.tsx` - Cart UI text (4+ strings)
11. `/components/cart/CartItem.tsx` - Item labels, ARIA labels (6+ strings)
12. `/components/cart/CartSummary.tsx` - Summary labels (4+ strings)
13. `/components/cart/AddToCartButton.tsx` - Button states (3 strings)
14. `/components/products/LimitedEditionBadge.tsx` - Badge text (3 strings)
15. `/components/products/ProductCard.tsx` - Card labels (2 strings)

**Additional Files (Low-Medium Impact):**
16-24. Other component files with scattered hardcoded strings

### String Categories to Externalize

#### 1. **Site Metadata** (HIGH PRIORITY)
- Site title, tagline
- Meta descriptions
- OpenGraph data
- Favicon/logo alt text

#### 2. **Navigation Structure** (HIGH PRIORITY)
- Header navigation items (labels + URLs)
- Footer navigation structure (4 columns)
- Social media links (labels + URLs)
- Breadcrumb labels

#### 3. **Marketing Content** (HIGH PRIORITY)
- Homepage hero section
- Value proposition cards
- Product category descriptions
- Limited edition messaging
- Feature descriptions
- Call-to-action text

#### 4. **UI Labels & Messages** (MEDIUM PRIORITY)
- Button labels (Add to Cart, Checkout, Remove, etc.)
- Form field labels (Select Color, Quantity, Filter By, etc.)
- Placeholder text (Your cart is empty, Loading...)
- Section headings (Description, Specifications, etc.)

#### 5. **Error & Validation Messages** (MEDIUM PRIORITY)
- Cart validation errors
- Product availability warnings
- Dependency validation messages
- Stock warnings (low stock, sold out)
- System errors

#### 6. **Filter & Category Options** (LOW-MEDIUM PRIORITY)
- Product type filters
- Availability options (In Stock, Limited Edition)
- Color options (Black, White, Red)
- Price range labels
- Sort options

---

## Proposed JSON Structure

### Directory Layout

```
/config/
├── content/
│   ├── site-metadata.json       # Site title, meta tags, SEO
│   ├── navigation.json          # Header/footer navigation structure
│   ├── pages/
│   │   ├── home.json            # Homepage content
│   │   ├── products-listing.json
│   │   └── product-detail.json
│   ├── ui-strings.json          # Common UI labels, buttons, messages
│   └── validation-messages.json # Error messages, warnings
├── schema/
│   ├── site-metadata-schema.ts
│   ├── navigation-schema.ts
│   ├── page-content-schema.ts
│   ├── ui-strings-schema.ts
│   └── validation-messages-schema.ts
└── products.json                 # ✅ Already exists
```

---

## JSON File Specifications

### 1. Site Metadata (`config/content/site-metadata.json`)

```json
{
  "version": "1.0",
  "updated": "2025-10-27",
  "site": {
    "name": "Imajin",
    "tagline": "Sculptural LED Lighting for Modern Spaces",
    "description": "Modular LED fixtures designed and manufactured in Toronto. Pre-assembled units and DIY kits for residential and commercial installations.",
    "url": "https://www.imajin.ai",
    "contact_email": "hello@imajin.ai",
    "support_email": "support@imajin.ai"
  },
  "meta": {
    "default_title": "Imajin | Modular LED Fixtures",
    "title_template": "%s | Imajin",
    "default_description": "Sculptural LED lighting designed in Toronto. Modular fixtures for modern spaces. Pre-assembled units with 10-year warranty and expandable DIY kits.",
    "keywords": [
      "LED fixtures",
      "modular lighting",
      "sculptural lighting",
      "Toronto design",
      "custom LED installation",
      "addressable LEDs"
    ],
    "og_image": "/og-image.jpg",
    "twitter_handle": "@imajin",
    "favicon": "/favicon.ico"
  },
  "pages": {
    "home": {
      "title": "Imajin | Modular LED Fixtures",
      "description": "Sculptural LED lighting designed in Toronto. Pre-assembled fixtures and expandable DIY kits for modern spaces."
    },
    "products": {
      "title": "Shop Pre-Made Fixtures",
      "description": "Browse our collection of modular LED fixtures. Limited edition Founder Collection and expandable component systems."
    },
    "productDetail": {
      "title_template": "%s | Imajin",
      "description_template": "%s - Modular LED fixture designed in Toronto. Available now at Imajin."
    },
    "cart": {
      "title": "Shopping Cart | Imajin"
    },
    "checkout": {
      "title": "Checkout | Imajin"
    }
  }
}
```

**Zod Schema:**
```typescript
// config/schema/site-metadata-schema.ts
import { z } from 'zod';

export const SiteMetadataSchema = z.object({
  version: z.string(),
  updated: z.string(),
  site: z.object({
    name: z.string(),
    tagline: z.string(),
    description: z.string(),
    url: z.string().url(),
    contact_email: z.string().email(),
    support_email: z.string().email(),
  }),
  meta: z.object({
    default_title: z.string(),
    title_template: z.string(),
    default_description: z.string(),
    keywords: z.array(z.string()),
    og_image: z.string(),
    twitter_handle: z.string(),
    favicon: z.string(),
  }),
  pages: z.record(z.object({
    title: z.string().optional(),
    title_template: z.string().optional(),
    description: z.string().optional(),
    description_template: z.string().optional(),
  })),
});

export type SiteMetadata = z.infer<typeof SiteMetadataSchema>;
```

---

### 2. Navigation (`config/content/navigation.json`)

```json
{
  "version": "1.0",
  "updated": "2025-10-27",
  "header": {
    "logo_alt": "Imajin Logo",
    "nav_items": [
      {
        "id": "shop",
        "label": "Shop",
        "href": "/products",
        "aria_label": "Browse all products"
      },
      {
        "id": "collections",
        "label": "Collections",
        "href": "/collections",
        "aria_label": "View product collections"
      },
      {
        "id": "portfolio",
        "label": "Portfolio",
        "href": "/portfolio",
        "aria_label": "View installation portfolio"
      },
      {
        "id": "about",
        "label": "About",
        "href": "/about",
        "aria_label": "Learn about Imajin"
      }
    ]
  },
  "footer": {
    "sections": [
      {
        "id": "shop",
        "heading": "Shop",
        "links": [
          {
            "label": "Founder Edition",
            "href": "/products?category=founder",
            "aria_label": "Shop Founder Edition collection"
          },
          {
            "label": "Expansion Panels",
            "href": "/products?category=material",
            "aria_label": "Shop expansion panels"
          },
          {
            "label": "Controllers",
            "href": "/products?category=control",
            "aria_label": "Shop control units"
          },
          {
            "label": "Accessories",
            "href": "/products?category=diffuser",
            "aria_label": "Shop accessories and diffusers"
          }
        ]
      },
      {
        "id": "company",
        "heading": "Company",
        "links": [
          {
            "label": "About Us",
            "href": "/about",
            "aria_label": "Learn about Imajin"
          },
          {
            "label": "Portfolio",
            "href": "/portfolio",
            "aria_label": "View our installation work"
          },
          {
            "label": "Contact",
            "href": "/contact",
            "aria_label": "Get in touch"
          },
          {
            "label": "Press",
            "href": "/press",
            "aria_label": "Press and media resources"
          }
        ]
      },
      {
        "id": "support",
        "heading": "Support",
        "links": [
          {
            "label": "Installation Guide",
            "href": "/support/installation",
            "aria_label": "Installation instructions"
          },
          {
            "label": "Warranty",
            "href": "/support/warranty",
            "aria_label": "Warranty information"
          },
          {
            "label": "Returns",
            "href": "/support/returns",
            "aria_label": "Return policy"
          },
          {
            "label": "FAQ",
            "href": "/support/faq",
            "aria_label": "Frequently asked questions"
          }
        ]
      },
      {
        "id": "follow",
        "heading": "Follow",
        "links": [
          {
            "label": "Instagram",
            "href": "https://instagram.com/imajin.ai",
            "aria_label": "Follow us on Instagram",
            "external": true
          },
          {
            "label": "Facebook",
            "href": "https://facebook.com/imajin.ai",
            "aria_label": "Follow us on Facebook",
            "external": true
          },
          {
            "label": "LinkedIn",
            "href": "https://linkedin.com/company/imajin",
            "aria_label": "Follow us on LinkedIn",
            "external": true
          }
        ]
      }
    ],
    "copyright": "© {year} Imajin. All rights reserved.",
    "legal_links": [
      {
        "label": "Privacy Policy",
        "href": "/legal/privacy"
      },
      {
        "label": "Terms of Service",
        "href": "/legal/terms"
      }
    ]
  },
  "breadcrumbs": {
    "home": "Home",
    "products": "Products",
    "collections": "Collections",
    "portfolio": "Portfolio",
    "about": "About",
    "cart": "Cart",
    "checkout": "Checkout"
  }
}
```

**Zod Schema:**
```typescript
// config/schema/navigation-schema.ts
import { z } from 'zod';

const NavLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  aria_label: z.string(),
  external: z.boolean().optional(),
});

const FooterSectionSchema = z.object({
  id: z.string(),
  heading: z.string(),
  links: z.array(NavLinkSchema),
});

export const NavigationSchema = z.object({
  version: z.string(),
  updated: z.string(),
  header: z.object({
    logo_alt: z.string(),
    nav_items: z.array(
      NavLinkSchema.extend({
        id: z.string(),
      })
    ),
  }),
  footer: z.object({
    sections: z.array(FooterSectionSchema),
    copyright: z.string(),
    legal_links: z.array(
      z.object({
        label: z.string(),
        href: z.string(),
      })
    ),
  }),
  breadcrumbs: z.record(z.string()),
});

export type Navigation = z.infer<typeof NavigationSchema>;
```

---

### 3. Homepage Content (`config/content/pages/home.json`)

```json
{
  "version": "1.0",
  "updated": "2025-10-27",
  "hero": {
    "heading": "Sculptural LED Lighting for Modern Spaces",
    "subheading": "Pre-made modular fixtures designed in Toronto. Ready to install or expand over time.",
    "cta_primary": {
      "label": "Shop Pre-Made Fixtures",
      "href": "/products",
      "aria_label": "Browse pre-assembled LED fixtures"
    },
    "cta_secondary": {
      "label": "View Portfolio",
      "href": "/portfolio",
      "aria_label": "View installation portfolio"
    }
  },
  "value_props": [
    {
      "id": "ready-to-install",
      "heading": "Ready to Install",
      "description": "Pre-assembled fixtures arrive ready to hang. Professional installation available in GTA.",
      "icon": "package"
    },
    {
      "id": "modular-design",
      "heading": "Modular Design",
      "description": "Expand your fixture over time. Add panels, upgrade controllers, or reconfigure layouts.",
      "icon": "grid"
    },
    {
      "id": "warranty",
      "heading": "10-Year Warranty",
      "description": "Founder Edition units include comprehensive 10-year warranty and ESA certification.",
      "icon": "shield"
    }
  ],
  "founder_section": {
    "heading": "Founder Edition Collection",
    "description": "Limited run of 1,000 units worldwide. Hand-assembled 24v cubes with 10-year warranty and Solana NFT token.",
    "colors": [
      {
        "id": "black",
        "label": "Black",
        "quantity": 500,
        "quantity_label": "500 Available"
      },
      {
        "id": "white",
        "label": "White",
        "quantity": 300,
        "quantity_label": "300 Available"
      },
      {
        "id": "red",
        "label": "Red",
        "quantity": 200,
        "quantity_label": "200 Available"
      }
    ],
    "cta": {
      "label": "Explore Founder Edition",
      "href": "/products/Unit-8x8x8-Founder",
      "aria_label": "View Founder Edition details"
    }
  },
  "expansion_section": {
    "heading": "Expand Your Fixture",
    "description": "Add panels and upgrade components to grow your installation.",
    "cta": {
      "label": "Browse Components",
      "href": "/products?category=material",
      "aria_label": "Browse expansion components"
    }
  },
  "accessories_section": {
    "heading": "Accessories",
    "description": "Enhance and customize your fixture's appearance.",
    "cta": {
      "label": "Shop Accessories",
      "href": "/products?category=diffuser",
      "aria_label": "Browse accessories"
    }
  },
  "diy_section": {
    "heading": "DIY Kits",
    "description": "For makers who want to assemble themselves. Includes everything you need.",
    "cta": {
      "label": "View DIY Kits",
      "href": "/products?category=kit",
      "aria_label": "Browse DIY kits"
    }
  },
  "about_section": {
    "heading": "Designed in Toronto. Built to Last.",
    "description": "Each Imajin fixture is a sculptural statement piece crafted from precision-engineered PCB panels and addressable RGB LEDs. Designed for residential and commercial spaces seeking modern, dynamic lighting solutions.",
    "cta": {
      "label": "Browse All Products",
      "href": "/products",
      "aria_label": "View all products"
    }
  }
}
```

---

### 4. Product Listing Page (`config/content/pages/products-listing.json`)

```json
{
  "version": "1.0",
  "updated": "2025-10-27",
  "page": {
    "heading": "Shop Pre-Made Fixtures",
    "subheading": "Sculptural LED lighting ready for your home or business. Pre-assembled fixtures and expansion components."
  },
  "filters": {
    "heading": "Filter By",
    "sections": [
      {
        "id": "product_type",
        "label": "Product Type",
        "options": [
          {
            "value": "fixtures",
            "label": "Complete Fixtures",
            "description": "Pre-assembled ready-to-install units"
          },
          {
            "value": "material",
            "label": "Expansion Panels",
            "description": "Individual panels for growing your fixture"
          },
          {
            "value": "control",
            "label": "Controllers",
            "description": "Control units and power supplies"
          },
          {
            "value": "diffuser",
            "label": "Accessories",
            "description": "Diffusion caps and connectors"
          }
        ]
      },
      {
        "id": "availability",
        "label": "Availability",
        "options": [
          {
            "value": "in_stock",
            "label": "In Stock",
            "description": "Ships within 7-14 days"
          },
          {
            "value": "limited_edition",
            "label": "Limited Edition",
            "description": "Founder Edition collection"
          }
        ]
      },
      {
        "id": "color",
        "label": "Color",
        "options": [
          {
            "value": "BLACK",
            "label": "Black",
            "description": "Matte black PCB"
          },
          {
            "value": "WHITE",
            "label": "White",
            "description": "White PCB finish"
          },
          {
            "value": "RED",
            "label": "Red",
            "description": "Red PCB accent"
          }
        ]
      },
      {
        "id": "price",
        "label": "Price Range",
        "options": [
          {
            "value": "0-50000",
            "label": "Under $500",
            "description": "Budget-friendly options"
          },
          {
            "value": "50000-150000",
            "label": "$500 - $1,500",
            "description": "Mid-range fixtures"
          },
          {
            "value": "150000-300000",
            "label": "$1,500 - $3,000",
            "description": "Premium fixtures"
          },
          {
            "value": "300000-999999999",
            "label": "$3,000+",
            "description": "High-end installations"
          }
        ]
      }
    ],
    "clear_filters_label": "Clear All Filters",
    "active_filters_label": "Active Filters"
  },
  "loading_states": {
    "loading_products": "Loading products...",
    "no_products": "No products found matching your filters.",
    "try_again": "Try adjusting your filters or browse all products."
  },
  "product_sections": [
    {
      "id": "founder",
      "heading": "Founder Edition Collection",
      "description": "Limited run of 1,000 units worldwide. Hand-assembled 24v cubes with 10-year warranty and Solana NFT token."
    },
    {
      "id": "expansion",
      "heading": "Expand Your Fixture",
      "description": "Add panels and upgrade components to grow your installation."
    },
    {
      "id": "accessories",
      "heading": "Accessories",
      "description": "Enhance and customize your fixture's appearance."
    },
    {
      "id": "diy",
      "heading": "DIY Kits",
      "description": "For makers who want to assemble themselves. Includes everything you need."
    }
  ]
}
```

---

### 5. Product Detail Page (`config/content/pages/product-detail.json`)

```json
{
  "version": "1.0",
  "updated": "2025-10-27",
  "sections": {
    "description": {
      "heading": "Description"
    },
    "specifications": {
      "heading": "Specifications"
    },
    "whats_included": {
      "heading": "What's Included"
    },
    "warranty": {
      "heading": "Warranty & Support"
    }
  },
  "variant_selector": {
    "color_label": "Select Color:",
    "quantity_label": "Quantity:",
    "out_of_stock_label": "Sold Out",
    "out_of_stock_suffix": "- Sold Out"
  },
  "badges": {
    "limited_edition": "Limited Edition",
    "sold_out": "Sold Out",
    "requires_assembly": "Requires Assembly",
    "multiple_colors": "Multiple colors available",
    "low_stock_template": "Only {quantity} remaining",
    "in_stock": "In Stock"
  },
  "assembly": {
    "notice": "Assembly Required: This product requires assembly."
  },
  "cta": {
    "add_to_cart": "Add to Cart",
    "adding": "Adding...",
    "added": "Added!",
    "sold_out": "Sold Out",
    "notify_me": "Notify When Available"
  },
  "shipping": {
    "estimate": "Ships within 7-14 business days",
    "free_shipping_notice": "Free shipping on orders over $500"
  }
}
```

---

### 6. UI Strings (`config/content/ui-strings.json`)

```json
{
  "version": "1.0",
  "updated": "2025-10-27",
  "cart": {
    "heading": "Shopping Cart",
    "empty_state": {
      "heading": "Your cart is empty",
      "message": "Add some products to get started",
      "cta_label": "Browse Products"
    },
    "item_count": {
      "singular": "item",
      "plural": "items"
    },
    "summary": {
      "subtotal": "Subtotal",
      "shipping": "Shipping",
      "shipping_calculated": "Calculated at checkout",
      "total": "Total"
    },
    "actions": {
      "checkout": "Checkout",
      "continue_shopping": "Continue Shopping",
      "update_cart": "Update Cart",
      "clear_cart": "Clear Cart"
    }
  },
  "cart_item": {
    "limited_edition_badge": "Limited Edition",
    "low_stock_template": "Only {quantity} remaining",
    "quantity_label": "Quantity",
    "remove_label": "Remove",
    "update_label": "Update",
    "aria": {
      "increase_quantity": "Increase quantity",
      "decrease_quantity": "Decrease quantity",
      "remove_item": "Remove item from cart"
    }
  },
  "buttons": {
    "add_to_cart": "Add to Cart",
    "adding": "Adding...",
    "added": "Added!",
    "buy_now": "Buy Now",
    "checkout": "Checkout",
    "continue": "Continue",
    "back": "Back",
    "close": "Close",
    "cancel": "Cancel",
    "save": "Save",
    "submit": "Submit",
    "loading": "Loading...",
    "learn_more": "Learn More",
    "view_details": "View Details",
    "shop_now": "Shop Now"
  },
  "forms": {
    "required_field": "Required",
    "optional_field": "Optional",
    "select_placeholder": "Select an option",
    "search_placeholder": "Search..."
  },
  "loading": {
    "loading": "Loading...",
    "please_wait": "Please wait..."
  },
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "network": "Network error. Check your connection and try again.",
    "not_found": "The page you're looking for doesn't exist."
  },
  "aria": {
    "close_dialog": "Close dialog",
    "close_cart": "Close cart",
    "open_cart": "Open cart",
    "open_menu": "Open menu",
    "close_menu": "Close menu",
    "skip_to_content": "Skip to content"
  }
}
```

---

### 7. Validation Messages (`config/content/validation-messages.json`)

```json
{
  "version": "1.0",
  "updated": "2025-10-27",
  "cart_validation": {
    "product_unavailable_template": "{product_name} is no longer available",
    "product_sold_out_template": "{product_name} is sold out",
    "insufficient_stock_template": "Only {available_quantity} units of {product_name} remaining",
    "quantity_exceeds_stock_template": "Only {available_quantity} units available",
    "voltage_mismatch": "Cannot mix 5v and 24v components in the same order. Please choose one voltage system.",
    "missing_required_component_template": "This product requires {required_product}",
    "suggested_component_template": "Consider adding {suggested_product}",
    "incompatible_products_template": "Cannot add {product_name} with {conflicting_product} in cart"
  },
  "product_validation": {
    "invalid_variant": "Please select a valid variant",
    "invalid_quantity": "Please enter a valid quantity",
    "quantity_too_low": "Quantity must be at least 1",
    "quantity_too_high_template": "Maximum quantity is {max_quantity}"
  },
  "checkout_validation": {
    "required_field_template": "{field_name} is required",
    "invalid_email": "Please enter a valid email address",
    "invalid_phone": "Please enter a valid phone number",
    "invalid_postal_code": "Please enter a valid postal code",
    "invalid_card": "Invalid card number",
    "card_declined": "Your card was declined. Please try another payment method."
  },
  "form_validation": {
    "required": "This field is required",
    "email_invalid": "Please enter a valid email address",
    "min_length_template": "Must be at least {min_length} characters",
    "max_length_template": "Must be no more than {max_length} characters",
    "pattern_mismatch": "Please match the requested format"
  }
}
```

---

## Implementation Plan

### Phase A: Infrastructure (Loaders & Validation)

**Goal:** Create the plumbing for content loading with full type safety

**Tasks:**
1. Create Zod validation schemas for all JSON structures
2. Build content loader utilities (`lib/config/content-loader.ts`)
3. Create React hooks for accessing content (`hooks/useContent.ts`, `hooks/useNavigation.ts`, etc.)
4. Add runtime validation with helpful error messages
5. Create content type definitions from Zod schemas

**Files to Create:**
```
/config/schema/
  ├── site-metadata-schema.ts
  ├── navigation-schema.ts
  ├── page-content-schema.ts
  ├── ui-strings-schema.ts
  └── validation-messages-schema.ts

/lib/config/
  ├── content-loader.ts           # Core loader utility
  └── content-cache.ts            # Optional: in-memory cache

/hooks/
  ├── useContent.ts               # Generic content hook
  ├── useSiteMetadata.ts          # Site metadata hook
  ├── useNavigation.ts            # Navigation hook
  ├── useUIStrings.ts             # UI strings hook
  └── useValidationMessages.ts    # Validation messages hook

/types/
  └── content.ts                  # Exported types from schemas
```

**Content Loader Pattern:**
```typescript
// lib/config/content-loader.ts
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

export async function loadContent<T>(
  filePath: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const fullPath = path.join(process.cwd(), 'config', filePath);
    const fileContents = await fs.readFile(fullPath, 'utf-8');
    const json = JSON.parse(fileContents);
    return schema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`Content validation failed for ${filePath}:`, error.errors);
      throw new Error(`Invalid content structure in ${filePath}`);
    }
    throw error;
  }
}

// Cache content in memory (server-side only)
const contentCache = new Map<string, any>();

export async function loadContentCached<T>(
  filePath: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const cacheKey = filePath;

  if (contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey) as T;
  }

  const content = await loadContent(filePath, schema);
  contentCache.set(cacheKey, content);
  return content;
}

// Clear cache (useful for development hot reloading)
export function clearContentCache() {
  contentCache.clear();
}
```

**React Hook Pattern:**
```typescript
// hooks/useNavigation.ts
import { useEffect, useState } from 'react';
import { Navigation, NavigationSchema } from '@/config/schema/navigation-schema';

// Server-side: load during build/SSR
export async function getNavigation(): Promise<Navigation> {
  const { loadContentCached } = await import('@/lib/config/content-loader');
  return loadContentCached('content/navigation.json', NavigationSchema);
}

// Client-side: hydrate from server props
export function useNavigation(initialData: Navigation) {
  return initialData;
}
```

**Testing:**
- [ ] Unit tests for content loader (error handling, validation failures)
- [ ] Unit tests for each Zod schema (validate against example JSON)
- [ ] Integration test: Load all JSON files successfully
- [ ] Test cache invalidation during development

---

### Phase B: JSON File Creation

**Goal:** Create all JSON configuration files with real content

**Tasks:**
1. Create all 7 JSON files with content migrated from existing components
2. Validate each file against its Zod schema
3. Review for completeness (ensure all hardcoded strings are captured)
4. Commit JSON files to git

**JSON Files to Create:**
```
/config/content/
  ├── site-metadata.json
  ├── navigation.json
  ├── pages/
  │   ├── home.json
  │   ├── products-listing.json
  │   └── product-detail.json
  ├── ui-strings.json
  └── validation-messages.json
```

**Validation Script:**
```bash
# scripts/validate-content.ts
# Run all JSON files through their schemas
# Exit with error if validation fails
# Use in CI/CD pipeline
```

**Testing:**
- [ ] Validate all JSON files against schemas (automated script)
- [ ] Manual review: Compare strings in JSON vs current hardcoded strings
- [ ] Check for missing/duplicate strings

---

### Phase C: Component Refactoring

**Goal:** Update all components to consume externalized content

**Refactoring Order (High Priority First):**

**1. Metadata & SEO (CRITICAL)**
- [ ] `/app/layout.tsx` - Use `useSiteMetadata()` for site title, meta tags
- [ ] Update `<title>`, `<meta>` tags to pull from config
- [ ] Verify OpenGraph tags, favicons

**2. Navigation (HIGH)**
- [ ] `/components/layout/Header.tsx` - Use `useNavigation()` for nav items
- [ ] `/components/layout/Footer.tsx` - Use `useNavigation()` for footer structure, social links
- [ ] Test all navigation links, ARIA labels

**3. Homepage (HIGH)**
- [ ] `/app/page.tsx` - Use page content hook for all homepage sections
- [ ] `/components/home/HeroSection.tsx` - Hero text from config
- [ ] Verify all CTAs, section headings, descriptions

**4. Product Pages (HIGH)**
- [ ] `/app/products/page.tsx` - Use products listing content
- [ ] `/app/products/[id]/page.tsx` - Use product detail content
- [ ] Refactor filter labels, section headings
- [ ] Test loading states, empty states

**5. Cart Components (MEDIUM)**
- [ ] `/components/cart/CartDrawer.tsx` - UI strings for cart
- [ ] `/components/cart/CartItem.tsx` - Item labels, ARIA labels
- [ ] `/components/cart/CartSummary.tsx` - Summary labels
- [ ] `/components/cart/AddToCartButton.tsx` - Button states
- [ ] Test all cart interactions

**6. Product Components (MEDIUM)**
- [ ] `/components/products/ProductAddToCart.tsx` - Form labels
- [ ] `/components/products/LimitedEditionBadge.tsx` - Badge text
- [ ] `/components/products/ProductCard.tsx` - Card labels
- [ ] Test variant selectors, quantity inputs

**7. Validation Messages (MEDIUM)**
- [ ] `/lib/services/cart-validator.ts` - Error messages from config
- [ ] Test all validation scenarios (voltage mismatch, stock issues, etc.)

**Refactoring Pattern:**

**Before (Hardcoded):**
```tsx
// app/page.tsx
<h1>Sculptural LED Lighting for Modern Spaces</h1>
<p>Pre-made modular fixtures designed in Toronto...</p>
```

**After (Externalized):**
```tsx
// app/page.tsx
import { getHomeContent } from '@/hooks/useContent';

export default async function HomePage() {
  const content = await getHomeContent();

  return (
    <section>
      <h1>{content.hero.heading}</h1>
      <p>{content.hero.subheading}</p>
    </section>
  );
}
```

**Testing for Each Component:**
- [ ] Unit tests pass (update mocks to use content objects)
- [ ] Visual regression test (page looks identical)
- [ ] Accessibility test (ARIA labels correct)
- [ ] Manual browser test (all strings render correctly)

---

### Phase D: Documentation

**Goal:** Document the content management pattern for future development

**Tasks:**
1. Update `/docs/JSON_CONFIG_STRUCTURE.md` to include content configs
2. Create `/docs/CONTENT_MANAGEMENT.md` - How to add/edit content
3. Update `/docs/COMPONENT_ARCHITECTURE.md` - Content hook patterns
4. Add inline JSDoc comments to all hooks and loaders

**Documentation Structure:**

**`docs/CONTENT_MANAGEMENT.md`:**
```markdown
# Content Management Guide

## Overview
All UI copy, messaging, and content is managed through JSON configuration files...

## Adding New Content
1. Determine appropriate JSON file
2. Add content with descriptive key
3. Update Zod schema (if structure changes)
4. Import and use in component
5. Test rendering

## Editing Existing Content
1. Find content in JSON file
2. Edit text/labels
3. Commit to git
4. Deploy (no code changes needed)

## Content Structure
[Explanation of each JSON file and its purpose]

## Hooks Reference
[Documentation for each content hook]
```

**Update `JSON_CONFIG_STRUCTURE.md`:**
- Add section on content configurations
- Explain relationship between product config and content config
- Document validation workflow

---

### Phase E: Testing & Validation

**Goal:** Comprehensive testing to ensure no regressions

**Test Plan:**

**1. Unit Tests (~30 new tests)**
- [ ] Content loader utility tests (10 tests)
  - Load valid JSON successfully
  - Handle missing files gracefully
  - Validation error handling
  - Cache functionality
- [ ] Zod schema tests (5 tests per schema × 5 schemas = 25 tests)
  - Valid content passes
  - Invalid content fails with helpful errors
  - Optional fields work correctly
- [ ] Hook tests (update existing + 10 new)
  - Hooks return correct data structure
  - Server-side loading works
  - Client-side hydration works

**2. Integration Tests (~15 tests)**
- [ ] Page rendering with content (8 tests)
  - Homepage renders all sections with correct content
  - Product listing renders with correct filters
  - Product detail page renders with correct labels
  - Cart renders with correct UI strings
- [ ] Navigation tests (4 tests)
  - Header navigation renders correctly
  - Footer navigation renders correctly
  - Breadcrumbs work
  - Social media links correct
- [ ] Validation message tests (3 tests)
  - Cart validation messages display correctly
  - Product validation works
  - Template substitution works ({product_name}, etc.)

**3. Visual Regression Tests**
- [ ] Homepage looks identical to pre-refactor
- [ ] Product listing page looks identical
- [ ] Product detail page looks identical
- [ ] Cart drawer looks identical
- [ ] All buttons/badges render correctly

**4. Manual Testing Checklist**
- [ ] All pages load without errors
- [ ] All navigation links work
- [ ] All buttons have correct labels
- [ ] All error messages display correctly
- [ ] Cart validation messages render correctly
- [ ] Filter labels and options work
- [ ] Variant selector labels correct
- [ ] Breadcrumbs render correctly
- [ ] Footer social links work
- [ ] Meta tags correct (view page source)
- [ ] No hardcoded strings visible in UI

**5. Accessibility Testing**
- [ ] All ARIA labels present and correct
- [ ] Screen reader test (navigation works)
- [ ] Keyboard navigation works
- [ ] Focus states correct

**Test Commands:**
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# All tests
npm test

# Coverage report
npm run test:coverage

# Validate all JSON files
npm run validate:content
```

---

## Acceptance Criteria

### Phase Complete When:

**Infrastructure:**
- [x] All Zod schemas created and tested
- [x] Content loader utility built with caching
- [x] React hooks created for all content types
- [x] TypeScript types exported from schemas
- [x] Unit tests passing (100% coverage for loaders)

**Content:**
- [x] All 7 JSON files created with complete content
- [x] All hardcoded strings migrated to JSON
- [x] JSON validation script passes
- [x] No placeholder/example content remaining

**Components:**
- [x] All 24 files refactored to use content hooks
- [x] No hardcoded UI strings remaining in components
- [x] All component tests updated and passing
- [x] Visual regression tests pass (no UI changes)

**Testing:**
- [x] 365+ existing tests still passing
- [x] ~45 new tests added (loaders, schemas, integration)
- [x] Manual testing checklist complete
- [x] Accessibility audit passes

**Documentation:**
- [x] `CONTENT_MANAGEMENT.md` created
- [x] `JSON_CONFIG_STRUCTURE.md` updated
- [x] Inline JSDoc comments added
- [x] README updated with content management info

**Quality Gates:**
- [x] No regressions in existing functionality
- [x] Site metadata correct (no more "Create Next App")
- [x] All navigation works
- [x] All error messages render correctly
- [x] TypeScript builds without errors
- [x] Lint passes
- [x] Ready for Phase 2.4 (Checkout)

---

## Timeline Estimate

**Total: 2-3 days**

- **Day 1 (6-8 hours):** Phase A (Infrastructure) + Phase B (JSON Creation)
  - Build loaders, schemas, hooks (3-4 hours)
  - Create all JSON files (2-3 hours)
  - Validation script + initial testing (1-2 hours)

- **Day 2 (6-8 hours):** Phase C (Component Refactoring)
  - Refactor critical components (metadata, navigation - 2 hours)
  - Refactor homepage + product pages (2-3 hours)
  - Refactor cart components (2 hours)
  - Update tests (1-2 hours)

- **Day 3 (4-6 hours):** Phase D (Documentation) + Phase E (Testing)
  - Documentation (2 hours)
  - Comprehensive testing (2-3 hours)
  - Bug fixes and polish (1-2 hours)

---

## Risks & Mitigations

### Risk 1: Template String Complexity
**Issue:** Some messages use templates (e.g., "Only {quantity} remaining")
**Mitigation:** Create helper utilities for string interpolation with TypeScript safety

```typescript
// lib/utils/string-template.ts
export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

// Usage:
const message = interpolate(
  content.validation.insufficient_stock_template,
  { available_quantity: 5, product_name: 'Black Cube' }
);
// Result: "Only 5 units of Black Cube remaining"
```

### Risk 2: Server vs Client Rendering
**Issue:** Content needs to be available on server (SSR) and client
**Mitigation:**
- Server components: Load directly with async
- Client components: Pass as props from server parent
- Use Next.js data fetching patterns consistently

### Risk 3: Cache Invalidation During Development
**Issue:** Hot reloading may not pick up JSON changes
**Mitigation:**
- Disable cache in development mode
- Add file watcher to clear cache on JSON changes
- Document cache behavior in development docs

### Risk 4: Test Updates
**Issue:** Many existing tests mock hardcoded strings
**Mitigation:**
- Create test helper to load content in tests
- Mock content loaders consistently
- Update test snapshots where needed

### Risk 5: Breaking Changes
**Issue:** Refactoring 24 files could introduce bugs
**Mitigation:**
- Refactor incrementally (one component at a time)
- Run full test suite after each component
- Visual regression testing
- Manual QA checklist

---

## Success Metrics

**Quantitative:**
- 0 hardcoded UI strings remaining in components
- 100% of existing tests passing
- ~45 new tests added (loaders, schemas, integration)
- 410+ total tests passing
- TypeScript build: 0 errors
- Lint: 0 errors

**Qualitative:**
- Site metadata correct (no "Create Next App")
- Content changes possible without code changes
- Clear pattern established for future content
- Documentation comprehensive
- Developer experience improved
- Ready for Phase 2.4 development

---

## Out of Scope (Future Enhancements)

**NOT included in Phase 2.3.6:**
- Content Management UI/Admin interface
- Internationalization (i18n) support
- Content versioning/rollback system
- A/B testing infrastructure
- Dynamic content personalization
- Content preview mode

**Can be added later without major refactoring**

---

## Handoff to Dr. LeanDev

### Context for Execution

**What you're building:**
A content externalization system that moves all hardcoded UI strings, copy, and messaging into JSON configuration files with full TypeScript type safety.

**Why it matters:**
- 80+ hardcoded strings creating maintenance burden
- Content changes require code changes and deploys
- Site metadata still says "Create Next App" (embarrassing)
- Phase 2.4 (Checkout) will add lots of copy
- Need content flexibility without developer involvement

**What already exists:**
- ✅ Product data externalization pattern (`/config/products.json`)
- ✅ Design system with CSS variables (`/app/globals.css`)
- ✅ UI component library (`/components/ui/*`)
- ✅ Strong testing infrastructure (Vitest, 365 tests passing)

**What you're building on:**
- Same pattern as `products.json` (JSON → Zod → TypeScript → React hooks)
- Follow established conventions for file structure, naming, testing
- Maintain 100% test pass rate (no regressions)

### Execution Approach

**Sequential phases (don't skip ahead):**
1. Infrastructure first (loaders, schemas, hooks)
2. Then JSON files (validate before moving on)
3. Then refactor components (one at a time, test each)
4. Then documentation
5. Finally comprehensive testing

**Quality gates:**
- After Phase A: All schemas validated, loaders tested
- After Phase B: All JSON files load successfully
- After each component refactor: Tests pass, visual check in browser
- Before completion: Full test suite passes, manual QA complete

**Testing strategy:**
- Write tests for loaders/schemas first
- Update component tests as you refactor
- Run `npm test` frequently
- Manual browser testing for visual regression
- Accessibility check (screen reader, keyboard nav)

### Files You'll Create

**New files (~20):**
- 5 Zod schemas (`/config/schema/*-schema.ts`)
- 7 JSON files (`/config/content/**/*.json`)
- 2 loader utilities (`/lib/config/content-loader.ts`, etc.)
- 5 React hooks (`/hooks/use*.ts`)
- 1 string template utility (`/lib/utils/string-template.ts`)
- 2 documentation files
- Test files for all of the above

**Files You'll Modify (~26):**
- 24 component/page files (refactor to use hooks)
- `docs/JSON_CONFIG_STRUCTURE.md` (update)
- `docs/COMPONENT_ARCHITECTURE.md` (update)

### Common Pitfalls to Avoid

1. **Don't skip validation** - Every JSON file must pass its Zod schema
2. **Don't batch component refactors** - Do one, test, then next
3. **Don't forget ARIA labels** - Accessibility strings are content too
4. **Don't leave "TODO" comments** - Finish each phase completely
5. **Don't break existing tests** - Update mocks as you go
6. **Don't forget error messages** - Validation messages are critical

### Definition of Done

**You're done when:**
- [ ] All 365 existing tests passing
- [ ] ~45 new tests added and passing
- [ ] Zero hardcoded strings in components (grep for quotes)
- [ ] Site metadata correct (view page source)
- [ ] All pages render identically to before refactor
- [ ] Documentation complete and accurate
- [ ] TypeScript builds cleanly
- [ ] Lint passes
- [ ] Manual QA checklist complete
- [ ] Ready for Dr. Clean review

### Questions to Ask Before Starting

- Confirm social media URLs (placeholder in JSON spec)
- Confirm support email addresses
- Any specific brand guidelines for error messages?
- Any content that should NOT be externalized?

---

**Document Created:** 2025-10-27
**Status:** Ready for implementation
**Assigned To:** Dr. LeanDev
**Estimated Effort:** 2-3 days
**Dependencies:** Phase 2.3.5 complete (✅)
**Blocks:** Phase 2.4 (Checkout)
