import Link from 'next/link';

type OrderWithItems = {
  id: string;
  orderNumber: string | null;
  createdAt: Date;
  total: number;
  status: string;
  orderItems: Array<{
    productName: string;
    variantName: string | null;
    quantity: number;
    unitPrice: number;
  }>;
};

export function OrderCard({ order }: { order: OrderWithItems }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-green-100 text-green-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

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
    <div className="bg-white border rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium">
            Order #{order.orderNumber || order.id.slice(0, 8)}
          </h3>
          <p className="text-sm text-gray-600">Placed on {formatDate(order.createdAt)}</p>
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
              {item.variantName && ` (${item.variantName})`} × {item.quantity}
            </span>
            <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <span className="font-medium">Total: {formatCurrency(order.total)}</span>
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
