'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/components/toast/ToastProvider';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { apiPost } from '@/lib/utils/api-client';
import { API_ENDPOINTS } from '@/lib/config/api';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

/**
 * Checkout Page
 *
 * Collects shipping information and creates Stripe Checkout session.
 * Redirects to Stripe's hosted checkout page for payment.
 *
 * Flow:
 * 1. Customer fills out shipping form
 * 2. Submit creates Stripe Checkout session with cart items
 * 3. Redirect to Stripe for payment
 * 4. Return to /api/checkout/success which validates and redirects to /checkout/success
 */
export default function CheckoutPage() {
  const router = useRouter();
  const { items, isHydrated } = useCart();
  const { showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Redirect if cart is empty (after hydration)
  useEffect(() => {
    if (isHydrated && items.length === 0) {
      router.push('/products');
    }
  }, [isHydrated, items.length, router]);

  // Don't render until hydrated to avoid flash of content
  if (!isHydrated || items.length === 0) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create checkout session
      const session = await apiPost(
        API_ENDPOINTS.CHECKOUT_SESSION,
        z.object({ sessionId: z.string(), url: z.string() }),
        {
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            stripePriceId: item.stripePriceId,
            productName: item.name,
            variantValue: item.variantName,
          })),
          customerEmail: email,
          metadata: {},
        }
      );

      // Redirect to Stripe Checkout
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      logger.error('Checkout session creation failed', error as Error);
      showError('Failed to create checkout session. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Container className="py-12">
        <div className="max-w-6xl mx-auto">
          <Heading level={1} className="mb-2">
            Checkout
          </Heading>
          <Text color="muted" className="mb-8">
            Complete your order information below
          </Text>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <Card>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Contact Information */}
                  <div>
                    <Heading level={2} className="text-xl mb-4">
                      Contact Information
                    </Heading>
                    <Input
                      type="email"
                      name="email"
                      label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      helperText="Order confirmation will be sent to this email"
                    />
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <Heading level={2} className="text-xl mb-4">
                      Shipping Address
                    </Heading>
                    <div className="space-y-4">
                      <Input
                        name="name"
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                      <Input
                        name="addressLine1"
                        label="Address"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        required
                      />
                      <Input
                        name="addressLine2"
                        label="Apartment, suite, etc."
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        helperText="Optional"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          name="city"
                          label="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                        />
                        <Select
                          name="state"
                          label="State"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          required
                          options={US_STATES}
                          placeholder="Select state"
                        />
                      </div>
                      <Input
                        name="postalCode"
                        label="Postal Code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                        placeholder="12345"
                      />
                    </div>
                  </div>

                  {/* Payment Notice */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <Text size="sm" color="muted">
                      You will be redirected to Stripe to securely complete your payment.
                    </Text>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Continue to Payment'}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <OrderSummary items={items} />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
