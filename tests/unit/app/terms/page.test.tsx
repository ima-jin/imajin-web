/**
 * Terms of Service Page Tests
 * Phase 3.2 - Policy Content Pages
 *
 * Tests for Terms page rendering and metadata
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TermsPage from '@/app/terms/page';

describe('Terms of Service Page', () => {
  it('should render Terms heading', () => {
    render(<TermsPage />);

    expect(screen.getByRole('heading', { level: 1, name: /terms/i })).toBeInTheDocument();
  });

  it('should render company information', () => {
    const { container } = render(<TermsPage />);

    // Should mention company name
    expect(container.textContent).toContain('Imajin');
  });

  it('should render last updated date', () => {
    render(<TermsPage />);

    // Use getAllByText since "last updated" appears in both UI and body content
    const elements = screen.getAllByText(/last updated/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('should have proper page structure', () => {
    const { container } = render(<TermsPage />);

    // Should have semantic structure
    expect(container.querySelector('article')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
