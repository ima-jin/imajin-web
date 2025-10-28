import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

interface NotFoundDisplayProps {
  resource?: string;
  message?: string;
}

export function NotFoundDisplay({
  resource = 'Page',
  message,
}: NotFoundDisplayProps) {
  return (
    <Container className="py-16 text-center">
      <div className="max-w-md mx-auto space-y-6">
        {/* 404 Icon */}
        <div className="text-gray-400">
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <Heading level={1}>{resource} Not Found</Heading>

        {/* Message */}
        <Text className="text-gray-600">
          {message ||
            `The ${resource.toLowerCase()} you're looking for doesn't exist or has been removed.`}
        </Text>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="primary">
              Go Home
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
