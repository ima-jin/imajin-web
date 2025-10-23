# JSON Configuration Structure

## Overview

Product and portfolio data is managed through JSON configuration files in the `/config` directory. This approach provides:

- Version control for content changes
- Easy bulk updates via JSON editing
- Type-safe imports in TypeScript
- No GUI CMS overhead

**Philosophy:** Keep it simple. JSON files are the source of truth, synced to database via seed script.

**Note on Examples:** This document shows example JSON structures with placeholder data (image URLs, some product IDs, etc.). The actual configuration files will contain real Stripe Product IDs, Cloudinary URLs, and product details. The schemas and property structures shown here are what matters for implementation.

---

## Directory Structure

```
/config
├── products/
│   ├── materials.json       # Material panels (PCBs)
│   ├── connectors.json      # Spine connectors
│   ├── controls.json        # Control units
│   ├── diffusers.json       # Diffusion caps
│   ├── kits.json            # Complete kits (DIY, Founder)
│   └── interfaces.json      # Wall interfaces
├── portfolio/
│   ├── installations.json   # Installation projects
│   └── case-studies.json    # Case studies
├── dependencies.json        # Product dependency rules
├── default.json             # Default app config
├── dev.json                 # Dev environment overrides
└── live.json                # Production overrides
```

---

## Product Configuration

### Schema

Each product category file follows this structure:

```typescript
// types/config.ts
export interface ProductConfig {
  id: string; // Product ID (matches Stripe)
  name: string; // Display name
  description: string; // Short description
  long_description?: string; // Full product description (markdown)
  category: "material" | "connector" | "control" | "diffuser" | "kit" | "interface";
  dev_status: 0 | 1 | 2 | 3 | 4 | 5;
  base_price: number; // Price in cents
  stripe_product_id: string; // Stripe Product ID
  has_variants: boolean;
  requires_assembly?: boolean;
  images: string[]; // Cloudinary URLs
  specs: ProductSpec[];
  metadata?: Record<string, any>;
}

export interface ProductSpec {
  key: string; // e.g., "voltage", "dimensions"
  value: string; // e.g., "5v", "240 x 240"
  unit?: string; // e.g., "v", "mm"
  display_order: number;
}

export interface VariantConfig {
  id: string; // Variant ID
  product_id: string; // Parent product ID
  stripe_product_id: string; // Stripe Product ID for this variant
  variant_type: string; // "color", "voltage", "size"
  variant_value: string; // "BLACK", "WHITE", "RED", "5v", "24v"
  price_modifier?: number; // Price difference from base (cents)
  is_limited_edition: boolean;
  max_quantity?: number; // NULL = unlimited
  images?: string[]; // Variant-specific images (if different from base)
  metadata?: Record<string, any>;
}
```

---

### Example: Materials

