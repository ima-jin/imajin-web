/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/checkout/session/route';
import { NextRequest } from 'next/server';
import { HTTP_STATUS, ERROR_CODES } from '@/lib/config/api';

// Mock the stripe service
vi.mock('@/lib/services/stripe-service', () => ({
  createCheckoutSession: vi.fn(),
}));

import { createCheckoutSession } from '@/lib/services/stripe-service';

describe('POST /api/checkout/session', () => {
  const validRequestBody = {
    items: [
      {
        productId: 'Material-8x8-V',
        variantId: 'variant_black',
        quantity: 2,
        price: 2500,
        stripeProductId: 'price_test_123',
        productName: 'Material-8x8-V',
        variantValue: 'BLACK',
      },
    ],
    customerEmail: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates checkout session successfully', async () => {
    const mockSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    };

    (createCheckoutSession as any).mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.success).toBe(true);
    expect(data.data.sessionId).toBe('cs_test_123');
    expect(data.data.url).toBe('https://checkout.stripe.com/test');
  });

  it('passes correct data to createCheckoutSession', async () => {
    const mockSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    };

    (createCheckoutSession as any).mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
    });

    await POST(request);

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          {
            stripeProductId: 'price_test_123',
            quantity: 2,
          },
        ],
        customerEmail: 'test@example.com',
        metadata: expect.objectContaining({
          cartItems: expect.any(String),
        }),
      })
    );
  });

  it('serializes cart items in metadata', async () => {
    const mockSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    };

    (createCheckoutSession as any).mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
    });

    await POST(request);

    const callArgs = (createCheckoutSession as any).mock.calls[0][0];
    const cartItems = JSON.parse(callArgs.metadata.cartItems);

    expect(cartItems).toEqual([
      {
        productId: 'Material-8x8-V',
        variantId: 'variant_black',
        stripeProductId: 'price_test_123',
        quantity: 2,
        unitPrice: 2500,
        productName: 'Material-8x8-V',
        variantName: 'BLACK',
      },
    ]);
  });

  it('includes custom metadata', async () => {
    const mockSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    };

    (createCheckoutSession as any).mockResolvedValue(mockSession);

    const requestWithMetadata = {
      ...validRequestBody,
      metadata: {
        orderId: 'order_123',
        source: 'web',
      },
    };

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(requestWithMetadata),
    });

    await POST(request);

    const callArgs = (createCheckoutSession as any).mock.calls[0][0];
    expect(callArgs.metadata.orderId).toBe('order_123');
    expect(callArgs.metadata.source).toBe('web');
    expect(callArgs.metadata.cartItems).toBeDefined();
  });

  it('handles multiple items', async () => {
    const mockSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    };

    (createCheckoutSession as any).mockResolvedValue(mockSession);

    const multiItemRequest = {
      ...validRequestBody,
      items: [
        validRequestBody.items[0],
        {
          productId: 'Founder-8x8-V',
          quantity: 1,
          price: 10000,
          stripeProductId: 'price_test_456',
          productName: 'Founder-8x8-V',
        },
      ],
    };

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(multiItemRequest),
    });

    await POST(request);

    const callArgs = (createCheckoutSession as any).mock.calls[0][0];
    expect(callArgs.items).toHaveLength(2);
  });

  it('returns validation error for empty cart', async () => {
    const invalidRequest = {
      ...validRequestBody,
      items: [],
    };

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(invalidRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(data.error.message).toBe('Invalid checkout data');
  });

  it('returns validation error for invalid email', async () => {
    const invalidRequest = {
      ...validRequestBody,
      customerEmail: 'not-an-email',
    };

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(invalidRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('returns validation error for missing stripeProductId', async () => {
    const invalidItem = { ...validRequestBody.items[0] };
    delete (invalidItem as any).stripeProductId;

    const invalidRequest = {
      ...validRequestBody,
      items: [invalidItem],
    };

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(invalidRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('returns validation error for negative quantity', async () => {
    const invalidRequest = {
      ...validRequestBody,
      items: [{ ...validRequestBody.items[0], quantity: -1 }],
    };

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(invalidRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('returns validation error for non-integer quantity', async () => {
    const invalidRequest = {
      ...validRequestBody,
      items: [{ ...validRequestBody.items[0], quantity: 1.5 }],
    };

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(invalidRequest),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
  });

  it('handles Stripe API errors', async () => {
    (createCheckoutSession as any).mockRejectedValue(
      new Error('Stripe API error')
    );

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('Failed to create checkout session');
  });

  it('handles malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.success).toBe(false);
  });

  it('handles item without variant', async () => {
    const mockSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    };

    (createCheckoutSession as any).mockResolvedValue(mockSession);

    const requestWithoutVariant = {
      items: [
        {
          productId: 'Material-8x8-V',
          quantity: 1,
          price: 2500,
          stripeProductId: 'price_test_123',
          productName: 'Material-8x8-V',
        },
      ],
      customerEmail: 'test@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(requestWithoutVariant),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.success).toBe(true);
  });

  it('preserves variantName as variantName in metadata', async () => {
    const mockSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    };

    (createCheckoutSession as any).mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
    });

    await POST(request);

    const callArgs = (createCheckoutSession as any).mock.calls[0][0];
    const cartItems = JSON.parse(callArgs.metadata.cartItems);

    expect(cartItems[0].variantName).toBe('BLACK');
  });

  it('handles items with zero price', async () => {
    const mockSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    };

    (createCheckoutSession as any).mockResolvedValue(mockSession);

    const requestWithZeroPrice = {
      ...validRequestBody,
      items: [{ ...validRequestBody.items[0], price: 0 }],
    };

    const request = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(requestWithZeroPrice),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.success).toBe(true);
  });
});
