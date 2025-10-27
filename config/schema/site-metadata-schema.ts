import { z } from 'zod';

/**
 * Site Metadata Schema
 * Defines site-wide metadata, SEO tags, and page-specific metadata
 */
/**
 * Page Metadata Schema
 * Defines metadata for a single page (can have either title or title_template, etc.)
 */
const PageMetadataSchema = z.object({
  title: z.string().optional(),
  title_template: z.string().optional(),
  description: z.string().optional(),
  description_template: z.string().optional(),
}).passthrough();

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
  pages: z.record(z.string(), PageMetadataSchema),
});

// Export type inferred from schema
export type SiteMetadata = z.infer<typeof SiteMetadataSchema>;
