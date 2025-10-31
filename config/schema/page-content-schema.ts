import { z } from 'zod';

/**
 * CTA (Call to Action) Schema
 * Defines a button or link with label and href
 */
const CTASchema = z.object({
  label: z.string(),
  href: z.string(),
  aria_label: z.string(),
});

/**
 * Value Proposition Schema
 * Used for homepage feature cards
 */
const ValuePropSchema = z.object({
  id: z.string(),
  heading: z.string(),
  description: z.string(),
  icon: z.string(),
});

/**
 * Color Option Schema
 * Used for Founder Edition color variants
 */
const ColorOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  quantity: z.number().int().nonnegative(),
  quantity_label: z.string(),
});

/**
 * Homepage Content Schema
 * All content for the homepage including hero, sections, and CTAs
 */
export const HomePageContentSchema = z.object({
  version: z.string(),
  updated: z.string(),
  hero: z.object({
    heading: z.string(),
    subheading: z.string(),
    cta_primary: CTASchema,
    cta_secondary: CTASchema,
  }),
  value_props: z.array(ValuePropSchema),
  founder_section: z.object({
    heading: z.string(),
    description: z.string(),
    colors: z.array(ColorOptionSchema).optional(), // Optional - quantities now fetched from database
    cta: CTASchema,
  }),
  expansion_section: z.object({
    heading: z.string(),
    description: z.string(),
    cta: CTASchema,
  }),
  accessories_section: z.object({
    heading: z.string(),
    description: z.string(),
    cta: CTASchema,
  }),
  diy_section: z.object({
    heading: z.string(),
    description: z.string(),
    cta: CTASchema,
  }),
  about_section: z.object({
    heading: z.string(),
    description: z.string(),
    cta: CTASchema,
  }),
  browse_all_section: z.object({
    heading: z.string(),
    cta: CTASchema,
  }),
});

/**
 * Filter Option Schema
 * Defines a single filter option with value, label, and description
 */
const FilterOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string(),
});

/**
 * Filter Section Schema
 * Defines a filter category with multiple options
 */
const FilterSectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  options: z.array(FilterOptionSchema),
});

/**
 * Product Section Schema
 * Defines product category sections for listing page
 */
const ProductSectionSchema = z.object({
  id: z.string(),
  heading: z.string(),
  description: z.string(),
});

/**
 * Products Listing Page Content Schema
 * All content for the products listing page including filters and sections
 */
export const ProductsListingContentSchema = z.object({
  version: z.string(),
  updated: z.string(),
  page: z.object({
    heading: z.string(),
    subheading: z.string(),
  }),
  filters: z.object({
    heading: z.string(),
    sections: z.array(FilterSectionSchema),
    clear_filters_label: z.string(),
    active_filters_label: z.string(),
  }),
  loading_states: z.object({
    loading_products: z.string(),
    no_products: z.string(),
    try_again: z.string(),
  }),
  product_sections: z.array(ProductSectionSchema),
});

/**
 * Product Detail Page Content Schema
 * All content for the product detail page including sections and labels
 */
export const ProductDetailContentSchema = z.object({
  version: z.string(),
  updated: z.string(),
  sections: z.object({
    description: z.object({
      heading: z.string(),
    }),
    specifications: z.object({
      heading: z.string(),
    }),
    whats_included: z.object({
      heading: z.string(),
    }),
    warranty: z.object({
      heading: z.string(),
    }),
  }),
  variant_selector: z.object({
    color_label: z.string(),
    quantity_label: z.string(),
    out_of_stock_label: z.string(),
    out_of_stock_suffix: z.string(),
  }),
  badges: z.object({
    limited_edition: z.string(),
    sold_out: z.string(),
    requires_assembly: z.string(),
    multiple_colors: z.string(),
    low_stock_template: z.string(),
    in_stock: z.string(),
  }),
  assembly: z.object({
    notice: z.string(),
  }),
  cta: z.object({
    add_to_cart: z.string(),
    adding: z.string(),
    added: z.string(),
    sold_out: z.string(),
    notify_me: z.string(),
  }),
  shipping: z.object({
    estimate: z.string(),
    free_shipping_notice: z.string(),
  }),
});

// Export types inferred from schemas
export type HomePageContent = z.infer<typeof HomePageContentSchema>;
export type ProductsListingContent = z.infer<typeof ProductsListingContentSchema>;
export type ProductDetailContent = z.infer<typeof ProductDetailContentSchema>;
export type CTA = z.infer<typeof CTASchema>;
export type ValueProp = z.infer<typeof ValuePropSchema>;
export type FilterSection = z.infer<typeof FilterSectionSchema>;
export type FilterOption = z.infer<typeof FilterOptionSchema>;
