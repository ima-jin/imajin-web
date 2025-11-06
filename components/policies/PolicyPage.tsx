/**
 * PolicyPage Component
 *
 * Reusable component for rendering policy pages with markdown content
 * Includes ErrorBoundary, DraftBadge, and markdown sanitization
 */

import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { formatDate } from '@/lib/utils/date-format';
import type { PolicyContent } from '@/config/schema/policy-content-schema';

interface PolicyPageProps {
  content: PolicyContent | null;
}

function PolicyPageContent({ content }: PolicyPageProps) {
  if (!content) {
    return (
      <Container>
        <div className="py-12 text-center">
          <Text>Content not available</Text>
        </div>
      </Container>
    );
  }

  const formattedDate = formatDate(content.updated);

  return (
    <Container>
      <article className="prose prose-lg max-w-4xl mx-auto py-12">
        {content.isDraft && <DraftBadge />}
        <Heading level={1}>{content.heading}</Heading>
        <Text size="sm" color="muted" className="mb-8">
          Last updated: {formattedDate}
        </Text>
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content.body}</ReactMarkdown>
      </article>
    </Container>
  );
}

export function PolicyPage(props: PolicyPageProps) {
  return (
    <ErrorBoundary
      fallback={
        <Container>
          <div className="py-12 text-center">
            <Text>Unable to load policy page</Text>
          </div>
        </Container>
      }
    >
      <PolicyPageContent {...props} />
    </ErrorBoundary>
  );
}