```json
// config/products/materials.json
{
  "products": [
    {
      "id": "Material-5x5-O",
      "name": "5x5 Opaque Panel",
      "description": "150mm, 5×5 prototype PCB from 2023 (opaque, 30mm spacing)",
      "long_description": "Our original prototype panel featuring a 5×5 grid of addressable LEDs. Perfect for smaller installations or prototyping. Each panel contains 25 individually controllable RGB LEDs with opaque PCB backing for focused light output.\n\n**Use Cases:**\n- Small-scale installations\n- Prototyping and testing\n- Accent lighting\n- Legacy system compatibility",
      "category": "material",
      "dev_status": 5,
      "base_price": 1600,
      "stripe_product_id": "prod_stripe_material_5x5_o",
      "has_variants": false,
      "images": ["cloudinary-url-1.jpg", "cloudinary-url-2.jpg"],
      "specs": [
        {
          "key": "dimensions",
          "value": "150 x 150",
          "unit": "mm",
          "display_order": 1
        },
        {
          "key": "led_count",
          "value": "25",
          "unit": "LEDs",
          "display_order": 2
        },
        {
          "key": "spacing",
          "value": "30",
          "unit": "mm",
          "display_order": 3
        },
        {
          "key": "led_type",
          "value": "WS2812B",
          "display_order": 4
        },
        {
          "key": "voltage",
          "value": "5",
          "unit": "v",
          "display_order": 5
        },
        {
          "key": "power_consumption",
          "value": "15",
          "unit": "W",
          "display_order": 6
        }
      ],
      "metadata": {
        "year_introduced": 2023,
        "generation": 1,
        "weight_grams": 45
      }
    },
    {
      "id": "Material-8x8-V",
      "name": "8x8 Void Panel",
      "description": "240mm, 8×8 prototype PCB from 2024 (negative space cut away, 31.6mm spacing)",
      "long_description": "Our current-generation panel featuring a refined 8×8 grid with negative space design for enhanced visual depth. The void-style PCB creates floating LED effects perfect for modern installations.\n\n**Key Features:**\n- 64 individually addressable RGB LEDs\n- Precision-cut negative space design\n- Optimized 31.6mm spacing for ideal coverage\n- Compatible with our spine connector system\n- Designed for scalability (tested up to 80 panels)\n\n**Use Cases:**\n- Large-scale installations\n- Commercial projects\n- Expandable fixtures\n- Founder Edition cubes",
      "category": "material",
      "dev_status": 5,
      "base_price": 3500,
      "stripe_product_id": "prod_TFqJ6019ONDct2",
      "has_variants": false,
      "images": [
        "cloudinary-url-front.jpg",
        "cloudinary-url-detail.jpg",
        "cloudinary-url-installed.jpg"
      ],
      "specs": [
        {
          "key": "dimensions",
          "value": "240 x 240",
          "unit": "mm",
          "display_order": 1
        },
        {
          "key": "led_count",
          "value": "64",
          "unit": "LEDs",
          "display_order": 2
        },
        {
          "key": "spacing",
          "value": "31.6",
          "unit": "mm",
          "display_order": 3
        },
        {
          "key": "led_type",
          "value": "WS2812B",
          "display_order": 4
        },
        {
          "key": "voltage",
          "value": "5 / 24",
          "unit": "v",
          "display_order": 5
        },
        {
          "key": "power_consumption",
          "value": "38",
          "unit": "W",
          "display_order": 6
        },
        {
          "key": "pcb_thickness",
          "value": "1.6",
          "unit": "mm",
          "display_order": 7
        }
      ],
      "metadata": {
        "year_introduced": 2024,
        "generation": 2,
        "weight_grams": 72,
        "compatible_diffusers": ["Diffuse-12-C", "Diffuse-12-S"]
      }
    }
  ]
}
```

---

### Example: Kits with Variants

