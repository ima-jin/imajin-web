/**
 * 404 Not Found Page Tests
 * Phase 2.4.7 - Phase 5
 *
 * Tests for 404 error page (app/not-found.tsx)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';

describe('NotFound (404 Page)', () => {
  it('should render 404 page', () => {
    render(<NotFound />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should display "Page Not Found" heading', () => {
    render(<NotFound />);

    const heading = screen.getByRole('heading', { name: /not found|404/i });
    expect(heading).toBeInTheDocument();
  });

  it('should have "Back to Home" link', () => {
    render(<NotFound />);

    const link = screen.getByRole('link', { name: /home|back/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('should suggest browsing products', () => {
    render(<NotFound />);

    const productsLink = screen.getByRole('link', { name: /products|browse|shop/i });
    expect(productsLink).toHaveAttribute('href', '/products');
  });
});
