/**
 * Warranty Policy Page
 * Phase 2.4.7 - Phase 8
 */

import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';

export default async function WarrantyPage() {
  return (
    <main>
      <Container className="py-16">
        <div className="max-w-3xl mx-auto">
          <Heading level={1} className="text-4xl mb-8">
            Warranty Policy
          </Heading>

          <div className="space-y-6 text-gray-700">
            <section className="bg-blue-50 p-6 rounded-lg">
              <Heading level={2} className="text-2xl mb-4">
                Founder Edition - 10-Year Warranty
              </Heading>
              <Text className="mb-4">
                Our Founder Edition units come with an industry-leading <strong>10-year warranty</strong>, covering all manufacturing defects and component failures under normal use.
              </Text>
              <Text>
                Each Founder Edition unit includes an NFT token that serves as proof of authenticity and warranty registration.
              </Text>
            </section>

            <section>
              <Heading level={2} className="text-2xl mb-4">
                Standard Products
              </Heading>
              <Text>
                All other products include a 2-year limited warranty covering manufacturing defects and component failures.
              </Text>
            </section>

            <section>
              <Heading level={2} className="text-2xl mb-4">
                What&apos;s Covered
              </Heading>
              <ul className="list-disc pl-6 space-y-2">
                <li>LED panel failures</li>
                <li>Control unit malfunctions</li>
                <li>Connector defects</li>
                <li>Manufacturing defects in materials or workmanship</li>
              </ul>
            </section>

            <section>
              <Heading level={2} className="text-2xl mb-4">
                What&apos;s Not Covered
              </Heading>
              <ul className="list-disc pl-6 space-y-2">
                <li>Damage from improper installation</li>
                <li>Normal wear and tear</li>
                <li>Accidental damage or misuse</li>
                <li>Modifications or repairs by unauthorized parties</li>
              </ul>
            </section>

            <section>
              <Heading level={2} className="text-2xl mb-4">
                Making a Claim
              </Heading>
              <Text>
                To file a warranty claim, contact us at <a href="mailto:info@imajin.ca" className="text-blue-600 hover:underline">info@imajin.ca</a> with your order number and a description of the issue. For Founder Edition units, you&apos;ll need your NFT token hash for verification.
              </Text>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
