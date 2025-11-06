/**
 * Privacy Policy Page
 *
 * Privacy policy page using PolicyPage component
 */

import { PolicyPage } from '@/components/policies/PolicyPage';
import { validatePolicyContent } from '@/config/schema/policy-content-schema';
import { logger } from '@/lib/utils/logger';
import privacyContent from '@/config/content/pages/privacy.json';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Imajin',
  description: 'Learn how Imajin collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  // Validate content at build time
  const validation = validatePolicyContent(privacyContent);

  if (!validation.success) {
    logger.error('Privacy content validation failed', validation.error);
    return <PolicyPage content={null} />;
  }

  return <PolicyPage content={validation.data} />;
}
