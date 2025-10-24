import { test as setup } from "@playwright/test";
import postgres from "postgres";
import { getDatabaseConnectionString } from "@/lib/config/database";

/**
 * Global setup for Playwright tests
 * This runs once before all E2E/smoke tests
 */
setup("playwright global setup", async ({}) => {
  console.log("🎭 Running Playwright global setup...");

  try {
    // Verify database is accessible for E2E tests
    const connectionString = getDatabaseConnectionString();
    const client = postgres(connectionString, { max: 1 });

    // Quick health check
    await client`SELECT 1`;
    console.log("✓ Database accessible for E2E tests");

    // Optional: Seed test data if needed for E2E tests
    // const products = await db.select().from(schema.products);
    // if (products.length === 0) {
    //   console.log("⚠ No products found - consider running npm run db:seed");
    // }

    await client.end();
    console.log("✓ Playwright setup complete");
  } catch (error) {
    console.error("❌ Playwright setup failed:", error);
    throw error; // Fail setup if database is not available
  }
});
