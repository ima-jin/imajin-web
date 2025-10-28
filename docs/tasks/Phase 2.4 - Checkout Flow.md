# Phase 2.4: Checkout Flow

**Type:** Core Feature - Payment Processing
**Priority:** CRITICAL - MVP Blocker
**Estimated Effort:** 12-16 hours (2-3 days)
**Dependencies:** Phase 2.3.7-A, 2.3.7-B, 2.3.7-C (API infrastructure, price handling, error UI)
**Blocks:** MVP Launch

---

## Current Status (2025-10-28)

**Phase Status:** ⚠️ INFRASTRUCTURE COMPLETE, TESTING INCOMPLETE

**What's Done:**
- ✅ All form UI components (Input, Select, Textarea, Checkbox, Label) with 119 tests
- ✅ Validation schemas (checkout-schemas.ts)
- ✅ Stripe service (createCheckoutSession, verifyWebhook)
- ✅ Order service (createOrder, getOrder, lookupOrder)
- ✅ API routes (checkout/session, checkout/success, webhooks/stripe, orders/lookup)
- ✅ Checkout page with form
- ✅ Order confirmation page
- ✅ TypeScript compiles cleanly
- ✅ 649 tests passing

**What's Missing (CRITICAL):**
- ❌ Service tests (stripe-service.test.ts, order-service.test.ts)
- ❌ Validation tests (checkout-schemas.test.ts)
- ❌ API route tests (checkout-session.test.ts, stripe-webhook.test.ts, orders-lookup.test.ts)
- ❌ Integration tests (full-checkout-flow.test.ts)
- ❌ Lint errors fixed (3 issues)
- ❌ Coverage verification (currently 0% for critical services)

**Dr. Testalot's Verdict:** CONDITIONAL PASS - Do not proceed to Phase 2.5 until payment/order flow is tested.

**Estimated Time to Complete:** 6-8 hours for comprehensive test coverage

---

## Context

### The Goal

Build a complete checkout flow that allows customers to:
1. Review their cart with accurate pricing
2. Enter shipping information
3. Process payment securely via Stripe
4. Receive order confirmation
5. Track their order status

This is the **revenue-generating feature** - everything built so far culminates here.

### Business Requirements

**Must Have:**
- Stripe embedded checkout (NOT redirecting to Stripe hosted page)
- Cart validation before payment
- Limited edition quantity decrements on successful payment
- Order record creation in database
- Order confirmation page
- Email address collection (for Stripe receipt)

**Should Have:**
- Shipping address collection
- Order lookup by email + order ID
- Clear error messages for payment failures
- Loading states during payment processing

**Nice to Have (Future):**
- Guest vs account checkout toggle
- Saved payment methods
- Multiple shipping addresses
- Gift messages

---

## Objectives

1. **Build Form UI Components** - Input, Select, Textarea (deferred from Phase 2.3.5)
2. **Create Checkout Page** - Multi-step or single-page form
3. **Integrate Stripe Checkout** - Embedded payment UI
4. **Build Checkout API** - Create session, handle success
5. **Implement Stripe Webhooks** - Process completed payments
6. **Create Order Management** - Database records, confirmation page
7. **Add Order Lookup** - Customer self-service order tracking
8. **Comprehensive Testing** - Payment flows, error scenarios, webhooks

---

## Scope

### Files to Create (20+ new files)

**Form UI Components:**
1. `/components/ui/Input.tsx` - Text input with validation
2. `/components/ui/Select.tsx` - Dropdown select
3. `/components/ui/Textarea.tsx` - Multi-line text input
4. `/components/ui/Checkbox.tsx` - Checkbox input
5. `/components/ui/Label.tsx` - Form label

**Checkout Components:**
6. `/components/checkout/CheckoutForm.tsx` - Main checkout form
7. `/components/checkout/ShippingForm.tsx` - Shipping address fields
8. `/components/checkout/OrderSummary.tsx` - Cart review with totals
9. `/components/checkout/StripeCheckout.tsx` - Stripe Elements wrapper
10. `/components/checkout/PaymentStatus.tsx` - Loading/success/error states

**API Routes:**
11. `/app/api/checkout/session/route.ts` - Create Stripe session
12. `/app/api/checkout/success/route.ts` - Post-payment redirect handler
13. `/app/api/webhooks/stripe/route.ts` - Stripe webhook handler
14. `/app/api/orders/lookup/route.ts` - Order lookup by email

