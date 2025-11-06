/**
 * Privacy Policy Page Tests
 * Phase 3.2 - Policy Content Pages
 *
 * Tests for Privacy page rendering and metadata
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivacyPage from '@/app/privacy/page';

describe('Privacy Policy Page', () => {
  it('should render Privacy heading', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { level: 1, name: /privacy/i })).toBeInTheDocument();
  });

  it('should render data collection sections', () => {
    const { container } = render(<PrivacyPage />);

    // Should mention data or privacy-related terms
    const text = container.textContent?.toLowerCase() || '';
    const hasPrivacyContent = text.includes('data') || text.includes('information') || text.includes('privacy');
    expect(hasPrivacyContent).toBe(true);
  });

  it('should render contact information', () => {
    const { container } = render(<PrivacyPage />);

    // Should have contact info (email or company name)
    const hasContact = container.textContent?.includes('info@imajin.ca') || container.textContent?.includes('Imajin');
    expect(hasContact).toBe(true);
  });

  it('should have proper page structure', () => {
    const { container } = render(<PrivacyPage />);

    // Should have semantic structure
    expect(container.querySelector('article')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
