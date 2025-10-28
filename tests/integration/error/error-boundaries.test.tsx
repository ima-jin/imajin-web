import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ApiErrorBoundary } from '@/components/error/ApiErrorBoundary';
import { ApiClientError } from '@/lib/utils/api-client';
import { ERROR_CODES } from '@/lib/config/api';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No Error</div>;
}

// Component that throws an ApiClientError
function ThrowApiError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new ApiClientError(
      'API request failed',
      500,
      ERROR_CODES.PRODUCTS_FETCH_ERROR
    );
  }
  return <div>No Error</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No Error')).toBeInTheDocument();
  });

  it('should catch and display error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should show retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it('should render custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});

describe('ApiErrorBoundary', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error', () => {
    render(
      <ApiErrorBoundary>
        <ThrowApiError shouldThrow={false} />
      </ApiErrorBoundary>
    );

    expect(screen.getByText('No Error')).toBeInTheDocument();
  });

  it('should catch and display API error', () => {
    render(
      <ApiErrorBoundary>
        <ThrowApiError shouldThrow={true} />
      </ApiErrorBoundary>
    );

    expect(screen.getByText('Failed to Load Products')).toBeInTheDocument();
    expect(screen.getByText('API request failed')).toBeInTheDocument();
  });

  it('should show retry button for API errors', () => {
    render(
      <ApiErrorBoundary>
        <ThrowApiError shouldThrow={true} />
      </ApiErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should handle generic errors', () => {
    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ApiErrorBoundary>
    );

    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
