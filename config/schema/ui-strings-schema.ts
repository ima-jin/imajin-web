import { z } from 'zod';

/**
 * UI Strings Schema
 * Defines all UI labels, button text, and common strings used across the application
 */
export const UIStringsSchema = z.object({
  version: z.string(),
  updated: z.string(),
  cart: z.object({
    heading: z.string(),
    empty_state: z.object({
      heading: z.string(),
      message: z.string(),
      cta_label: z.string(),
    }),
    item_count: z.object({
      singular: z.string(),
      plural: z.string(),
    }),
    summary: z.object({
      subtotal: z.string(),
      shipping: z.string(),
      shipping_calculated: z.string(),
      total: z.string(),
    }),
    actions: z.object({
      checkout: z.string(),
      continue_shopping: z.string(),
      update_cart: z.string(),
      clear_cart: z.string(),
    }),
  }),
  cart_item: z.object({
    limited_edition_badge: z.string(),
    low_stock_template: z.string(),
    quantity_label: z.string(),
    remove_label: z.string(),
    update_label: z.string(),
    aria: z.object({
      increase_quantity: z.string(),
      decrease_quantity: z.string(),
      remove_item: z.string(),
    }),
  }),
  buttons: z.object({
    add_to_cart: z.string(),
    adding: z.string(),
    added: z.string(),
    buy_now: z.string(),
    checkout: z.string(),
    continue: z.string(),
    back: z.string(),
    close: z.string(),
    cancel: z.string(),
    save: z.string(),
    submit: z.string(),
    loading: z.string(),
    learn_more: z.string(),
    view_details: z.string(),
    shop_now: z.string(),
  }),
  forms: z.object({
    required_field: z.string(),
    optional_field: z.string(),
    select_placeholder: z.string(),
    search_placeholder: z.string(),
  }),
  loading: z.object({
    loading: z.string(),
    please_wait: z.string(),
  }),
  errors: z.object({
    generic: z.string(),
    network: z.string(),
    not_found: z.string(),
  }),
  aria: z.object({
    close_dialog: z.string(),
    close_cart: z.string(),
    open_cart: z.string(),
    open_menu: z.string(),
    close_menu: z.string(),
    skip_to_content: z.string(),
  }),
});

// Export type inferred from schema
export type UIStrings = z.infer<typeof UIStringsSchema>;
