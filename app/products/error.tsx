'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Products page error:', error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Failed to load products"
      message="We couldn't load the product catalog. Please try again."
      details={error.stack}
      onRetry={reset}
      showHomeLink
    />
  );
}
