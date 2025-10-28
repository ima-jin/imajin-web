import { db } from "@/db";
import { sql } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
} from "@/lib/utils/api-response";
import { ERROR_CODES, HTTP_STATUS } from "@/lib/config/api";

/**
 * Health check endpoint
 * Returns system status including database connectivity
 */
export async function GET() {
  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);

    return successResponse(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      HTTP_STATUS.OK
    );
  } catch (error) {
    return errorResponse(
      ERROR_CODES.DATABASE_CONNECTION_ERROR,
      "Health check failed - database connection error",
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      {
        database: "disconnected",
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
}
