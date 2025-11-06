/**
 * Returns Policy Page Tests
 * Phase 3.2 - Policy Content Pages
 *
 * Tests for Returns page rendering and metadata
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReturnsPage from '@/app/returns/page';

describe('Returns Policy Page', () => {
  it('should render Returns heading', () => {
    render(<ReturnsPage />);

    expect(screen.getByRole('heading', { level: 1, name: /return/i })).toBeInTheDocument();
  });

  it('should render return policy details', () => {
    const { container } = render(<ReturnsPage />);

    // Should mention returns or refunds
    const text = container.textContent?.toLowerCase() || '';
    const hasReturnContent = text.includes('return') || text.includes('refund');
    expect(hasReturnContent).toBe(true);
  });

  it('should render contact information', () => {
    const { container } = render(<ReturnsPage />);

    // Should have contact info
    const hasContact = container.textContent?.includes('info@imajin.ca') || container.textContent?.includes('contact');
    expect(hasContact).toBe(true);
  });

  it('should have proper page structure', () => {
    const { container } = render(<ReturnsPage />);

    // Should have semantic structure
    expect(container.querySelector('article')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
