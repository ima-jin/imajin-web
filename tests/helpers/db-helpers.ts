import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { getDatabaseConnectionString } from "@/lib/config/database";

/**
 * Database test helpers
 */

/**
 * Create a test database connection
 * Use this when you need an isolated database connection in tests
 */
export function createTestDbConnection() {
  const connectionString = getDatabaseConnectionString();
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  return { client, db };
}

/**
 * Clean up database connection
 */
export async function closeTestDbConnection(client: postgres.Sql) {
  await client.end();
}

/**
 * Clear all data from test tables
 * WARNING: Only use in test environment!
 */
export async function clearTestData(db: ReturnType<typeof drizzle>) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("clearTestData can only be used in test environment!");
  }

  // Delete in correct order to respect foreign key constraints
  await db.delete(schema.portfolioImages);
  await db.delete(schema.portfolioItems);
  await db.delete(schema.nftTokens);
  await db.delete(schema.orderItems);
  await db.delete(schema.orders);
  await db.delete(schema.productSpecs);
  await db.delete(schema.productDependencies);
  await db.delete(schema.variants);
  await db.delete(schema.products);
}

/**
 * Seed minimal test data
 * Creates basic products needed for testing
 */
export async function seedTestData(db: ReturnType<typeof drizzle>) {
  // Insert test product
  await db.insert(schema.products).values({
    id: "test-product-1",
    name: "Test Product",
    category: "material",
    devStatus: 5,
    basePrice: 1000,
    isActive: true,
  });

  // Insert test variant
  await db.insert(schema.variants).values({
    id: "test-variant-1",
    productId: "test-product-1",
    stripeProductId: "price_test_123",
    variantType: "color",
    variantValue: "BLACK",
    priceModifier: 0,
  });
}

/**
 * Wait for database to be ready
 * Useful for integration tests that need the database to be available
 */
export async function waitForDatabase(maxRetries = 10, delayMs = 500): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { client } = createTestDbConnection();
      await client`SELECT 1`;
      await closeTestDbConnection(client);
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error("Database not ready after max retries:", error);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}
