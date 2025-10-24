import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { products } from "@/db/schema";

describe("Database Connection", () => {
  let client: postgres.Sql;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    // Use test database connection string
    const connectionString =
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER || "imajin"}:${process.env.DB_PASSWORD || "imajin_dev"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5435"}/${process.env.DB_NAME || "imajin_local"}`;

    client = postgres(connectionString);
    db = drizzle(client);
  });

  afterAll(async () => {
    // Close connection after tests
    await client.end();
  });

  it("should successfully connect to database", async () => {
    // Simple query to verify connection
    const result = await client`SELECT 1 as value`;
    expect(result).toBeDefined();
    expect(result[0].value).toBe(1);
  });

  it("should be able to query products table", async () => {
    // Query products table using Drizzle
    const allProducts = await db.select().from(products);

    // Should return an array (even if empty)
    expect(Array.isArray(allProducts)).toBe(true);
  });

  it("should have working connection pool", async () => {
    // Execute multiple concurrent queries to test connection pool
    const queries = [
      client`SELECT 1 as result`,
      client`SELECT 2 as result`,
      client`SELECT 3 as result`,
      client`SELECT 4 as result`,
      client`SELECT 5 as result`,
    ];

    const results = await Promise.all(queries);

    // All queries should succeed
    expect(results).toHaveLength(5);
    results.forEach((result, index) => {
      expect(result[0].result).toBe(index + 1);
    });
  });

  it("should properly handle database schema queries", async () => {
    // Test that we can query table metadata
    const tableCheck = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'products'
      ) as exists
    `;

    expect(tableCheck[0].exists).toBe(true);
  });

  it("should support transactions", async () => {
    // Test basic transaction support
    const result = await client.begin(async (sql) => {
      const test = await sql`SELECT 1 as value`;
      return test[0].value;
    });

    expect(result).toBe(1);
  });
});
