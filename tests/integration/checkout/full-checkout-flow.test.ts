import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createSession } from '@/app/api/checkout/session/route';
import { POST as handleWebhook } from '@/app/api/webhooks/stripe/route';
import { POST as lookupOrderRoute } from '@/app/api/orders/lookup/route';
import { NextRequest } from 'next/server';
import { HTTP_STATUS } from '@/lib/config/api';
import type Stripe from 'stripe';

// Mock the services
vi.mock('@/lib/services/stripe-service', () => ({
  createCheckoutSession: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));

vi.mock('@/lib/services/order-service', () => ({
  createOrder: vi.fn(),
  lookupOrder: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

import { createCheckoutSession, verifyWebhookSignature } from '@/lib/services/stripe-service';
import { createOrder, lookupOrder as lookupOrderService } from '@/lib/services/order-service';
import { headers } from 'next/headers';

describe('Full Checkout Flow Integration', () => {
  const cartItems = [
    {
      productId: 'Material-8x8-V',
      variantId: 'variant_black',
      quantity: 2,
      price: 2500,
      stripePriceId: 'price_test_123',
      productName: 'Material-8x8-V',
      variantValue: 'BLACK',
    },
  ];

  const customerEmail = 'test@example.com';
  const sessionId = 'cs_test_123';
  const paymentIntentId = 'pi_test_123';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock headers for webhook
    (headers as any).mockResolvedValue({
      get: vi.fn().mockReturnValue('valid_signature'),
    });
  });

  it('completes full checkout flow from session creation to order lookup', async () => {
    // Step 1: Create checkout session
    const mockSession = {
      id: sessionId,
      url: 'https://checkout.stripe.com/test',
    };

    (createCheckoutSession as any).mockResolvedValue(mockSession);

    const sessionRequest = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify({
        items: cartItems,
        customerEmail,
      }),
    });

    const sessionResponse = await createSession(sessionRequest);
    const sessionData = await sessionResponse.json();

    expect(sessionResponse.status).toBe(HTTP_STATUS.OK);
    expect(sessionData.success).toBe(true);
    expect(sessionData.data.sessionId).toBe(sessionId);

    // Step 2: Verify cart items were stored in metadata
    const sessionCallArgs = (createCheckoutSession as any).mock.calls[0][0];
    expect(sessionCallArgs.metadata.cartItems).toBeDefined();
    const storedCartItems = JSON.parse(sessionCallArgs.metadata.cartItems);
    expect(storedCartItems).toHaveLength(1);
    expect(storedCartItems[0].productId).toBe('Material-8x8-V');

    // Step 3: Process webhook event
    const mockCheckoutSession: any = {
      id: sessionId,
      payment_intent: paymentIntentId,
      customer_email: customerEmail,
      customer_details: {
        email: customerEmail,
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
        cartItems: JSON.stringify([
          {
            productId: 'Material-8x8-V',
            variantId: 'variant_black',
            stripePriceId: 'price_test_123',
            quantity: 2,
            unitPrice: 2500,
            productName: 'Material-8x8-V',
            variantName: 'BLACK',
          },
        ]),
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

    const mockWebhookEvent: Stripe.Event = {
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

    (verifyWebhookSignature as any).mockReturnValue(mockWebhookEvent);

    const mockCreatedOrder = {
      id: sessionId,
      stripePaymentIntentId: paymentIntentId,
      customerEmail,
      status: 'paid',
    };

    (createOrder as any).mockResolvedValue(mockCreatedOrder);

    const webhookRequest = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockWebhookEvent),
    });

    const webhookResponse = await handleWebhook(webhookRequest);
    const webhookData = await webhookResponse.json();

    expect(webhookResponse.status).toBe(HTTP_STATUS.OK);
    expect(webhookData.success).toBe(true);

    // Step 4: Verify order was created
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId,
        paymentIntentId,
        customerEmail,
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

    // Step 5: Lookup order
    const mockOrderWithItems = {
      ...mockCreatedOrder,
      items: [
        {
          id: 'item_1',
          orderId: sessionId,
          productId: 'Material-8x8-V',
          variantId: 'variant_black',
          quantity: 2,
          unitPrice: 2500,
          productName: 'Material-8x8-V',
        },
      ],
    };

    (lookupOrderService as any).mockResolvedValue(mockOrderWithItems);

    const lookupRequest = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify({
        email: customerEmail,
        orderId: sessionId,
      }),
    });

    const lookupResponse = await lookupOrderRoute(lookupRequest);
    const lookupData = await lookupResponse.json();

    expect(lookupResponse.status).toBe(HTTP_STATUS.OK);
    expect(lookupData.success).toBe(true);
    expect(lookupData.data.id).toBe(sessionId);
    expect(lookupData.data.items).toHaveLength(1);
  });

  it('handles multiple items in checkout flow', async () => {
    const multiItemCart = [
      {
        productId: 'Material-8x8-V',
        variantId: 'variant_black',
        quantity: 2,
        price: 2500,
        stripePriceId: 'price_test_123',
        productName: 'Material-8x8-V',
        variantValue: 'BLACK',
      },
      {
        productId: 'Founder-8x8-V',
        variantId: 'variant_red',
        quantity: 1,
        price: 10000,
        stripePriceId: 'price_test_456',
        productName: 'Founder-8x8-V',
        variantValue: 'RED',
      },
    ];

    (createCheckoutSession as any).mockResolvedValue({
      id: sessionId,
      url: 'https://checkout.stripe.com/test',
    });

    const sessionRequest = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify({
        items: multiItemCart,
        customerEmail,
      }),
    });

    const sessionResponse = await createSession(sessionRequest);
    expect(sessionResponse.status).toBe(HTTP_STATUS.OK);

    const sessionCallArgs = (createCheckoutSession as any).mock.calls[0][0];
    const storedCartItems = JSON.parse(sessionCallArgs.metadata.cartItems);
    expect(storedCartItems).toHaveLength(2);
  });

  it('preserves variant information through full flow', async () => {
    (createCheckoutSession as any).mockResolvedValue({
      id: sessionId,
      url: 'https://checkout.stripe.com/test',
    });

    const sessionRequest = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify({
        items: cartItems,
        customerEmail,
      }),
    });

    await createSession(sessionRequest);

    const sessionCallArgs = (createCheckoutSession as any).mock.calls[0][0];
    const storedCartItems = JSON.parse(sessionCallArgs.metadata.cartItems);

    expect(storedCartItems[0].variantId).toBe('variant_black');
    expect(storedCartItems[0].variantName).toBe('BLACK');
  });

  it('handles checkout flow without variants', async () => {
    const itemWithoutVariant = [
      {
        productId: 'Material-8x8-V',
        quantity: 1,
        price: 2500,
        stripePriceId: 'price_test_123',
        productName: 'Material-8x8-V',
      },
    ];

    (createCheckoutSession as any).mockResolvedValue({
      id: sessionId,
      url: 'https://checkout.stripe.com/test',
    });

    const sessionRequest = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify({
        items: itemWithoutVariant,
        customerEmail,
      }),
    });

    const sessionResponse = await createSession(sessionRequest);
    expect(sessionResponse.status).toBe(HTTP_STATUS.OK);

    const sessionCallArgs = (createCheckoutSession as any).mock.calls[0][0];
    const storedCartItems = JSON.parse(sessionCallArgs.metadata.cartItems);
    expect(storedCartItems[0].variantId).toBeUndefined();
  });

  it('includes shipping address in webhook processing', async () => {
    const mockCheckoutSession: any = {
      id: sessionId,
      payment_intent: paymentIntentId,
      customer_email: customerEmail,
      customer_details: {
        email: customerEmail,
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
        cartItems: JSON.stringify([
          {
            productId: 'Material-8x8-V',
            stripePriceId: 'price_test_123',
            quantity: 1,
            unitPrice: 2500,
            productName: 'Material-8x8-V',
          },
        ]),
      },
      shipping_details: {
        name: 'Test User',
        address: {
          line1: '123 Test St',
          line2: 'Apt 4B',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94102',
          country: 'US',
        },
      },
    };

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
    (createOrder as any).mockResolvedValue({
      id: sessionId,
      status: 'paid',
    });

    const webhookRequest = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    await handleWebhook(webhookRequest);

    const createOrderArgs = (createOrder as any).mock.calls[0][0];
    expect(createOrderArgs.shippingAddress).toBeDefined();
    expect(createOrderArgs.shippingAddress.line1).toBe('123 Test St');
    expect(createOrderArgs.shippingAddress.line2).toBe('Apt 4B');
  });

  it('rejects order lookup with wrong email', async () => {
    (lookupOrderService as any).mockResolvedValue(null);

    const lookupRequest = new NextRequest('http://localhost:3000/api/orders/lookup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'wrong@example.com',
        orderId: sessionId,
      }),
    });

    const lookupResponse = await lookupOrderRoute(lookupRequest);
    const lookupData = await lookupResponse.json();

    expect(lookupResponse.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(lookupData.success).toBe(false);
  });

  it('fails checkout with invalid cart data', async () => {
    const invalidCart = {
      items: [],
      customerEmail,
    };

    const sessionRequest = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(invalidCart),
    });

    const sessionResponse = await createSession(sessionRequest);
    const sessionData = await sessionResponse.json();

    expect(sessionResponse.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(sessionData.success).toBe(false);
  });

  it('preserves price information through flow', async () => {
    (createCheckoutSession as any).mockResolvedValue({
      id: sessionId,
      url: 'https://checkout.stripe.com/test',
    });

    const sessionRequest = new NextRequest('http://localhost:3000/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify({
        items: cartItems,
        customerEmail,
      }),
    });

    await createSession(sessionRequest);

    const sessionCallArgs = (createCheckoutSession as any).mock.calls[0][0];
    const storedCartItems = JSON.parse(sessionCallArgs.metadata.cartItems);

    expect(storedCartItems[0].unitPrice).toBe(2500);
    expect(storedCartItems[0].quantity).toBe(2);
  });
});
