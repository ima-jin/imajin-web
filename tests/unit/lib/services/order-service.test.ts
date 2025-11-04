import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOrder,
  getOrder,
  lookupOrder,
  updateOrderStatus,
  type CreateOrderParams,
} from '@/lib/services/order-service';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  orders: {
    id: 'id',
    stripePaymentIntentId: 'stripePaymentIntentId',
    customerEmail: 'customerEmail',
    status: 'status',
    soldQuantity: 'soldQuantity',
  },
  orderItems: {
    orderId: 'orderId',
  },
  products: {
    id: 'id',
    soldQuantity: 'soldQuantity',
  },
  variants: {
    id: 'id',
    soldQuantity: 'soldQuantity',
  },
}));

import { db } from '@/db';

describe('Order Service', () => {
  let mockTx: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock transaction behavior
    mockTx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };

    (db.transaction as any) = vi.fn((callback) => callback(mockTx));
    (db.select as any) = vi.fn().mockReturnThis();
    (db.update as any) = vi.fn().mockReturnThis();
  });

  describe('createOrder', () => {
    const mockOrderParams: CreateOrderParams = {
      sessionId: 'cs_test_123',
      paymentIntentId: 'pi_test_123',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      subtotal: 5000,
      tax: 500,
      shipping: 1000,
      total: 6500,
      items: [
        {
          productId: 'Material-8x8-V',
          variantId: 'variant_black',
          stripePriceId: 'price_test_123',
          quantity: 2,
          unitPrice: 2500,
          productName: 'Material-8x8-V',
          variantName: 'BLACK',
        },
      ],
      shippingAddress: {
        name: 'Test User',
        line1: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'US',
      },
    };

    it('creates order with all fields in transaction', async () => {
      const mockOrder = {
        id: 'cs_test_123',
        customerEmail: 'test@example.com',
        status: 'paid',
      };

      mockTx.returning.mockResolvedValue([mockOrder]);

      const result = await createOrder(mockOrderParams);

      expect(result).toEqual(mockOrder);
      expect(db.transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cs_test_123',
          stripePaymentIntentId: 'pi_test_123',
          customerEmail: 'test@example.com',
          customerName: 'Test User',
          status: 'paid',
          subtotal: 5000,
          tax: 500,
          shipping: 1000,
          total: 6500,
          currency: 'usd',
          shippingName: 'Test User',
          shippingAddressLine1: '123 Test St',
          shippingCity: 'San Francisco',
          shippingState: 'CA',
          shippingPostalCode: '94102',
          shippingCountry: 'US',
        })
      );
    });

    it('creates order items for each line item', async () => {
      mockTx.returning.mockResolvedValue([{ id: 'cs_test_123' }]);

      await createOrder(mockOrderParams);

      expect(mockTx.insert).toHaveBeenCalledTimes(2); // 1 order + 1 item
      expect(mockTx.values).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'cs_test_123',
          productId: 'Material-8x8-V',
          variantId: 'variant_black',
          stripePriceId: 'price_test_123',
          quantity: 2,
          unitPrice: 2500,
          totalPrice: 5000,
          productName: 'Material-8x8-V',
          variantName: 'BLACK',
        })
      );
    });

    it('increments product and variant quantities atomically', async () => {
      mockTx.returning.mockResolvedValue([{ id: 'cs_test_123' }]);

      await createOrder(mockOrderParams);

      // Should update both product and variant
      expect(mockTx.update).toHaveBeenCalledTimes(2); // 1 product + 1 variant
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({
          soldQuantity: expect.any(Object), // SQL template
        })
      );
      expect(mockTx.where).toHaveBeenCalled();
    });

    it('creates multiple order items', async () => {
      const multiItemParams: CreateOrderParams = {
        ...mockOrderParams,
        items: [
          {
            productId: 'Material-8x8-V',
            variantId: 'variant_black',
            stripePriceId: 'price_test_123',
            quantity: 2,
            unitPrice: 2500,
            productName: 'Material-8x8-V',
            variantName: 'BLACK',
          },
          {
            productId: 'Founder-8x8-V',
            variantId: 'variant_red',
            stripePriceId: 'price_test_456',
            quantity: 1,
            unitPrice: 10000,
            productName: 'Founder-8x8-V',
            variantName: 'RED',
          },
        ],
      };

      mockTx.returning.mockResolvedValue([{ id: 'cs_test_123' }]);

      await createOrder(multiItemParams);

      expect(mockTx.insert).toHaveBeenCalledTimes(3); // 1 order + 2 items
      expect(mockTx.update).toHaveBeenCalledTimes(4); // 2 product updates + 2 variant updates
    });

    it('increments product quantity even for items without variants', async () => {
      const noVariantParams: CreateOrderParams = {
        ...mockOrderParams,
        items: [
          {
            productId: 'Material-8x8-V',
            stripePriceId: 'price_test_123',
            quantity: 2,
            unitPrice: 2500,
            productName: 'Material-8x8-V',
          },
        ],
      };

      mockTx.returning.mockResolvedValue([{ id: 'cs_test_123' }]);

      await createOrder(noVariantParams);

      expect(mockTx.insert).toHaveBeenCalledTimes(2); // 1 order + 1 item
      expect(mockTx.update).toHaveBeenCalledTimes(1); // 1 product update (no variant)
    });

    it('handles orders without shipping address', async () => {
      const noShippingParams: CreateOrderParams = {
        ...mockOrderParams,
        shippingAddress: undefined,
      };

      mockTx.returning.mockResolvedValue([{ id: 'cs_test_123' }]);

      await createOrder(noShippingParams);

      expect(mockTx.values).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingName: undefined,
          shippingAddressLine1: undefined,
          shippingCity: undefined,
          shippingState: undefined,
          shippingPostalCode: undefined,
          shippingCountry: undefined,
        })
      );
    });

    it('handles orders without customer name', async () => {
      const noNameParams: CreateOrderParams = {
        ...mockOrderParams,
        customerName: undefined,
      };

      mockTx.returning.mockResolvedValue([{ id: 'cs_test_123' }]);

      await createOrder(noNameParams);

      expect(mockTx.values).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: undefined,
        })
      );
    });

    it('calculates total price correctly for each item', async () => {
      mockTx.returning.mockResolvedValue([{ id: 'cs_test_123' }]);

      await createOrder(mockOrderParams);

      expect(mockTx.values).toHaveBeenCalledWith(
        expect.objectContaining({
          totalPrice: 5000, // 2500 * 2
        })
      );
    });

    it('throws error if transaction fails', async () => {
      (db.transaction as any) = vi
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(createOrder(mockOrderParams)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getOrder', () => {
    beforeEach(() => {
      // Reset mocks for getOrder tests
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };
      (db.select as any) = vi.fn(() => mockSelectChain);
    });

    it('retrieves order with items', async () => {
      const mockOrder = {
        id: 'cs_test_123',
        customerEmail: 'test@example.com',
        status: 'paid',
      };

      const mockItems = [
        {
          id: 'item_1',
          orderId: 'cs_test_123',
          productId: 'Material-8x8-V',
          quantity: 2,
        },
      ];

      const selectMock = vi.fn().mockReturnThis();
      const fromMock = vi.fn().mockReturnThis();
      const whereMock = vi
        .fn()
        .mockResolvedValueOnce([mockOrder]) // First call returns order
        .mockResolvedValueOnce(mockItems); // Second call returns items

      (db.select as any) = vi.fn(() => ({
        from: fromMock.mockReturnValue({
          where: whereMock,
        }),
      }));

      const result = await getOrder('cs_test_123');

      expect(result).toEqual({
        ...mockOrder,
        items: mockItems,
      });
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    it('returns null if order not found', async () => {
      const selectMock = vi.fn().mockReturnThis();
      const fromMock = vi.fn().mockReturnThis();
      const whereMock = vi.fn().mockResolvedValue([]);

      (db.select as any) = vi.fn(() => ({
        from: fromMock.mockReturnValue({
          where: whereMock,
        }),
      }));

      const result = await getOrder('nonexistent_id');

      expect(result).toBeNull();
    });

    it('returns order with empty items array if no items found', async () => {
      const mockOrder = {
        id: 'cs_test_123',
        customerEmail: 'test@example.com',
      };

      const selectMock = vi.fn().mockReturnThis();
      const fromMock = vi.fn().mockReturnThis();
      const whereMock = vi
        .fn()
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([]);

      (db.select as any) = vi.fn(() => ({
        from: fromMock.mockReturnValue({
          where: whereMock,
        }),
      }));

      const result = await getOrder('cs_test_123');

      expect(result).toEqual({
        ...mockOrder,
        items: [],
      });
    });
  });

  describe('lookupOrder', () => {
    beforeEach(() => {
      // Mock getOrder for lookupOrder tests
      vi.clearAllMocks();
    });

    it('returns order when email matches', async () => {
      const mockOrderWithItems = {
        id: 'cs_test_123',
        customerEmail: 'test@example.com',
        status: 'paid',
        items: [],
      };

      // Mock getOrder to return the order
      const selectMock = vi.fn().mockReturnThis();
      const fromMock = vi.fn().mockReturnThis();
      const whereMock = vi
        .fn()
        .mockResolvedValueOnce([mockOrderWithItems])
        .mockResolvedValueOnce([]);

      (db.select as any) = vi.fn(() => ({
        from: fromMock.mockReturnValue({
          where: whereMock,
        }),
      }));

      const result = await lookupOrder('test@example.com', 'cs_test_123');

      expect(result).toEqual(mockOrderWithItems);
    });

    it('returns null when email does not match', async () => {
      const mockOrderWithItems = {
        id: 'cs_test_123',
        customerEmail: 'test@example.com',
        status: 'paid',
        items: [],
      };

      const selectMock = vi.fn().mockReturnThis();
      const fromMock = vi.fn().mockReturnThis();
      const whereMock = vi
        .fn()
        .mockResolvedValueOnce([mockOrderWithItems])
        .mockResolvedValueOnce([]);

      (db.select as any) = vi.fn(() => ({
        from: fromMock.mockReturnValue({
          where: whereMock,
        }),
      }));

      const result = await lookupOrder('wrong@example.com', 'cs_test_123');

      expect(result).toBeNull();
    });

    it('returns null when order does not exist', async () => {
      const selectMock = vi.fn().mockReturnThis();
      const fromMock = vi.fn().mockReturnThis();
      const whereMock = vi.fn().mockResolvedValue([]);

      (db.select as any) = vi.fn(() => ({
        from: fromMock.mockReturnValue({
          where: whereMock,
        }),
      }));

      const result = await lookupOrder('test@example.com', 'nonexistent_id');

      expect(result).toBeNull();
    });
  });

  describe('updateOrderStatus', () => {
    beforeEach(() => {
      const mockUpdateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };
      (db.update as any) = vi.fn(() => mockUpdateChain);
    });

    it('updates order status', async () => {
      const mockUpdatedOrder = {
        id: 'cs_test_123',
        status: 'processing',
      };

      const setMock = vi.fn().mockReturnThis();
      const whereMock = vi.fn().mockReturnThis();
      const returningMock = vi.fn().mockResolvedValue([mockUpdatedOrder]);

      (db.update as any) = vi.fn(() => ({
        set: setMock,
      }));

      setMock.mockReturnValue({
        where: whereMock.mockReturnValue({
          returning: returningMock,
        }),
      });

      const result = await updateOrderStatus('cs_test_123', 'processing');

      expect(db.update).toHaveBeenCalled();
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'processing',
          updatedAt: expect.any(Date),
        })
      );
      expect(result).toEqual([mockUpdatedOrder]);
    });

    it('includes tracking number when provided', async () => {
      const setMock = vi.fn().mockReturnThis();
      const whereMock = vi.fn().mockReturnThis();
      const returningMock = vi.fn().mockResolvedValue([]);

      (db.update as any) = vi.fn(() => ({
        set: setMock,
      }));

      setMock.mockReturnValue({
        where: whereMock.mockReturnValue({
          returning: returningMock,
        }),
      });

      await updateOrderStatus('cs_test_123', 'shipped', 'TRACK123');

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'shipped',
          trackingNumber: 'TRACK123',
          updatedAt: expect.any(Date),
        })
      );
    });

    it('sets shippedAt timestamp when status is shipped', async () => {
      const setMock = vi.fn().mockReturnThis();
      const whereMock = vi.fn().mockReturnThis();
      const returningMock = vi.fn().mockResolvedValue([]);

      (db.update as any) = vi.fn(() => ({
        set: setMock,
      }));

      setMock.mockReturnValue({
        where: whereMock.mockReturnValue({
          returning: returningMock,
        }),
      });

      await updateOrderStatus('cs_test_123', 'shipped', 'TRACK123');

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'shipped',
          shippedAt: expect.any(Date),
        })
      );
    });

    it('does not set shippedAt for non-shipped status', async () => {
      const setMock = vi.fn().mockReturnThis();
      const whereMock = vi.fn().mockReturnThis();
      const returningMock = vi.fn().mockResolvedValue([]);

      (db.update as any) = vi.fn(() => ({
        set: setMock,
      }));

      setMock.mockReturnValue({
        where: whereMock.mockReturnValue({
          returning: returningMock,
        }),
      });

      await updateOrderStatus('cs_test_123', 'processing');

      const callArg = setMock.mock.calls[0][0];
      expect(callArg.shippedAt).toBeUndefined();
    });

    it('does not include tracking number when not provided', async () => {
      const setMock = vi.fn().mockReturnThis();
      const whereMock = vi.fn().mockReturnThis();
      const returningMock = vi.fn().mockResolvedValue([]);

      (db.update as any) = vi.fn(() => ({
        set: setMock,
      }));

      setMock.mockReturnValue({
        where: whereMock.mockReturnValue({
          returning: returningMock,
        }),
      });

      await updateOrderStatus('cs_test_123', 'processing');

      const callArg = setMock.mock.calls[0][0];
      expect(callArg.trackingNumber).toBeUndefined();
    });
  });
});