```json
// config/products/kits.json
{
  "products": [
    {
      "id": "Unit-8x8x8-DIY",
      "name": "8x8x8 DIY Cube Kit",
      "description": "DIY version of the 5v 8-layer original cube",
      "long_description": "Build your own LED cube with our comprehensive DIY kit. Includes everything you need to assemble an 8×8×8 fixture (512 addressable LEDs) perfect for makers, hackers, and lighting enthusiasts.\n\n**What's Included:**\n- 8× Material-8x8-V panels (BLACK PCB)\n- 7× Connect-5x31.6-5v spine connectors\n- 1× Control-2-5v control unit\n- 512× Diffuse-12-C round diffusion caps\n- Assembly instructions and wiring guide\n- Access to online configurator tool\n\n**Requirements:**\n- Basic soldering skills\n- 5V 10A power supply (not included)\n- 2-3 hours assembly time\n\n**Note:** DIY kits do not include warranty or assembly service guarantees.",
      "category": "kit",
      "dev_status": 5,
      "base_price": 49500,
      "stripe_product_id": "prod_stripe_diy_cube",
      "has_variants": false,
      "requires_assembly": true,
      "images": [
        "cloudinary-url-box.jpg",
        "cloudinary-url-contents.jpg",
        "cloudinary-url-assembled.jpg"
      ],
      "specs": [
        {
          "key": "dimensions",
          "value": "240 x 240 x 240",
          "unit": "mm",
          "display_order": 1
        },
        {
          "key": "total_leds",
          "value": "512",
          "unit": "LEDs",
          "display_order": 2
        },
        {
          "key": "layers",
          "value": "8",
          "display_order": 3
        },
        {
          "key": "voltage",
          "value": "5",
          "unit": "v",
          "display_order": 4
        },
        {
          "key": "max_power",
          "value": "50",
          "unit": "W",
          "display_order": 5
        },
        {
          "key": "assembly_time",
          "value": "2-3",
          "unit": "hours",
          "display_order": 6
        }
      ],
      "metadata": {
        "includes_warranty": false,
        "skill_level": "intermediate",
        "contents": {
          "Material-8x8-V": 8,
          "Connect-5x31.6-5v": 7,
          "Control-2-5v": 1,
          "Diffuse-12-C": 512
        }
      }
    },
    {
      "id": "Unit-8x8x8-Founder",
      "name": "Founder Edition Cube",
      "description": "Fully hand-assembled 24v 8-layer cube with 10-year warranty and MJN NFT",
      "long_description": "The ultimate LED cube experience. Each Founder Edition unit is meticulously hand-assembled, tested, and certified. Limited to 1,000 units worldwide across three exclusive colorways.\n\n**Premium Features:**\n- Hand-assembled by Imajin craftspeople\n- 24v professional-grade system\n- Control-8-24v unit (8 outputs, 2 initially configured)\n- Expandable to 32+ layers\n- 10-year comprehensive warranty\n- ESA certified for safety and reliability\n- MJN RWA NFT token (minted on Solana)\n- Unique serial number engraved on unit\n- Certificate of authenticity\n- Premium packaging\n\n**Limited Edition:**\n- BLACK: 500 units\n- WHITE: 300 units\n- RED: 200 units\n\n**What's Included:**\n- 8× Material-8x8-V panels (selected color)\n- 7× Connect-5x31.6-24v spine connectors\n- 1× Control-8-24v control unit\n- 512× Diffuse-12-C round diffusion caps\n- Professional cabling and cable management\n- MJN NFT token (delivered post-shipment)\n- Warranty documentation\n\n**Optional Upgrades:**\n- Control-16-24v upgrade (+$70) - doubles expansion capacity",
      "category": "kit",
      "dev_status": 5,
      "base_price": 99500,
      "stripe_product_id": "prod_stripe_founder_base",
      "has_variants": true,
      "requires_assembly": false,
      "images": [
        "cloudinary-url-hero.jpg",
        "cloudinary-url-detail.jpg",
        "cloudinary-url-packaging.jpg"
      ],
      "specs": [
        {
          "key": "dimensions",
          "value": "240 x 240 x 240",
          "unit": "mm",
          "display_order": 1
        },
        {
          "key": "total_leds",
          "value": "512",
          "unit": "LEDs",
          "display_order": 2
        },
        {
          "key": "layers",
          "value": "8 (expandable to 32)",
          "display_order": 3
        },
        {
          "key": "voltage",
          "value": "24",
          "unit": "v",
          "display_order": 4
        },
        {
          "key": "max_power",
          "value": "120",
          "unit": "W",
          "display_order": 5
        },
        {
          "key": "warranty",
          "value": "10 years",
          "display_order": 6
        },
        {
          "key": "certifications",
          "value": "ESA",
          "display_order": 7
        }
      ],
      "metadata": {
        "includes_warranty": true,
        "warranty_years": 10,
        "is_limited_edition": true,
        "includes_nft": true,
        "hand_assembled": true,
        "contents": {
          "Material-8x8-V": 8,
          "Connect-5x31.6-24v": 7,
          "Control-8-24v": 1,
          "Diffuse-12-C": 512
        }
      }
    }
  ],
  "variants": [
    {
      "id": "Unit-8x8x8-Founder-Black",
      "product_id": "Unit-8x8x8-Founder",
      "stripe_product_id": "prod_stripe_founder_black",
      "variant_type": "color",
      "variant_value": "BLACK",
      "is_limited_edition": true,
      "max_quantity": 500,
      "images": ["cloudinary-url-black-hero.jpg", "cloudinary-url-black-detail.jpg"]
    },
    {
      "id": "Unit-8x8x8-Founder-White",
      "product_id": "Unit-8x8x8-Founder",
      "stripe_product_id": "prod_stripe_founder_white",
      "variant_type": "color",
      "variant_value": "WHITE",
      "is_limited_edition": true,
      "max_quantity": 300,
      "images": ["cloudinary-url-white-hero.jpg", "cloudinary-url-white-detail.jpg"]
    },
    {
      "id": "Unit-8x8x8-Founder-Red",
      "product_id": "Unit-8x8x8-Founder",
      "stripe_product_id": "prod_stripe_founder_red",
      "variant_type": "color",
      "variant_value": "RED",
      "is_limited_edition": true,
      "max_quantity": 200,
      "images": ["cloudinary-url-red-hero.jpg", "cloudinary-url-red-detail.jpg"]
    }
  ]
}
```

---

## Product Dependencies

