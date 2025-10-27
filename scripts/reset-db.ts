#!/usr/bin/env tsx

/**
 * Reset Database Script
 * 
 * WARNING: This will DROP ALL DATA in the current database!
 * 
 * Usage:
 *   npm run db:reset
 */

import postgres from "postgres";
import { getDatabaseConnectionString } from "@/lib/config/database";

async function resetDatabase() {
  console.log("⚠️  WARNING: This will delete ALL data in the database!");
  console.log("   Database:", process.env.DB_NAME || "imajin_local");
  console.log("");
  
  // Safety check - never run on production
  if (process.env.NODE_ENV === "production" || process.env.DB_NAME === "imajin_prod") {
    console.error("❌ Cannot reset production database!");
    process.exit(1);
  }

  const connectionString = getDatabaseConnectionString();
  const client = postgres(connectionString);

  try {
    console.log("🗑️  Dropping all tables...");
    
    // Drop all tables by dropping and recreating the public schema
    await client`DROP SCHEMA public CASCADE`;
    await client`CREATE SCHEMA public`;
    
    console.log("✅ All tables dropped");
    console.log("");
    console.log("Next steps:");
    console.log("  1. npm run db:push    # Recreate schema");
    console.log("  2. npm run db:seed    # Seed with data");
    console.log("");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to reset database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();
