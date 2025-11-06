/**
 * FAQ Page
 *
 * Frequently Asked Questions page using PolicyPage component
 */

import { PolicyPage } from '@/components/policies/PolicyPage';
import { validatePolicyContent } from '@/config/schema/policy-content-schema';
import { logger } from '@/lib/utils/logger';
import faqContent from '@/config/content/pages/faq.json';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | Imajin',
  description: 'Find answers to common questions about Imajin LED fixtures, ordering, shipping, warranties, and technical specifications.',
};

export default function FAQPage() {
  // Validate content at build time
  const validation = validatePolicyContent(faqContent);

  if (!validation.success) {
    logger.error('FAQ content validation failed', validation.error);
    return <PolicyPage content={null} />;
  }

  return <PolicyPage content={validation.data} />;
}
