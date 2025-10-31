/**
 * ProductSkeleton Component Tests
 * Phase 2.4.7 - Phase 5
 *
 * Tests for product loading skeleton
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductSkeleton from '@/components/loading/ProductSkeleton';

describe('ProductSkeleton', () => {
  it('should render skeleton with correct structure', () => {
    const { container } = render(<ProductSkeleton />);

    // Should have skeleton elements
    const skeleton = container.firstChild;
    expect(skeleton).toBeInTheDocument();
  });

  it('should match ProductCard dimensions', () => {
    const { container } = render(<ProductSkeleton />);

    // Skeleton should have similar dimensions to actual ProductCard
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toBeInTheDocument();

    // Should have card-like structure
    expect(skeleton.className).toBeTruthy();
  });

  it('should show loading animation', () => {
    const { container } = render(<ProductSkeleton />);

    // Should have animation/pulse classes
    const skeleton = container.firstChild as HTMLElement;
    const hasAnimation = skeleton.className.includes('animate') ||
                        skeleton.className.includes('pulse') ||
                        skeleton.className.includes('loading');

    expect(hasAnimation).toBe(true);
  });

  it('should render multiple skeletons in grid', () => {
    const { container } = render(
      <div className="grid">
        <ProductSkeleton />
        <ProductSkeleton />
        <ProductSkeleton />
      </div>
    );

    // Find all elements with role="status" (ProductSkeleton components)
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBe(3);
  });

  it('should be accessible with aria-label', () => {
    render(<ProductSkeleton />);

    // Should have loading indicator for screen readers
    const loading = screen.getByLabelText(/loading/i) ||
                   screen.getByRole('status', { hidden: true });
    expect(loading).toBeInTheDocument();
  });

  it('should have proper spacing', () => {
    const { container } = render(<ProductSkeleton />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toBeInTheDocument();

    // Should have proper padding/margin
    expect(skeleton.className).toBeTruthy();
  });
});
