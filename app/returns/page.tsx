/**
 * Returns Policy Page
 *
 * Returns and refunds policy page using PolicyPage component
 */

import { PolicyPage } from '@/components/policies/PolicyPage';
import { validatePolicyContent } from '@/config/schema/policy-content-schema';
import { logger } from '@/lib/utils/logger';
import returnsContent from '@/config/content/pages/returns.json';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Refunds Policy | Imajin',
  description: 'Learn about our 30-day return policy, refund process, and how to return Imajin LED fixture products.',
};

export default function ReturnsPage() {
  // Validate content at build time
  const validation = validatePolicyContent(returnsContent);

  if (!validation.success) {
    logger.error('Returns content validation failed', validation.error);
    return <PolicyPage content={null} />;
  }

  return <PolicyPage content={validation.data} />;
}
