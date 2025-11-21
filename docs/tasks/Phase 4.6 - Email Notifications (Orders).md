# Phase 4.6 - Email Notifications (Orders)

**Status:** 📋 Not Started (Needs SendGrid Update)
**Priority:** MEDIUM - Required for order confirmations and pre-sale notifications
**Estimated Duration:** 6-10 hours
**Dependencies:** Phase 4.4.6 (SendGrid integration for auth emails)
**Blocks:** Phase 2.5.2.2 (automated pre-sale notifications)

---

> **NOTE:** This document was originally Phase 4.4.2 and has been moved to Phase 4.6.
>
> **Scope Change:** This document covers **ORDER-related emails** (order confirmations, deposit confirmations, pre-order ready, refunds). For **AUTH-related emails** (verification, password reset), see Phase 4.4.6.
>
> **Service Change Required:** This document originally specified Resend, but the project standard is **SendGrid**. All code examples should be updated to use SendGrid instead of Resend before implementation.
>
> **Email Templates:** The HTML templates in this document are valuable and can be used with SendGrid with minor modifications.

---

## Overview

Implement a comprehensive email notification system to handle all **order-related transactional emails** across the platform. This includes order confirmations, deposit notifications, pre-sale transitions, refund confirmations, and future needs.

**Goals:**
- Centralized email service abstraction (SendGrid-based)
- Template system for all email types
- Queue/batch sending for bulk notifications
- Delivery tracking and error handling
- Support for both transactional and marketing emails

---

## Email Service Selection

### Selected: SendGrid

**Why SendGrid?**
- Industry-standard email service
- Comprehensive API
- Excellent deliverability
- Template management dashboard
- Webhook support for tracking opens/clicks
- Free tier: 100 emails/day
- $19.95/month for 50k emails

**Implementation Notes:**
- Use `@sendgrid/mail` npm package
- Store API key in environment variables
- Reuse connection with Phase 4.4.6 auth emails
- HTML templates can be used as-is (minor modifications needed)

---

## Architecture

### Service Layer

**File:** `lib/services/email-service.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export async function sendEmail(params: SendEmailParams) {
  const {
    to,
    subject,
    html,
    text,
    from = process.env.EMAIL_FROM || 'info@imajin.ca',
    replyTo,
    tags = [],
  } = params;

  try {
    const result = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || stripHtml(html), // Auto-generate plain text from HTML
      replyTo,
      tags,
    });

    // Log success
    console.log('[Email] Sent successfully', {
      to,
      subject,
      messageId: result.id,
    });

    return { success: true, messageId: result.id };
  } catch (error) {
    // Log error
    console.error('[Email] Send failed', {
      to,
      subject,
      error: error.message,
    });

    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Batch send with rate limiting
export async function sendBulkEmails(
  emails: SendEmailParams[],
  options: { batchSize?: number; delayMs?: number } = {}
) {
  const { batchSize = 10, delayMs = 100 } = options;
  const results = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((email) => sendEmail(email))
    );

    results.push(...batchResults);

    // Delay between batches to respect rate limits
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log('[Email] Bulk send complete', {
    total: emails.length,
    successful,
    failed,
  });

  return { total: emails.length, successful, failed, results };
}

// Helper: Strip HTML tags for plain text fallback
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

---

## Email Templates

### Template System

**File:** `lib/email-templates/index.ts`

```typescript
import { formatPrice } from '@/lib/utils/format';

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    variant?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  estimatedDelivery?: string;
}

