import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

interface ErrorDisplayProps {
  title: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
}

export function ErrorDisplay({
  title,
  message,
  details,
  onRetry,
  showHomeLink = true,
}: ErrorDisplayProps) {
  return (
    <Container className="py-16 text-center">
      <div className="max-w-md mx-auto space-y-6">
        {/* Error Icon */}
        <div className="text-red-500">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <Heading level={1}>{title}</Heading>

        {/* Message */}
        <Text className="text-gray-600">{message}</Text>

        {/* Details (development only) */}
        {details && process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error Details
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
              {details}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="primary">
              Try Again
            </Button>
          )}
          {showHomeLink && (
            <Link href="/">
              <Button variant="secondary">
                Go Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Container>
  );
}
