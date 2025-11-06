/**
 * Terms of Service Page
 *
 * Terms and conditions page using PolicyPage component
 */

import { PolicyPage } from '@/components/policies/PolicyPage';
import { validatePolicyContent } from '@/config/schema/policy-content-schema';
import { logger } from '@/lib/utils/logger';
import termsContent from '@/config/content/pages/terms.json';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Imajin',
  description: 'Terms and conditions for using Imajin services and purchasing our LED fixture products.',
};

export default function TermsPage() {
  // Validate content at build time
  const validation = validatePolicyContent(termsContent);

  if (!validation.success) {
    logger.error('Terms content validation failed', validation.error);
    return <PolicyPage content={null} />;
  }

  return <PolicyPage content={validation.data} />;
}