export function orderConfirmationTemplate(data: OrderConfirmationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${item.name}${item.variant ? ` - ${item.variant}` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        ${formatPrice(item.price)}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #000; font-size: 24px; margin: 0;">IMAJIN</h1>
  </div>

  <h2 style="color: #000; font-size: 20px; margin-bottom: 20px;">Order Confirmation</h2>

  <p>Hi ${data.customerName},</p>
  <p>Thank you for your order! We've received your payment and will begin processing your order shortly.</p>

  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
    <p style="margin: 0; font-weight: 600;">Order #${data.orderNumber}</p>
  </div>

  <h3 style="font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Order Details</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background: #f5f5f5;">
        <th style="padding: 12px; text-align: left;">Item</th>
        <th style="padding: 12px; text-align: center;">Qty</th>
        <th style="padding: 12px; text-align: right;">Price</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">Subtotal:</td>
        <td style="padding: 12px; text-align: right;">${formatPrice(data.subtotal)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">Shipping:</td>
        <td style="padding: 12px; text-align: right;">${formatPrice(data.shipping)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">Tax:</td>
        <td style="padding: 12px; text-align: right;">${formatPrice(data.tax)}</td>
      </tr>
      <tr style="border-top: 2px solid #000;">
        <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600; font-size: 18px;">Total:</td>
        <td style="padding: 12px; text-align: right; font-weight: 600; font-size: 18px;">${formatPrice(data.total)}</td>
      </tr>
    </tfoot>
  </table>

  <h3 style="font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Shipping Address</h3>
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
    <p style="margin: 0;">${data.shippingAddress.line1}</p>
    ${data.shippingAddress.line2 ? `<p style="margin: 0;">${data.shippingAddress.line2}</p>` : ''}
    <p style="margin: 0;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
  </div>

  ${
    data.estimatedDelivery
      ? `
  <p style="margin-top: 24px;">
    <strong>Estimated Delivery:</strong> ${data.estimatedDelivery}
  </p>
  `
      : ''
  }

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />

  <p style="font-size: 14px; color: #666;">
    If you have any questions about your order, please reply to this email or contact us at info@imajin.ca.
  </p>

  <p style="font-size: 14px; color: #666;">
    Thank you for choosing IMAJIN!
  </p>
</body>
</html>
  `;
}

export interface DepositConfirmationData {
  customerName: string;
  productName: string;
  depositAmount: number;
  orderNumber: string;
}

export function depositConfirmationTemplate(
  data: DepositConfirmationData
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pre-Sale Deposit Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #000; font-size: 24px; margin: 0;">IMAJIN</h1>
  </div>

  <h2 style="color: #000; font-size: 20px; margin-bottom: 20px;">Pre-Sale Deposit Confirmed</h2>

  <p>Hi ${data.customerName},</p>
  <p>Thank you for securing your place in line for <strong>${data.productName}</strong>!</p>

  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
    <p style="margin: 0;"><strong>Deposit Amount:</strong> ${formatPrice(data.depositAmount)}</p>
    <p style="margin: 8px 0 0 0;"><strong>Reference #:</strong> ${data.orderNumber}</p>
  </div>

  <h3 style="font-size: 16px; margin-top: 24px; margin-bottom: 12px;">What's Next?</h3>
  <p>We'll email you as soon as this product is ready for pre-order. When you receive our notification, you'll have the opportunity to complete your purchase at our exclusive wholesale pricing.</p>

  <p style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 24px 0;">
    <strong>Note:</strong> Your deposit is fully refundable at any time before you complete your final purchase. If you decide not to proceed, simply click the refund link in your pre-order notification email.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />

  <p style="font-size: 14px; color: #666;">
    Questions? Reply to this email or contact us at info@imajin.ca.
  </p>

  <p style="font-size: 14px; color: #666;">
    Thank you for being an early supporter!
  </p>
</body>
</html>
  `;
}

export interface PreOrderReadyData {
  customerName: string;
  productName: string;
  depositAmount: number;
  wholesalePrice: number;
  remainingBalance: number;
  productUrl: string;
  refundUrl: string;
  expiresAt: string; // e.g., "7 days"
}

export function preOrderReadyTemplate(data: PreOrderReadyData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Pre-Order is Ready!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #000; font-size: 24px; margin: 0;">IMAJIN</h1>
  </div>

  <h2 style="color: #000; font-size: 20px; margin-bottom: 20px;">Your Pre-Order is Ready!</h2>

  <p>Hi ${data.customerName},</p>
  <p>Great news! <strong>${data.productName}</strong> is now available for pre-order, and you have exclusive access to wholesale pricing.</p>

  <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; margin: 24px 0;">
    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #16a34a;">Your Exclusive Price: ${formatPrice(data.wholesalePrice)}</p>
    <p style="margin: 12px 0 0 0; font-size: 14px; color: #15803d;">
      Deposit paid: ${formatPrice(data.depositAmount)}<br />
      Remaining balance: ${formatPrice(data.remainingBalance)}
    </p>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${data.productUrl}" style="display: inline-block; background: #000; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
      Complete Your Order
    </a>
  </div>

  <p style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 24px 0;">
    <strong>Important:</strong> This exclusive pricing expires in ${data.expiresAt}. After that, the product will be available at regular retail pricing.
  </p>

  <h3 style="font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Changed Your Mind?</h3>
  <p>No problem! If you'd prefer not to proceed, you can <a href="${data.refundUrl}" style="color: #2563eb;">request a full refund</a> of your deposit.</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />

  <p style="font-size: 14px; color: #666;">
    Questions? Reply to this email or contact us at info@imajin.ca.
  </p>

  <p style="font-size: 14px; color: #666;">
    Thank you for your early support!
  </p>
</body>
</html>
  `;
}

export interface RefundConfirmationData {
  customerName: string;
  productName: string;
  refundAmount: number;
  orderNumber: string;
}

export function refundConfirmationTemplate(
  data: RefundConfirmationData
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Processed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #000; font-size: 24px; margin: 0;">IMAJIN</h1>
  </div>

  <h2 style="color: #000; font-size: 20px; margin-bottom: 20px;">Refund Processed</h2>

  <p>Hi ${data.customerName},</p>
  <p>Your refund for <strong>${data.productName}</strong> has been processed.</p>

  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
    <p style="margin: 0;"><strong>Refund Amount:</strong> ${formatPrice(data.refundAmount)}</p>
    <p style="margin: 8px 0 0 0;"><strong>Reference #:</strong> ${data.orderNumber}</p>
  </div>

  <p>The funds should appear in your account within 5-10 business days, depending on your bank.</p>

  <p style="margin-top: 24px;">We're sorry to see you go, but we appreciate your interest in IMAJIN products. If you change your mind in the future, we'd love to have you back!</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />

  <p style="font-size: 14px; color: #666;">
    Questions about your refund? Reply to this email or contact us at info@imajin.ca.
  </p>
</body>
</html>
  `;
}
```

---

## API Routes

### Send Pre-Order Ready Emails (Admin)

**File:** `app/api/admin/products/[id]/notify-deposit-holders/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendBulkEmails } from '@/lib/services/email-service';
import { preOrderReadyTemplate } from '@/lib/email-templates';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: productId } = params;

  try {
    // 1. Fetch product details
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Query all deposit holders
    const depositOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.product_id, 'pre-sale-deposit'),
        eq(orders.status, 'paid')
      ),
    });

    // Filter by target product
    const targetDepositOrders = depositOrders.filter(
      (order) => order.metadata?.target_product_id === productId
    );

    if (targetDepositOrders.length === 0) {
      return NextResponse.json(
        { message: 'No deposit holders found for this product' },
        { status: 200 }
      );
    }

    // 3. Generate emails
    const emails = targetDepositOrders.map((order) => {
      const depositAmount = order.total_amount;
      const wholesalePrice = product.wholesale_price_cents || product.base_price_cents;
      const remainingBalance = wholesalePrice - depositAmount;

      const refundToken = generateRefundToken(order.id);
      const productUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/products/${productId}?email=${encodeURIComponent(order.customer_email)}`;
      const refundUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/orders/refund?token=${refundToken}`;

      return {
        to: order.customer_email,
        subject: `Your Pre-Order for ${product.name} is Ready!`,
        html: preOrderReadyTemplate({
          customerName: order.customer_name || 'there',
          productName: product.name,
          depositAmount,
          wholesalePrice,
          remainingBalance,
          productUrl,
          refundUrl,
          expiresAt: '7 days',
        }),
        tags: [
          { name: 'campaign', value: 'pre-order-ready' },
          { name: 'product_id', value: productId },
        ],
      };
    });

    // 4. Send bulk emails with rate limiting
    const result = await sendBulkEmails(emails, {
      batchSize: 10,
      delayMs: 100,
    });

    return NextResponse.json({
      message: 'Emails sent successfully',
      total: result.total,
      successful: result.successful,
      failed: result.failed,
    });
  } catch (error) {
    console.error('[API] Failed to send pre-order ready emails', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}

// Helper: Generate secure refund token
function generateRefundToken(orderId: string): string {
  // TODO: Implement secure token generation (JWT or HMAC)
  // For now, simple base64 encoding (INSECURE - replace in production)
  return Buffer.from(`${orderId}:${Date.now()}`).toString('base64url');
}
```

---

## Database Schema Updates

### Email Tracking Table (Optional)

**File:** `db/schema.ts`

```typescript
export const email_logs = pgTable('email_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  to: varchar('to', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  template: varchar('template', { length: 100 }), // e.g., 'order-confirmation'
  message_id: varchar('message_id', { length: 255 }), // Resend message ID
  status: varchar('status', { length: 50 }).notNull().default('sent'), // sent, delivered, bounced, failed
  error_message: text('error_message'),
  metadata: jsonb('metadata'), // Additional context
  sent_at: timestamp('sent_at').defaultNow(),
  delivered_at: timestamp('delivered_at'),
  opened_at: timestamp('opened_at'),
  clicked_at: timestamp('clicked_at'),
});
```

**Note:** This table is optional. Only implement if you need delivery tracking. For MVP, logging to console is sufficient.

---

## Environment Variables

Add to `.env.local` and production:

```env
# Email Service (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=info@imajin.ca
EMAIL_REPLY_TO=info@imajin.ca

