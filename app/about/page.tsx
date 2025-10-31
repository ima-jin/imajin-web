/**
 * About Page
 *
 * Company information, mission, and approach
 */

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface AboutContent {
  hero: {
    heading: string;
    subheading: string;
  };
  sections: Array<{
    id: string;
    heading: string;
    content: string;
  }>;
  cta: {
    heading: string;
    subheading: string;
    buttons: Array<{
      label: string;
      href: string;
      variant: 'primary' | 'secondary';
    }>;
  };
}

async function getAboutContent(): Promise<AboutContent> {
  const contentPath = join(process.cwd(), 'config/content/pages/about.json');
  const content = await readFile(contentPath, 'utf-8');
  return JSON.parse(content);
}

export default async function AboutPage() {
  const content = await getAboutContent();

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

      {/* Content Sections */}
      <Container className="py-16">
        <div className="max-w-4xl mx-auto space-y-16">
          {content.sections.map((section) => (
            <section key={section.id} className="space-y-4">
              <Heading level={2} className="text-3xl md:text-4xl">
                {section.heading}
              </Heading>
              <div className="prose-editorial-lg text-gray-700">
                {section.content.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>

      {/* CTA Section */}
      <div className="bg-gray-50 border-t border-gray-200">
        <Container className="py-16 text-center">
          <Heading level={2} className="text-3xl md:text-4xl mb-4">
            {content.cta.heading}
          </Heading>
          <Text size="lg" color="secondary" className="mb-8 max-w-2xl mx-auto">
            {content.cta.subheading}
          </Text>
          <div className="flex flex-wrap gap-4 justify-center">
            {content.cta.buttons.map((button) => (
              <Link key={button.href} href={button.href}>
                <Button variant={button.variant} size="lg">
                  {button.label}
                </Button>
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </main>
  );
}
