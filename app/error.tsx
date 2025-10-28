'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root error:', error);
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
