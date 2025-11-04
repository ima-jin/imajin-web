import { describe, it, expect } from 'vitest';
import {
  ShippingAddressSchema,
  CheckoutSessionRequestSchema,
  OrderLookupSchema,
} from '@/lib/validation/checkout-schemas';

describe('Checkout Validation Schemas', () => {
  describe('ShippingAddressSchema', () => {
    const validAddress = {
      name: 'Test User',
      email: 'test@example.com',
      addressLine1: '123 Test St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
    };

    it('validates valid shipping address', () => {
      const result = ShippingAddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('requires name field', () => {
      const invalid = { ...validAddress, name: '' };
      const result = ShippingAddressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });

    it('requires valid email', () => {
      const invalid = { ...validAddress, email: 'invalid-email' };
      const result = ShippingAddressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('requires addressLine1', () => {
      const invalid = { ...validAddress, addressLine1: '' };
      const result = ShippingAddressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Address is required');
      }
    });

    it('accepts optional addressLine2', () => {
      const withLine2 = { ...validAddress, addressLine2: 'Apt 4B' };
      const result = ShippingAddressSchema.safeParse(withLine2);
      expect(result.success).toBe(true);
    });

    it('accepts missing addressLine2', () => {
      const result = ShippingAddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('requires city', () => {
      const invalid = { ...validAddress, city: '' };
      const result = ShippingAddressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('City is required');
      }
    });

    it('requires state with at least 2 characters', () => {
      const invalid = { ...validAddress, state: 'C' };
      const result = ShippingAddressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('State is required');
      }
    });

    it('requires postal code with at least 5 characters', () => {
      const invalid = { ...validAddress, postalCode: '941' };
      const result = ShippingAddressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Postal code is required');
      }
    });

    it('requires country with at least 2 characters', () => {
      const invalid = { ...validAddress, country: 'U' };
      const result = ShippingAddressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Country is required');
      }
    });

    it('defaults country to US when not provided', () => {
      const withoutCountry = { ...validAddress };
      delete (withoutCountry as any).country;
      const result = ShippingAddressSchema.safeParse(withoutCountry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.country).toBe('US');
      }
    });

    it('accepts optional phone field', () => {
      const withPhone = { ...validAddress, phone: '555-1234' };
      const result = ShippingAddressSchema.safeParse(withPhone);
      expect(result.success).toBe(true);
    });

    it('accepts missing phone field', () => {
      const result = ShippingAddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('rejects when multiple fields are invalid', () => {
      const invalid = {
        name: '',
        email: 'bad-email',
        addressLine1: '',
        city: '',
        state: 'C',
        postalCode: '94',
        country: '',
      };
      const result = ShippingAddressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });
  });

  describe('CheckoutSessionRequestSchema', () => {
    const validItem = {
      productId: 'Material-8x8-V',
      variantId: 'variant_black',
      quantity: 2,
      price: 2500,
      stripePriceId: 'price_test_123',
      productName: 'Material-8x8-V',
      variantValue: 'BLACK',
    };

    const validRequest = {
      items: [validItem],
      customerEmail: 'test@example.com',
    };

    it('validates valid checkout request', () => {
      const result = CheckoutSessionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('requires at least one item', () => {
      const invalid = { ...validRequest, items: [] };
      const result = CheckoutSessionRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Cart must have at least one item');
      }
    });

    it('requires valid customer email', () => {
      const invalid = { ...validRequest, customerEmail: 'invalid-email' };
      const result = CheckoutSessionRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('requires positive quantity', () => {
      const invalid = {
        ...validRequest,
        items: [{ ...validItem, quantity: 0 }],
      };
      const result = CheckoutSessionRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('requires integer quantity', () => {
      const invalid = {
        ...validRequest,
        items: [{ ...validItem, quantity: 1.5 }],
      };
      const result = CheckoutSessionRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('requires non-negative price', () => {
      const invalid = {
        ...validRequest,
        items: [{ ...validItem, price: -100 }],
      };
      const result = CheckoutSessionRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('requires stripePriceId', () => {
      const itemWithoutStripeId = { ...validItem };
      delete (itemWithoutStripeId as any).stripePriceId;
      const invalid = {
        ...validRequest,
        items: [itemWithoutStripeId],
      };
      const result = CheckoutSessionRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('requires productName', () => {
      const itemWithoutProductName = { ...validItem };
      delete (itemWithoutProductName as any).productName;
      const invalid = {
        ...validRequest,
        items: [itemWithoutProductName],
      };
      const result = CheckoutSessionRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts item without variantId', () => {
      const withoutVariant = {
        ...validRequest,
        items: [
          {
            productId: 'Material-8x8-V',
            quantity: 1,
            price: 2500,
            stripePriceId: 'price_test_123',
            productName: 'Material-8x8-V',
          },
        ],
      };
      const result = CheckoutSessionRequestSchema.safeParse(withoutVariant);
      expect(result.success).toBe(true);
    });

    it('accepts item without variantValue', () => {
      const withoutVariantValue = {
        ...validRequest,
        items: [
          {
            ...validItem,
            variantValue: undefined,
          },
        ],
      };
      const result = CheckoutSessionRequestSchema.safeParse(withoutVariantValue);
      expect(result.success).toBe(true);
    });

    it('accepts multiple items', () => {
      const withMultipleItems = {
        ...validRequest,
        items: [
          validItem,
          {
            productId: 'Founder-8x8-V',
            quantity: 1,
            price: 10000,
            stripePriceId: 'price_test_456',
            productName: 'Founder-8x8-V',
          },
        ],
      };
      const result = CheckoutSessionRequestSchema.safeParse(withMultipleItems);
      expect(result.success).toBe(true);
    });

    it('accepts optional shipping address', () => {
      const withShipping = {
        ...validRequest,
        shippingAddress: {
          name: 'Test User',
          email: 'test@example.com',
          addressLine1: '123 Test St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94102',
          country: 'US',
        },
      };
      const result = CheckoutSessionRequestSchema.safeParse(withShipping);
      expect(result.success).toBe(true);
    });

    it('accepts missing shipping address', () => {
      const result = CheckoutSessionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('validates shipping address when provided', () => {
      const withInvalidShipping = {
        ...validRequest,
        shippingAddress: {
          name: '',
          email: 'bad-email',
          addressLine1: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      };
      const result = CheckoutSessionRequestSchema.safeParse(withInvalidShipping);
      expect(result.success).toBe(false);
    });

    it('accepts optional metadata', () => {
      const withMetadata = {
        ...validRequest,
        metadata: {
          orderId: 'order_123',
          customerId: 'cust_456',
        },
      };
      const result = CheckoutSessionRequestSchema.safeParse(withMetadata);
      expect(result.success).toBe(true);
    });

    it('accepts missing metadata', () => {
      const result = CheckoutSessionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('requires metadata values to be strings', () => {
      const withInvalidMetadata = {
        ...validRequest,
        metadata: {
          count: 123 as any,
        },
      };
      const result = CheckoutSessionRequestSchema.safeParse(withInvalidMetadata);
      expect(result.success).toBe(false);
    });
  });

  describe('OrderLookupSchema', () => {
    const validLookup = {
      email: 'test@example.com',
      orderId: 'cs_test_123',
    };

    it('validates valid order lookup', () => {
      const result = OrderLookupSchema.safeParse(validLookup);
      expect(result.success).toBe(true);
    });

    it('requires valid email', () => {
      const invalid = { ...validLookup, email: 'invalid-email' };
      const result = OrderLookupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('requires non-empty email', () => {
      const invalid = { ...validLookup, email: '' };
      const result = OrderLookupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('requires orderId', () => {
      const invalid = { ...validLookup, orderId: '' };
      const result = OrderLookupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Order ID is required');
      }
    });

    it('rejects when both fields are invalid', () => {
      const invalid = {
        email: 'bad-email',
        orderId: '',
      };
      const result = OrderLookupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('rejects missing email field', () => {
      const invalid = { orderId: 'cs_test_123' };
      const result = OrderLookupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects missing orderId field', () => {
      const invalid = { email: 'test@example.com' };
      const result = OrderLookupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
