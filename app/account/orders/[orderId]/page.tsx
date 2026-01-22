import { requireAuth, getLocalUser } from '@/lib/auth/guards';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const session = await requireAuth();
  const localUser = await getLocalUser();

  // Fetch order (must belong to user)
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, params.orderId), eq(orders.userId, localUser.id)))
    .limit(1);

  if (!order) {
    notFound();
  }

  // Fetch order items separately
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container className="py-12">
      <Heading level={1} className="mb-8">
        Order #{order.id.slice(0, 8)}
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Items */}
        <div>
          <h2 className="text-lg font-medium mb-4">Items</h2>
          <div className="bg-white border rounded-lg divide-y">
            {items.map((item, index) => (
              <div key={index} className="p-4 flex justify-between">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-sm text-gray-600">{item.variantName}</p>
                  )}
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(item.totalPrice)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(item.unitPrice)} each
                  </p>
                </div>
              </div>
            ))}

            <div className="p-4 bg-gray-50">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shipping ?? 0)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-4">Order Information</h2>
            <div className="bg-white border rounded-lg p-4 space-y-2">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium capitalize">{order.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium">{order.createdAt ? formatDate(order.createdAt) : 'N/A'}</p>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="text-sm text-gray-600">Tracking Number</p>
                  <p className="font-medium">{order.trackingNumber}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">Shipping Address</h2>
            <div className="bg-white border rounded-lg p-4">
              {order.shippingName && <p>{order.shippingName}</p>}
              {order.shippingAddressLine1 && <p>{order.shippingAddressLine1}</p>}
              {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
              {(order.shippingCity || order.shippingState || order.shippingPostalCode) && (
                <p>
                  {order.shippingCity}
                  {order.shippingState && `, ${order.shippingState}`}{' '}
                  {order.shippingPostalCode}
                </p>
              )}
              {order.shippingCountry && <p>{order.shippingCountry}</p>}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
