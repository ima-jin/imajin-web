'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';
import { logger } from '@/lib/utils/logger';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Products page error boundary triggered', error, { digest: error.digest });
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
