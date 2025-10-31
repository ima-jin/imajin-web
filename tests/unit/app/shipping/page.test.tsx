/**
 * Shipping Policy Page Tests
 * Phase 2.4.7 - Phase 8
 *
 * Tests for shipping policy page (app/shipping/page.tsx)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShippingPage from '@/app/shipping/page';

describe('ShippingPage', () => {
  it('should render shipping policy page', async () => {
    render(await ShippingPage());

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should contain shipping information', async () => {
    render(await ShippingPage());

    // Should have heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toMatch(/shipping/i);

    // Should have some shipping details
    const content = screen.getByRole('main');
    expect(content.textContent).toBeTruthy();
    expect(content.textContent!.length).toBeGreaterThan(50);
  });
});
