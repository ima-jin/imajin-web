import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const metadata = {
  title: 'Authentication Error - Imajin',
  description: 'An error occurred during authentication',
};

const errorMessages: Record<string, { title: string; description: string }> = {
  FlowExpired: {
    title: 'Session Expired',
    description: 'Your authentication session has expired. Please try again.',
  },
  InvalidFlow: {
    title: 'Invalid Request',
    description: 'The authentication request is invalid. Please start over.',
  },
  Unauthorized: {
    title: 'Unauthorized',
    description: 'You do not have permission to access this resource.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred. Please try again.',
  },
};

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorType = searchParams.error || 'Default';
  const errorInfo = errorMessages[errorType] || errorMessages.Default;

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto text-center">
        <Heading level={1} className="mb-6 text-red-600">
          {errorInfo.title}
        </Heading>

        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded mb-6 text-left">
          <p>{errorInfo.description}</p>
        </div>

        <div className="space-y-3">
          <Link href="/auth/signin">
            <Button className="w-full">Sign In</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" className="w-full">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
