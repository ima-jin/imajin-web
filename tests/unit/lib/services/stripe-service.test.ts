import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stripe from 'stripe';
import {
  createCheckoutSession,
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
          { stripeProductId: 'price_123', quantity: 2 },
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
        items: [{ stripeProductId: 'price_123', quantity: 1 }],
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
        items: [{ stripeProductId: 'price_123', quantity: 1 }],
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
        items: [{ stripeProductId: 'price_123', quantity: 1 }],
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
          items: [{ stripeProductId: 'price_123', quantity: 1 }],
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
});
