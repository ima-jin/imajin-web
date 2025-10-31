import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL
    ? {
        // Use DATABASE_URL if provided (for remote databases like Neon)
        url: process.env.DATABASE_URL,
      }
    : {
        // Fall back to individual credentials for local development
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5435"),
        user: process.env.DB_USER || "imajin",
        password: process.env.DB_PASSWORD || "imajin_dev",
        database: process.env.DB_NAME || "imajin_local",
        ssl: false,
      },
} satisfies Config;
