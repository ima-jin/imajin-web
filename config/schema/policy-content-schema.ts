/**
 * Policy Content Schema
 *
 * Zod validation schema for policy page JSON content files
 */

import { z } from 'zod';

export const PolicySectionSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const PolicyContentSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)'),
  isDraft: z.boolean().optional(),
  sections: z.array(PolicySectionSchema).optional(),
});

export type PolicyContent = z.infer<typeof PolicyContentSchema>;
export type PolicySection = z.infer<typeof PolicySectionSchema>;

export function validatePolicyContent(data: unknown) {
  return PolicyContentSchema.safeParse(data);
}
