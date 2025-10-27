import { z } from 'zod';

/**
 * Navigation Schema
 * Defines header navigation, footer structure, and breadcrumb labels
 */
export const NavigationSchema = z.object({
  version: z.string(),
  updated: z.string(),
  header: z.object({
    logo_alt: z.string(),
    nav_items: z.array(z.object({
      id: z.string(),
      label: z.string(),
      href: z.string(),
      aria_label: z.string(),
    })),
  }),
  footer: z.object({
    sections: z.array(z.object({
      id: z.string(),
      heading: z.string(),
      links: z.array(z.object({
        label: z.string(),
        href: z.string(),
        aria_label: z.string(),
        external: z.boolean().optional(),
      })),
    })),
    copyright: z.string(),
    legal_links: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })),
  }),
  breadcrumbs: z.record(z.string(), z.string()),
});

// Export type inferred from schema
export type Navigation = z.infer<typeof NavigationSchema>;
