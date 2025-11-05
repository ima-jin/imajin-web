import { z } from 'zod';

/**
 * Schema for deposit checkout requests
 * Used when customer initiates a pre-sale deposit payment
 */
export const DepositCheckoutSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  email: z.string().email('Valid email address is required'),
  quantity: z.number().int().positive().default(1),
});

export type DepositCheckoutRequest = z.infer<typeof DepositCheckoutSchema>;

/**
 * Schema for checking deposit status
 * Used to verify if a customer has paid a deposit for a product
 */
export const DepositCheckSchema = z.object({
  email: z.string().email('Valid email address is required'),
  productId: z.string().min(1, 'Product ID is required'),
});

export type DepositCheckRequest = z.infer<typeof DepositCheckSchema>;

/**
 * Schema for deposit checkout response
 */
export const DepositCheckoutResponseSchema = z.object({
  url: z.string().url('Invalid checkout URL'),
});

export type DepositCheckoutResponse = z.infer<typeof DepositCheckoutResponseSchema>;

/**
 * Schema for deposit status response
 */
export const DepositStatusResponseSchema = z.object({
  hasDeposit: z.boolean(),
  depositAmount: z.number().nullable(),
  orderId: z.string().nullable(),
});

export type DepositStatusResponse = z.infer<typeof DepositStatusResponseSchema>;