**Pages:**
15. `/app/checkout/page.tsx` - Checkout page
16. `/app/checkout/success/page.tsx` - Order confirmation
17. `/app/orders/lookup/page.tsx` - Order tracking lookup

**Services:**
18. `/lib/services/stripe-service.ts` - Stripe API wrapper
19. `/lib/services/order-service.ts` - Order creation/management
20. `/lib/validation/checkout-schemas.ts` - Zod schemas for checkout data

### Files to Modify (3 existing files)

1. `/components/cart/CartDrawer.tsx` - Add "Checkout" button
2. `/app/layout.tsx` - Add Stripe provider (if using Stripe Elements)
3. `/.env.local` - Add Stripe keys

### Test Files to Create (12+ new test files)

1. `/tests/unit/components/ui/Input.test.tsx`
2. `/tests/unit/components/ui/Select.test.tsx`
3. `/tests/unit/components/checkout/CheckoutForm.test.tsx`
4. `/tests/unit/lib/services/stripe-service.test.ts`
5. `/tests/unit/lib/services/order-service.test.ts`
6. `/tests/integration/api/checkout-session.test.ts`
7. `/tests/integration/api/stripe-webhook.test.ts`
8. `/tests/integration/api/orders-lookup.test.ts`
9. `/tests/integration/checkout/full-checkout-flow.test.ts`
10. `/tests/e2e/checkout.spec.ts` - End-to-end checkout test
11. `/tests/e2e/checkout-errors.spec.ts` - Error scenario tests
12. `/tests/smoke/phase2-checkout.spec.ts` - Smoke tests

---

## Implementation Plan

### Step 1: Build Form UI Components (2-3 hours)

**File:** `/components/ui/Input.tsx`

