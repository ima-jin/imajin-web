#!/usr/bin/env tsx

import { ProductsJsonSchema } from '../config/schema';
import { readFileSync } from 'fs';
import { join } from 'path';

const PRODUCTS_JSON_PATH = join(process.cwd(), 'config', 'content', 'products.json');

const data = JSON.parse(readFileSync(PRODUCTS_JSON_PATH, 'utf-8'));
const result = ProductsJsonSchema.safeParse(data);

if (result.success) {
  console.log('✅ Validation passed');
  console.log(`   Products: ${data.products.length}`);
  console.log(`   Variants: ${data.variants.length}`);
  console.log(`   Dependencies: ${data.dependencies.length}`);
  process.exit(0);
} else {
  console.error('❌ Validation failed');
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}
