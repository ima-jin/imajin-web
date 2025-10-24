#!/usr/bin/env tsx

/**
 * Test Database Setup Script
 *
 * Sets up the test database schema by running migrations.
 * Always uses imajin_test database regardless of NODE_ENV.
 */

import postgres from "postgres";

const TEST_DB_URL = "postgresql://imajin:imajin_dev@localhost:5435/imajin_test";

async function setupTestDatabase() {
  console.log("🔧 Setting up test database schema...\n");

  const client = postgres(TEST_DB_URL, { max: 1 });

  try {
    // For now, we'll just verify connection
    // Once we have migrations, we'll run them here
    await client`SELECT 1`;
    console.log("✅ Test database connection successful");
    console.log(`📊 Database: imajin_test`);
    console.log("\n💡 Run migrations manually with: npm run db:push");
    console.log("   (Make sure NODE_ENV=test or DB_NAME=imajin_test is set)");
  } catch (error) {
    console.error("❌ Failed to setup test database:");
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupTestDatabase();
