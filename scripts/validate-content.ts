import { loadContent } from '../lib/config/content-loader';
import { SiteMetadataSchema } from '../config/schema/site-metadata-schema';
import { NavigationSchema } from '../config/schema/navigation-schema';
import {
  HomePageContentSchema,
  ProductsListingContentSchema,
  ProductDetailContentSchema,
} from '../config/schema/page-content-schema';
import { UIStringsSchema } from '../config/schema/ui-strings-schema';
import { ValidationMessagesSchema } from '../config/schema/validation-messages-schema';
import type { ZodSchema } from 'zod';

/**
 * Validation Script
 * Validates all content JSON files against their Zod schemas
 * Run with: tsx scripts/validate-content.ts
 */

interface ValidationResult {
  file: string;
  valid: boolean;
  error?: string;
}

const contentFiles = [
  {
    path: 'content/site-metadata.json',
    schema: SiteMetadataSchema as ZodSchema,
    name: 'Site Metadata',
  },
  {
    path: 'content/navigation.json',
    schema: NavigationSchema as ZodSchema,
    name: 'Navigation',
  },
  {
    path: 'content/pages/home.json',
    schema: HomePageContentSchema as ZodSchema,
    name: 'Homepage Content',
  },
  {
    path: 'content/pages/products-listing.json',
    schema: ProductsListingContentSchema as ZodSchema,
    name: 'Products Listing Content',
  },
  {
    path: 'content/pages/product-detail.json',
    schema: ProductDetailContentSchema as ZodSchema,
    name: 'Product Detail Content',
  },
  {
    path: 'content/ui-strings.json',
    schema: UIStringsSchema as ZodSchema,
    name: 'UI Strings',
  },
  {
    path: 'content/validation-messages.json',
    schema: ValidationMessagesSchema as ZodSchema,
    name: 'Validation Messages',
  },
];

async function validateAllContent(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (const file of contentFiles) {
    try {
      await loadContent(file.path, file.schema);
      results.push({
        file: file.name,
        valid: true,
      });
      console.log(`✓ ${file.name} - Valid`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        file: file.name,
        valid: false,
        error: errorMessage,
      });
      console.error(`✗ ${file.name} - Invalid:`);
      console.error(`  ${errorMessage}\n`);
    }
  }

  return results;
}

async function main() {
  console.log('Validating content files...\n');

  const results = await validateAllContent();

  const totalFiles = results.length;
  const validFiles = results.filter(r => r.valid).length;
  const invalidFiles = totalFiles - validFiles;

  console.log('\n' + '='.repeat(60));
  console.log(`Validation Summary:`);
  console.log(`  Total files: ${totalFiles}`);
  console.log(`  Valid: ${validFiles}`);
  console.log(`  Invalid: ${invalidFiles}`);
  console.log('='.repeat(60));

  if (invalidFiles > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
