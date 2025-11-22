#!/usr/bin/env tsx
/**
 * Manual test script for Stripe integration
 *
 * This script tests the Stripe sync service by:
 * 1. Creating a test product
 * 2. Updating the product name
 * 3. Creating a new price (simulating price change)
 * 4. Archiving the product
 * 5. Cleaning up
 *
 * Usage: npx tsx scripts/test-stripe.ts
 *
 * Prerequisites:
 * - STRIPE_SECRET_KEY in .env.local (test mode key)
 */

import { syncProductToStripe } from '@/lib/services/stripe-sync-service';

async function testStripe() {
  console.log('🧪 Testing Stripe Integration\n');

  let productId: string | undefined;

  try {
    // Step 1: Create test product
    console.log('📝 Step 1: Creating test product...');
    const createResult = await syncProductToStripe({
      id: 'test-product-123',
      name: 'Test Product - Stripe Sync',
      description: 'This is a test product for validating Stripe sync',
      basePriceCents: 5000, // $50.00
      isLive: true,
      sellStatus: 'for-sale',
    });

    if (createResult.action !== 'created') {
      throw new Error(`Expected 'created', got '${createResult.action}'`);
    }

    productId = createResult.stripeProductId;
    console.log('  ✅ Product created successfully!');
    console.log(`     Stripe Product ID: ${productId}`);
    console.log(`     Stripe Price ID: ${createResult.stripePriceId}\n`);

    // Step 2: Update product name
    console.log('📝 Step 2: Updating product name...');
    const updateResult = await syncProductToStripe({
      id: 'test-product-123',
      name: 'Test Product - UPDATED',
      description: 'This is an updated test product',
      basePriceCents: 5000, // Same price
      isLive: true,
      sellStatus: 'for-sale',
      stripeProductId: productId,
    });

    if (updateResult.action !== 'updated') {
      throw new Error(`Expected 'updated', got '${updateResult.action}'`);
    }

    console.log('  ✅ Product updated successfully!\n');

    // Step 3: Change price (test Stripe Price immutability)
    console.log('📝 Step 3: Changing product price...');
    const priceChangeResult = await syncProductToStripe({
      id: 'test-product-123',
      name: 'Test Product - UPDATED',
      description: 'This is an updated test product',
      basePriceCents: 6000, // New price: $60.00
      isLive: true,
      sellStatus: 'for-sale',
      stripeProductId: productId,
    });

    if (priceChangeResult.action !== 'updated') {
      throw new Error(`Expected 'updated', got '${priceChangeResult.action}'`);
    }

    console.log('  ✅ Price changed successfully!');
    console.log('     (Old price archived, new price created)\n');

    // Step 4: Archive product (simulate 'internal' status)
    console.log('📝 Step 4: Archiving product (internal status)...');
    const archiveResult = await syncProductToStripe({
      id: 'test-product-123',
      name: 'Test Product - UPDATED',
      description: 'This is an updated test product',
      basePriceCents: 6000,
      isLive: false,
      sellStatus: 'internal',
      stripeProductId: productId,
    });

    if (archiveResult.action !== 'archived') {
      throw new Error(`Expected 'archived', got '${archiveResult.action}'`);
    }

    console.log('  ✅ Product archived successfully!\n');

    // Step 5: Summary
    console.log('✅ All Stripe tests passed!\n');
    console.log('📊 Summary:');
    console.log('   - Create product: ✅');
    console.log('   - Update product: ✅');
    console.log('   - Change price: ✅');
    console.log('   - Archive product: ✅\n');
    console.log('🎉 Stripe integration is working correctly!');
    console.log('\n📍 Please check your Stripe Test Dashboard to verify:');
    console.log(`   https://dashboard.stripe.com/test/products/${productId}`);
    console.log('\n⚠️  Note: The test product has been archived but not deleted.');
    console.log('   You may want to delete it manually from the Stripe dashboard.');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Stripe test failed:', error);

    if (productId) {
      console.log('\n⚠️  Test product may still exist in Stripe:');
      console.log(`   https://dashboard.stripe.com/test/products/${productId}`);
      console.log('   Please delete it manually if needed.');
    }

    process.exit(1);
  }
}

// Check for required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Missing required environment variable: STRIPE_SECRET_KEY');
  console.error('\nPlease add STRIPE_SECRET_KEY to your .env.local file');
  console.error('Use a TEST mode key (starts with sk_test_)');
  process.exit(1);
}

if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  console.error('⚠️  WARNING: Your STRIPE_SECRET_KEY does not appear to be a test key!');
  console.error('   Test keys start with "sk_test_"');
  console.error('   Using production keys for testing is dangerous.');
  console.error('\nPlease use a test mode key. Aborting.');
  process.exit(1);
}

testStripe();
