import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create postgres connection
const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || 'imajin'}:${process.env.DB_PASSWORD || 'imajin_dev'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5435'}/${process.env.DB_NAME || 'imajin_local'}`;

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// For migrations
export const migrationClient = postgres(connectionString, { max: 1 });
