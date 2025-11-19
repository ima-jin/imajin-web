# Phase 4.4.5: Integration with Existing Features

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 4 hours
**Dependencies:** Phase 4.4.4 complete (Protected routes work)
**Next Phase:** Phase 4.4.6 (SendGrid Email Integration)

---

## Overview

Integrate Ory Kratos authentication with existing e-commerce features: link orders to users, display order history, pre-fill checkout forms, and enable account management.

**Key Integrations:**
1. Link orders to users at checkout
2. Display order history for authenticated users
3. Pre-fill checkout with user info from Ory identity
4. Backfill existing orders by email
5. Create account dashboard page

---

## Orders Integration

### Update Checkout Session Creation

**File:** `app/api/checkout/session/route.ts`

```typescript
import { getLocalUserId, getServerSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  // ... existing code

  // Get authenticated user if logged in
  const session = await getServerSession();
  let userId: string | null = null;

  if (session) {
    // Map Kratos ID to local user ID
    try {
      userId = await getLocalUserId();
    } catch (error) {
      // User not found in local DB, continue as guest
      console.warn('User not found in local database:', session.identity.id);
    }
  }

  // Create order in database
  const [order] = await db
    .insert(orders)
    .values({
      customerName: shippingDetails.name,
      customerEmail: email,
      shippingAddress: JSON.stringify(shippingDetails),
      totalAmount: checkoutTotal,
      status: 'pending',
      stripeCheckoutSessionId: checkoutSession.id,
      userId, // Link to local user ID if authenticated
    })
    .returning();

  // ... rest of code
}
```

**Why This Works:**
- Nullable `userId` → Guest checkout supported
- Authenticated users automatically linked via local user ID
- Email still stored for backfill matching
- Handles case where Ory identity exists but local user doesn't (webhook race condition)

---

### Order History Page

**File:** `app/account/orders/page.tsx`

```typescript
import { requireAuth } from '@/lib/auth/guards';
import { getLocalUser } from '@/lib/auth/guards';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { OrderCard } from '@/components/orders/OrderCard';

export const metadata = {
  title: 'Order History - Imajin',
  description: 'View your past orders',
};

export default async function OrderHistoryPage() {
  const session = await requireAuth();
  const localUser = await getLocalUser(); // Get local user from Kratos ID

  // Fetch user's orders with items
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, localUser.id),
    orderBy: [desc(orders.createdAt)],
    with: {
      orderItems: {
        with: {
          product: true,
          variant: true,
        },
      },
    },
  });

  return (
    <Container className="py-12">
      <Heading level={1} className="mb-8">
        Order History
      </Heading>

      {userOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <a
            href="/shop"
            className="inline-block bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            Start Shopping
          </a>
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
```

---

### Order Card Component

**File:** `components/orders/OrderCard.tsx`

