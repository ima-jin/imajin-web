/**
 * Upload Media Script
 *
 * Manual script for uploading media files to Cloudinary during development
 *
 * Usage:
 *   npx tsx scripts/upload-media.ts <file-path> <public-id>
 *
 * Examples:
 *   npx tsx scripts/upload-media.ts ./media/products/Material-8x8-V/main.jpg media/products/Material-8x8-V/main
 *   npx tsx scripts/upload-media.ts ./media/products/Founder/main.jpg media/products/Founder/main
 *   npx tsx scripts/upload-media.ts ./media/manuals/assembly.pdf media/manuals/assembly
 */

import { uploadMedia as uploadToCloudinary } from '@/lib/services/cloudinary-service';
import { getThumbnailUrl, getProductImageUrl } from '@/lib/utils/cloudinary';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Detect resource type based on file extension
 */
function getResourceType(filePath: string): 'image' | 'video' | 'raw' {
  const ext = path.extname(filePath).toLowerCase();

  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return 'raw'; // PDFs, documents, etc.
}

async function uploadMedia() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/upload-media.ts <file-path> <public-id>');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/upload-media.ts ./media/products/Material-8x8-V/main.jpg media/products/Material-8x8-V/main');
    console.log('  npx tsx scripts/upload-media.ts ./media/products/Founder/main.jpg media/products/Founder/main');
    console.log('  npx tsx scripts/upload-media.ts ./media/manuals/assembly.pdf media/manuals/assembly');
    process.exit(1);
  }

  const filePath = args[0];
  const publicId = args[1];

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  // Get file stats and resource type
  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  const resourceType = getResourceType(filePath);

  console.log('\n📤 Uploading to Cloudinary...\n');
  console.log(`   File: ${fileName}`);
  console.log(`   Size: ${fileSizeKB} KB`);
  console.log(`   Path: ${filePath}`);
  console.log(`   Public ID: ${publicId}`);
  console.log(`   Resource Type: ${resourceType}`);
  console.log('');

  try {
    // Upload to Cloudinary using the service
    const result = await uploadToCloudinary(filePath, publicId, resourceType);

    console.log('✅ Upload successful!\n');
    console.log('📋 Upload Details:');
    console.log(`   Public ID: ${result.publicId}`);
    console.log(`   Format: ${result.format}`);
    console.log(`   Resource Type: ${result.resourceType}`);
    console.log('');

    console.log('🔗 URLs:');
    console.log(`   Secure URL: ${result.secureUrl}`);

    if (resourceType === 'image') {
      console.log(`   Thumbnail (400x400): ${getThumbnailUrl(result.publicId)}`);
      console.log(`   Product Image (1200w): ${getProductImageUrl(result.publicId)}`);
    }
    console.log('');

    console.log('📝 Media Object for products.json:');
    const mediaObject = {
      local_path: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
      cloudinary_public_id: result.publicId,
      type: resourceType === 'image' ? 'image' : resourceType === 'video' ? 'video' : 'document',
      mime_type: resourceType === 'image' ? `image/${result.format}` :
                 resourceType === 'video' ? `video/${result.format}` :
                 `application/${result.format}`,
      alt: fileName.replace(/\.[^.]+$/, ''),
      category: 'main',
      order: 1,
    };
    console.log(JSON.stringify(mediaObject, null, 2));
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Upload failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (error.message.includes('CLOUDINARY')) {
        console.error('\n💡 Tip: Make sure your .env file has valid Cloudinary credentials:');
        console.error('   CLOUDINARY_CLOUD_NAME=your-cloud-name');
        console.error('   CLOUDINARY_API_KEY=your-api-key');
        console.error('   CLOUDINARY_API_SECRET=your-api-secret');
      }
    }
    process.exit(1);
  }
}

uploadMedia();
