/**
 * Database configuration utilities
 * Centralizes database connection string logic
 */

import { getEnvironmentConfig } from "./env";

/**
 * Get the database connection string from environment variables
 * Falls back to local development defaults if not set
 *
 * @returns PostgreSQL connection string
 */
export function getDatabaseConnectionString(): string {
  const config = getEnvironmentConfig();

  return (
    config.database.url ||
    `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`
  );
}
