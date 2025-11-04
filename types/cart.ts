// Cart type definitions for shopping cart functionality

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number; // In cents
  stripePriceId: string; // Stripe Price ID for checkout
  image: string;
  quantity: number;
  voltage?: '5v' | '24v'; // For dependency validation
  isLimitedEdition?: boolean;
  remainingQuantity?: number; // If limited edition
  variantName?: string; // For display in checkout
}

export interface CartValidationResult {
  valid: boolean;
  errors: CartValidationError[];
  warnings: CartWarning[];
}

export interface CartValidationError {
  productId: string;
  variantId?: string;
  type: 'out_of_stock' | 'voltage_mismatch' | 'incompatible' | 'unavailable';
  message: string;
}

export interface CartWarning {
  type: 'missing_component' | 'suggested_product' | 'low_stock';
  message: string;
  suggestedProductId?: string;
}
