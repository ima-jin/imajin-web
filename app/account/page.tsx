import { requireAuth, getLocalUser } from '@/lib/auth/guards';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import Link from 'next/link';

export const metadata = {
  title: 'My Account - Imajin',
  description: 'Manage your account and orders',
};

export default async function AccountPage() {
  const session = await requireAuth();
  const localUser = await getLocalUser();

  // Fetch recent orders
  const recentOrders = await db.query.orders.findMany({
    where: eq(orders.userId, localUser.id),
    orderBy: [desc(orders.createdAt)],
    limit: 5,
  });

  return (
    <Container className="py-12">
      <Heading level={1} className="mb-8">
        Welcome, {session.identity.traits.name}!
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Info */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Account Information</h2>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{session.identity.traits.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{session.identity.traits.email}</p>
            </div>
            <div className="pt-4">
              <Link href="/auth/settings" className="text-sm text-blue-600 hover:underline">
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="md:col-span-2 bg-white border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Orders</h2>
            <Link href="/account/orders" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-gray-600">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block border rounded p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">
                      Order #{order.orderNumber || order.id.slice(0, 8)}
                    </span>
                    <span className="text-sm capitalize">{order.status}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Link
          href="/account/orders"
          className="bg-white border rounded-lg p-6 hover:bg-gray-50 text-center"
        >
          <h3 className="font-medium mb-2">Orders</h3>
          <p className="text-sm text-gray-600">View your order history</p>
        </Link>
        <Link
          href="/auth/settings"
          className="bg-white border rounded-lg p-6 hover:bg-gray-50 text-center"
        >
          <h3 className="font-medium mb-2">Settings</h3>
          <p className="text-sm text-gray-600">Update your profile and security</p>
        </Link>
        <Link
          href="/shop"
          className="bg-white border rounded-lg p-6 hover:bg-gray-50 text-center"
        >
          <h3 className="font-medium mb-2">Shop</h3>
          <p className="text-sm text-gray-600">Browse our products</p>
        </Link>
      </div>
    </Container>
  );
}
