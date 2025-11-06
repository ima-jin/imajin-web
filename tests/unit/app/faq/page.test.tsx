/**
 * FAQ Page Tests
 * Phase 3.2 - Policy Content Pages
 *
 * Tests for FAQ page rendering and metadata
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FAQPage from '@/app/faq/page';

describe('FAQ Page', () => {
  it('should render FAQ heading', () => {
    render(<FAQPage />);

    expect(screen.getByRole('heading', { level: 1, name: /frequently asked questions/i })).toBeInTheDocument();
  });

  it('should render FAQ content sections', () => {
    const { container } = render(<FAQPage />);

    // Should have article content
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('should render multiple Q&A items if present', () => {
    const { container } = render(<FAQPage />);

    // Check that content is rendered (will contain questions/answers)
    expect(container.textContent?.length).toBeGreaterThan(100);
  });

  it('should have proper page structure', () => {
    const { container } = render(<FAQPage />);

    // Should have semantic structure
    expect(container.querySelector('article')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