```json
// config/dependencies.json
{
  "dependencies": [
    {
      "product_id": "Connect-4x31.6-5v",
      "depends_on_product_id": "Material-8x8-V",
      "dependency_type": "requires",
      "message": "Spine connectors are designed for Material-8x8-V panels (31.6mm spacing)"
    },
    {
      "product_id": "Connect-4x31.6-5v",
      "depends_on_product_id": "Control-2-5v",
      "dependency_type": "voltage_match",
      "message": "5v spine connectors must be used with a 5v control unit"
    },
    {
      "product_id": "Connect-4x31.6-24v",
      "depends_on_product_id": "Control-8-24v",
      "dependency_type": "voltage_match",
      "message": "24v spine connectors must be used with a 24v control unit (Control-8-24v or Control-16-24v)"
    },
    {
      "product_id": "Material-8x8-V",
      "depends_on_product_id": "Diffuse-12-C",
      "dependency_type": "suggests",
      "message": "Recommended: 64 diffusion caps per panel for even light distribution",
      "metadata": {
        "quantity_ratio": 64,
        "alternative_products": ["Diffuse-12-S"]
      }
    },
    {
      "product_id": "Material-8x8-V",
      "depends_on_product_id": "Connect-4x31.6-5v",
      "dependency_type": "suggests",
      "message": "To stack panels vertically, you'll need spine connectors (one connector per gap between panels)",
      "metadata": {
        "quantity_ratio_note": "For N panels stacked, need N-1 connectors"
      }
    },
    {
      "product_id": "Connect-4x31.6-5v",
      "depends_on_product_id": "Connect-4x31.6-24v",
      "dependency_type": "incompatible",
      "message": "Cannot mix 5v and 24v components in the same fixture. Choose one voltage system."
    },
    {
      "product_id": "Control-2-5v",
      "depends_on_product_id": "Control-8-24v",
      "dependency_type": "incompatible",
      "message": "Cannot use multiple control units in the same fixture. Choose one control unit appropriate for your scale."
    }
  ]
}
```

**Dependency Types:**

- `requires` - Hard requirement (user should not proceed without this)
- `voltage_match` - Voltage compatibility requirement
- `suggests` - Soft recommendation (helpful but not required)
- `incompatible` - Cannot be used together (show error if both in cart)

---

## Portfolio Configuration

```json
// config/portfolio/installations.json
{
  "items": [
    {
      "slug": "venue-downtown-toronto",
      "title": "Downtown Toronto Venue Installation",
      "description": "Custom LED grid installation spanning 15 feet across main performance space",
      "content": "# Downtown Toronto Venue\n\nIn early 2024, we partnered with [Venue Name] to create an immersive lighting installation...\n\n## Project Scope\n- 120× Material-8x8-V panels\n- Custom mounting system\n- DMX integration\n- 3 months from concept to installation\n\n## Challenges\n- Working with existing venue infrastructure\n- Meeting fire safety requirements\n- Coordinating with other contractors\n\n## Results\nThe installation has been used for 50+ events...",
      "category": "installation",
      "location": "Toronto, ON",
      "year": 2024,
      "featured_image_url": "cloudinary-url-hero.jpg",
      "is_published": true,
      "is_featured": true,
      "display_order": 1,
      "images": [
        {
          "url": "cloudinary-url-1.jpg",
          "thumbnail_url": "cloudinary-url-1-thumb.jpg",
          "alt_text": "Main installation view from stage",
          "caption": "15-foot LED grid spanning main performance space"
        },
        {
          "url": "cloudinary-url-2.jpg",
          "thumbnail_url": "cloudinary-url-2-thumb.jpg",
          "alt_text": "Close-up detail of panel mounting",
          "caption": "Custom mounting brackets designed for easy service access"
        },
        {
          "url": "cloudinary-url-3.jpg",
          "thumbnail_url": "cloudinary-url-3-thumb.jpg",
          "alt_text": "Installation during live event",
          "caption": "Grid in action during electronic music performance"
        }
      ],
      "metadata": {
        "client": "Venue Name (anonymized)",
        "project_duration_months": 3,
        "products_used": ["Material-8x8-V", "Control-16-24v", "Connect-5x31.6-24v"],
        "panel_count": 120,
        "total_leds": 7680,
        "integration": "DMX512",
        "tags": ["commercial", "venue", "large-scale", "dmx"]
      }
    }
  ]
}
```

---

## App Configuration

### Default Config

