/**
 * Shipping Policy Page
 * Phase 2.4.7 - Phase 8
 */

import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';

export default async function ShippingPage() {
  return (
    <main>
      <Container className="py-16">
        <div className="max-w-3xl mx-auto">
          <Heading level={1} className="text-4xl mb-8">
            Shipping Policy
          </Heading>

          <div className="space-y-6 text-gray-700">
            <section>
              <Heading level={2} className="text-2xl mb-4">
                Shipping Methods
              </Heading>
              <Text>
                We offer standard and expedited shipping options for all products. Shipping times and costs vary based on your location and chosen method.
              </Text>
            </section>

            <section>
              <Heading level={2} className="text-2xl mb-4">
                Processing Time
              </Heading>
              <Text>
                Orders are typically processed within 1-2 business days. Custom configurations may require additional processing time.
              </Text>
            </section>

            <section>
              <Heading level={2} className="text-2xl mb-4">
                Delivery
              </Heading>
              <Text>
                Standard shipping: 5-7 business days
                <br />
                Expedited shipping: 2-3 business days
                <br />
                International shipping times vary by destination.
              </Text>
            </section>

            <section>
              <Heading level={2} className="text-2xl mb-4">
                Tracking
              </Heading>
              <Text>
                You will receive a tracking number via email once your order ships. Track your order status at any time through the provided tracking link.
              </Text>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
