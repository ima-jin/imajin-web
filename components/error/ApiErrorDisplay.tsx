import { ApiClientError } from '@/lib/utils/api-client';
import { ERROR_CODES } from '@/lib/config/api';
import { ErrorDisplay } from './ErrorDisplay';

interface ApiErrorDisplayProps {
  error: ApiClientError | Error;
  onRetry?: () => void;
}

export function ApiErrorDisplay({ error, onRetry }: ApiErrorDisplayProps) {
  // Handle ApiClientError
  if (error instanceof ApiClientError) {
    const title = getErrorTitle(error.errorCode);
    const message = error.message;
    const details = JSON.stringify(error.details, null, 2);

    return (
      <ErrorDisplay
        title={title}
        message={message}
        details={details}
        onRetry={onRetry}
      />
    );
  }

  // Handle generic Error
  return (
    <ErrorDisplay
      title="An error occurred"
      message={error.message}
      details={error.stack}
      onRetry={onRetry}
    />
  );
}

function getErrorTitle(errorCode?: string): string {
  switch (errorCode) {
    case ERROR_CODES.NOT_FOUND:
      return 'Not Found';
    case ERROR_CODES.VALIDATION_ERROR:
      return 'Invalid Request';
    case ERROR_CODES.DATABASE_ERROR:
      return 'Database Error';
    case ERROR_CODES.PRODUCTS_FETCH_ERROR:
      return 'Failed to Load Products';
    case ERROR_CODES.CART_VALIDATION_ERROR:
      return 'Cart Validation Failed';
    default:
      return 'Something Went Wrong';
  }
}
