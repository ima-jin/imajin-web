# Phase 2.5.4 - Stripe Link Integration Testing

**Status:** 🟢 Ready to Test (Code Already Updated)
**Priority:** MEDIUM - Enhanced checkout UX
**Started:** 2025-11-01 (Code changes made)
**Target Completion:** TBD
**Estimated Duration:** 1-2 hours

---

## Overview

Stripe Link is already enabled in the checkout code (`payment_method_types: ['card', 'link']`), but needs end-to-end testing to verify it works correctly with our checkout flow.

**What is Stripe Link?**
- One-click checkout for returning customers
- Saves customer payment and shipping info
- Pre-fills forms automatically
- Reduces cart abandonment
- No additional integration required (just enable it)

**Reference:** https://stripe.com/en-ca/payments/link

---

## Current State

### Code Changes Already Made

**File:** `lib/services/stripe-service.ts` (line 59)

```typescript
payment_method_types: ['card', 'link'],
```

This change enables Stripe Link in the Checkout Session creation. No other code changes are needed.

---

## Testing Scope

### In Scope
- Verify Link appears in Stripe Checkout
- Test Link with new customer (first-time use)
- Test Link with returning customer (pre-filled data)
- Verify order creation works with Link payments
- Test on multiple devices (desktop, mobile)

### Out of Scope
- Link customization/branding (default styling is fine)
- Link analytics setup (can track later)
- Alternative payment methods (Apple Pay, Google Pay)

---

## Test Plan

### Setup Requirements

1. **Stripe Account Configuration**
   - Ensure Stripe Link is enabled in dashboard
   - Use TEST mode for initial testing
   - Have test card credentials ready

2. **Environment**
   - Dev server running (`npm run dev`)
   - Database seeded with products
   - Test Stripe keys configured in `.env.local`

3. **Test Accounts**
   - Use multiple email addresses for testing
   - First email: New customer (Link signup)
   - Second email: Returning customer (Link autofill)

---

### Test Case 1: Link Appears in Checkout

**Objective:** Verify Stripe Link option shows up

**Steps:**
1. Add product to cart
2. Proceed to checkout
3. Fill out email and shipping address
4. Click "Continue to Payment"
5. Wait for Stripe Checkout to load

**Expected Result:**
- Stripe Checkout page displays
- "Pay with Link" option visible
- Can toggle between Link and card payment

**Pass Criteria:**
- [ ] Link option is visible
- [ ] Can switch between payment methods
- [ ] No console errors

---

### Test Case 2: First-Time Link User (Signup)

**Objective:** Test Link signup flow for new customer

**Steps:**
1. Use email address that hasn't used Link before
2. Add product to cart
3. Complete checkout form
4. In Stripe Checkout, select "Pay with Link"
5. Enter payment info
6. Check "Save my info for secure 1-click checkout"
7. Complete payment

**Expected Result:**
- Link signup successful
- Payment processes
- Order created in database
- Confirmation email sent

**Pass Criteria:**
- [ ] Link account created successfully
- [ ] Payment completed
- [ ] Order record exists in database with correct data
- [ ] `stripe_payment_intent_id` stored
- [ ] Order items match cart
- [ ] Inventory decremented (if applicable)

---

### Test Case 3: Returning Link User (Autofill)

**Objective:** Test Link autofill for returning customer

**Steps:**
1. Use same email from Test Case 2
2. Add product to cart
3. On checkout page, enter email address
4. Click "Continue to Payment"
5. In Stripe Checkout, select "Pay with Link"
6. Enter verification code (sent to email)

**Expected Result:**
- Link recognizes email
- Payment method pre-filled
- Shipping address pre-filled
- One-click payment works

**Pass Criteria:**
- [ ] Email recognized by Link
- [ ] Verification code received
- [ ] Payment info auto-filled
- [ ] Shipping address auto-filled
- [ ] Payment completes successfully
- [ ] Order created correctly

---

### Test Case 4: Order Data Integrity

**Objective:** Verify Link payments create proper orders

**Steps:**
1. Complete Test Case 2 or 3
2. Check database for order record
3. Verify all fields populated correctly

**Expected Result:**
Order record contains:
- Correct customer email
- Correct shipping address
- Correct line items (product, variant, quantity, price)
- Valid `stripe_payment_intent_id`
- Correct `total_amount`
- `status` = 'paid'

**Pass Criteria:**
- [ ] Order exists in database
- [ ] Customer info correct
- [ ] Line items correct
- [ ] Total matches cart
- [ ] Payment intent ID valid
- [ ] Inventory updated (if tracking enabled)

---

### Test Case 5: Webhook Processing

**Objective:** Verify webhooks work with Link payments

**Steps:**
1. Complete a Link payment
2. Check webhook logs in Stripe Dashboard
3. Verify `checkout.session.completed` event processed
4. Check order creation timestamp

**Expected Result:**
- Webhook received by app
- Event verified successfully
- Order created via webhook (not just client-side)
- Order creation logs visible

**Pass Criteria:**
- [ ] Webhook event logged in Stripe
- [ ] Webhook processed by app
- [ ] Order created by webhook handler
- [ ] No webhook errors in logs

---

### Test Case 6: Mobile Device Testing

**Objective:** Verify Link works on mobile

**Steps:**
1. Open site on mobile device (or emulator)
2. Add product to cart
3. Complete checkout flow
4. Use Link payment

