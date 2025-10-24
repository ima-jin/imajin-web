/**
 * Environment variable validation
 * Validates required environment variables at startup
 */

interface EnvironmentConfig {
  nodeEnv: string;
  publicEnv: string;
  database: {
    url?: string;
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
}

/**
 * Validate and return environment configuration
 * Throws error if required variables are missing or invalid
 */
export function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];

  // Node environment (default to development if not set)
  const nodeEnv = process.env.NODE_ENV || "development";

  // Database configuration (required)
  const dbUrl = process.env.DATABASE_URL;
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPortStr = process.env.DB_PORT || "5435";
  const dbPort = parseInt(dbPortStr, 10);
  const dbUser = process.env.DB_USER || "imajin";
  const dbPassword = process.env.DB_PASSWORD || "imajin_dev";
  const dbName = process.env.DB_NAME || "imajin_local";

  // Validate port is a number
  if (isNaN(dbPort)) {
    errors.push(`DB_PORT must be a number, got: ${dbPortStr}`);
  }

  // In production, require explicit DATABASE_URL or all DB_ variables
  if (nodeEnv === "production" && !dbUrl) {
    if (!process.env.DB_HOST) errors.push("DB_HOST is required in production");
    if (!process.env.DB_USER) errors.push("DB_USER is required in production");
    if (!process.env.DB_PASSWORD)
      errors.push("DB_PASSWORD is required in production");
    if (!process.env.DB_NAME) errors.push("DB_NAME is required in production");
  }

  // Throw if any validation errors
  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }

  return {
    nodeEnv,
    publicEnv: process.env.NEXT_PUBLIC_ENV || "local",
    database: {
      url: dbUrl,
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      name: dbName,
    },
  };
}

/**
 * Get validated environment config
 * Cached after first call
 */
let cachedConfig: EnvironmentConfig | null = null;

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnvironment();
  }
  return cachedConfig;
}
