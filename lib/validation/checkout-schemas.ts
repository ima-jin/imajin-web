import { z } from 'zod';

/**
 * Shipping address schema
 */
export const ShippingAddressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(5, 'Postal code is required'),
  country: z.string().min(2, 'Country is required').default('US'),
  phone: z.string().optional(),
});

export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

/**
 * Checkout session request schema
 */
export const CheckoutSessionRequestSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().int().positive(),
      price: z.number().int().nonnegative(),
      stripeProductId: z.string(), // Stripe Price ID
      productName: z.string(),
      variantValue: z.string().optional(),
    }),
    { message: 'Cart is empty' }
  ).min(1, { message: 'Cart must have at least one item' }),
  customerEmail: z.string().email('Invalid email address'),
  shippingAddress: ShippingAddressSchema.optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type CheckoutSessionRequest = z.infer<typeof CheckoutSessionRequestSchema>;

/**
 * Order lookup schema
 */
export const OrderLookupSchema = z.object({
  email: z.string().email('Invalid email address'),
  orderId: z.string().min(1, 'Order ID is required'),
});

export type OrderLookup = z.infer<typeof OrderLookupSchema>;
