import { Container } from '@/components/ui/Container';
import { LoadingSpinner } from './LoadingSpinner';
import { Text } from '@/components/ui/Text';

interface PageLoadingStateProps {
  message?: string;
}

export function PageLoadingState({
  message = 'Loading...',
}: PageLoadingStateProps) {
  return (
    <Container className="py-16 text-center">
      <div className="space-y-4">
        <LoadingSpinner size="lg" className="mx-auto text-gray-400" />
        <Text className="text-gray-600">{message}</Text>
      </div>
    </Container>
  );
}
