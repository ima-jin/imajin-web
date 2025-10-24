#!/usr/bin/env tsx

/**
 * Reset Test Database Script
 *
 * Drops all tables in the test database and recreates the schema.
 * This script should ONLY be run against the test database, never dev or prod.
 *
 * Usage:
 *   npm run test:db:reset
 *   or
 *   tsx scripts/reset-test-db.ts
 */

import { db } from "@/db";
import { sql } from "drizzle-orm";

// Safety check - verify we're using test database
const DATABASE_URL = process.env.DATABASE_URL || "";
if (!DATABASE_URL.includes("imajin_test")) {
  console.error("❌ ERROR: This script can only be run against the test database!");
  console.error(`   Current DATABASE_URL: ${DATABASE_URL}`);
  console.error("   Expected: postgresql://...@.../imajin_test");
  process.exit(1);
}

async function resetTestDatabase() {
  console.log("🔄 Resetting test database...");
  console.log(`   Database: ${DATABASE_URL.split("@")[1]}`); // Show DB name without credentials

  try {
    // Drop all tables (CASCADE removes dependencies)
    console.log("📦 Dropping all tables...");
    await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE;`);

    // Recreate public schema
    console.log("🏗️  Recreating public schema...");
    await db.execute(sql`CREATE SCHEMA public;`);

    // Grant permissions
    await db.execute(sql`GRANT ALL ON SCHEMA public TO imajin;`);
    await db.execute(sql`GRANT ALL ON SCHEMA public TO public;`);

    // Push schema from Drizzle
    console.log("📋 Pushing schema from Drizzle...");
    console.log("   Run: npm run db:push");
    console.log("");
    console.log("✅ Test database reset complete!");
    console.log("");
    console.log("💡 Next steps:");
    console.log("   1. npm run db:push       # Push schema to test DB");
    console.log("   2. npm run test:db:seed  # Seed test data");
  } catch (error) {
    console.error("\n❌ Error during reset:");
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the reset
resetTestDatabase();
