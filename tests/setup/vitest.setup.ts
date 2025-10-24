import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "@/db/schema";

// Mock environment variables for tests
process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_ENV = "test";

// Global test database connection
let testClient: postgres.Sql | null = null;
let testDb: ReturnType<typeof drizzle> | null = null;

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup test database
beforeAll(async () => {
  try {
    // Create test database connection
    const connectionString =
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER || "imajin"}:${process.env.DB_PASSWORD || "imajin_dev"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5435"}/${process.env.DB_NAME || "imajin_local"}`;

    testClient = postgres(connectionString, { max: 1 });
    testDb = drizzle(testClient, { schema });

    // Run migrations if needed
    // Note: In a real test environment, you might want to:
    // 1. Use a separate test database
    // 2. Run migrations before tests
    // 3. Clean up test data after tests
    // For now, we're using the same database as development

    console.log("✓ Test database connection established");
  } catch (error) {
    console.error("Failed to setup test database:", error);
    // Don't throw - some tests might not need database
  }
});

// Teardown
afterAll(async () => {
  try {
    // Close database connections
    if (testClient) {
      await testClient.end();
      console.log("✓ Test database connection closed");
    }
  } catch (error) {
    console.error("Failed to close test database connection:", error);
  }
});

// Export for use in tests if needed
export { testClient, testDb };
