/**
 * Contact Page
 *
 * Contact information and consultation details
 */

import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface ContactMethod {
  id: string;
  heading: string;
  method: string;
  value: string;
  display: string;
  description: string;
}

interface ContactContent {
  hero: {
    heading: string;
    subheading: string;
  };
  contact_methods: ContactMethod[];
  response_time: string;
  additional_info: {
    heading: string;
    content: string;
  };
}

async function getContactContent(): Promise<ContactContent> {
  const contentPath = join(process.cwd(), 'config/content/pages/contact.json');
  const content = await readFile(contentPath, 'utf-8');
  return JSON.parse(content);
}

export default async function ContactPage() {
  const content = await getContactContent();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gray-50 border-b border-gray-200">
        <Container className="py-16 md:py-24 text-center">
          <Heading level={1} className="text-4xl md:text-5xl lg:text-6xl mb-6">
            {content.hero.heading}
          </Heading>
          <Text size="lg" color="secondary" className="max-w-3xl mx-auto">
            {content.hero.subheading}
          </Text>
        </Container>
      </div>

      {/* Contact Methods */}
      <Container className="py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {content.contact_methods.map((method) => (
              <div key={method.id} className="bg-gray-50 rounded-lg p-6 text-center">
                <Heading level={3} className="text-xl mb-3">
                  {method.heading}
                </Heading>
                <a
                  href={`mailto:${method.value}`}
                  className="text-lg text-blue-600 hover:text-blue-800 font-medium block mb-2"
                >
                  {method.display}
                </a>
                <Text size="sm" color="secondary">
                  {method.description}
                </Text>
              </div>
            ))}
          </div>

          {/* Response Time */}
          <div className="text-center mb-16">
            <Text color="secondary">{content.response_time}</Text>
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Heading level={2} className="text-2xl md:text-3xl mb-4">
              {content.additional_info.heading}
            </Heading>
            <Text size="lg" color="secondary" className="max-w-2xl mx-auto">
              {content.additional_info.content}
            </Text>
          </div>
        </div>
      </Container>
    </main>
  );
}
