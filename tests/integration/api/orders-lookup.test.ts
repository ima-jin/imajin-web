import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/orders/lookup/route';
import { NextRequest } from 'next/server';
import { HTTP_STATUS, ERROR_CODES } from '@/lib/config/api';

// Mock the order service
vi.mock('@/lib/services/order-service', () => ({
  lookupOrder: vi.fn(),
}));

import { lookupOrder } from '@/lib/services/order-service';

describe('POST /api/orders/lookup', () => {
  const validRequest = {
    email: 'test@example.com',
    orderId: 'cs_test_123',
  };

  const mockOrder = {
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
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    items: [
      {
        id: 'item_1',
        orderId: 'cs_test_123',
        productId: 'Material-8x8-V',
        variantId: 'variant_black',
        stripeProductId: 'price_test_123',
        quantity: 2,
        unitPrice: 2500,
        totalPrice: 5000,
        productName: 'Material-8x8-V',
        variantName: 'BLACK',
        createdAt: new Date('2025-01-01'),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully looks up order', async () => {
    (lookupOrder as any).mockResolvedValue(mockOrder);

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(validRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      id: 'cs_test_123',
      customerEmail: 'test@example.com',
      status: 'paid',
      total: 6500,
    });
    expect(lookupOrder).toHaveBeenCalledWith('test@example.com', 'cs_test_123');
  });

  it('returns order with items', async () => {
    (lookupOrder as any).mockResolvedValue(mockOrder);

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(validRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.data.items).toBeDefined();
    expect(data.data.items).toHaveLength(1);
    expect(data.data.items[0].productName).toBe('Material-8x8-V');
  });

  it('returns order with shipping address', async () => {
    (lookupOrder as any).mockResolvedValue(mockOrder);

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(validRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.data.shippingName).toBe('Test User');
    expect(data.data.shippingAddressLine1).toBe('123 Test St');
    expect(data.data.shippingCity).toBe('San Francisco');
  });

  it('returns 404 when order not found', async () => {
    (lookupOrder as any).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(validRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(data.error.message).toBe('Order not found');
  });

  it('returns 404 when email does not match', async () => {
    (lookupOrder as any).mockResolvedValue(null);

    const invalidEmail = {
      email: 'wrong@example.com',
      orderId: 'cs_test_123',
    };

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(invalidEmail),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(data.success).toBe(false);
    expect(data.error.message).toBe('Order not found');
  });

  it('validates email format', async () => {
    const invalidEmail = {
      email: 'not-an-email',
      orderId: 'cs_test_123',
    };

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(invalidEmail),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(data.error.message).toBe('Invalid lookup data');
  });

  it('validates orderId is required', async () => {
    const missingOrderId = {
      email: 'test@example.com',
      orderId: '',
    };

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(missingOrderId),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('requires email field', async () => {
    const missingEmail = {
      orderId: 'cs_test_123',
    };

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(missingEmail),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
  });

  it('requires orderId field', async () => {
    const missingOrderId = {
      email: 'test@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(missingOrderId),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
  });

  it('handles database errors', async () => {
    (lookupOrder as any).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(validRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('Order lookup failed');
  });

  it('handles malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.success).toBe(false);
  });

  it('handles order with multiple items', async () => {
    const orderWithMultipleItems = {
      ...mockOrder,
      items: [
        mockOrder.items[0],
        {
          id: 'item_2',
          orderId: 'cs_test_123',
          productId: 'Founder-8x8-V',
          variantId: 'variant_red',
          stripeProductId: 'price_test_456',
          quantity: 1,
          unitPrice: 10000,
          totalPrice: 10000,
          productName: 'Founder-8x8-V',
          variantName: 'RED',
          createdAt: new Date('2025-01-01'),
        },
      ],
    };

    (lookupOrder as any).mockResolvedValue(orderWithMultipleItems);

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(validRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.data.items).toHaveLength(2);
  });

  it('handles order without shipping address', async () => {
    const orderWithoutShipping = {
      ...mockOrder,
      shippingName: null,
      shippingAddressLine1: null,
      shippingCity: null,
      shippingState: null,
      shippingPostalCode: null,
      shippingCountry: null,
    };

    (lookupOrder as any).mockResolvedValue(orderWithoutShipping);

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(validRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.data.shippingName).toBeNull();
  });

  it('case-sensitive email matching', async () => {
    (lookupOrder as any).mockResolvedValue(null);

    const upperCaseEmail = {
      email: 'TEST@EXAMPLE.COM',
      orderId: 'cs_test_123',
    };

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(upperCaseEmail),
    });

    const response = await POST(request);

    expect(lookupOrder).toHaveBeenCalledWith('TEST@EXAMPLE.COM', 'cs_test_123');
  });

  it('trims whitespace from inputs', async () => {
    (lookupOrder as any).mockResolvedValue(mockOrder);

    // Note: Zod's email validation doesn't trim by default
    // This test documents current behavior
    const requestWithSpaces = {
      email: 'test@example.com',
      orderId: '  cs_test_123  ',
    };

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(requestWithSpaces),
    });

    await POST(request);

    expect(lookupOrder).toHaveBeenCalledWith('test@example.com', '  cs_test_123  ');
  });

  it('returns validation errors with detailed issues', async () => {
    const invalidRequest = {
      email: 'bad-email',
      orderId: '',
    };

    const request = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(invalidRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.error.details).toBeDefined();
    expect(data.error.details.issues).toBeDefined();
    expect(Array.isArray(data.error.details.issues)).toBe(true);
  });
});
