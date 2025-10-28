import { notFound } from 'next/navigation';
import { getOrder } from '@/lib/services/order-service';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/format';
import Link from 'next/link';

/**
 * Order Confirmation Page
 *
 * Displays order confirmation after successful Stripe payment.
 * Loads order from database using order ID (Stripe Checkout Session ID).
 *
 * This page is shown after redirect from /api/checkout/success.
 */
export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.order_id;

  if (!orderId) {
    notFound();
  }

  const order = await getOrder(orderId);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <Container className="py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <Heading level={1} className="mb-2">
              Order Confirmed!
            </Heading>
            <Text size="lg" color="muted" className="mb-1">
              Thank you for your purchase
            </Text>
            <Text size="sm" color="muted">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </Text>
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            {/* Confirmation Email Notice */}
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <Text className="font-medium mb-1">Confirmation email sent</Text>
                    <Text size="sm" color="muted">
                      We&apos;ve sent a confirmation email to{' '}
                      <span className="font-medium text-gray-900">{order.customerEmail}</span>
                    </Text>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card noPadding>
              <CardHeader>
                <Heading level={3} className="text-lg font-semibold">
                  Order Items
                </Heading>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <Text className="font-medium">{item.productName}</Text>
                        {item.variantName && (
                          <Text size="sm" color="muted">
                            {item.variantName}
                          </Text>
                        )}
                        <Text size="sm" color="muted">
                          Qty: {item.quantity}
                        </Text>
                      </div>
                      <Text className="font-medium">{formatCurrency(item.totalPrice)}</Text>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 mt-6 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <Text color="muted">Subtotal</Text>
                    <Text>{formatCurrency(order.subtotal)}</Text>
                  </div>
                  {order.shipping !== null && order.shipping > 0 && (
                    <div className="flex justify-between text-sm">
                      <Text color="muted">Shipping</Text>
                      <Text>{formatCurrency(order.shipping)}</Text>
                    </div>
                  )}
                  {order.tax !== null && order.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <Text color="muted">Tax</Text>
                      <Text>{formatCurrency(order.tax)}</Text>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <Heading level={4} className="text-lg">
                      Total
                    </Heading>
                    <Heading level={4} className="text-lg">
                      {formatCurrency(order.total)}
                    </Heading>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shippingAddressLine1 && (
              <Card noPadding>
                <CardHeader>
                  <Heading level={3} className="text-lg font-semibold">
                    Shipping Address
                  </Heading>
                </CardHeader>
                <CardContent>
                  {order.shippingName && (
                    <Text className="font-medium">{order.shippingName}</Text>
                  )}
                  {order.shippingAddressLine1 && <Text>{order.shippingAddressLine1}</Text>}
                  {order.shippingAddressLine2 && <Text>{order.shippingAddressLine2}</Text>}
                  <Text>
                    {[
                      order.shippingCity,
                      order.shippingState,
                      order.shippingPostalCode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                  {order.shippingCountry && <Text>{order.shippingCountry}</Text>}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link href="/products">
                <Button variant="primary" size="lg">
                  Continue Shopping
                </Button>
              </Link>
              <Link href="/">
                <Button variant="secondary" size="lg">
                  Return to Home
                </Button>
              </Link>
            </div>

            {/* Support Notice */}
            <Card>
              <CardContent className="text-center">
                <Text size="sm" color="muted">
                  Questions about your order? Contact us at{' '}
                  <a
                    href="mailto:support@imajin.ai"
                    className="text-black font-medium hover:underline"
                  >
                    support@imajin.ai
                  </a>
                </Text>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