```json
// config/default.json
{
  "app": {
    "name": "Imajin",
    "tagline": "Modular LED Fixtures",
    "contact_email": "hello@imajin.ai",
    "support_email": "support@imajin.ai"
  },
  "features": {
    "solana_checkout": false,
    "visual_configurator": false,
    "customer_accounts": false,
    "newsletter": false,
    "gift_cards": false,
    "bulk_ordering": false
  },
  "cart": {
    "max_items": 100,
    "max_quantity_per_item": 50,
    "session_timeout_minutes": 60
  },
  "checkout": {
    "require_account": false,
    "guest_checkout": true,
    "save_cart_on_checkout": true
  },
  "shipping": {
    "countries": ["CA", "US"],
    "free_shipping_threshold_cents": null,
    "estimated_delivery_days": "7-14"
  },
  "inventory": {
    "low_stock_threshold": 10,
    "show_stock_count": true,
    "reserve_on_checkout": false
  },
  "images": {
    "quality": 85,
    "formats": ["webp", "jpg"],
    "max_upload_size_mb": 10,
    "cloudinary_transformations": {
      "thumbnail": "c_thumb,w_400,h_400,q_85,f_auto",
      "card": "c_fill,w_800,h_600,q_85,f_auto",
      "hero": "c_fill,w_1920,h_1080,q_90,f_auto"
    }
  },
  "cache": {
    "products_ttl_seconds": 300,
    "portfolio_ttl_seconds": 600,
    "static_pages_ttl_seconds": 3600
  },
  "pagination": {
    "products_per_page": 20,
    "orders_per_page": 50,
    "portfolio_per_page": 12
  },
  "seo": {
    "site_name": "Imajin",
    "default_og_image": "cloudinary-url-og-image.jpg",
    "twitter_handle": "@imajin"
  }
}
```

---

### Environment Overrides

```json
// config/dev.json
{
  "features": {
    "visual_configurator": true,
    "customer_accounts": true
  },
  "inventory": {
    "reserve_on_checkout": true
  },
  "cache": {
    "products_ttl_seconds": 10,
    "portfolio_ttl_seconds": 10
  }
}
```

```json
// config/live.json
{
  "shipping": {
    "free_shipping_threshold_cents": 50000
  },
  "inventory": {
    "low_stock_threshold": 5
  }
}
```

---

## Sync Script

Script to sync JSON configs to database:

```typescript
// scripts/sync-config.ts
import { db } from "@/lib/db";
import { products, variants, productSpecs, productDependencies } from "@/db/schema";
import materialsConfig from "@/config/products/materials.json";
import connectorsConfig from "@/config/products/connectors.json";
// ... other imports

async function syncProducts() {
  console.log("Syncing products to database...");

  const allProducts = [
    ...materialsConfig.products,
    ...connectorsConfig.products,
    // ... other product files
  ];

  for (const product of allProducts) {
    // Upsert product
    await db
      .insert(products)
      .values({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        dev_status: product.dev_status,
        base_price: product.base_price,
        has_variants: product.has_variants,
        // ... other fields
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          name: product.name,
          description: product.description,
          // ... update fields
        },
      });

    // Insert specs
    for (const spec of product.specs) {
      await db
        .insert(productSpecs)
        .values({
          product_id: product.id,
          spec_key: spec.key,
          spec_value: spec.value,
          spec_unit: spec.unit,
          display_order: spec.display_order,
        })
        .onConflictDoUpdate({
          target: [productSpecs.product_id, productSpecs.spec_key],
          set: { spec_value: spec.value },
        });
    }
  }

  console.log(`Synced ${allProducts.length} products`);
}

async function syncVariants() {
  // Similar logic for variants
}

async function syncDependencies() {
  // Similar logic for dependencies
}

async function main() {
  await syncProducts();
  await syncVariants();
  await syncDependencies();
  console.log("Sync complete!");
}

main();
```

**Usage:**

```bash
npm run sync:config
```

---

## Validation

TypeScript types ensure config files are valid:

```typescript
// lib/config/validate.ts
import { z } from "zod";

const ProductConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(["material", "connector", "control", "diffuser", "kit", "interface"]),
  dev_status: z.number().min(0).max(5),
  base_price: z.number().positive(),
  stripe_product_id: z.string(),
  has_variants: z.boolean(),
  images: z.array(z.string().url()),
  specs: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
      unit: z.string().optional(),
      display_order: z.number(),
    })
  ),
  metadata: z.record(z.any()).optional(),
});

export function validateProductConfig(config: unknown) {
  return ProductConfigSchema.parse(config);
}
```

---

## Editing Workflow

1. **Edit JSON file** in `/config` directory
2. **Validate** (TypeScript types + Zod schema)
3. **Commit to git** (version control)
4. **Run sync script** `npm run sync:config`
5. **Deploy** (git push triggers CI/CD)

---

## Future Enhancements

### CMS Integration (Optional)

- Use JSON files as "database of record"
- Add GUI editor that writes to JSON files
- Commit changes via git from CMS

### Content Localization

```
/config/products/
  ├── en/
  │   ├── materials.json
  │   └── kits.json
  └── fr/
      ├── materials.json
      └── kits.json
```

---

**Document Created:** 2025-10-22
**Last Updated:** 2025-10-22
**Status:** Complete - Ready for implementation
