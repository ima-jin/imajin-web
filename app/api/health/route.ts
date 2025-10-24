import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";

/**
 * Health check endpoint
 * Returns system status including database connectivity
 */
export async function GET() {
  try {
    // Test database connection by querying products
    await db.select().from(products).limit(1);

    // Check environment variables are loaded
    const envCheck = {
      nodeEnv: process.env.NODE_ENV || "unknown",
      publicEnv: process.env.NEXT_PUBLIC_ENV || "unknown",
      hasDatabaseUrl: !!process.env.DATABASE_URL || !!process.env.DB_HOST,
    };

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: envCheck,
      version: process.env.npm_package_version || "0.1.0",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
