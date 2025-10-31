import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getDatabaseConnectionString } from "@/lib/config/database";

// Create postgres connection
const connectionString = getDatabaseConnectionString();

/**
 * Main database instance for queries
 * Use this for all application database operations
 */
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
