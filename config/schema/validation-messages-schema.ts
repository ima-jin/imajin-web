import { z } from 'zod';

/**
 * Validation Messages Schema
 * Defines all error messages, warnings, and validation feedback used across the application
 * Many messages use template strings with placeholders like {product_name}, {quantity}, etc.
 */
export const ValidationMessagesSchema = z.object({
  version: z.string(),
  updated: z.string(),
  cart_validation: z.object({
    product_unavailable_template: z.string(),
    product_sold_out_template: z.string(),
    insufficient_stock_template: z.string(),
    quantity_exceeds_stock_template: z.string(),
    voltage_mismatch: z.string(),
    missing_required_component_template: z.string(),
    suggested_component_template: z.string(),
    incompatible_products_template: z.string(),
  }),
  product_validation: z.object({
    invalid_variant: z.string(),
    invalid_quantity: z.string(),
    quantity_too_low: z.string(),
    quantity_too_high_template: z.string(),
  }),
  checkout_validation: z.object({
    required_field_template: z.string(),
    invalid_email: z.string(),
    invalid_phone: z.string(),
    invalid_postal_code: z.string(),
    invalid_card: z.string(),
    card_declined: z.string(),
  }),
  form_validation: z.object({
    required: z.string(),
    email_invalid: z.string(),
    min_length_template: z.string(),
    max_length_template: z.string(),
    pattern_mismatch: z.string(),
  }),
});

// Export type inferred from schema
export type ValidationMessages = z.infer<typeof ValidationMessagesSchema>;
