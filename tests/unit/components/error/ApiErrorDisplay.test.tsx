import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ApiErrorDisplay } from '@/components/error/ApiErrorDisplay';
import { ApiClientError } from '@/lib/utils/api-client';
import { ERROR_CODES } from '@/lib/config/api';

describe('ApiErrorDisplay', () => {
  it('should render ApiClientError with correct title', () => {
    const error = new ApiClientError(
      'Product not found',
      404,
      ERROR_CODES.NOT_FOUND
    );

    render(<ApiErrorDisplay error={error} />);

    expect(screen.getByText('Not Found')).toBeInTheDocument();
    expect(screen.getByText('Product not found')).toBeInTheDocument();
  });

  it('should render validation error', () => {
    const error = new ApiClientError(
      'Invalid input',
      400,
      ERROR_CODES.VALIDATION_ERROR
    );

    render(<ApiErrorDisplay error={error} />);

    expect(screen.getByText('Invalid Request')).toBeInTheDocument();
    expect(screen.getByText('Invalid input')).toBeInTheDocument();
  });

  it('should render database error', () => {
    const error = new ApiClientError(
      'Database connection failed',
      500,
      ERROR_CODES.DATABASE_ERROR
    );

    render(<ApiErrorDisplay error={error} />);

    expect(screen.getByText('Database Error')).toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('should render products fetch error', () => {
    const error = new ApiClientError(
      'Failed to fetch products',
      500,
      ERROR_CODES.PRODUCTS_FETCH_ERROR
    );

    render(<ApiErrorDisplay error={error} />);

    expect(screen.getByText('Failed to Load Products')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch products')).toBeInTheDocument();
  });

  it('should render cart validation error', () => {
    const error = new ApiClientError(
      'Invalid cart item',
      400,
      ERROR_CODES.CART_VALIDATION_ERROR
    );

    render(<ApiErrorDisplay error={error} />);

    expect(screen.getByText('Cart Validation Failed')).toBeInTheDocument();
    expect(screen.getByText('Invalid cart item')).toBeInTheDocument();
  });

  it('should handle generic Error', () => {
    const error = new Error('Something went wrong');

    render(<ApiErrorDisplay error={error} />);

    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should call onRetry when provided', async () => {
    const onRetry = vi.fn();
    const error = new Error('Test error');

    render(<ApiErrorDisplay error={error} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });
});
