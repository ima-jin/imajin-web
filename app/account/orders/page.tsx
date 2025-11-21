import { requireAuth, getLocalUser } from '@/lib/auth/guards';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { OrderCard } from '@/components/orders/OrderCard';
import Link from 'next/link';

export const metadata = {
  title: 'Order History - Imajin',
  description: 'View your past orders',
};

export default async function OrderHistoryPage() {
  const session = await requireAuth();
  const localUser = await getLocalUser();

  // Fetch user's orders with items
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, localUser.id),
    orderBy: [desc(orders.createdAt)],
    with: {
      orderItems: true,
    },
  });

  return (
    <Container className="py-12">
      <Heading level={1} className="mb-8">
        Order History
      </Heading>

      {userOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/shop"
            className="inline-block bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {userOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </Container>
  );
}
