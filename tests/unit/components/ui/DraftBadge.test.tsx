/**
 * DraftBadge Component Tests
 * Phase 3.1 - Policy Page Infrastructure
 *
 * Tests for warning badge displayed on draft policy pages
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DraftBadge } from '@/components/ui/DraftBadge';

describe('DraftBadge Component', () => {
  it('should render default draft message', () => {
    render(<DraftBadge />);

    expect(screen.getByText(/draft/i)).toBeInTheDocument();
    expect(screen.getByText(/pending legal review/i)).toBeInTheDocument();
  });

  it('should render custom message when provided', () => {
    render(<DraftBadge message="Under Review - Do Not Publish" />);

    expect(screen.getByText(/under review/i)).toBeInTheDocument();
    expect(screen.getByText(/do not publish/i)).toBeInTheDocument();
  });

  it('should have warning styling and alert role', () => {
    const { container } = render(<DraftBadge />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();

    // Should have warning-related classes
    expect(alert).toHaveClass(/yellow|warning/);
  });
});