# Base URL for email links
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (2-3 hours)
1. Install Resend SDK: `npm install resend`
2. Create `email-service.ts` with `sendEmail()` and `sendBulkEmails()`
3. Add environment variables
4. Write unit tests for email service

### Phase 2: Email Templates (2-3 hours)
1. Create `email-templates/index.ts`
2. Implement 4 core templates:
   - Order confirmation
   - Deposit confirmation
   - Pre-order ready
   - Refund confirmation
3. Test templates with sample data

### Phase 3: Integration (2-3 hours)
1. Add email sending to webhook handler (`/api/webhooks/stripe`)
2. Create admin API route (`/api/admin/products/[id]/notify-deposit-holders`)
3. Add email sending to refund API route
4. Test full workflow

### Phase 4: Testing & Polish (1-2 hours)
1. Write integration tests for email sending
2. Test bulk email sending with rate limiting
3. Verify deliverability (check spam folders)
4. Update documentation

**Total: 7-11 hours**

---

## Testing Strategy

### Unit Tests

**File:** `tests/unit/lib/services/email-service.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { sendEmail, sendBulkEmails } from '@/lib/services/email-service';

describe('email-service', () => {
  it('should send single email', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('should send bulk emails with rate limiting', async () => {
    const emails = Array.from({ length: 25 }, (_, i) => ({
      to: `test${i}@example.com`,
      subject: 'Bulk Test',
      html: '<p>Test</p>',
    }));

    const result = await sendBulkEmails(emails, {
      batchSize: 10,
      delayMs: 50,
    });

    expect(result.total).toBe(25);
    expect(result.successful).toBe(25);
    expect(result.failed).toBe(0);
  });

  it('should handle email send failures gracefully', async () => {
    const result = await sendEmail({
      to: 'invalid-email',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result.success).toBe(false);
  });
});
```

