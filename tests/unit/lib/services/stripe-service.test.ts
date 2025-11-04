import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stripe from 'stripe';
import {
  createCheckoutSession,
  createDepositCheckoutSession,
  createPreOrderCheckoutSession,
  getCheckoutSession,
  verifyWebhookSignature,
  createRefund,
  getStripeInstance,
} from '@/lib/services/stripe-service';

// Mock Stripe
vi.mock('stripe');

describe('Stripe Service', () => {
  let mockStripe: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment variable for Stripe secret key
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_mock_key_for_testing');

    // Mock Stripe instance
    mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn(),
          retrieve: vi.fn(),
        },
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
      refunds: {
        create: vi.fn(),
      },
    };

    // Mock Stripe constructor
    (Stripe as any).mockImplementation(() => mockStripe);
  });

  describe('getStripeInstance', () => {
    it('returns configured Stripe instance', () => {
      const stripe = getStripeInstance();
      expect(stripe).toBeDefined();
    });
  });

  describe('createCheckoutSession', () => {
    it('creates session with valid params', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      };

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await createCheckoutSession({
        items: [
          { stripePriceId: 'price_123', quantity: 2 },
        ],
        customerEmail: 'test@example.com',
      });

      expect(result).toEqual(mockSession);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          customer_email: 'test@example.com',
          line_items: [
            { price: 'price_123', quantity: 2 },
          ],
        })
      );
    });

    it('includes metadata in session', async () => {
      const mockSession = { id: 'cs_test_123', url: 'https://checkout.stripe.com/test' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createCheckoutSession({
        items: [{ stripePriceId: 'price_123', quantity: 1 }],
        customerEmail: 'test@example.com',
        metadata: { orderId: 'order_123' },
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { orderId: 'order_123' },
        })
      );
    });

    it('sets success and cancel URLs', async () => {
      const mockSession = { id: 'cs_test_123', url: 'https://checkout.stripe.com/test' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createCheckoutSession({
        items: [{ stripePriceId: 'price_123', quantity: 1 }],
        customerEmail: 'test@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining('success'),
          cancel_url: 'https://example.com/cancel',
        })
      );
    });

    it('enables shipping address collection', async () => {
      const mockSession = { id: 'cs_test_123', url: 'https://checkout.stripe.com/test' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createCheckoutSession({
        items: [{ stripePriceId: 'price_123', quantity: 1 }],
        customerEmail: 'test@example.com',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shipping_address_collection: expect.objectContaining({
            allowed_countries: expect.arrayContaining(['US']),
          }),
        })
      );
    });

    it('throws error when Stripe API fails', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Stripe API error')
      );

      await expect(
        createCheckoutSession({
          items: [{ stripePriceId: 'price_123', quantity: 1 }],
          customerEmail: 'test@example.com',
        })
      ).rejects.toThrow('Stripe API error');
    });
  });

  describe('getCheckoutSession', () => {
    it('retrieves session by ID', async () => {
      const mockSession = {
        id: 'cs_test_123',
        payment_status: 'paid',
        customer_email: 'test@example.com',
      };

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(mockSession);

      const result = await getCheckoutSession('cs_test_123');

      expect(result).toEqual(mockSession);
      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith(
        'cs_test_123',
        expect.objectContaining({
          expand: expect.arrayContaining(['line_items']),
        })
      );
    });

    it('expands line items and payment intent', async () => {
      const mockSession = { id: 'cs_test_123' };
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(mockSession);

      await getCheckoutSession('cs_test_123');

      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith(
        'cs_test_123',
        expect.objectContaining({
          expand: expect.arrayContaining(['line_items', 'payment_intent']),
        })
      );
    });

    it('throws error for invalid session ID', async () => {
      mockStripe.checkout.sessions.retrieve.mockRejectedValue(
        new Error('No such checkout session')
      );

      await expect(getCheckoutSession('invalid_id')).rejects.toThrow(
        'No such checkout session'
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    it('verifies valid webhook signature', () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: { object: {} },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = verifyWebhookSignature(
        'payload',
        'signature',
        'webhook_secret'
      );

      expect(result).toEqual(mockEvent);
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'payload',
        'signature',
        'webhook_secret'
      );
    });

    it('throws error for invalid signature', () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      expect(() =>
        verifyWebhookSignature('payload', 'bad_signature', 'webhook_secret')
      ).toThrow('Invalid signature');
    });

    it('throws error for expired signature', () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Timestamp outside the tolerance zone');
      });

      expect(() =>
        verifyWebhookSignature('payload', 'signature', 'webhook_secret')
      ).toThrow('Timestamp outside the tolerance zone');
    });
  });

  describe('createRefund', () => {
    it('creates full refund', async () => {
      const mockRefund = {
        id: 're_test_123',
        amount: 5000,
        status: 'succeeded',
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await createRefund('pi_test_123');

      expect(result).toEqual(mockRefund);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
      });
    });

    it('creates partial refund', async () => {
      const mockRefund = {
        id: 're_test_123',
        amount: 2500,
        status: 'succeeded',
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await createRefund('pi_test_123', 2500);

      expect(result).toEqual(mockRefund);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: 2500,
      });
    });

    it('throws error for invalid payment intent', async () => {
      mockStripe.refunds.create.mockRejectedValue(
        new Error('No such payment_intent')
      );

      await expect(createRefund('invalid_pi')).rejects.toThrow(
        'No such payment_intent'
      );
    });
  });

  describe('createDepositCheckoutSession', () => {
    it('creates deposit session with correct metadata', async () => {
      const mockSession = {
        id: 'cs_deposit_123',
        url: 'https://checkout.stripe.com/deposit',
      };

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await createDepositCheckoutSession({
        productId: 'prod_founder_edition',
        depositAmount: 50000, // $500
        customerEmail: 'test@example.com',
      });

      expect(result).toEqual(mockSession);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          customer_email: 'test@example.com',
          metadata: {
            order_type: 'pre-sale-deposit',
            target_product_id: 'prod_founder_edition',
          },
        })
      );
    });

    it('includes variant ID in metadata when provided', async () => {
      const mockSession = { id: 'cs_deposit_123' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createDepositCheckoutSession({
        productId: 'prod_founder_edition',
        variantId: 'variant_black',
        depositAmount: 50000,
        customerEmail: 'test@example.com',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            order_type: 'pre-sale-deposit',
            target_product_id: 'prod_founder_edition',
            target_variant_id: 'variant_black',
          },
        })
      );
    });

    it('creates line item with correct deposit amount', async () => {
      const mockSession = { id: 'cs_deposit_123' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createDepositCheckoutSession({
        productId: 'prod_founder_edition',
        depositAmount: 50000,
        customerEmail: 'test@example.com',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Pre-Sale Deposit',
                  description: 'Refundable deposit to secure wholesale pricing',
                },
                unit_amount: 50000,
              },
              quantity: 1,
            },
          ],
        })
      );
    });

    it('sets custom success and cancel URLs', async () => {
      const mockSession = { id: 'cs_deposit_123' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createDepositCheckoutSession({
        productId: 'prod_founder_edition',
        depositAmount: 50000,
        customerEmail: 'test@example.com',
        successUrl: 'https://example.com/deposit-success',
        cancelUrl: 'https://example.com/deposit-cancel',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://example.com/deposit-success',
          cancel_url: 'https://example.com/deposit-cancel',
        })
      );
    });

    it('does not collect shipping address for deposits', async () => {
      const mockSession = { id: 'cs_deposit_123' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createDepositCheckoutSession({
        productId: 'prod_founder_edition',
        depositAmount: 50000,
        customerEmail: 'test@example.com',
      });

      const callArgs = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(callArgs.shipping_address_collection).toBeUndefined();
    });
  });

  describe('createPreOrderCheckoutSession', () => {
    it('creates pre-order session with deposit metadata', async () => {
      const mockSession = {
        id: 'cs_preorder_123',
        url: 'https://checkout.stripe.com/preorder',
      };

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await createPreOrderCheckoutSession({
        items: [{ stripePriceId: 'price_wholesale_123', quantity: 1 }],
        customerEmail: 'test@example.com',
        depositOrderId: 'cs_deposit_123',
      });

      expect(result).toEqual(mockSession);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          customer_email: 'test@example.com',
          metadata: {
            order_type: 'pre-order-with-deposit',
            deposit_order_id: 'cs_deposit_123',
          },
        })
      );
    });

    it('creates session without deposit ID when not provided', async () => {
      const mockSession = { id: 'cs_preorder_123' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createPreOrderCheckoutSession({
        items: [{ stripePriceId: 'price_base_123', quantity: 1 }],
        customerEmail: 'test@example.com',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            order_type: 'pre-order-with-deposit',
          },
        })
      );
    });

    it('includes line items for multiple products', async () => {
      const mockSession = { id: 'cs_preorder_123' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createPreOrderCheckoutSession({
        items: [
          { stripePriceId: 'price_123', quantity: 2 },
          { stripePriceId: 'price_456', quantity: 1 },
        ],
        customerEmail: 'test@example.com',
        depositOrderId: 'cs_deposit_123',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            { price: 'price_123', quantity: 2 },
            { price: 'price_456', quantity: 1 },
          ],
        })
      );
    });

    it('enables shipping address collection', async () => {
      const mockSession = { id: 'cs_preorder_123' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createPreOrderCheckoutSession({
        items: [{ stripePriceId: 'price_123', quantity: 1 }],
        customerEmail: 'test@example.com',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shipping_address_collection: expect.objectContaining({
            allowed_countries: expect.arrayContaining(['US', 'CA']),
          }),
        })
      );
    });

    it('sets custom success and cancel URLs', async () => {
      const mockSession = { id: 'cs_preorder_123' };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createPreOrderCheckoutSession({
        items: [{ stripePriceId: 'price_123', quantity: 1 }],
        customerEmail: 'test@example.com',
        successUrl: 'https://example.com/preorder-success',
        cancelUrl: 'https://example.com/preorder-cancel',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://example.com/preorder-success',
          cancel_url: 'https://example.com/preorder-cancel',
        })
      );
    });
  });
});
