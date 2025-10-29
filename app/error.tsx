'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';
import { logger } from '@/lib/utils/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Root error boundary triggered', error, { digest: error.digest });
  }, [error]);

  return (
    <ErrorDisplay
      title="Something went wrong"
      message={error.message || 'An unexpected error occurred'}
      details={error.stack}
      onRetry={reset}
    />
  );
}