### Integration Tests

**File:** `tests/integration/api/admin/notify-deposit-holders.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/admin/products/[id]/notify-deposit-holders/route';

describe('POST /api/admin/products/:id/notify-deposit-holders', () => {
  it('should send emails to all deposit holders', async () => {
    // Setup: Create test deposits
    // ...

    const request = new Request(
      'http://localhost:3000/api/admin/products/test-product-id/notify-deposit-holders',
      { method: 'POST' }
    );

    const response = await POST(request, {
      params: { id: 'test-product-id' },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.successful).toBeGreaterThan(0);
  });
});
```

---

## Security Considerations

1. **Rate Limiting:**
   - Limit bulk email sending to 10 emails per second
   - Prevent abuse of admin API endpoints

2. **Email Validation:**
   - Validate email addresses before sending
   - Sanitize user-provided data in templates

3. **Token Security:**
   - Use JWT or HMAC for refund tokens
   - Set expiration (7 days)
   - Verify token signature before processing refund

4. **Admin Access:**
   - Protect admin API routes with authentication (Phase 4.4.1)
   - Log all admin actions (who sent emails, when)

5. **Privacy:**
   - Don't expose customer emails in logs
   - Use BCC for bulk sends if needed

---

## Acceptance Criteria

- [ ] Resend API integration complete
- [ ] Email service with `sendEmail()` and `sendBulkEmails()` implemented
- [ ] 4 email templates created (order, deposit, pre-order ready, refund)
- [ ] Admin API route for notifying deposit holders
- [ ] Bulk email sending with rate limiting (10 emails/second)
- [ ] Email sending integrated into webhook handler
- [ ] Email sending integrated into refund API route
- [ ] Environment variables configured
- [ ] Unit tests for email service (3+ tests)
- [ ] Integration tests for admin notification route (2+ tests)
- [ ] Plain text fallback auto-generated from HTML
- [ ] Error handling and logging for failed emails
- [ ] Documentation updated

---

## Future Enhancements (Post-MVP)

### Phase 4.1.2: Advanced Email Features
- Email delivery tracking (webhooks from Resend)
- Retry logic for failed emails
- Email queue system (background jobs)
- Email analytics dashboard (open rates, click rates)
- A/B testing for email templates
- Email preferences (unsubscribe, frequency)

### Phase 4.1.3: Additional Templates
- Welcome email (new user signup)
- Password reset email
- Shipping notification
- Order status updates
- Review request (post-delivery)
- Re-engagement campaigns (abandoned cart)

### Phase 4.1.4: React Email Templates
- Migrate to React Email for JSX-based templates
- Component library for email UI
- Preview system for templates
- Localization support (multi-language)

---

## Related Documents

- [Phase 2.5.2 - Pre-Sale vs Pre-Order Schema](./Phase%202.5.2%20-%20Pre-Sale%20vs%20Pre-Order%20Schema.md)
- [Phase 4.4.1 - Hybrid Authentication](./Phase%204.4.1%20-%20Hybrid%20Authentication.md)
- [Phase 4.4.5 - Admin Tools](../IMPLEMENTATION_PLAN.md#445-admin-tools)
- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email)

---

## Notes

- Email system is decoupled from Phase 2.5.2 implementation
- Can implement Phase 2.5.2 without emails (manual notification initially)
- Email service can be swapped later (e.g., Resend → SendGrid) with minimal code changes
- Consider adding `email_logs` table if delivery tracking becomes important
- For high-volume sending (>10k emails), consider using a job queue (BullMQ, Inngest)
