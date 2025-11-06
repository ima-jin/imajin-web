/**
 * Policy Content Schema Tests
 * Phase 3.1 - Policy Page Infrastructure
 *
 * Tests for Zod validation schema for policy page JSON content
 */

import { describe, it, expect } from 'vitest';
import { validatePolicyContent } from '@/config/schema/policy-content-schema';

describe('Policy Content Schema', () => {
  it('should accept valid policy content', () => {
    const valid = {
      heading: 'Privacy Policy',
      body: 'Policy content here',
      updated: '2025-11-01',
    };

    const result = validatePolicyContent(valid);

    expect(result.success).toBe(true);
  });

  it('should reject policy content missing heading', () => {
    const invalid = {
      body: 'Content',
      updated: '2025-11-01',
    };

    const result = validatePolicyContent(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error?.issues[0].path).toContain('heading');
    }
  });

  it('should reject invalid date format', () => {
    const invalid = {
      heading: 'Policy',
      body: 'Content',
      updated: 'not-a-date',
    };

    const result = validatePolicyContent(invalid);

    expect(result.success).toBe(false);
  });

  it('should accept policy with optional sections field', () => {
    const valid = {
      heading: 'FAQ',
      body: 'Main content',
      updated: '2025-11-01',
      sections: [{ question: 'Q1?', answer: 'A1' }],
    };

    const result = validatePolicyContent(valid);

    expect(result.success).toBe(true);
  });

  it('should accept policy with optional isDraft field', () => {
    const valid = {
      heading: 'Terms of Service',
      body: 'Terms content',
      updated: '2025-11-01',
      isDraft: true,
    };

    const result = validatePolicyContent(valid);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDraft).toBe(true);
    }
  });
});