```typescript
import { forwardRef, InputHTMLAttributes } from 'react';
import { Label } from './Label';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const id = props.id || props.name;
    const hasError = Boolean(error);

    return (
      <div className="space-y-1">
        {label && <Label htmlFor={id}>{label}</Label>}

        <input
          ref={ref}
          id={id}
          className={`
            w-full px-3 py-2
            border rounded-md
            bg-white
            text-gray-900
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${hasError ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${id}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

**File:** `/components/ui/Select.tsx`

```typescript
import { forwardRef, SelectHTMLAttributes } from 'react';
import { Label } from './Label';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', ...props }, ref) => {
    const id = props.id || props.name;
    const hasError = Boolean(error);

    return (
      <div className="space-y-1">
        {label && <Label htmlFor={id}>{label}</Label>}

        <select
          ref={ref}
          id={id}
          className={`
            w-full px-3 py-2
            border rounded-md
            bg-white
            text-gray-900
            focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${hasError ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${id}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
```

**File:** `/components/ui/Textarea.tsx`

```typescript
import { forwardRef, TextareaHTMLAttributes, useState } from 'react';
import { Label } from './Label';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharacterCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCharacterCount,
      maxLength,
      className = '',
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(0);
    const id = props.id || props.name;
    const hasError = Boolean(error);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="space-y-1">
        {label && <Label htmlFor={id}>{label}</Label>}

        <textarea
          ref={ref}
          id={id}
          maxLength={maxLength}
          className={`
            w-full px-3 py-2
            border rounded-md
            bg-white
            text-gray-900
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            resize-y
            ${hasError ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          onChange={handleChange}
          {...props}
        />

        <div className="flex justify-between items-start">
          <div className="flex-1">
            {error && (
              <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {helperText && !error && (
              <p id={`${id}-helper`} className="text-sm text-gray-500">
                {helperText}
              </p>
            )}
          </div>

          {showCharacterCount && maxLength && (
            <p className="text-sm text-gray-500">
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
```

**File:** `/components/ui/Checkbox.tsx`

```typescript
import { forwardRef, InputHTMLAttributes } from 'react';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const id = props.id || props.name;
    const hasError = Boolean(error);

    return (
      <div className="space-y-1">
        <div className="flex items-start">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            className={`
              w-4 h-4 mt-0.5
              border-gray-300 rounded
              text-black
              focus:ring-2 focus:ring-black
              disabled:opacity-50 disabled:cursor-not-allowed
              ${hasError ? 'border-red-500' : ''}
              ${className}
            `}
            aria-invalid={hasError}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          />
          <label htmlFor={id} className="ml-2 text-sm text-gray-700">
            {label}
          </label>
        </div>

        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600 ml-6" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
```

**File:** `/components/ui/Label.tsx`

```typescript
import { LabelHTMLAttributes } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, className = '', children, ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-gray-700 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
    </label>
  );
}
```

**Tests:** Write comprehensive tests for each form component (~12 tests each = 60 tests total)

---

### Step 2: Create Validation Schemas (1 hour)

**File:** `/lib/validation/checkout-schemas.ts`

```typescript
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
    })
  ).min(1, 'Cart is empty'),
  customerEmail: z.string().email('Invalid email address'),
  shippingAddress: ShippingAddressSchema.optional(),
  metadata: z.record(z.string()).optional(),
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
```

---

### Step 3: Build Stripe Service (2 hours)

**File:** `/lib/services/stripe-service.ts`

```typescript
import Stripe from 'stripe';
import { API_BASE_URL } from '@/lib/config/api';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

export interface CreateCheckoutSessionParams {
  items: Array<{
    stripeProductId: string;
    quantity: number;
  }>;
  customerEmail: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Creates a Stripe Checkout Session
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const {
    items,
    customerEmail,
    metadata = {},
    successUrl = `${API_BASE_URL}/checkout/success`,
    cancelUrl = `${API_BASE_URL}/checkout`,
  } = params;

  // Build line items for Stripe
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => ({
      price: item.stripeProductId,
      quantity: item.quantity,
    })
  );

  // Create session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    customer_email: customerEmail,
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 hours
    shipping_address_collection: {
      allowed_countries: ['US', 'CA'],
    },
    billing_address_collection: 'required',
  });

  return session;
}

/**
 * Retrieves a checkout session
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });
}

/**
 * Verifies Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Processes a refund
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount && { amount }),
  });
}
```

---

### Step 4: Build Order Service (2 hours)

**File:** `/lib/services/order-service.ts`

```typescript
import { db } from '@/lib/db';
import { orders, orderItems, variants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

export interface CreateOrderParams {
  sessionId: string;
  paymentIntentId: string;
  customerEmail: string;
  customerName?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  items: Array<{
    productId: string;
    variantId?: string;
    stripeProductId: string;
    quantity: number;
    unitPrice: number;
    productName: string;
    variantName?: string;
  }>;
  shippingAddress?: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Creates order from successful checkout session
 */
export async function createOrder(params: CreateOrderParams) {
  const {
    sessionId,
    paymentIntentId,
    customerEmail,
    customerName,
    subtotal,
    tax,
    shipping,
    total,
    items,
    shippingAddress,
  } = params;

  return db.transaction(async (tx) => {
    // Create order record
    const [order] = await tx
      .insert(orders)
      .values({
        id: sessionId,
        stripePaymentIntentId: paymentIntentId,
        customerEmail,
        customerName,
        status: 'paid',
        subtotal,
        tax,
        shipping,
        total,
        currency: 'usd',
        shippingName: shippingAddress?.name,
        shippingAddressLine1: shippingAddress?.line1,
        shippingAddressLine2: shippingAddress?.line2,
        shippingCity: shippingAddress?.city,
        shippingState: shippingAddress?.state,
        shippingPostalCode: shippingAddress?.postalCode,
        shippingCountry: shippingAddress?.country,
      })
      .returning();

    // Create order items
    for (const item of items) {
      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        stripeProductId: item.stripeProductId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        productName: item.productName,
        variantName: item.variantName,
      });

      // Decrement limited edition quantities
      if (item.variantId) {
        await tx
          .update(variants)
          .set({
            soldQuantity: db.raw(`sold_quantity + ${item.quantity}`),
          })
          .where(eq(variants.id, item.variantId));
      }
    }

    return order;
  });
}

/**
 * Retrieves order by ID
 */
export async function getOrder(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { ...order, items };
}

/**
 * Looks up order by email and order ID
 */
export async function lookupOrder(email: string, orderId: string) {
  const order = await getOrder(orderId);

  if (!order || order.customerEmail !== email) {
    return null;
  }

  return order;
}

/**
 * Updates order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  trackingNumber?: string
) {
  return db
    .update(orders)
    .set({
      status,
      ...(trackingNumber && { trackingNumber }),
      ...(status === 'shipped' && { shippedAt: new Date() }),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();
}
```

---

### Step 5: Build Checkout API Routes (3 hours)

**File:** `/app/api/checkout/session/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { validateCart } from '@/lib/services/cart-validator';
import { createCheckoutSession } from '@/lib/services/stripe-service';
import { CheckoutSessionRequestSchema } from '@/lib/validation/checkout-schemas';
import {
  successResponse,
  badRequestResponse,
  handleUnknownError,
} from '@/lib/utils/api-response';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CheckoutSessionRequestSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse('Invalid checkout data');
    }

    const { items, customerEmail, metadata } = validation.data;

    // Validate cart (availability, voltage compatibility, etc.)
    const cartValidation = await validateCart(items);
    if (!cartValidation.isValid) {
      return errorResponse(
        ERROR_CODES.CART_VALIDATION_ERROR,
        'Cart validation failed',
        HTTP_STATUS.BAD_REQUEST,
        { errors: cartValidation.errors }
      );
    }

    // Map items to Stripe format
    const stripeItems = items.map((item) => ({
      stripeProductId: item.stripeProductId, // Need to add this to cart items
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      items: stripeItems,
      customerEmail,
      metadata: {
        ...metadata,
        cartItems: JSON.stringify(items), // Store for webhook processing
      },
    });

    return successResponse(
      {
        sessionId: session.id,
        url: session.url,
      },
      HTTP_STATUS.OK
    );
  } catch (error) {
    return handleUnknownError(error, 'Failed to create checkout session');
  }
}
```

**File:** `/app/api/checkout/success/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { getCheckoutSession } from '@/lib/services/stripe-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return redirect('/checkout?error=missing_session');
    }

    // Retrieve session to verify it's valid
    const session = await getCheckoutSession(sessionId);

    if (session.payment_status !== 'paid') {
      return redirect('/checkout?error=payment_incomplete');
    }

    // Redirect to order confirmation page
    return redirect(`/orders/confirmation?order_id=${session.id}`);
  } catch (error) {
    console.error('Checkout success error:', error);
    return redirect('/checkout?error=unknown');
  }
}
```

**File:** `/app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature } from '@/lib/services/stripe-service';
import { createOrder } from '@/lib/services/order-service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';
import type Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

if (!WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return errorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Missing Stripe signature',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      return errorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Invalid webhook signature',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Handle event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.payment_failed':
        // Log failure but don't create order
        console.error('Payment failed:', event.data.object);
        break;

      // Add more event handlers as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return successResponse({ received: true }, HTTP_STATUS.OK);
  } catch (error) {
    console.error('Webhook error:', error);
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Webhook processing failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Parse cart items from metadata
  const cartItemsJson = session.metadata?.cartItems;
  if (!cartItemsJson) {
    throw new Error('No cart items in session metadata');
  }

  const cartItems = JSON.parse(cartItemsJson);

  // Extract shipping address
  const shipping = session.shipping_details;
  const shippingAddress = shipping
    ? {
        name: shipping.name || undefined,
        line1: shipping.address?.line1 || undefined,
        line2: shipping.address?.line2 || undefined,
        city: shipping.address?.city || undefined,
        state: shipping.address?.state || undefined,
        postalCode: shipping.address?.postal_code || undefined,
        country: shipping.address?.country || undefined,
      }
    : undefined;

  // Create order in database
  await createOrder({
    sessionId: session.id,
    paymentIntentId: session.payment_intent as string,
    customerEmail: session.customer_email || session.customer_details?.email || '',
    customerName: session.customer_details?.name || undefined,
    subtotal: session.amount_subtotal || 0,
    tax: session.total_details?.amount_tax || 0,
    shipping: session.total_details?.amount_shipping || 0,
    total: session.amount_total || 0,
    items: cartItems.map((item: any) => ({
      productId: item.productId,
      variantId: item.variantId,
      stripeProductId: item.stripeProductId,
      quantity: item.quantity,
      unitPrice: item.price,
      productName: item.productName,
      variantName: item.variantValue,
    })),
    shippingAddress,
  });

  console.log(`Order created for session ${session.id}`);
}
```

**File:** `/app/api/orders/lookup/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { lookupOrder } from '@/lib/services/order-service';
import { OrderLookupSchema } from '@/lib/validation/checkout-schemas';
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  handleUnknownError,
} from '@/lib/utils/api-response';
import { HTTP_STATUS } from '@/lib/config/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = OrderLookupSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse('Invalid lookup data');
    }

    const { email, orderId } = validation.data;

    // Lookup order
    const order = await lookupOrder(email, orderId);

    if (!order) {
      return notFoundResponse('Order');
    }

    return successResponse(order, HTTP_STATUS.OK);
  } catch (error) {
    return handleUnknownError(error, 'Order lookup failed');
  }
}
```

---

### Step 6: Build Checkout Pages (3-4 hours)

**File:** `/app/checkout/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/components/toast/ToastProvider';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { apiPost } from '@/lib/utils/api-client';
import { API_ENDPOINTS } from '@/lib/config/api';
import { CheckoutSessionRequestSchema } from '@/lib/validation/checkout-schemas';
import { z } from 'zod';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartSubtotal } = useCart();
  const { showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Redirect if cart is empty
  if (items.length === 0) {
    router.push('/products');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create checkout session
      const session = await apiPost(
        API_ENDPOINTS.CHECKOUT_SESSION,
        z.object({ sessionId: z.string(), url: z.string() }),
        {
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            stripeProductId: item.stripeProductId, // Need to add this to CartItem
          })),
          customerEmail: email,
          shippingAddress: {
            name,
            email,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country: 'US',
          },
        }
      );

      // Redirect to Stripe Checkout
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showError('Failed to create checkout session. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-12">
      <div className="max-w-6xl mx-auto">
        <Heading level={1} className="mb-8">
          Checkout
        </Heading>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div>
                  <Heading level={2} className="mb-4">
                    Contact Information
                  </Heading>
                  <Input
                    type="email"
                    name="email"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                {/* Shipping Address */}
                <div>
                  <Heading level={2} className="mb-4">
                    Shipping Address
                  </Heading>
                  <div className="space-y-4">
                    <Input
                      name="name"
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <Input
                      name="addressLine1"
                      label="Address"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      required
                    />
                    <Input
                      name="addressLine2"
                      label="Apartment, suite, etc. (optional)"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        name="city"
                        label="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                      <Select
                        name="state"
                        label="State"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                        options={US_STATES} // Define this constant
                        placeholder="Select state"
                      />
                    </div>
                    <Input
                      name="postalCode"
                      label="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <OrderSummary items={items} />
          </div>
        </div>
      </div>
    </Container>
  );
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  // ... add all states
];
```

**File:** `/app/checkout/success/page.tsx` (Order Confirmation)

```typescript
import { notFound } from 'next/navigation';
import { getOrder } from '@/lib/services/order-service';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/price';

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.order_id;

  if (!orderId) {
    notFound();
  }

  const order = await getOrder(orderId);

  if (!order) {
    notFound();
  }

  return (
    <Container className="py-12">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        {/* Success Icon */}
        <div className="text-green-500">
          <svg
            className="w-20 h-20 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div>
          <Heading level={1}>Order Confirmed!</Heading>
          <Text className="text-gray-600 mt-2">
            Thank you for your purchase. A confirmation email has been sent to{' '}
            <strong>{order.customerEmail}</strong>
          </Text>
        </div>

        {/* Order Details */}
        <Card className="text-left">
          <Heading level={2} className="mb-4">
            Order Details
          </Heading>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Order Number:</dt>
              <dd className="font-mono">{order.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Status:</dt>
              <dd className="capitalize">{order.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Total:</dt>
              <dd className="font-semibold">{formatCurrency(order.total)}</dd>
            </div>
          </dl>

          <div className="mt-6 pt-6 border-t">
            <Heading level={3} className="mb-3">
              Items Ordered
            </Heading>
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.productName}
                    {item.variantName && ` (${item.variantName})`} x{item.quantity}
                  </span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button href="/products" variant="primary">
            Continue Shopping
          </Button>
          <Button href={`/orders/${order.id}`} variant="secondary">
            View Order
          </Button>
        </div>
      </div>
    </Container>
  );
}
```

---

### Step 7: Testing (3-4 hours)

**CRITICAL:** This step is MANDATORY before marking phase complete. Tests provide the only evidence that the payment/order flow works correctly.

#### 7.1: Service Tests (1-2 hours)

**File:** `/tests/unit/lib/services/stripe-service.test.ts`

Must cover:
- `createCheckoutSession()` with valid params
- `createCheckoutSession()` with missing/invalid params
- `getCheckoutSession()` retrieves session
- `verifyWebhookSignature()` validates signatures
- `verifyWebhookSignature()` rejects invalid signatures
- Error handling for Stripe API failures

**File:** `/tests/unit/lib/services/order-service.test.ts`

Must cover:
- `createOrder()` creates order + items in transaction
- `createOrder()` decrements variant quantities
- `createOrder()` rolls back on error
- `getOrder()` retrieves order with items
- `lookupOrder()` verifies email ownership
- `updateOrderStatus()` updates tracking info

**File:** `/tests/unit/lib/validation/checkout-schemas.test.ts`

Must cover:
- ShippingAddressSchema validates all fields
- CheckoutSessionRequestSchema validates cart items
- OrderLookupSchema validates email + order ID
- Schema rejection messages are user-friendly

#### 7.2: API Route Tests (1-2 hours)

**File:** `/tests/integration/api/checkout-session.test.ts`

Must cover:
- POST with valid cart creates session
- POST with empty cart returns 400
- POST with invalid items returns 400
- POST with out-of-stock items returns error
- Response includes sessionId and url

**File:** `/tests/integration/api/stripe-webhook.test.ts`

Must cover:
- Valid webhook signature processes event
- Invalid signature returns 400
- `checkout.session.completed` creates order
- `checkout.session.completed` decrements quantities
- Duplicate webhook (idempotency) doesn't duplicate order
- `payment_intent.payment_failed` logs but doesn't create order

**File:** `/tests/integration/api/orders-lookup.test.ts`

Must cover:
- Valid email + order ID returns order
- Wrong email for order ID returns 404
- Invalid order ID returns 404
- Response includes order items

#### 7.3: Integration Tests (1 hour)

**File:** `/tests/integration/checkout/full-checkout-flow.test.ts`

Must cover:
- Full flow: Add to cart → validate → create session → simulate webhook → verify order created
- Variant quantity decremented after successful payment
- Order record matches session data
- Transaction rollback on partial failure

#### 7.4: E2E Tests (Optional - defer to Phase 2.6)

**File:** `/tests/e2e/checkout.spec.ts`

Should cover:
- User adds product to cart
- User fills out checkout form
- User redirects to Stripe
- (Mock) User completes payment
- User sees order confirmation

**File:** `/tests/e2e/checkout-errors.spec.ts`

Should cover:
- Out of stock error before checkout
- Payment failure scenarios
- Session expiration handling

#### 7.5: Smoke Tests (30 minutes)

**File:** `/tests/smoke/phase2-checkout.spec.ts`

Quick validation:
- Stripe service initializes
- Order service connects to DB
- Checkout API routes exist
- Validation schemas parse correctly

---

**TESTING ACCEPTANCE CRITERIA:**

Before marking Step 7 complete, verify:

- [ ] All service functions have tests (stripe-service, order-service)
- [ ] All API routes have tests (checkout/session, webhooks/stripe, orders/lookup)
- [ ] All validation schemas have tests
- [ ] Integration test covers full checkout flow
- [ ] Test suite passes: `npm test`
- [ ] Coverage for new files >80%: `npm run test:coverage`
- [ ] No skipped tests
- [ ] No commented-out tests

**If any checkbox is unchecked, Step 7 is NOT complete.**

---

## Acceptance Criteria

### Form Components
- [x] Input, Select, Textarea, Checkbox, Label components created
- [x] Full accessibility (ARIA labels, error states)
- [x] 60+ tests for form components
- [x] Error states and validation styling
- [x] Character counter for Textarea

### Checkout Flow
- [x] Checkout page with shipping form
- [x] Cart validation before payment
- [x] Stripe Checkout Session created
- [x] Payment redirects to Stripe
- [x] Success redirect to confirmation page

### API Integration
- [x] `/api/checkout/session` creates valid sessions
- [x] `/api/webhooks/stripe` processes payments
- [x] `/api/orders/lookup` allows order tracking
- [x] All routes use standardized response format

### Order Management
- [x] Orders created in database on successful payment
- [x] Order items recorded with snapshot data
- [x] Limited edition quantities decremented
- [x] Shipping address captured
- [x] Order confirmation page displays order details

### Testing
- [x] 119 form component tests added (Input, Select, Textarea, Checkbox, Label)
- [ ] Service tests (stripe-service, order-service) - **MISSING**
- [ ] Validation schema tests (checkout-schemas) - **MISSING**
- [ ] API route tests (checkout/session, webhooks/stripe, orders/lookup) - **MISSING**
- [ ] Integration test (full checkout flow) - **MISSING**
- [ ] E2E checkout test (Stripe test mode) - **DEFERRED TO PHASE 2.6**
- [ ] Webhook processing tested - **MISSING**
- [ ] Error scenarios covered - **MISSING**
- [x] All existing tests still passing (649 tests)

### Quality Gates
- [x] TypeScript builds cleanly
- [ ] Lint passes - **3 ERRORS/WARNINGS** (error-handling.test.ts, ToastProvider.test.tsx)
- [x] All tests passing (649 total, but missing Phase 2.4 specific tests)
- [ ] Coverage >80% for new files - **0% for stripe-service, order-service, checkout-schemas**
- [ ] Stripe test mode working - **UNTESTED**
- [ ] Ready for live Stripe keys - **NOT YET** (need tests first)

---

## Timeline

**Estimated: 12-16 hours (2-3 days)**

- **Day 1 (6-8 hours):** Form components, validation schemas, services
- **Day 2 (4-6 hours):** API routes, checkout page
- **Day 3 (2-4 hours):** Order confirmation, testing, QA

---

## Environment Setup

**Required Environment Variables:**

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Stripe Setup:**
1. Create products in Stripe dashboard (or use existing from Phase 2.1)
2. Set up webhook endpoint (use Stripe CLI for local testing)
3. Configure webhook to send `checkout.session.completed` events
4. Test with Stripe test cards

---

## Handoff to Dr. LeanDev

### Execution Order

1. **Form components first** - Foundation for checkout
2. **Validation schemas** - Define data shapes
3. **Services** - Stripe and order services
4. **API routes** - Checkout session, webhooks
5. **Pages** - Checkout, confirmation
6. **Testing** - Comprehensive coverage
7. **Stripe testing** - End-to-end with test cards

### Success Indicators

- Can complete full checkout in Stripe test mode
- Order appears in database after payment
- Confirmation page shows order details
- Limited edition quantities decrement
- Webhooks process reliably

### Common Pitfalls

- Don't forget to expand Stripe session line items
- Verify webhook signature before processing
- Store cart items in session metadata for webhook
- Handle Stripe API rate limits gracefully
- Test with various Stripe test cards (success, decline, etc.)

---

---

## Next Steps (Before Proceeding to Phase 2.5)

### MANDATORY Test Coverage (6-8 hours)

**Priority 1: Service Tests (2-3 hours)**
1. Create `/tests/unit/lib/services/stripe-service.test.ts`
2. Create `/tests/unit/lib/services/order-service.test.ts`
3. Create `/tests/unit/lib/validation/checkout-schemas.test.ts`
4. Verify >80% coverage for these files

**Priority 2: API Route Tests (2-3 hours)**
1. Create `/tests/integration/api/checkout-session.test.ts`
2. Create `/tests/integration/api/stripe-webhook.test.ts`
3. Create `/tests/integration/api/orders-lookup.test.ts`
4. Test all success and error paths

**Priority 3: Integration Tests (1-2 hours)**
1. Create `/tests/integration/checkout/full-checkout-flow.test.ts`
2. Simulate full flow from cart to order creation
3. Verify variant quantities decrement correctly

**Priority 4: Quality Fixes (30 minutes)**
1. Fix lint errors in error-handling.test.ts
2. Fix lint warnings in ToastProvider.test.tsx
3. Run full test suite to verify 750+ tests passing
4. Run coverage report to verify >80% for Phase 2.4 files

### OPTIONAL (Defer to Phase 2.6)
- E2E tests with Playwright
- Smoke tests for Phase 2.4
- Manual Stripe test mode validation

### Success Criteria

Phase 2.4 is complete when:
- [ ] All 8 MANDATORY test files exist and pass
- [ ] Coverage >80% for stripe-service, order-service, checkout-schemas
- [ ] All lint errors/warnings fixed
- [ ] Test suite shows 750+ passing tests
- [ ] All acceptance criteria checkboxes are checked

**Only then can Phase 2.5 (Inventory Management) begin.**

---

**Document Created:** 2025-10-27
**Document Updated:** 2025-10-28 (Dr. Testalot audit)
**Status:** Infrastructure complete, testing in progress
**Dependencies:** Phase 2.3.7-A, 2.3.7-B, 2.3.7-C complete
**Blocks:** MVP Launch
