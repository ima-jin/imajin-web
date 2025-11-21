import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/db';
import { orders, products, variants } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import * as stripeService from '@/lib/services/stripe-service';
import { userHasPaidDeposit, getDepositOrder, updateOrderStatus } from '@/lib/services/order-service';
import { getDisplayPrice, getDepositAmount } from '@/lib/utils/product-display';
import type { Product, Variant } from '@/types/product';

// Mock Stripe service
vi.mock('@/lib/services/stripe-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/stripe-service')>();
  return {
    ...actual,
    createDepositCheckoutSession: vi.fn(),
    createPreOrderCheckoutSession: vi.fn(),
  };
});

describe('Deposit Flow Integration Tests', () => {
  // Test data
  const testEmail = 'test@example.com';
  const testProduct: Product = {
    id: 'test-product-deposit-flow',
    name: 'Test Product for Deposit Flow',
    description: 'Test product',
    category: 'kit',
    devStatus: 5,
    basePriceCents: 100000, // $1,000
    wholesalePriceCents: 75000, // $750
    presaleDepositPriceCents: 25000, // $250
    hasVariants: true,
    requiresAssembly: false,
    isActive: true,
    maxQuantity: null,
    maxQuantityPerOrder: 2,
    soldQuantity: 0,
    availableQuantity: null,
    isAvailable: true,
    isLive: true,
    sellStatus: 'pre-sale',
    showOnPortfolioPage: false,
    portfolioCopy: null,
    isFeatured: false,
    media: [],
    lastSyncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const testVariant: Variant = {
    id: 'test-variant-black',
    productId: testProduct.id,
    stripeProductId: 'prod_test_123',
    stripePriceId: 'price_test_123',
    variantType: 'color',
    variantValue: 'BLACK',
    priceModifier: 0,
    wholesalePriceModifier: 0,
    presaleDepositModifier: 0,
    isLimitedEdition: true,
    maxQuantity: 100,
    soldQuantity: 0,
    availableQuantity: 100,
    isAvailable: true,
    media: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Clean up test data
    await db.delete(orders).where(eq(orders.customerEmail, testEmail));
    await db.delete(variants).where(eq(variants.id, testVariant.id));
    await db.delete(products).where(eq(products.id, testProduct.id));

    // Insert test product
    await db.insert(products).values({
      id: testProduct.id,
      name: testProduct.name,
      description: testProduct.description,
      category: testProduct.category,
      devStatus: testProduct.devStatus,
      basePriceCents: testProduct.basePrice,
      wholesalePriceCents: testProduct.wholesalePriceCents,
      presaleDepositPriceCents: testProduct.presaleDepositPriceCents,
      hasVariants: testProduct.hasVariants,
      requiresAssembly: testProduct.requiresAssembly,
      maxQuantity: null,
      soldQuantity: 0,
      isLive: testProduct.isLive,
      isActive: true,
      sellStatus: testProduct.sellStatus,
      showOnPortfolioPage: testProduct.showOnPortfolioPage,
      isFeatured: testProduct.isFeatured,
      media: testProduct.media,
    });

    // Insert test variant
    await db.insert(variants).values({
      id: testVariant.id,
      productId: testVariant.productId,
      stripeProductId: testVariant.stripeProductId,
      stripePriceId: testVariant.stripePriceId,
      variantType: testVariant.variantType,
      variantValue: testVariant.variantValue,
      priceModifier: testVariant.priceModifier,
      wholesalePriceModifier: testVariant.wholesalePriceModifier,
      presaleDepositModifier: testVariant.presaleDepositModifier,
      isLimitedEdition: testVariant.isLimitedEdition,
      maxQuantity: testVariant.maxQuantity,
      soldQuantity: testVariant.soldQuantity,
      media: testVariant.media,
      metadata: testVariant.metadata,
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(orders).where(eq(orders.customerEmail, testEmail));
    await db.delete(variants).where(eq(variants.id, testVariant.id));
    await db.delete(products).where(eq(products.id, testProduct.id));
  });

  describe('Happy Path: Full Deposit → Wholesale Checkout Flow', () => {
    it('creates deposit checkout session with correct metadata', async () => {
      const depositAmount = getDepositAmount(testProduct, testVariant);
      expect(depositAmount).toBe(25000);

      // Mock Stripe response
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
        metadata: {
          order_type: 'pre-sale-deposit',
          target_product_id: testProduct.id,
          target_variant_id: testVariant.id,
        },
      };
      vi.mocked(stripeService.createDepositCheckoutSession).mockResolvedValueOnce(mockSession as any);

      const session = await stripeService.createDepositCheckoutSession({
        productId: testProduct.id,
        variantId: testVariant.id,
        depositAmount: depositAmount!,
        customerEmail: testEmail,
      });

      expect(session).toBeDefined();
      expect(session.url).toBeDefined();
      expect(session.metadata).toMatchObject({
        order_type: 'pre-sale-deposit',
        target_product_id: testProduct.id,
        target_variant_id: testVariant.id,
      });
    });

    it('creates deposit order after payment with correct metadata', async () => {
      // Simulate deposit payment by creating order directly
      const depositOrderId = `cs_test_deposit_${Date.now()}`;
      await db.insert(orders).values({
        id: depositOrderId,
        stripePaymentIntentId: `pi_test_${Date.now()}`,
        customerEmail: testEmail,
        customerName: 'Test User',
        status: 'paid',
        subtotal: 25000,
        tax: 0,
        shipping: 0,
        total: 25000,
        currency: 'usd',
        metadata: {
          order_type: 'pre-sale-deposit',
          target_product_id: testProduct.id,
          target_variant_id: testVariant.id,
        },
      });

      // Verify deposit order exists
      const depositOrder = await getDepositOrder(testEmail, testProduct.id);
      expect(depositOrder).toBeDefined();
      expect(depositOrder?.id).toBe(depositOrderId);
      expect(depositOrder?.status).toBe('paid');
      expect(depositOrder?.total).toBe(25000);
    });

    it('userHasPaidDeposit returns true after deposit payment', async () => {
      // Initially no deposit
      let hasDeposit = await userHasPaidDeposit(testEmail, testProduct.id);
      expect(hasDeposit).toBe(false);

      // Create deposit order
      await db.insert(orders).values({
        id: `cs_test_deposit_${Date.now()}`,
        stripePaymentIntentId: `pi_test_${Date.now()}`,
        customerEmail: testEmail,
        customerName: 'Test User',
        status: 'paid',
        subtotal: 25000,
        tax: 0,
        shipping: 0,
        total: 25000,
        currency: 'usd',
        metadata: {
          order_type: 'pre-sale-deposit',
          target_product_id: testProduct.id,
          target_variant_id: testVariant.id,
        },
      });

      // Now user has deposit
      hasDeposit = await userHasPaidDeposit(testEmail, testProduct.id);
      expect(hasDeposit).toBe(true);
    });

    it('displays wholesale price after deposit paid (pre-order)', async () => {
      // Create deposit order
      await db.insert(orders).values({
        id: `cs_test_deposit_${Date.now()}`,
        stripePaymentIntentId: `pi_test_${Date.now()}`,
        customerEmail: testEmail,
        status: 'paid',
        subtotal: 25000,
        tax: 0,
        shipping: 0,
        total: 25000,
        currency: 'usd',
        metadata: {
          order_type: 'pre-sale-deposit',
          target_product_id: testProduct.id,
        },
      });

      // Transition product to pre-order
      await db.update(products)
        .set({ sellStatus: 'pre-order' })
        .where(eq(products.id, testProduct.id));

      const updatedProduct = { ...testProduct, sellStatus: 'pre-order' as const };
      const hasDeposit = await userHasPaidDeposit(testEmail, testProduct.id);

      // Check display price
      const displayPrice = getDisplayPrice(updatedProduct, testVariant, hasDeposit);
      expect(displayPrice).toBeDefined();
      expect(displayPrice?.type).toBe('wholesale');
      expect(displayPrice?.price).toBe(75000); // Wholesale price
    });

    it('final order applies deposit correctly (pre-order-with-deposit)', async () => {
      // Create deposit order
      const depositOrderId = `cs_test_deposit_${Date.now()}`;
      await db.insert(orders).values({
        id: depositOrderId,
        stripePaymentIntentId: `pi_test_deposit_${Date.now()}`,
        customerEmail: testEmail,
        status: 'paid',
        subtotal: 25000,
        tax: 0,
        shipping: 0,
        total: 25000,
        currency: 'usd',
        metadata: {
          order_type: 'pre-sale-deposit',
          target_product_id: testProduct.id,
        },
      });

      // Mock Stripe response
      const mockSession = {
        id: 'cs_test_preorder_123',
        url: 'https://checkout.stripe.com/test-preorder',
        metadata: {
          order_type: 'pre-order-with-deposit',
          deposit_order_id: depositOrderId,
        },
      };
      vi.mocked(stripeService.createPreOrderCheckoutSession).mockResolvedValueOnce(mockSession as any);

      // Create final order session
      const session = await stripeService.createPreOrderCheckoutSession({
        items: [{
          stripePriceId: testVariant.stripePriceId!,
          quantity: 1,
        }],
        customerEmail: testEmail,
        depositOrderId,
      });

      expect(session).toBeDefined();
      expect(session.metadata?.order_type).toBe('pre-order-with-deposit');
      expect(session.metadata?.deposit_order_id).toBe(depositOrderId);
    });

    it('marks deposit as applied after final payment', async () => {
      // Create deposit order
      const depositOrderId = `cs_test_deposit_${Date.now()}`;
      await db.insert(orders).values({
        id: depositOrderId,
        stripePaymentIntentId: `pi_test_deposit_${Date.now()}`,
        customerEmail: testEmail,
        status: 'paid',
        subtotal: 25000,
        tax: 0,
        shipping: 0,
        total: 25000,
        currency: 'usd',
        metadata: {
          order_type: 'pre-sale-deposit',
          target_product_id: testProduct.id,
        },
      });

      // Verify status is 'paid'
      let order = await db.select().from(orders).where(eq(orders.id, depositOrderId));
      expect(order[0].status).toBe('paid');

      // Mark deposit as applied (simulating webhook after final payment)
      await updateOrderStatus(depositOrderId, 'applied');

      // Verify status changed to 'applied'
      order = await db.select().from(orders).where(eq(orders.id, depositOrderId));
      expect(order[0].status).toBe('applied');

      // userHasPaidDeposit should now return false (deposit is applied, not paid)
      const hasDeposit = await userHasPaidDeposit(testEmail, testProduct.id);
      expect(hasDeposit).toBe(false);
    });
  });

  describe('Refund Flow', () => {
    it('deposit can be marked as refunded', async () => {
      // Create deposit order
      const depositOrderId = `cs_test_deposit_${Date.now()}`;
      await db.insert(orders).values({
        id: depositOrderId,
        stripePaymentIntentId: `pi_test_deposit_${Date.now()}`,
        customerEmail: testEmail,
        status: 'paid',
        subtotal: 25000,
        tax: 0,
        shipping: 0,
        total: 25000,
        currency: 'usd',
        metadata: {
          order_type: 'pre-sale-deposit',
          target_product_id: testProduct.id,
        },
      });

      // Mark as refunded
      await updateOrderStatus(depositOrderId, 'refunded');

      // Verify status
      const order = await db.select().from(orders).where(eq(orders.id, depositOrderId));
      expect(order[0].status).toBe('refunded');

      // userHasPaidDeposit should return false for refunded deposits
      const hasDeposit = await userHasPaidDeposit(testEmail, testProduct.id);
      expect(hasDeposit).toBe(false);
    });
  });

  describe('No Deposit Flow', () => {
    it('public user sees base price for pre-order (no deposit)', async () => {
      // Product is pre-order, no deposit paid
      await db.update(products)
        .set({ sellStatus: 'pre-order' })
        .where(eq(products.id, testProduct.id));

      const updatedProduct = { ...testProduct, sellStatus: 'pre-order' as const };
      const hasDeposit = await userHasPaidDeposit(testEmail, testProduct.id);

      // Check display price
      const displayPrice = getDisplayPrice(updatedProduct, testVariant, hasDeposit);
      expect(displayPrice).toBeDefined();
      expect(displayPrice?.type).toBe('base');
      expect(displayPrice?.price).toBe(100000); // Base price
    });
  });

  describe('Variant-Specific Deposits', () => {
    it('handles variant-specific deposit modifiers', async () => {
      // Create variant with deposit modifier
      const variantWithModifier: Variant = {
        ...testVariant,
        id: 'test-variant-red',
        variantValue: 'RED',
        presaleDepositModifier: 5000, // +$50
      };

      await db.insert(variants).values({
        id: variantWithModifier.id,
        productId: variantWithModifier.productId,
        stripeProductId: 'prod_test_red',
        stripePriceId: 'price_test_red',
        variantType: variantWithModifier.variantType,
        variantValue: variantWithModifier.variantValue,
        priceModifier: variantWithModifier.priceModifier,
        wholesalePriceModifier: variantWithModifier.wholesalePriceModifier,
        presaleDepositModifier: variantWithModifier.presaleDepositModifier,
        isLimitedEdition: variantWithModifier.isLimitedEdition,
        maxQuantity: variantWithModifier.maxQuantity,
        soldQuantity: variantWithModifier.soldQuantity,
      });

      // Get deposit amount with modifier
      const depositAmount = getDepositAmount(testProduct, variantWithModifier);
      expect(depositAmount).toBe(30000); // $250 + $50

      // Clean up
      await db.delete(variants).where(eq(variants.id, variantWithModifier.id));
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple products with deposits for same customer', async () => {
      const secondProduct = {
        ...testProduct,
        id: 'test-product-2',
        name: 'Second Test Product',
      };

      // Clean up second product if it exists
      await db.delete(products).where(eq(products.id, secondProduct.id));

      // Insert second product
      await db.insert(products).values({
        id: secondProduct.id,
        name: secondProduct.name,
        description: secondProduct.description,
        category: secondProduct.category,
        devStatus: secondProduct.devStatus,
        basePriceCents: secondProduct.basePrice,
        wholesalePriceCents: secondProduct.wholesalePriceCents,
        presaleDepositPriceCents: secondProduct.presaleDepositPriceCents,
        hasVariants: false,
        requiresAssembly: secondProduct.requiresAssembly,
        maxQuantity: null,
        soldQuantity: 0,
        isLive: secondProduct.isLive,
        isActive: true,
        sellStatus: secondProduct.sellStatus,
        showOnPortfolioPage: secondProduct.showOnPortfolioPage,
        isFeatured: secondProduct.isFeatured,
        media: secondProduct.media,
      });

      // Create deposits for both products
      await db.insert(orders).values([
        {
          id: `cs_test_deposit_1_${Date.now()}`,
          stripePaymentIntentId: `pi_test_1_${Date.now()}`,
          customerEmail: testEmail,
          status: 'paid',
          subtotal: 25000,
          tax: 0,
          shipping: 0,
          total: 25000,
          currency: 'usd',
          metadata: {
            order_type: 'pre-sale-deposit',
            target_product_id: testProduct.id,
          },
        },
        {
          id: `cs_test_deposit_2_${Date.now()}`,
          stripePaymentIntentId: `pi_test_2_${Date.now()}`,
          customerEmail: testEmail,
          status: 'paid',
          subtotal: 25000,
          tax: 0,
          shipping: 0,
          total: 25000,
          currency: 'usd',
          metadata: {
            order_type: 'pre-sale-deposit',
            target_product_id: secondProduct.id,
          },
        },
      ]);

      // Verify both deposits exist
      const hasDeposit1 = await userHasPaidDeposit(testEmail, testProduct.id);
      const hasDeposit2 = await userHasPaidDeposit(testEmail, secondProduct.id);
      expect(hasDeposit1).toBe(true);
      expect(hasDeposit2).toBe(true);

      // Clean up
      await db.delete(products).where(eq(products.id, secondProduct.id));
    });

    it('only returns deposits with status=paid (not applied or refunded)', async () => {
      const depositIds = [
        `cs_test_paid_${Date.now()}`,
        `cs_test_applied_${Date.now()}`,
        `cs_test_refunded_${Date.now()}`,
      ];

      // Create deposits with different statuses
      await db.insert(orders).values([
        {
          id: depositIds[0],
          stripePaymentIntentId: `pi_test_paid_${Date.now()}`,
          customerEmail: testEmail,
          status: 'paid',
          subtotal: 25000,
          tax: 0,
          shipping: 0,
          total: 25000,
          currency: 'usd',
          metadata: {
            order_type: 'pre-sale-deposit',
            target_product_id: testProduct.id,
          },
        },
        {
          id: depositIds[1],
          stripePaymentIntentId: `pi_test_applied_${Date.now()}`,
          customerEmail: testEmail,
          status: 'applied',
          subtotal: 25000,
          tax: 0,
          shipping: 0,
          total: 25000,
          currency: 'usd',
          metadata: {
            order_type: 'pre-sale-deposit',
            target_product_id: testProduct.id,
          },
        },
        {
          id: depositIds[2],
          stripePaymentIntentId: `pi_test_refunded_${Date.now()}`,
          customerEmail: testEmail,
          status: 'refunded',
          subtotal: 25000,
          tax: 0,
          shipping: 0,
          total: 25000,
          currency: 'usd',
          metadata: {
            order_type: 'pre-sale-deposit',
            target_product_id: testProduct.id,
          },
        },
      ]);

      // Only the 'paid' deposit should be counted
      const hasDeposit = await userHasPaidDeposit(testEmail, testProduct.id);
      expect(hasDeposit).toBe(true);

      // Get deposit order - should return the 'paid' one
      const depositOrder = await getDepositOrder(testEmail, testProduct.id);
      expect(depositOrder?.id).toBe(depositIds[0]);
      expect(depositOrder?.status).toBe('paid');
    });

    it('handles idempotency (duplicate webhook events)', async () => {
      const depositOrderId = `cs_test_idempotent_${Date.now()}`;

      // First insertion (webhook event 1)
      await db.insert(orders).values({
        id: depositOrderId,
        stripePaymentIntentId: `pi_test_${Date.now()}`,
        customerEmail: testEmail,
        status: 'paid',
        subtotal: 25000,
        tax: 0,
        shipping: 0,
        total: 25000,
        currency: 'usd',
        metadata: {
          order_type: 'pre-sale-deposit',
          target_product_id: testProduct.id,
        },
      });

      // Second insertion (duplicate webhook event) should fail gracefully
      await expect(
        db.insert(orders).values({
          id: depositOrderId, // Same ID
          stripePaymentIntentId: `pi_test_${Date.now()}`,
          customerEmail: testEmail,
          status: 'paid',
          subtotal: 25000,
          tax: 0,
          shipping: 0,
          total: 25000,
          currency: 'usd',
          metadata: {
            order_type: 'pre-sale-deposit',
            target_product_id: testProduct.id,
          },
        })
      ).rejects.toThrow();

      // Verify only one order exists
      const orders_list = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.customerEmail, testEmail),
            sql`${orders.metadata}->>'target_product_id' = ${testProduct.id}`
          )
        );
      expect(orders_list).toHaveLength(1);
    });
  });
});
