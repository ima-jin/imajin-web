'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { getAllCountries, getCountryByCode, hasSubdivisions } from '@/lib/utils/countries';
import { z } from 'zod';

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
  const [country, setCountry] = useState('CA'); // Default to Canada
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Get current country data
  const selectedCountry = useMemo(() => getCountryByCode(country), [country]);

  // Get subdivisions for selected country
  const subdivisions = useMemo(() => {
    if (!selectedCountry || !hasSubdivisions(country)) {
      return [];
    }
    return selectedCountry.subdivisions.map(s => ({ value: s.code, label: s.name }));
  }, [selectedCountry, country]);

  // Get all countries for dropdown
  const countryOptions = useMemo(() => {
    return getAllCountries().map(c => ({ value: c.code, label: c.name }));
  }, []);

  // Reset state/province when country changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid use case: synchronizing state field with country selection
    setState('');
  }, [country]);

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
      // Create checkout session with shipping address
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
          shippingAddress: {
            name,
            email,
            addressLine1,
            addressLine2,
            city,
            state: state || 'N/A', // For countries without subdivisions
            postalCode,
            country,
          },
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
                      <Select
                        name="country"
                        label="Country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                        options={countryOptions}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          name="city"
                          label="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                        />
                        {subdivisions.length > 0 ? (
                          <Select
                            name="state"
                            label={selectedCountry?.subdivisionLabel || 'State/Province'}
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            required
                            options={subdivisions}
                            placeholder={`Select ${selectedCountry?.subdivisionLabel.toLowerCase() || 'state/province'}`}
                          />
                        ) : (
                          <Input
                            name="state"
                            label={selectedCountry?.subdivisionLabel || 'State/Province/Region'}
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            placeholder="Optional"
                          />
                        )}
                      </div>
                      <Input
                        name="postalCode"
                        label={selectedCountry?.postalCodeLabel || 'Postal Code'}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                        placeholder={selectedCountry?.code === 'US' ? '12345' : selectedCountry?.code === 'CA' ? 'A1A 1A1' : ''}
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
