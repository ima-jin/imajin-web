import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render spinner with default size', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('should render small spinner', () => {
    render(<LoadingSpinner size="sm" />);

    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('should render medium spinner', () => {
    render(<LoadingSpinner size="md" />);

    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('should render large spinner', () => {
    render(<LoadingSpinner size="lg" />);

    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="text-blue-500" />);

    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('text-blue-500');
  });

  it('should have animate-spin class', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('animate-spin');
  });
});
