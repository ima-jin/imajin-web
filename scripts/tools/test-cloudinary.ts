#!/usr/bin/env tsx
/**
 * Manual test script for Cloudinary integration
 *
 * This script tests the Cloudinary service by:
 * 1. Uploading a test image
 * 2. Checking if it exists
 * 3. Deleting it
 * 4. Verifying deletion
 *
 * Usage: npx tsx scripts/test-cloudinary.ts
 *
 * Prerequisites:
 * - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local
 */

import { uploadMedia, checkMediaExists, deleteMedia } from '@/lib/services/cloudinary-service';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const TEST_PUBLIC_ID = 'media/products/test/sample-test-image';
const TEST_FILE_PATH = join(process.cwd(), 'test-sample.jpg');

async function testCloudinary() {
  console.log('🧪 Testing Cloudinary Integration\n');

  try {
    // Step 1: Create a test image file (1x1 red pixel JPEG)
    console.log('📝 Step 1: Creating test image file...');
    const redPixelBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==';
    writeFileSync(TEST_FILE_PATH, Buffer.from(redPixelBase64, 'base64'));
    console.log('  ✅ Test image created\n');

    // Step 2: Upload test image
    console.log('📤 Step 2: Uploading test image to Cloudinary...');
    const uploadResult = await uploadMedia(TEST_FILE_PATH, TEST_PUBLIC_ID);
    console.log('  ✅ Upload successful!');
    console.log(`     Public ID: ${uploadResult.publicId}`);
    console.log(`     URL: ${uploadResult.secureUrl}`);
    console.log(`     Format: ${uploadResult.format}`);
    console.log(`     Type: ${uploadResult.resourceType}\n`);

    // Step 3: Check if it exists
    console.log('🔍 Step 3: Checking if image exists...');
    const exists = await checkMediaExists(TEST_PUBLIC_ID);
    if (exists) {
      console.log('  ✅ Image found in Cloudinary\n');
    } else {
      throw new Error('Image not found after upload!');
    }

    // Step 4: Delete the image
    console.log('🗑️  Step 4: Deleting test image...');
    await deleteMedia(TEST_PUBLIC_ID);
    console.log('  ✅ Deletion successful\n');

    // Step 5: Verify deletion
    console.log('🔍 Step 5: Verifying deletion...');
    const stillExists = await checkMediaExists(TEST_PUBLIC_ID);
    if (!stillExists) {
      console.log('  ✅ Image successfully deleted from Cloudinary\n');
    } else {
      throw new Error('Image still exists after deletion!');
    }

    // Cleanup local test file
    console.log('🧹 Cleaning up local test file...');
    unlinkSync(TEST_FILE_PATH);
    console.log('  ✅ Local file removed\n');

    console.log('✅ All Cloudinary tests passed!\n');
    console.log('📊 Summary:');
    console.log('   - Upload: ✅');
    console.log('   - Check exists: ✅');
    console.log('   - Delete: ✅');
    console.log('   - Verify deletion: ✅\n');
    console.log('🎉 Cloudinary integration is working correctly!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cloudinary test failed:', error);

    // Cleanup on error
    try {
      unlinkSync(TEST_FILE_PATH);
      console.log('🧹 Local test file cleaned up');
    } catch (cleanupError) {
      // File might not exist
    }

    try {
      await deleteMedia(TEST_PUBLIC_ID);
      console.log('🧹 Cloudinary test file cleaned up');
    } catch (cleanupError) {
      // File might not exist
    }

    process.exit(1);
  }
}

// Check for required environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Missing required environment variables:');
  console.error('   - CLOUDINARY_CLOUD_NAME');
  console.error('   - CLOUDINARY_API_KEY');
  console.error('   - CLOUDINARY_API_SECRET');
  console.error('\nPlease add these to your .env.local file');
  process.exit(1);
}

testCloudinary();
