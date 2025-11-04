import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getDatabaseConnectionString } from "@/lib/config/database";

/**
 * Type for our database instance with schema
 */
type DbInstance = PostgresJsDatabase<typeof schema>;

/**
 * Lazily initialized database connection
 * Only creates connection when first accessed (runtime, not build time)
 */
let queryClient: postgres.Sql | null = null;
let dbInstance: DbInstance | null = null;

/**
 * Get database instance (lazy initialization)
 * Use this for all application database operations
 */
export function getDb(): DbInstance {
  if (!dbInstance) {
    const connectionString = getDatabaseConnectionString();
    queryClient = postgres(connectionString);
    dbInstance = drizzle(queryClient, { schema });
  }
  return dbInstance;
}

/**
 * Re-export for convenience
 * Proxies to getDb() for lazy initialization
 */
export const db = new Proxy({} as DbInstance, {
  get(_target, prop) {
    const instance = getDb();
    const value = instance[prop as keyof DbInstance];
    // Bind functions to preserve 'this' context
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