```typescript
import { formatCurrency } from '@/lib/utils/format';
import { formatDate } from '@/lib/utils/date';
import Link from 'next/link';

type OrderWithItems = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  totalAmount: number;
  status: string;
  orderItems: Array<{
    productName: string;
    variantValue: string | null;
    quantity: number;
    priceAtPurchase: number;
  }>;
};

export function OrderCard({ order }: { order: OrderWithItems }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-green-100 text-green-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium">Order #{order.orderNumber}</h3>
          <p className="text-sm text-gray-600">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${
            statusColors[order.status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {order.orderItems.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>
              {item.productName}
              {item.variantValue && ` (${item.variantValue})`} × {item.quantity}
            </span>
            <span>{formatCurrency(item.priceAtPurchase * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <span className="font-medium">Total: {formatCurrency(order.totalAmount)}</span>
        <Link
          href={`/account/orders/${order.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
```

---

### Order Detail Page

**File:** `app/account/orders/[orderId]/page.tsx`

```typescript
import { requireAuth } from '@/lib/auth/guards';
import { getLocalUser } from '@/lib/auth/guards';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { formatCurrency } from '@/lib/utils/format';
import { formatDate } from '@/lib/utils/date';

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const session = await requireAuth();
  const localUser = await getLocalUser();

  // Fetch order (must belong to user)
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.id, params.orderId),
      eq(orders.userId, localUser.id)
    ),
    with: {
      orderItems: {
        with: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const shippingAddress = JSON.parse(order.shippingAddress);

  return (
    <Container className="py-12">
      <Heading level={1} className="mb-8">
        Order #{order.orderNumber}
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Items */}
        <div>
          <h2 className="text-lg font-medium mb-4">Items</h2>
          <div className="bg-white border rounded-lg divide-y">
            {order.orderItems.map((item, index) => (
              <div key={index} className="p-4 flex justify-between">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  {item.variantValue && (
                    <p className="text-sm text-gray-600">{item.variantValue}</p>
                  )}
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(item.priceAtPurchase * item.quantity)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(item.priceAtPurchase)} each
                  </p>
                </div>
              </div>
            ))}

            <div className="p-4 bg-gray-50">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
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
                <p className="font-medium">{formatDate(order.createdAt)}</p>
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
              <p>{shippingAddress.name}</p>
              <p>{shippingAddress.addressLine1}</p>
              {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
              <p>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
              </p>
              <p>{shippingAddress.country}</p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
```

---

## Account Dashboard

**File:** `app/account/page.tsx`

```typescript
import { requireAuth } from '@/lib/auth/guards';
import { getLocalUser } from '@/lib/auth/guards';
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
              <Link
                href="/auth/settings"
                className="text-sm text-blue-600 hover:underline"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="md:col-span-2 bg-white border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Orders</h2>
            <Link
              href="/account/orders"
              className="text-sm text-blue-600 hover:underline"
            >
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
                    <span className="font-medium">Order #{order.orderNumber}</span>
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
          className="bg-white border rounded-lg p-6 hover:bg-gray-50"
        >
          <h3 className="font-medium mb-2">Order History</h3>
          <p className="text-sm text-gray-600">View all your past orders</p>
        </Link>
        <Link
          href="/auth/settings"
          className="bg-white border rounded-lg p-6 hover:bg-gray-50"
        >
          <h3 className="font-medium mb-2">Account Settings</h3>
          <p className="text-sm text-gray-600">Update your profile and preferences</p>
        </Link>
        <Link
          href="/shop"
          className="bg-white border rounded-lg p-6 hover:bg-gray-50"
        >
          <h3 className="font-medium mb-2">Continue Shopping</h3>
          <p className="text-sm text-gray-600">Browse our LED fixtures</p>
        </Link>
      </div>
    </Container>
  );
}
```

**Key Changes from NextAuth:**
- User data accessed via `session.identity.traits.name` / `session.identity.traits.email`
- Settings link points to `/auth/settings` (Ory settings flow, not custom page)
- Use `getLocalUser()` to get database user record

---

## Pre-fill Checkout Form

**File:** `app/checkout/page.tsx`

```typescript
import { getServerSession } from '@/lib/auth/session';

export default async function CheckoutPage() {
  const session = await getServerSession();

  // Pre-fill form with user info from Ory identity
  const defaultValues = session
    ? {
        name: session.identity.traits.name || '',
        email: session.identity.traits.email,
      }
    : {
        name: '',
        email: '',
      };

  return (
    <Container>
      <CheckoutForm defaultValues={defaultValues} />
    </Container>
  );
}
```

**Update CheckoutForm to accept defaults:**

```typescript
// components/checkout/CheckoutForm.tsx
export function CheckoutForm({
  defaultValues,
}: {
  defaultValues?: { name: string; email: string };
}) {
  const [email, setEmail] = useState(defaultValues?.email || '');
  const [name, setName] = useState(defaultValues?.name || '');

  // ... rest of component
}
```

---

## Backfill Existing Orders

**File:** `scripts/backfill-orders-users.ts`

```typescript
#!/usr/bin/env tsx

import { db } from '@/db';
import { orders, users } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';

/**
 * Backfill user_id for orders placed before auth was implemented
 * Matches orders to local users by email
 */
async function backfillOrderUsers() {
  console.log('Backfilling order user IDs...');

  // Find orders without user_id
  const ordersWithoutUser = await db.query.orders.findMany({
    where: isNull(orders.userId),
  });

  console.log(`Found ${ordersWithoutUser.length} orders without user_id`);

  let matched = 0;
  let unmatched = 0;

  for (const order of ordersWithoutUser) {
    // Find local user with matching email
    const user = await db.query.users.findFirst({
      where: eq(users.email, order.customerEmail),
    });

    if (user) {
      // Update order with local user_id
      await db
        .update(orders)
        .set({ userId: user.id })
        .where(eq(orders.id, order.id));

      matched++;
      console.log(`Matched order ${order.orderNumber} to user ${user.email}`);
    } else {
      unmatched++;
      console.log(`No user found for order ${order.orderNumber} (${order.customerEmail})`);
    }
  }

  console.log(`\nBackfill complete:`);
  console.log(`- Matched: ${matched}`);
  console.log(`- Unmatched: ${unmatched}`);
}

backfillOrderUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
```

**Run backfill:**

```bash
npx tsx scripts/backfill-orders-users.ts
```

**Note:** This script matches orders to local users table (which shadows Ory identities). The local users table is synced from Ory via webhooks.

---

## Webhook Sync (from Phase 4.4.2)

**Reminder:** Ory webhook already creates local user records on registration:

```typescript
// app/api/auth/webhook/route.ts
export async function POST(request: NextRequest) {
  const event = await request.json();

  if (event.type === 'identity.created') {
    // Create local user record
    await db.insert(users).values({
      kratosId: event.identity.id,
      email: event.identity.traits.email,
      name: event.identity.traits.name,
      role: event.identity.traits.role || 'customer',
    });
  }

  return NextResponse.json({ received: true });
}
```

This ensures local users exist for order linking.

---

## Implementation Steps

### Step 1: Update Checkout (45 min)

- [ ] Add getLocalUserId to checkout session creation
- [ ] Get Ory session in checkout API route
- [ ] Handle case where Ory identity exists but local user doesn't
- [ ] Test authenticated checkout
- [ ] Test unauthenticated checkout (guest)

### Step 2: Create Order History (90 min)

- [ ] Create OrderCard component
- [ ] Create order history page with getLocalUser
- [ ] Create order detail page
- [ ] Test with multiple orders
- [ ] Test with no orders

### Step 3: Create Account Dashboard (60 min)

- [ ] Create account page
- [ ] Display user info from session.identity.traits
- [ ] Display recent orders using local user ID
- [ ] Add quick links (note: settings links to /auth/settings)
- [ ] Test layout responsive

### Step 4: Pre-fill Checkout (30 min)

- [ ] Get Ory session in checkout page
- [ ] Extract name/email from session.identity.traits
- [ ] Pass default values to form
- [ ] Update CheckoutForm to accept defaults
- [ ] Test pre-fill when signed in
- [ ] Test empty when signed out

### Step 5: Backfill Script (15 min)

- [ ] Create backfill script
- [ ] Match orders to local users (not Kratos IDs)
- [ ] Test on dev database
- [ ] Document usage

---

## Acceptance Criteria

- [ ] Orders linked to local users at checkout
- [ ] Order history displays correctly
- [ ] Order detail page shows all info
- [ ] Account dashboard functional
- [ ] User info pulled from Ory identity traits
- [ ] Checkout form pre-fills for authenticated users
- [ ] Backfill script works with local users table
- [ ] No errors for users without orders
- [ ] Graceful handling of webhook race condition
- [ ] Mobile responsive

---

## Testing

### Manual Testing Checklist

**Checkout Integration:**
- [ ] Sign in, checkout → Order has user_id (local user ID)
- [ ] Sign out, checkout → Order has no user_id (guest)
- [ ] Checkout form pre-fills name and email from Ory identity

**Order History:**
- [ ] View order history (multiple orders)
- [ ] View order history (no orders)
- [ ] Click order → Detail page loads
- [ ] Order detail shows items, status, address

**Account Dashboard:**
- [ ] Dashboard shows user info from Ory identity
- [ ] Dashboard shows recent orders (limit 5)
- [ ] "View All" link works
- [ ] "Edit Profile" links to /auth/settings (Ory flow)
- [ ] Quick links work

**Backfill:**
- [ ] Run backfill script
- [ ] Verify orders matched by email to local users
- [ ] Check unmatched orders logged

**Webhook Sync:**
- [ ] New signup creates local user via webhook
- [ ] Checkout immediately after signup works (local user exists)

---

## Troubleshooting

**Orders not linked to users:**
```bash
# Check if local user record exists
SELECT * FROM users WHERE kratos_id = '{kratos_id}';

# Check webhook logs
# Verify app/api/auth/webhook/route.ts received identity.created event

# Run backfill script to fix existing orders
npx tsx scripts/backfill-orders-users.ts
```

**Pre-fill not working:**
```bash
# Check session exists
# Verify session.identity.traits.name and .email are populated

# Check Ory identity schema includes name field
curl http://localhost:4434/admin/identities/{id} | jq '.traits'
```

**Order history empty:**
```bash
# Verify orders.user_id matches local users.id (not kratos_id)
SELECT o.id, o.order_number, u.email
FROM orders o
JOIN users u ON o.user_id = u.id;
```

---

## Next Steps

After Phase 4.4.5 complete:
1. **Phase 4.4.6:** SendGrid email integration (Ory SMTP config)
2. **Phase 4.4.7:** Testing (unit, integration, E2E)

---

**See Also:**
- `docs/tasks/Phase 4.4.4 - Protected Routes & Middleware.md` - Previous phase
- `docs/tasks/Phase 4.4.6 - SendGrid Email Integration.md` - Next phase
- `docs/tasks/Phase 4.4.2 - Ory Kratos Setup.md` - Webhook setup
- `docs/DATABASE_SCHEMA.md` - Orders schema
