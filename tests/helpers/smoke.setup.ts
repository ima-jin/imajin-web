/**
 * Smoke Test Setup
 *
 * Unlike regular tests that use NODE_ENV=test and .env.test,
 * smoke tests run against the WORKING database (.env.local)
 */

// Force reading from .env.local instead of .env.test
import { config } from 'dotenv';
import path from 'path';

// Load .env.local explicitly
config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔍 Smoke test setup: Loading .env.local');
