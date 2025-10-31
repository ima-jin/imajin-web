/**
 * Warranty Policy Page Tests
 * Phase 2.4.7 - Phase 8
 *
 * Tests for warranty policy page (app/warranty/page.tsx)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WarrantyPage from '@/app/warranty/page';

describe('WarrantyPage', () => {
  it('should render warranty page', async () => {
    render(await WarrantyPage());

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should contain 10-year warranty info for Founder Edition', async () => {
    render(await WarrantyPage());

    // Should have heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toMatch(/warranty/i);

    // Should mention 10-year warranty for Founder Edition
    const content = screen.getByRole('main');
    const text = content.textContent || '';

    expect(text).toMatch(/10.*year/i);
    expect(text).toMatch(/founder.*edition/i);
  });
});