**Expected Result:**
- Link interface renders correctly on small screens
- Touch interactions work
- Payment completes
- Order created

**Pass Criteria:**
- [ ] UI renders correctly on mobile
- [ ] Link button tappable
- [ ] Form fields usable
- [ ] Payment completes
- [ ] No mobile-specific errors

---

### Test Case 7: Error Handling

**Objective:** Test error scenarios

**Scenarios to test:**
1. **Declined card** - Use test card `4000 0000 0000 0002`
2. **Network error** - Disconnect network during payment
3. **Expired session** - Wait 24 hours and try to complete payment

**Expected Results:**
- Error messages displayed clearly
- User not charged
- Order not created
- User can retry payment

**Pass Criteria:**
- [ ] Declined card shows clear error
- [ ] Network error handled gracefully
- [ ] Expired session redirects appropriately
- [ ] No partial orders created

---

## Test Data

### Stripe Test Cards

**Successful Payment:**
- `4242 4242 4242 4242` (Visa)
- Any future expiry date (e.g., 12/34)
- Any 3-digit CVC

**Declined Payment:**
- `4000 0000 0000 0002` (Generic decline)

**Requires Authentication (3D Secure):**
- `4000 0025 0000 3155` (Tests SCA flow)

### Test Emails

Use unique emails for each test run:
- `test+link1@example.com`
- `test+link2@example.com`
- `test+link3@example.com`

Gmail tip: `+` suffix goes to same inbox but counts as different email.

---

## Testing Checklist

### Pre-Testing Setup
- [ ] Dev server running
- [ ] Database has test products
- [ ] Stripe test keys configured
- [ ] Webhook endpoint accessible (use Stripe CLI or ngrok for local testing)

### Core Functionality
- [ ] Link option appears in Stripe Checkout
- [ ] First-time Link signup works
- [ ] Returning customer autofill works
- [ ] Payment processes successfully
- [ ] Order created in database
- [ ] Webhook processes correctly

### Edge Cases
- [ ] Declined card handled correctly
- [ ] Network errors don't break checkout
- [ ] Session expiration handled

### Cross-Device
- [ ] Works on desktop Chrome
- [ ] Works on desktop Firefox
- [ ] Works on mobile Safari (iOS)
- [ ] Works on mobile Chrome (Android)

### Data Integrity
- [ ] Order data matches cart
- [ ] Inventory updated correctly
- [ ] Customer info saved correctly
- [ ] Payment intent ID stored

---

## Known Issues / Edge Cases

### Issue 1: Local Development Webhooks

**Problem:** Stripe webhooks can't reach `localhost` directly

**Solution:** Use Stripe CLI for local webhook forwarding

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Use webhook signing secret from CLI output
# Add to .env.local:
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Issue 2: Link Not Showing Up

**Possible causes:**
- Stripe Link not enabled in dashboard
- Test mode vs Live mode mismatch
- Browser blocking cookies
- Email domain not supported

**Debug steps:**
1. Check Stripe Dashboard → Settings → Payment Methods
2. Verify Link is enabled
3. Check browser console for errors
4. Try different email domain

---

## Acceptance Criteria

- [ ] Stripe Link appears in checkout for all customers
- [ ] First-time Link signup creates account successfully
- [ ] Returning customers see pre-filled payment info
- [ ] Link payments create orders correctly
- [ ] Webhooks process Link payments
- [ ] Mobile experience works smoothly
- [ ] Error scenarios handled gracefully
- [ ] Order data integrity verified
- [ ] Tested on multiple devices/browsers
- [ ] Documentation updated with any findings

---

## Rollback Plan

If Link causes issues:

1. **Disable Link in code:**
   ```typescript
   // lib/services/stripe-service.ts
   payment_method_types: ['card'], // Remove 'link'
   ```

2. **Deploy change**

3. **Verify checkout works with card-only**

Link can be re-enabled later once issues resolved.

---

## Documentation Updates

After testing, update:

1. **README.md** - Note that Link is enabled
2. **API_ROUTES.md** - Confirm checkout supports Link
3. **TESTING_STRATEGY.md** - Add Link test cases
4. **This document** - Record any issues found and resolutions

---

## Estimated Duration

- Initial setup: 15 min
- Test Case 1-3: 30 min
- Test Case 4-6: 30 min
- Test Case 7: 15 min
- Documentation: 15 min
- **Total: 1.5-2 hours**

---

## Dependencies

**Requires:**
- ✅ Stripe account with Link enabled
- ✅ Code changes already made
- ⏸️ Phase 2.5.1 (Stripe Price Architecture) recommended first
- ⏸️ Products synced to Stripe

**Blocks:**
- Production launch
- Marketing materials claiming Link support

---

## Next Steps

After testing complete:

1. Document results in this file
2. File any bugs found
3. Update IMPLEMENTATION_PLAN.md
4. Mark Phase 2.5.4 complete
5. Proceed to Phase 2.5.5 or other work

---

## Related Documents

- [Phase 2.5 - Products & Inventory Completion](./Phase%202.5%20-%20Products%20&%20Inventory%20Completion.md)
- [Stripe Link Documentation](https://stripe.com/docs/payments/link)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Testing with Stripe](https://stripe.com/docs/testing)

---

## Notes

- Link is a free feature, no additional fees
- Works with existing Stripe Checkout integration
- No custom UI needed (Stripe handles everything)
- Can be enabled/disabled anytime without code changes
- Consider A/B testing Link vs non-Link to measure conversion impact
