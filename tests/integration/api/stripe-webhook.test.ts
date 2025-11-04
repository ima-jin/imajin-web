import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { NextRequest } from 'next/server';
import { HTTP_STATUS, ERROR_CODES } from '@/lib/config/api';
import type Stripe from 'stripe';

// Mock the services
vi.mock('@/lib/services/stripe-service', () => ({
  verifyWebhookSignature: vi.fn(),
}));

vi.mock('@/lib/services/order-service', () => ({
  createOrder: vi.fn(),
}));

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

import { verifyWebhookSignature } from '@/lib/services/stripe-service';
import { createOrder } from '@/lib/services/order-service';
import { headers } from 'next/headers';

describe('POST /api/webhooks/stripe', () => {
  const validCartItems = JSON.stringify([
    {
      productId: 'Material-8x8-V',
      variantId: 'variant_black',
      stripePriceId: 'price_test_123',
      quantity: 2,
      unitPrice: 2500,
      productName: 'Material-8x8-V',
      variantName: 'BLACK',
    },
  ]);

  const mockCheckoutSession: any = {
    id: 'cs_test_123',
    payment_intent: 'pi_test_123',
    customer_email: 'test@example.com',
    customer_details: {
      email: 'test@example.com',
      name: 'Test User',
      phone: null,
      tax_exempt: 'none',
      tax_ids: null,
      address: null,
      business_name: null,
      individual_name: null,
    },
    amount_subtotal: 5000,
    amount_total: 6500,
    total_details: {
      amount_discount: 0,
      amount_shipping: 1000,
      amount_tax: 500,
    },
    metadata: {
      cartItems: validCartItems,
    },
    shipping_details: {
      name: 'Test User',
      address: {
        line1: '123 Test St',
        line2: null,
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94102',
        country: 'US',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for headers
    (headers as any).mockResolvedValue({
      get: vi.fn().mockReturnValue('test_signature'),
    });

    // Default mock for createOrder
    (createOrder as any).mockResolvedValue({
      id: 'cs_test_123',
      status: 'paid',
    });
  });

  it('successfully processes checkout.session.completed event', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-09-30.clover',
      created: Date.now(),
      data: {
        object: mockCheckoutSession as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'checkout.session.completed',
    };

    (verifyWebhookSignature as any).mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.success).toBe(true);
    expect(data.data.received).toBe(true);
    expect(createOrder).toHaveBeenCalled();
  });

  it('creates order with correct data', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-09-30.clover',
      created: Date.now(),
      data: {
        object: mockCheckoutSession as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'checkout.session.completed',
    };

    (verifyWebhookSignature as any).mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    await POST(request);

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
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
      })
    );
  });

  it('extracts shipping address correctly', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-09-30.clover',
      created: Date.now(),
      data: {
        object: mockCheckoutSession as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'checkout.session.completed',
    };

    (verifyWebhookSignature as any).mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    await POST(request);

    const callArgs = (createOrder as any).mock.calls[0][0];
    expect(callArgs.shippingAddress).toEqual({
      name: 'Test User',
      line1: '123 Test St',
      line2: undefined,
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
    });
  });

  it('handles session without shipping address', async () => {
    const sessionWithoutShipping = {
      ...mockCheckoutSession,
      shipping_details: null,
    };

    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-09-30.clover',
      created: Date.now(),
      data: {
        object: sessionWithoutShipping as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'checkout.session.completed',
    };

    (verifyWebhookSignature as any).mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    await POST(request);

    const callArgs = (createOrder as any).mock.calls[0][0];
    expect(callArgs.shippingAddress).toBeUndefined();
  });

  it('rejects webhook without signature', async () => {
    (headers as any).mockResolvedValue({
      get: vi.fn().mockReturnValue(null),
    });

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe(ERROR_CODES.BAD_REQUEST);
    expect(data.error.message).toBe('Missing Stripe signature');
    expect(verifyWebhookSignature).not.toHaveBeenCalled();
  });

  it('rejects webhook with invalid signature', async () => {
    (verifyWebhookSignature as any).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
    expect(data.error.message).toBe('Invalid webhook signature');
  });

  it('rejects webhook with expired timestamp', async () => {
    (verifyWebhookSignature as any).mockImplementation(() => {
      throw new Error('Timestamp outside the tolerance zone');
    });

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.success).toBe(false);
  });

  it('throws error when cart items missing from metadata', async () => {
    const sessionWithoutCart = {
      ...mockCheckoutSession,
      metadata: {},
    };

    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-09-30.clover',
      created: Date.now(),
      data: {
        object: sessionWithoutCart as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'checkout.session.completed',
    };

    (verifyWebhookSignature as any).mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.success).toBe(false);
  });

  it('handles payment_intent.payment_failed event', async () => {
    const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
      id: 'pi_test_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'usd',
      status: 'requires_payment_method',
      last_payment_error: {
        type: 'card_error',
        code: 'card_declined',
        message: 'Your card was declined',
      },
    };

    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-09-30.clover',
      created: Date.now(),
      data: {
        object: mockPaymentIntent as Stripe.PaymentIntent,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'payment_intent.payment_failed',
    };

    (verifyWebhookSignature as any).mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.success).toBe(true);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('handles unhandled event types', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-09-30.clover',
      created: Date.now(),
      data: {
        object: {} as any,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'customer.created' as any,
    };

    (verifyWebhookSignature as any).mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.success).toBe(true);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('handles order creation failure', async () => {
    (createOrder as any).mockRejectedValue(new Error('Database error'));

    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-09-30.clover',
      created: Date.now(),
      data: {
        object: mockCheckoutSession as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'checkout.session.completed',
    };

    (verifyWebhookSignature as any).mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.success).toBe(false);
    expect(data.error.message).toBe('Webhook processing failed');
  });

  it('uses customer_email when customer_details.email is null', async () => {
    const sessionWithOnlyCustomerEmail = {
      ...mockCheckoutSession,
      customer_details: null,
    };

    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-09-30.clover',
      created: Date.now(),
      data: {
        object: sessionWithOnlyCustomerEmail as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'checkout.session.completed',
    };

    (verifyWebhookSignature as any).mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    await POST(request);

    const callArgs = (createOrder as any).mock.calls[0][0];
    expect(callArgs.customerEmail).toBe('test@example.com');
  });

  it('handles multiple items in cart', async () => {
    const multiItemCart = JSON.stringify([
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
    ]);

    const sessionWithMultipleItems = {
      ...mockCheckoutSession,
      metadata: {
        cartItems: multiItemCart,
      },
    };

    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-09-30.clover',
      created: Date.now(),
      data: {
        object: sessionWithMultipleItems as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'checkout.session.completed',
    };

    (verifyWebhookSignature as any).mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    await POST(request);

    const callArgs = (createOrder as any).mock.calls[0][0];
    expect(callArgs.items).toHaveLength(2);
  });

  it('handles item without variant', async () => {
    const cartWithoutVariant = JSON.stringify([
      {
        productId: 'Material-8x8-V',
        stripePriceId: 'price_test_123',
        quantity: 1,
        unitPrice: 2500,
        productName: 'Material-8x8-V',
      },
    ]);

    const sessionWithoutVariant = {
      ...mockCheckoutSession,
      metadata: {
        cartItems: cartWithoutVariant,
      },
    };

    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-09-30.clover',
      created: Date.now(),
      data: {
        object: sessionWithoutVariant as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'checkout.session.completed',
    };

    (verifyWebhookSignature as any).mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    await POST(request);

    const callArgs = (createOrder as any).mock.calls[0][0];
    expect(callArgs.items[0].variantId).toBeUndefined();
  });
});
